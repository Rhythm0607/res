from sqlalchemy import Column, Integer, String, Text, Float, ForeignKey, JSON, DateTime, Boolean
from sqlalchemy.sql import func
from app.database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Job(Base):
    __tablename__ = "jobs"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True, nullable=False)
    department = Column(String)
    location = Column(String)
    description = Column(Text, nullable=False)
    required_skills = Column(JSON)
    preferred_skills = Column(JSON)
    experience_years = Column(Integer)
    employment_type = Column(String)
    salary_range = Column(String)
    work_model = Column(String) 
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Candidate(Base):
    __tablename__ = "candidates"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    email = Column(String, unique=True, index=True)
    phone = Column(String)
    resume_text = Column(Text)
    extracted_skills = Column(JSON)
    experience_years = Column(Integer)
    education = Column(JSON)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class MatchResult(Base):
    __tablename__ = "match_results"
    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("jobs.id"))
    candidate_id = Column(Integer, ForeignKey("candidates.id"))
    ats_score = Column(Float)
    skill_match_score = Column(Float)
    semantic_score = Column(Float)
    experience_match_score = Column(Float)
    education_match_score = Column(Float)
    ai_summary = Column(Text)
    missing_skills = Column(JSON)
    status = Column(String, default="Screened")
