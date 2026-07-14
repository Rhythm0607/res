import os
import shutil
from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_user
from app.models.schema import User, Job, Candidate, MatchResult
from app.services.parser import extract_text, parse_resume
from app.services.matcher import compute_semantic_similarity, calculate_ats_score
from app.schemas.schemas import CandidateMatchResponse, SendEmailRequest, BulkEmailRequest

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
                status=match.status or "Uploaded",
                resume_text=candidate.resume_text or ""
            )
        )
    return response

@router.delete("/candidates/{candidate_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_candidate_resume(
    candidate_id: int,
    job_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 1. Verify job exists and belongs to current user
    job = db.query(Job).filter(Job.id == job_id, Job.user_id == current_user.id).first()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found or unauthorized access"
        )
        
    # 2. Find and delete MatchResult
    match = db.query(MatchResult).filter(
        MatchResult.job_id == job_id,
        MatchResult.candidate_id == candidate_id
    ).first()
    if not match:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidate match not found for this position"
        )
        
    db.delete(match)
    
    # 3. Find candidate and delete file copy
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if candidate:
        # Delete file copy from backend/uploads/{job_id}/
        job_upload_dir = os.path.join(UPLOAD_DIR, str(job_id))
        if os.path.exists(job_upload_dir):
            for filename in os.listdir(job_upload_dir):
                clean_name = os.path.splitext(filename)[0].lower().replace(" ", "_").replace("-", "_")
                cand_email_name = candidate.email.split('@')[0]
                if cand_email_name in clean_name or clean_name in candidate.name.lower().replace(" ", "_"):
                    try:
                        os.remove(os.path.join(job_upload_dir, filename))
                    except Exception as e:
                        print("Failed to delete file copy on disk:", str(e))
                        
        # 4. If this candidate has no other match results, delete the candidate record entirely
        other_matches = db.query(MatchResult).filter(MatchResult.candidate_id == candidate_id).first()
        if not other_matches:
            db.delete(candidate)
            
    db.commit()
    return None

@router.get("/candidates/{candidate_id}/questions")
def get_candidate_interview_questions(
    candidate_id: int,
    job_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 1. Verify job ownership
    job = db.query(Job).filter(Job.id == job_id, Job.user_id == current_user.id).first()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Unauthorized access to this vacancy context."
        )
        
    # 2. Verify candidate exists
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not candidate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidate not found."
        )
        
    # 3. Verify match mapping exists
    match = db.query(MatchResult).filter(MatchResult.candidate_id == candidate_id, MatchResult.job_id == job_id).first()
    if not match:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidate match record not found for this position."
        )
        
    # 4. Generate questions using RAG helper
    from app.services.rag import generate_interview_questions
    questions = generate_interview_questions(
        resume_text=candidate.resume_text or "",
        jd_text=job.description or "",
        required_skills=job.required_skills or [],
        candidate_skills=candidate.extracted_skills or []
    )
    return questions

@router.get("/candidates/{candidate_id}/email-draft")
def get_candidate_email_outreach_draft(
    candidate_id: int,
    job_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 1. Verify job ownership
    job = db.query(Job).filter(Job.id == job_id, Job.user_id == current_user.id).first()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Unauthorized access to this vacancy context."
        )
        
    # 2. Verify candidate exists
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not candidate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidate not found."
        )
        
    # 3. Verify match mapping exists
    match = db.query(MatchResult).filter(MatchResult.candidate_id == candidate_id, MatchResult.job_id == job_id).first()
    if not match:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidate match record not found for this position."
        )
        
    # 4. Generate email draft using RAG helper
    from app.services.rag import generate_email_outreach
    email_draft = generate_email_outreach(
        resume_text=candidate.resume_text or "",
        jd_text=job.description or "",
        required_skills=job.required_skills or [],
        candidate_skills=candidate.extracted_skills or [],
        candidate_name=candidate.name,
        job_title=job.title
    )
    return email_draft

@router.post("/candidates/{candidate_id}/send-email")
def send_candidate_email(
    candidate_id: int,
    payload: SendEmailRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from app.core.config import settings
    import smtplib
    from email.mime.text import MIMEText
    from email.mime.multipart import MIMEMultipart

    # 1. Verify job ownership
    job = db.query(Job).filter(Job.id == payload.job_id, Job.user_id == current_user.id).first()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Unauthorized access to this vacancy context."
        )
        
    # 2. Verify candidate exists
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not candidate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidate not found."
        )
        
    # 3. Verify match mapping exists
    match = db.query(MatchResult).filter(MatchResult.candidate_id == candidate_id, MatchResult.job_id == payload.job_id).first()
    if not match:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidate match record not found for this position."
        )

    # 4. Attempt real SMTP email transmission if config has SMTP credentials
    smtp_sent = False
    if settings.SMTP_USER and settings.SMTP_PASSWORD:
        try:
            # Setup email mime structure
            msg = MIMEMultipart()
            msg['From'] = settings.SMTP_FROM or settings.SMTP_USER
            msg['To'] = candidate.email
            msg['Subject'] = payload.subject
            msg.attach(MIMEText(payload.body, 'plain'))

            # Setup secure SMTP session
            server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT)
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(msg['From'], msg['To'], msg.as_string())
            server.quit()
            smtp_sent = True
        except Exception as e:
            print(f"Failed to transmit direct SMTP email outreach: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"SMTP transmission failed: {str(e)}"
            )

    # If no SMTP configured, print to terminal console (mock send)
    if not smtp_sent:
        print("\n" + "="*50)
        print("MOCK EMAIL OUTREACH TRANSMITTED SUCCESSFULLY (NO SMTP CONFIG)")
        print(f"To: {candidate.email}")
        print(f"Subject: {payload.subject}")
        print(f"Body:\n{payload.body}")
        print("="*50 + "\n")

    return {"message": "Email outreach dispatched successfully!", "sent_via_smtp": smtp_sent}

@router.post("/jobs/{job_id}/bulk-email")
def send_bulk_candidate_emails(
    job_id: int,
    payload: BulkEmailRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from app.core.config import settings
    import smtplib
    from email.mime.text import MIMEText
    from email.mime.multipart import MIMEMultipart

    # 1. Verify job ownership
    job = db.query(Job).filter(Job.id == job_id, Job.user_id == current_user.id).first()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Unauthorized access to this vacancy context."
        )

    # 2. Query candidates by requested IDs
    candidates = db.query(Candidate).filter(Candidate.id.in_(payload.candidate_ids)).all()
    if not candidates:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No matching candidates found for the specified IDs."
        )

    sent_count = 0
    smtp_sent = False
    failures = []

    # 3. Setup SMTP server once if credentials exist
    server = None
    if settings.SMTP_USER and settings.SMTP_PASSWORD:
        try:
            server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT)
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            smtp_sent = True
        except Exception as e:
            print(f"Failed to initialize bulk SMTP session: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to connect to SMTP server: {str(e)}"
            )

    # 4. Iterate and dispatch emails
    for candidate in candidates:
        # Interpolate placeholders: {candidate_name}, {job_title}
        interpolated_subject = payload.subject_template.replace("{candidate_name}", candidate.name).replace("{job_title}", job.title)
        interpolated_body = payload.body_template.replace("{candidate_name}", candidate.name).replace("{job_title}", job.title)

        if smtp_sent and server:
            try:
                msg = MIMEMultipart()
                msg['From'] = settings.SMTP_FROM or settings.SMTP_USER
                msg['To'] = candidate.email
                msg['Subject'] = interpolated_subject
                msg.attach(MIMEText(interpolated_body, 'plain'))
                
                server.sendmail(msg['From'], msg['To'], msg.as_string())
                sent_count += 1
            except Exception as e:
                print(f"Failed to send email to {candidate.email}: {str(e)}")
                failures.append(f"{candidate.name} ({candidate.email}): {str(e)}")
        else:
            # Mock send
            print("\n" + "="*50)
            print(f"MOCK BULK EMAIL DISPATCHED (CANDIDATE ID: {candidate.id})")
            print(f"To: {candidate.email}")
            print(f"Subject: {interpolated_subject}")
            print(f"Body:\n{interpolated_body}")
            print("="*50 + "\n")
            sent_count += 1

    # Close SMTP session if it was active
    if server:
        try:
            server.quit()
        except Exception:
            pass

    return {
        "message": f"Successfully processed {sent_count} dispatches.",
        "total_sent": sent_count,
        "sent_via_smtp": smtp_sent,
        "failures": failures
    }
