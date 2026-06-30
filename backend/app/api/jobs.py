from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.schema import Job, MatchResult, User, Candidate
from app.schemas.schemas import JobCreate, JobResponse
from app.api.deps import get_current_user
from app.services.matcher import compute_semantic_similarity, calculate_ats_score
from typing import List

router = APIRouter()

@router.post("/", response_model=JobResponse, status_code=status.HTTP_201_CREATED)
def create_job(job: JobCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_job = Job(**job.model_dump(), user_id=current_user.id)
    db.add(db_job)
    db.commit()
    db.refresh(db_job)
    return db_job

@router.get("/", response_model=List[JobResponse])
def get_jobs(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Job).filter(Job.user_id == current_user.id).all()

@router.get("/{job_id}", response_model=JobResponse)
def get_job(job_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_job = db.query(Job).filter(Job.id == job_id, Job.user_id == current_user.id).first()
    if not db_job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job with ID {job_id} not found"
        )
    return db_job

@router.put("/{job_id}", response_model=JobResponse)
def update_job(job_id: int, job: JobCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_job = db.query(Job).filter(Job.id == job_id, Job.user_id == current_user.id).first()
    if not db_job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job with ID {job_id} not found"
        )
    
    for key, value in job.model_dump().items():
        setattr(db_job, key, value)
        
    db.commit()
    # Recalculate all match scores for already-uploaded candidates using the new job description & skills
    recalculate_job_matches(db, db_job)
    db.refresh(db_job)
    return db_job

@router.delete("/{job_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_job(job_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_job = db.query(Job).filter(Job.id == job_id, Job.user_id == current_user.id).first()
    if not db_job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job with ID {job_id} not found"
        )
    
    # Delete associated match results to prevent FK constraint issues
    db.query(MatchResult).filter(MatchResult.job_id == job_id).delete()
    
    db.delete(db_job)
    db.commit()
    return None

def recalculate_job_matches(db: Session, job: Job):
    matches = db.query(MatchResult).filter(MatchResult.job_id == job.id).all()
    for match in matches:
        candidate = db.query(Candidate).filter(Candidate.id == match.candidate_id).first()
        if not candidate:
            continue
            
        try:
            # 1. Recalculate semantic similarity
            semantic_score = compute_semantic_similarity(candidate.resume_text or "", job.description)
            
            # 2. Recalculate skills match
            job_skills = [s.lower() for s in (job.required_skills or [])]
            cand_skills = [s.lower() for s in (candidate.extracted_skills or [])]
            
            if job_skills:
                matched_skills = [s for s in job_skills if s in cand_skills]
                skill_match_score = (len(matched_skills) / len(job_skills)) * 100.0
                missing_skills = [s for s in job.required_skills if s.lower() not in cand_skills]
            else:
                skill_match_score = 100.0
                missing_skills = []
                
            # 3. Recalculate experience score
            exp_diff = (candidate.experience_years or 0) - job.experience_years
            if exp_diff >= 0:
                experience_match_score = 100.0
            else:
                experience_match_score = max(0.0, 100.0 + (exp_diff * 20.0))
                
            # 4. Education Score (Placeholder 100)
            education_match_score = 100.0
            
            # 5. Calculate final weighted ATS score
            ats_score = calculate_ats_score(
                semantic_score=semantic_score,
                skill_match=skill_match_score,
                exp_match=experience_match_score,
                edu_match=education_match_score
            )
            ats_score = min(100.0, max(0.0, ats_score))
            
            # Update MatchResult fields
            match.semantic_score = semantic_score
            match.skill_match_score = skill_match_score
            match.experience_match_score = experience_match_score
            match.education_match_score = education_match_score
            match.ats_score = ats_score
            match.missing_skills = missing_skills
            match.ai_summary = f"Match score recalculated. Key strengths: {len(candidate.extracted_skills or [])} parsed skills."
            
        except Exception as e:
            print(f"Failed to recalculate match result for candidate {candidate.id}: {str(e)}")
            
    db.commit()
