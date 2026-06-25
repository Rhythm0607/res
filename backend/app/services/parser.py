import pdfplumber
import spacy
import re
from typing import Dict, Any

try:
    nlp = spacy.load("en_core_web_sm")
except:
    import spacy.cli
    spacy.cli.download("en_core_web_sm")
    nlp = spacy.load("en_core_web_sm")

COMMON_SKILLS = ["python", "java", "react", "node.js", "aws", "docker", "kubernetes", "sql", "fastapi", "typescript", "c++", "machine learning"]

def extract_text_from_pdf(file_path: str) -> str:
    text = ""
    with pdfplumber.open(file_path) as pdf:
        for page in pdf.pages:
            text += page.extract_text() + "\n"
    return text

def parse_resume(text: str) -> Dict[str, Any]:
    doc = nlp(text)
    
    emails = re.findall(r'[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+', text)
    email = emails[0] if emails else "Unknown"
    
    skills_found = [skill for skill in COMMON_SKILLS if skill.lower() in text.lower()]
    
    return {
        "email": email,
        "skills": skills_found,
        "experience_years": 5, 
        "education": "B.S. Computer Science" 
    }
