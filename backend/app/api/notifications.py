from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.schema import User, Notification
from app.api.deps import get_current_user
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

router = APIRouter()

class NotificationResponse(BaseModel):
    id: int
    title: str
    message: str
    type: str
    is_read: bool
    link_url: Optional[str] = None
    created_at: datetime

    class Config:
        orm_mode = True

@router.get("/", response_model=List[NotificationResponse])
def get_notifications(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Create sample notifications if none exist to test UI
    existing = db.query(Notification).filter(Notification.user_id == current_user.id).first()
    if not existing:
        samples = [
            Notification(user_id=current_user.id, title="New Job Application", message="Alice Smith applied for Software Engineer", type="candidate", link_url="/app/candidates", is_read=False),
            Notification(user_id=current_user.id, title="System Alert", message="Your weekly report is ready", type="system", link_url="/app/dashboard", is_read=True),
            Notification(user_id=current_user.id, title="Interview Scheduled", message="Interview with Bob Jones tomorrow at 10 AM", type="job", link_url="/app/candidates", is_read=False),
        ]
        db.add_all(samples)
        db.commit()

    notifications = db.query(Notification).filter(Notification.user_id == current_user.id).order_by(Notification.created_at.desc()).all()
    return notifications

@router.put("/{notification_id}/read", response_model=NotificationResponse)
def mark_as_read(notification_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    notification = db.query(Notification).filter(Notification.id == notification_id, Notification.user_id == current_user.id).first()
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    notification.is_read = True
    db.commit()
    db.refresh(notification)
    return notification

@router.put("/read-all", response_model=dict)
def mark_all_as_read(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db.query(Notification).filter(Notification.user_id == current_user.id, Notification.is_read == False).update({"is_read": True})
    db.commit()
    return {"message": "All notifications marked as read"}
