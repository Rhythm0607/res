import pdfplumber
import spacy
import re
import requests
from typing import Dict, Any

try:
    nlp = spacy.load("en_core_web_sm")
except:
    import spacy.cli
    spacy.cli.download("en_core_web_sm")
    nlp = spacy.load("en_core_web_sm")

COMMON_SKILLS = ["python", "java", "react", "node.js", "aws", "docker", "kubernetes", "sql", "fastapi", "typescript", "c++", "machine learning"]

import zipfile
import xml.etree.ElementTree as ET

def extract_text_from_pdf(file_path: str) -> str:
    text = ""
    with pdfplumber.open(file_path) as pdf:
        for page in pdf.pages:
            text += page.extract_text() + "\n"
    return text

def extract_text_from_docx(file_path: str) -> str:
    try:
        with zipfile.ZipFile(file_path) as docx:
            xml_content = docx.read('word/document.xml')
            root = ET.fromstring(xml_content)
            namespace = '{http://schemas.openxmlformats.org/wordprocessingml/2006/main}'
            paragraphs = []
            for elem in root.iter(f'{namespace}t'):
                if elem.text:
                    paragraphs.append(elem.text)
            return "\n".join(paragraphs)
    except Exception as e:
        print("Failed to extract text from docx:", str(e))
        return ""

def extract_text(file_path: str) -> str:
    if file_path.lower().endswith('.pdf'):
        return extract_text_from_pdf(file_path)
    elif file_path.lower().endswith('.docx'):
        return extract_text_from_docx(file_path)
    else:
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                return f.read()
        except:
            return ""

import json
from langchain_openai import ChatOpenAI
from app.core.config import settings

def parse_resume_fallback(text: str) -> Dict[str, Any]:
    # Regex for email
    emails = re.findall(r'[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+', text)
    email = emails[0] if emails else "Unknown"
    
    # Check for skills from COMMON_SKILLS list
    skills_found = [skill for skill in COMMON_SKILLS if skill.lower() in text.lower()]
    
    # Try to guess experience years from text
    experience_years = 0
    match_exp = re.search(r'(\d+)\+?\s*years?\s+of?\s+experience', text, re.IGNORECASE)
    if match_exp:
        try:
            experience_years = int(match_exp.group(1))
        except:
            pass
            
    # Guess education
    education = "Unknown"
    for line in text.split('\n'):
        if any(keyword in line.lower() for keyword in ["bachelor", "master", "phd", "b.s", "m.s", "degree", "university", "college"]):
            education = line.strip()
            if len(education) > 50:
                education = education[:50] + "..."
            break
            
    return {
        "email": email,
        "skills": skills_found,
        "experience_years": experience_years,
        "education": education
    }

def is_ollama_running() -> bool:
    try:
        res = requests.get("http://localhost:11434/", timeout=1)
        return res.status_code == 200
    except:
        return False

def parse_resume_ollama(text: str) -> Dict[str, Any]:
    try:
        system_prompt = (
            "You are a professional ATS resume parser. Your task is to extract structural metadata from the provided resume text. "
            "Return ONLY a valid JSON object matching this schema, without markdown backticks (no ```json):\n"
            "{\n"
            '  "email": "candidate email address or Unknown",\n'
            '  "skills": ["extracted technical and professional skills"],\n'
            '  "experience_years": integer representing total years of professional experience,\n'
            '  "education": "highest academic degree and major, e.g., M.S. Computer Science or Unknown"\n'
            "}"
        )
        prompt = f"{system_prompt}\n\nResume Text:\n{text}"
        
        res = requests.post(
            "http://localhost:11434/api/generate",
            json={
                "model": "llama3",
                "prompt": prompt,
                "stream": False,
                "options": {
                    "temperature": 0.1
                }
            },
            timeout=30
        )
        if res.status_code == 200:
            content = res.json().get("response", "").strip()
            if content.startswith("```json"):
                content = content[7:]
            if content.startswith("```"):
                content = content[3:]
            if content.endswith("```"):
                content = content[:-3]
            content = content.strip()
            
            data = json.loads(content)
            return {
                "email": str(data.get("email", "Unknown")),
                "skills": list(data.get("skills", [])),
                "experience_years": int(data.get("experience_years", 0)),
                "education": str(data.get("education", "Unknown"))
            }
        else:
            raise Exception(f"Ollama returned status {res.status_code}")
    except Exception as e:
        print(f"Ollama parsing failed: {str(e)}. Falling back to local rules.")
        return parse_resume_fallback(text)

def parse_resume_gemini(text: str, api_key: str) -> Dict[str, Any]:
    models = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"]
    
    system_prompt = (
        "You are a professional ATS resume parser. Your task is to extract structural metadata from the provided resume text. "
        "Return ONLY a valid JSON object matching this schema:\n"
        "{\n"
        '  "email": "candidate email address or Unknown",\n'
        '  "skills": ["extracted technical and professional skills"],\n'
        '  "experience_years": integer representing total years of professional experience,\n'
        '  "education": "highest academic degree and major, e.g., M.S. Computer Science or Unknown"\n'
        "}"
    )
    
    payload = {
        "contents": [
            {
                "parts": [{"text": f"Resume Text:\n{text}"}]
            }
        ],
        "systemInstruction": {
            "parts": [{"text": system_prompt}]
        },
        "generationConfig": {
            "responseMimeType": "application/json",
            "temperature": 0.1
        }
    }
    
    for model_name in models:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"
        try:
            res = requests.post(url, json=payload, timeout=30)
            if res.status_code == 200:
                data = res.json()
                content = data['candidates'][0]['content']['parts'][0]['text'].strip()
                parsed_data = json.loads(content)
                return {
                    "email": str(parsed_data.get("email", "Unknown")),
                    "skills": list(parsed_data.get("skills", [])),
                    "experience_years": int(parsed_data.get("experience_years", 0)),
                    "education": str(parsed_data.get("education", "Unknown"))
                }
            else:
                print(f"Gemini {model_name} failed with status {res.status_code}: {res.text}")
        except Exception as e:
            print(f"Gemini {model_name} call threw exception: {str(e)}")
            
    raise Exception("All Gemini API models failed to execute.")

def parse_resume(text: str) -> Dict[str, Any]:
    # 1. If OpenAI API Key is configured, use OpenAI
    if settings.OPENAI_API_KEY:
        try:
            llm = ChatOpenAI(
                model_name="gpt-4o-mini",
                temperature=0.1,
                openai_api_key=settings.OPENAI_API_KEY
            )
            
            system_prompt = (
                "You are a professional ATS resume parser. Your task is to extract structural metadata from the provided resume text. "
                "Return ONLY a valid JSON object matching this schema, without markdown backticks (no ```json):\n"
                "{\n"
                '  "email": "candidate email address or Unknown",\n'
                '  "skills": ["extracted technical and professional skills"],\n'
                '  "experience_years": integer representing total years of professional experience,\n'
                '  "education": "highest academic degree and major, e.g., M.S. Computer Science or Unknown"\n'
                "}"
            )
            
            messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Resume Text:\n{text}"}
            ]
            
            response = llm.invoke(messages)
            content = response.content.strip()
            
            # Remove code blocks if returned
            if content.startswith("```json"):
                content = content[7:]
            if content.startswith("```"):
                content = content[3:]
            if content.endswith("```"):
                content = content[:-3]
            content = content.strip()
            
            data = json.loads(content)
            
            return {
                "email": str(data.get("email", "Unknown")),
                "skills": list(data.get("skills", [])),
                "experience_years": int(data.get("experience_years", 0)),
                "education": str(data.get("education", "Unknown"))
            }
        except Exception as e:
            print(f"OpenAI parsing failed: {str(e)}. Checking other API options.")
            
    # 2. If Gemini API Key is configured, use Gemini
    if settings.GEMINI_API_KEY:
        try:
            print("Using cloud Gemini API for parsing.")
            return parse_resume_gemini(text, settings.GEMINI_API_KEY)
        except Exception as e:
            print(f"Gemini parsing failed: {str(e)}. Checking local options.")
            
    # 3. Check if Ollama is running
    if is_ollama_running():
        print("Using local Ollama instance for parsing.")
        return parse_resume_ollama(text)
        
    # 4. Fallback to local rule-based parsing
    print("No cloud LLM API or local Ollama available. Using local rule-based fallback.")
    return parse_resume_fallback(text)
