from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.database import get_db
from app.models.schema import User, Job, Candidate
from app.api.deps import get_current_user
from typing import List, Dict, Any

router = APIRouter()

@router.get("/")
def global_search(q: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> Dict[str, List[Dict[str, Any]]]:
    if not q or len(q.strip()) == 0:
        return {"jobs": [], "candidates": []}
    
    search_term = f"%{q.strip().lower()}%"
    
    # Search jobs
    # case-insensitive search in title or department
    jobs = db.query(Job).filter(
        or_(
            Job.title.ilike(search_term),
            Job.department.ilike(search_term),
            Job.location.ilike(search_term)
        )
    ).limit(5).all()

    # Search candidates
    # case-insensitive search in name or email
    candidates = db.query(Candidate).filter(
        or_(
            Candidate.name.ilike(search_term),
            Candidate.email.ilike(search_term)
        )
    ).limit(5).all()

    return {
        "jobs": [
            {
                "id": j.id,
                "title": j.title,
                "department": j.department,
                "location": j.location,
                "type": "job"
            } for j in jobs
        ],
        "candidates": [
            {
                "id": c.id,
                "name": c.name,
                "email": c.email,
                "type": "candidate"
            } for c in candidates
        ]
    }
