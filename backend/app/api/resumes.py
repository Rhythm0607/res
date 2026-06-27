import os
import shutil
from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_user
from app.models.schema import User, Job, Candidate, MatchResult
from app.services.parser import extract_text, parse_resume
from app.services.matcher import compute_semantic_similarity, calculate_ats_score
from app.schemas.schemas import CandidateMatchResponse

router = APIRouter()

# Setup base upload directory
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")

@router.post("/upload")
async def upload_resume(
    job_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 1. Verify job exists and belongs to the current user
    job = db.query(Job).filter(Job.id == job_id, Job.user_id == current_user.id).first()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found or unauthorized access"
        )
        
    # 2. Check file format (PDF, DOCX)
    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in [".pdf", ".docx"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported file type. Only PDF and DOCX files are allowed."
        )
        
    # 3. Create job-scoped upload folder if it doesn't exist
    job_upload_dir = os.path.join(UPLOAD_DIR, str(job_id))
    os.makedirs(job_upload_dir, exist_ok=True)
    
    # 4. Save file to disk
    file_path = os.path.join(job_upload_dir, file.filename)
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save file to disk: {str(e)}"
        )
        
    # 5. Extract text and parse email & skills
    try:
        resume_text = extract_text(file_path)
        parsed_info = parse_resume(resume_text)
    except Exception as e:
        # Cleanup file on parser error
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Failed to parse resume: {str(e)}"
        )
        
    # 6. Resolve Candidate record (email is unique)
    candidate_email = parsed_info.get("email")
    if not candidate_email or candidate_email == "Unknown":
        # Generate a temporary unique email using filename if parser missed it
        clean_name = os.path.splitext(file.filename)[0].lower().replace(" ", "_")
        candidate_email = f"{clean_name}@{job_id}_hiresense.temp"
        
    candidate = db.query(Candidate).filter(Candidate.email == candidate_email).first()
    candidate_name = os.path.splitext(file.filename)[0].replace("_", " ").replace("-", " ").title()
    
    # Default extraction values
    extracted_skills = parsed_info.get("skills", [])
    experience_years = parsed_info.get("experience_years", 0)
    education = parsed_info.get("education", "Unknown")
    
    if not candidate:
        candidate = Candidate(
            name=candidate_name,
            email=candidate_email,
            resume_text=resume_text,
            extracted_skills=extracted_skills,
            experience_years=experience_years,
            education=education,
            phone="Unknown"
        )
        db.add(candidate)
        db.commit()
        db.refresh(candidate)
    else:
        # Update existing candidate text and skills
        candidate.resume_text = resume_text
        candidate.extracted_skills = extracted_skills
        candidate.experience_years = experience_years
        candidate.education = education
        db.commit()
        db.refresh(candidate)
        
    # 7. Perform ATS scoring calculations
    try:
        # A. Semantic Score (cosine similarity of embeddings)
        semantic_score = compute_semantic_similarity(resume_text, job.description)
        
        # B. Skill Match Score (overlap of candidate skills with job requirements)
        job_skills = [s.lower() for s in (job.required_skills or [])]
        cand_skills = [s.lower() for s in (candidate.extracted_skills or [])]
        
        if job_skills:
            matched_skills = [s for s in job_skills if s in cand_skills]
            skill_match_score = (len(matched_skills) / len(job_skills)) * 100.0
            missing_skills = [s for s in job.required_skills if s.lower() not in cand_skills]
        else:
            skill_match_score = 100.0
            missing_skills = []
            
        # C. Experience Score (compare years of experience)
        exp_diff = candidate.experience_years - job.experience_years
        if exp_diff >= 0:
            experience_match_score = 100.0
        else:
            # Deduct 20 points per missing year
            experience_match_score = max(0.0, 100.0 + (exp_diff * 20.0))
            
        # D. Education Score
        education_match_score = 100.0 # Placeholder
        
        # E. Final Weighted Score
        ats_score = calculate_ats_score(
            semantic_score=semantic_score,
            skill_match=skill_match_score,
            exp_match=experience_match_score,
            edu_match=education_match_score
        )
        
        # Clip ATS score to 0-100 range
        ats_score = min(100.0, max(0.0, ats_score))
        
    except Exception as e:
        print(f"Error calculating ATS score: {str(e)}")
        # Fallback to zero values on error
        semantic_score = 0.0
        skill_match_score = 0.0
        experience_match_score = 0.0
        education_match_score = 0.0
        ats_score = 0.0
        missing_skills = []
        
    # 8. Check if MatchResult already exists; if yes update, if not create
    match_result = db.query(MatchResult).filter(
        MatchResult.job_id == job_id,
        MatchResult.candidate_id == candidate.id
    ).first()
    
    ai_summary = f"Match score generated dynamically. Key strengths: {len(extracted_skills)} matching skills found."
    
    if not match_result:
        match_result = MatchResult(
            job_id=job_id,
            candidate_id=candidate.id,
            ats_score=ats_score,
            skill_match_score=skill_match_score,
            semantic_score=semantic_score,
            experience_match_score=experience_match_score,
            education_match_score=education_match_score,
            ai_summary=ai_summary,
            missing_skills=missing_skills,
            status="Screened"
        )
        db.add(match_result)
    else:
        match_result.ats_score = ats_score
        match_result.skill_match_score = skill_match_score
        match_result.semantic_score = semantic_score
        match_result.experience_match_score = experience_match_score
        match_result.education_match_score = education_match_score
        match_result.ai_summary = ai_summary
        match_result.missing_skills = missing_skills
        match_result.status = "Screened"
        
    db.commit()
    db.refresh(match_result)
    
    return {
        "candidate_id": candidate.id,
        "name": candidate.name,
        "email": candidate.email,
        "status": match_result.status,
        "ats_score": round(match_result.ats_score, 1),
        "skills": candidate.extracted_skills
    }

@router.get("/candidates", response_model=List[CandidateMatchResponse])
def get_job_candidates(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 1. Verify job exists and belongs to the current user
    job = db.query(Job).filter(Job.id == job_id, Job.user_id == current_user.id).first()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found or unauthorized access"
        )
        
    # 2. Query candidates matching this job, ordered by ATS score desc
    matches = (
        db.query(MatchResult, Candidate)
        .join(Candidate, MatchResult.candidate_id == Candidate.id)
        .filter(MatchResult.job_id == job_id)
        .order_by(MatchResult.ats_score.desc())
        .all()
    )
    
    # 3. Format to CandidateMatchResponse schemas
    response = []
    for match, candidate in matches:
        response.append(
            CandidateMatchResponse(
                candidate_id=candidate.id,
                name=candidate.name,
                email=candidate.email,
                extracted_skills=candidate.extracted_skills or [],
                experience_years=candidate.experience_years or 0,
                education=candidate.education or "Unknown",
                ats_score=match.ats_score or 0.0,
                skill_match_score=match.skill_match_score or 0.0,
                semantic_score=match.semantic_score or 0.0,
                experience_match_score=match.experience_match_score or 0.0,
                education_match_score=match.education_match_score or 0.0,
                missing_skills=match.missing_skills or [],
                ai_summary=match.ai_summary or "",
                status=match.status or "Uploaded"
            )
        )
    return response
