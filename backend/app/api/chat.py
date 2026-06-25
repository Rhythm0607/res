from fastapi import APIRouter, UploadFile, File, HTTPException
import tempfile
import os
from app.services.parser import extract_text_from_pdf
from app.services.rag import build_rag_chain, query_resume
from app.schemas.schemas import ChatRequest

router = APIRouter()
rag_sessions = {}

@router.post("/upload")
async def upload_for_chat(file: UploadFile = File(...)):
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF allowed")
    
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as temp:
        temp.write(await file.read())
        temp_path = temp.name
        
    text = extract_text_from_pdf(temp_path)
    os.unlink(temp_path)
    
    session_id = file.filename
    try:
        rag_sessions[session_id] = build_rag_chain(text)
    except Exception as e:
        return {"status": "error", "message": "Failed to initialize AI. Check API Key."}
        
    return {"session_id": session_id, "status": "Ready"}

@router.post("/ask")
async def ask_question(req: ChatRequest):
    if req.session_id not in rag_sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    chain = rag_sessions[req.session_id]
    try:
        answer = query_resume(chain, req.question, req.chat_history)
        return {"answer": answer}
    except Exception as e:
        return {"answer": "AI processing error: " + str(e)}
