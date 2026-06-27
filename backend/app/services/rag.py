from typing import Optional, List, Any
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
