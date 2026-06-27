import tempfile
import os
from typing import Dict, Any
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, status
from sqlalchemy.orm import Session
from app.services.parser import extract_text_from_pdf
from app.services.rag import build_rag_chain, query_resume
from app.schemas.schemas import ChatRequest
from app.api.deps import get_db, get_current_user
from app.models.schema import User, Job, Candidate, MatchResult

router = APIRouter()
rag_sessions = {}

@router.post("/upload")
async def upload_for_chat(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    if not file.filename.endswith('.pdf') and not file.filename.endswith('.docx'):
        raise HTTPException(status_code=400, detail="Only PDF and DOCX files allowed")
    
    suffix = ".pdf" if file.filename.endswith('.pdf') else ".docx"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp:
        temp.write(await file.read())
        temp_path = temp.name
        
    # Extract text dynamically
    from app.services.parser import extract_text
    try:
        text = extract_text(temp_path)
    finally:
        if os.path.exists(temp_path):
            os.unlink(temp_path)
    
    session_id = file.filename
    try:
        rag_sessions[session_id] = build_rag_chain(text)
    except Exception as e:
        return {"status": "error", "message": f"Failed to initialize AI: {str(e)}"}
        
    return {"session_id": session_id, "status": "Ready"}

@router.post("/initialize-candidate/{candidate_id}")
def initialize_candidate_chat(
    candidate_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 1. Fetch candidate
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not candidate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidate profile not found."
        )
        
    # 2. Check if the vacancy belongs to the current user
    match = db.query(MatchResult).filter(MatchResult.candidate_id == candidate_id).first()
    if match:
        job = db.query(Job).filter(Job.id == match.job_id, Job.user_id == current_user.id).first()
        if not job:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Unauthorized access to this candidate's resume."
            )
            
    # 3. Read pre-parsed resume text
    text = candidate.resume_text
    if not text or not text.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Resume text has not been extracted yet. Please re-upload candidate resume."
        )
        
    session_id = f"candidate_{candidate_id}"
    
    try:
        # Build vector search index in RAG memory
        rag_sessions[session_id] = build_rag_chain(text)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to initialize local AI chain: {str(e)}"
        )
        
    return {
        "session_id": session_id,
        "status": "Ready",
        "candidate_name": candidate.name
    }

@router.post("/ask")
async def ask_question(
    req: ChatRequest,
    current_user: User = Depends(get_current_user)
):
    if req.session_id not in rag_sessions:
        raise HTTPException(status_code=404, detail="Active chat session not found. Please select a candidate first.")
    
    chain = rag_sessions[req.session_id]
    try:
        answer = query_resume(chain, req.question, req.chat_history)
        return {"answer": answer}
    except Exception as e:
        return {"answer": "AI Processing error: " + str(e)}
