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
    avatar_url = Column(String, nullable=True)
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
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
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

class UserSettings(Base):
    __tablename__ = "user_settings"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, index=True)
    skills_match = Column(Integer, default=88)
    experience_match = Column(Integer, default=76)
    culture_match = Column(Integer, default=82)
    communication_match = Column(Integer, default=74)
    theme_preference = Column(String, default="Comfortable layout")
    alert_match = Column(Boolean, default=True)
    alert_recap = Column(Boolean, default=True)

class TeamMember(Base):
    __tablename__ = "team_members"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, nullable=False)
    role = Column(String, nullable=False)
    coverage = Column(String)
    status = Column(String, default="Pending")
    inviter_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class WorkflowStage(Base):
    __tablename__ = "workflow_stages"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    order_index = Column(Integer, default=0)
    user_id = Column(Integer, ForeignKey("users.id"))

class Notification(Base):
    __tablename__ = "notifications"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String, default="system")
    is_read = Column(Boolean, default=False)
    link_url = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
