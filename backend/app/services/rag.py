from typing import Optional, List, Any
import json
import requests
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain.vectorstores import FAISS
from langchain.chains import ConversationalRetrievalChain
from langchain.embeddings.base import Embeddings
from langchain.llms.base import LLM
from sentence_transformers import SentenceTransformer
from app.core.config import settings

class LocalSentenceTransformerEmbeddings(Embeddings):
    """
    Local embeddings generator using sentence-transformers.
    Runs entirely on-device (CPU/GPU) for free.
    """
    def __init__(self):
        # Cache and load the MiniLM transformer
        self.model = SentenceTransformer('all-MiniLM-L6-v2')
        
    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        embeddings = self.model.encode(texts)
        return embeddings.tolist()
        
    def embed_query(self, text: str) -> List[float]:
        embedding = self.model.encode([text])[0]
        return embedding.tolist()

class OllamaLLM(LLM):
    """
    Local LLM connector executing queries via Ollama API.
    Provides free offline resume question answering.
    """
    model_name: str = "llama3"
    
    @property
    def _llm_type(self) -> str:
        return "ollama"
        
    def _call(self, prompt: str, stop: Optional[List[str]] = None, **kwargs: Any) -> str:
        try:
            res = requests.post(
                "http://localhost:11434/api/generate",
                json={
                    "model": self.model_name,
                    "prompt": prompt,
                    "stream": False,
                    "options": {"temperature": 0.2}
                },
                timeout=30
            )
            if res.status_code == 200:
                return res.json().get("response", "")
            return f"Error: Ollama returned status code {res.status_code}."
        except Exception:
            return (
                "Ollama is offline or not running. Please start Ollama using 'ollama run llama3' "
                "in your terminal, or configure an OPENAI_API_KEY in your backend/.env to use OpenAI."
            )
class GeminiLLM(LLM):
    """
    Cloud Gemini LLM connector executing queries via REST API.
    Provides free cloud-based resume question answering.
    """
    api_key: str
    model_name: str = "gemini-2.5-flash"
    
    @property
    def _llm_type(self) -> str:
        return "gemini"
        
    def _call(self, prompt: str, stop: Optional[List[str]] = None, **kwargs: Any) -> str:
        models = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"]
        payload = {
            "contents": [
                {
                    "parts": [{"text": prompt}]
                }
            ],
            "generationConfig": {
                "temperature": 0.2
            }
        }
        
        last_error = ""
        for model in models:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={self.api_key}"
            try:
                res = requests.post(url, json=payload, timeout=30)
                if res.status_code == 200:
                    data = res.json()
                    return data['candidates'][0]['content']['parts'][0]['text']
                else:
                    last_error = f"Model {model} returned status {res.status_code}: {res.text}"
            except Exception as e:
                last_error = f"Model {model} failed with exception: {str(e)}"
                
        return f"Failed to call Gemini API: {last_error}"

def build_rag_chain(text: str):
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=100)
    docs = text_splitter.create_documents([text])
    
    # 1. Determine Embeddings Model
    if settings.OPENAI_API_KEY:
        embeddings = OpenAIEmbeddings(openai_api_key=settings.OPENAI_API_KEY)
    else:
        print("Using local sentence-transformer embeddings for RAG indexing.")
        embeddings = LocalSentenceTransformerEmbeddings()
        
    vectorstore = FAISS.from_documents(docs, embeddings)
    retriever = vectorstore.as_retriever(search_kwargs={"k": 3})
    
    # 2. Determine LLM
    if settings.OPENAI_API_KEY:
        llm = ChatOpenAI(
            model_name="gpt-4-turbo-preview", 
            temperature=0.2, 
            openai_api_key=settings.OPENAI_API_KEY
        )
    elif settings.GEMINI_API_KEY:
        print("Using cloud Gemini LLM for Q&A.")
        llm = GeminiLLM(api_key=settings.GEMINI_API_KEY)
    else:
        print("Using local Ollama LLM for Q&A.")
        llm = OllamaLLM()
        
    chain = ConversationalRetrievalChain.from_llm(llm=llm, retriever=retriever)
    return chain

def query_resume(chain, question: str, chat_history: List[dict]):
    formatted_history = []
    for msg in chat_history:
        user_msg = msg.get("user") or msg.get("sender") or ""
        ai_msg = msg.get("ai") or msg.get("content") or ""
        formatted_history.append((user_msg, ai_msg))
        
    response = chain({"question": question, "chat_history": formatted_history})
    return response["answer"]

def generate_interview_questions(resume_text: str, jd_text: str, required_skills: List[str], candidate_skills: List[str]) -> List[dict]:
    # 1. Determine active LLM
    from app.core.config import settings
    llm = None
    if settings.OPENAI_API_KEY:
        from langchain_openai import ChatOpenAI
        llm = ChatOpenAI(
            model_name="gpt-4-turbo-preview", 
            temperature=0.7, 
            openai_api_key=settings.OPENAI_API_KEY
        )
    elif settings.GEMINI_API_KEY:
        llm = GeminiLLM(api_key=settings.GEMINI_API_KEY)
    else:
        llm = OllamaLLM()

    # 2. Build detailed prompt
    missing_skills = [s for s in required_skills if s.lower() not in [cs.lower() for cs in candidate_skills]]
    
    prompt = f"""
You are an expert recruiter and technical hiring manager.
Compare the candidate's resume text and the job vacancy requirements.

Job Vacancy Description:
{jd_text}

Job Required Skills:
{", ".join(required_skills) if required_skills else "None specified"}

Candidate's Parsed Skills:
{", ".join(candidate_skills) if candidate_skills else "None parsed"}

Candidate's Resume Text (Excerpt):
{resume_text[:4000]}

Based on this, identify:
1. Missing required skills (specifically: {", ".join(missing_skills) if missing_skills else "None identified"}).
2. Strengths and technologies claimed in their resume.

Generate exactly 5 tailored interview questions:
- 3 Technical questions: test them on required skills, or probe their familiarity with the missing skills/alternate concepts.
- 2 Behavioral/Project questions: ask about specific projects, achievements, or tech stacks listed in their resume.

For each question, provide a detailed "Evaluation Guide" explaining the key concepts, keywords, and indicators the recruiter should look for in a good answer.

Your response MUST be a valid JSON array of objects. Do NOT include markdown blocks like ```json ... ``` or any other text before/after the JSON.
Each object in the array must have the following keys:
- "id": integer (1 to 5)
- "category": string ("Technical" or "Behavioral")
- "question": string
- "evaluation_guide": string

Example Output Format:
[
  {{
    "id": 1,
    "category": "Technical",
    "question": "Can you explain...",
    "evaluation_guide": "Look for explanation of..."
  }}
]
"""
    try:
        # Query active model
        if hasattr(llm, "invoke"):
            response = llm.invoke(prompt)
            content = response.content if hasattr(response, "content") else str(response)
        else:
            content = llm._call(prompt)
            
        content = content.strip()
        if content.startswith("```json"):
            content = content[7:]
        if content.endswith("```"):
            content = content[:-3]
        content = content.strip()
        
        questions = json.loads(content)
        if isinstance(questions, list) and len(questions) > 0:
            return questions
            
    except Exception as e:
        print(f"Failed to generate questions using LLM: {str(e)}")
        
    # Fallback questions if LLM fails or times out
    return [
        {
            "id": 1,
            "category": "Technical",
            "question": f"Based on your resume, how would you approach working with the required technologies for this role, specifically {', '.join(required_skills[:3]) if required_skills else 'software development'}?",
            "evaluation_guide": "Look for structured explanations of candidate's core design practices and direct familiarity with the requested tech stack."
        },
        {
            "id": 2,
            "category": "Technical",
            "question": f"The job description highlights the need for {missing_skills[0] if missing_skills else 'advanced problem-solving'}. Do you have experience with this, or how would you adapt if required to learn it?",
            "evaluation_guide": "Look for adaptability, self-learning methodologies, and transferrable tech knowledge from their parsed profile."
        },
        {
            "id": 3,
            "category": "Technical",
            "question": "Walk us through the technical architecture of the most challenging project listed on your resume.",
            "evaluation_guide": "Check for concrete details, scaling decisions, database selection reasoning, and clarity of communication."
        },
        {
            "id": 4,
            "category": "Behavioral",
            "question": "Tell us about a time you had to resolve a technical disagreement with a team member or stakeholder.",
            "evaluation_guide": "Evaluate active listening skills, constructive compromises, and focus on delivering business value."
        },
        {
            "id": 5,
            "category": "Behavioral",
            "question": "How do you manage your time and prioritize tasks when handling multiple projects or deliverables?",
            "evaluation_guide": "Look for specific methodologies (e.g. Agile, Kanban, calendar blocks) and communication practices with project managers."
        }
    ]

def generate_email_outreach(
    resume_text: str,
    jd_text: str,
    required_skills: List[str],
    candidate_skills: List[str],
    candidate_name: str,
    job_title: str
) -> dict:
    from app.core.config import settings
    llm = None
    if settings.OPENAI_API_KEY:
        from langchain_openai import ChatOpenAI
        llm = ChatOpenAI(
            model_name="gpt-4-turbo-preview", 
            temperature=0.7, 
            openai_api_key=settings.OPENAI_API_KEY
        )
    elif settings.GEMINI_API_KEY:
        llm = GeminiLLM(api_key=settings.GEMINI_API_KEY)
    else:
        llm = OllamaLLM()

    # Determine matching skills
    matching_skills = [s for s in required_skills if s.lower() in [cs.lower() for cs in candidate_skills]]
    
    prompt = f"""
You are an expert technical recruiter.
Write a personalized cold outreach/interview invitation email to the candidate.

Candidate Name: {candidate_name}
Job Title: {job_title}
Job Vacancy Description:
{jd_text[:2000]}

Matching Skills they have: {", ".join(matching_skills) if matching_skills else "None specified"}
Candidate's Resume Text (Excerpt):
{resume_text[:2000]}

Write a warm, professional email inviting them for an introductory call.
- Reference their experience with matching skills: {", ".join(matching_skills[:3]) if matching_skills else "their qualifications"}.
- Frame their background as a strong fit for the {job_title} position.
- Suggest a 15-minute introductory call.
- DO NOT use placeholders like [Candidate Name] or [Your Name]. Fill in the candidate's name as {candidate_name} and sign off as "The HireSense Recruitment Team".

Your response MUST be a valid JSON object. Do NOT include markdown blocks like ```json ... ``` or any other text before/after the JSON.
The object must have the following keys:
- "subject": string
- "body": string

Example Output Format:
{{
  "subject": "Introductory Call: {job_title} at HireSense",
  "body": "Hi {candidate_name}, ..."
}}
"""
    try:
        if hasattr(llm, "invoke"):
            response = llm.invoke(prompt)
            content = response.content if hasattr(response, "content") else str(response)
        else:
            content = llm._call(prompt)
            
        content = content.strip()
        if content.startswith("```json"):
            content = content[7:]
        if content.endswith("```"):
            content = content[:-3]
        content = content.strip()
        
        email_data = json.loads(content)
        if isinstance(email_data, dict) and "subject" in email_data and "body" in email_data:
            return email_data
            
    except Exception as e:
        print(f"Failed to generate email outreach using LLM: {str(e)}")

    # Fallback email
    skills_text = f", particularly your experience with {', '.join(matching_skills[:2])}" if matching_skills else ""
    return {
        "subject": f"Opportunity: {job_title} role - Introductory Chat",
        "body": f"Hi {candidate_name},\n\nI hope this email finds you well.\n\nI came across your profile and was very impressed by your background{skills_text}. We are currently seeking a talented {job_title} to join our team, and we believe your skills align incredibly well with the requirements.\n\nI would love to set up a brief 15-minute introductory call to share more about the role and learn more about your career goals. Do you have any availability for a quick chat next week?\n\nBest regards,\n\nThe HireSense Recruitment Team"
      }
