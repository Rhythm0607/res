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
    avatar_url: Optional[str] = None
    
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
    resume_text: str

    class Config:
        from_attributes = True

class ProfileUpdate(BaseModel):
    full_name: str
    email: str

class PasswordUpdate(BaseModel):
    current_password: str
    new_password: str

class SendEmailRequest(BaseModel):
    job_id: int
    subject: str
    body: str

class BulkEmailRequest(BaseModel):
    candidate_ids: List[int]
    subject_template: str
    body_template: str

class UserSettingsUpdate(BaseModel):
    skills_match: Optional[int] = None
    experience_match: Optional[int] = None
    culture_match: Optional[int] = None
    communication_match: Optional[int] = None
    theme_preference: Optional[str] = None
    alert_match: Optional[bool] = None
    alert_recap: Optional[bool] = None

class UserSettingsResponse(BaseModel):
    id: int
    user_id: int
    skills_match: int
    experience_match: int
    culture_match: int
    communication_match: int
    theme_preference: str
    alert_match: bool
    alert_recap: bool

    class Config:
        from_attributes = True

class TeamMemberCreate(BaseModel):
    name: str
    email: EmailStr
    role: str
    coverage: Optional[str] = None

class TeamMemberResponse(TeamMemberCreate):
    id: int
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class WorkflowStageCreate(BaseModel):
    name: str

class WorkflowStageResponse(WorkflowStageCreate):
    id: int
    order_index: int
    
    class Config:
        from_attributes = True
