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
