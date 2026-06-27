from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime

class Token(BaseModel):
    access_token: str
    token_type: str

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str

class UserResponse(BaseModel):
    id: int
    email: EmailStr
    full_name: str
    
    class Config:
        from_attributes = True

class JobCreate(BaseModel):
    title: str
    department: str
    location: str
    description: str
    required_skills: List[str]
    preferred_skills: List[str] = []
    experience_years: int
    employment_type: str
    salary_range: str
    work_model: str

class JobResponse(JobCreate):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class CandidateResponse(BaseModel):
    id: int
    name: str
    email: str
    extracted_skills: List[str]
    experience_years: int
    
    class Config:
        from_attributes = True

class ChatRequest(BaseModel):
    session_id: str
    question: str
    chat_history: List[Dict[str, str]] = []

class GoogleLoginRequest(BaseModel):
    credential_token: str

class CandidateMatchResponse(BaseModel):
    candidate_id: int
    name: str
    email: str
    extracted_skills: List[str]
    experience_years: int
    education: Any
    ats_score: float
    skill_match_score: float
    semantic_score: float
    experience_match_score: float
    education_match_score: float
    missing_skills: List[str]
    ai_summary: Optional[str] = None
    status: str

    class Config:
        from_attributes = True

