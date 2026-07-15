from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.schema import User, TeamMember
from app.schemas.schemas import TeamMemberCreate, TeamMemberResponse
from app.api.deps import get_current_user
from typing import List

router = APIRouter()

@router.get("", response_model=List[TeamMemberResponse])
def get_team_members(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Returns team members (could be scoped by company in future, currently returns all for demo)
    # Ideally should return members invited by current_user or same org.
    members = db.query(TeamMember).all()
    return members

@router.post("", response_model=TeamMemberResponse)
def invite_team_member(
    payload: TeamMemberCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    member = TeamMember(
        name=payload.name,
        email=payload.email,
        role=payload.role,
        coverage=payload.coverage,
        inviter_id=current_user.id
    )
    db.add(member)
    db.commit()
    db.refresh(member)
    
    # Mock sending email
    print("\\n" + "="*50)
    print("MOCK INVITATION EMAIL SENT")
    print(f"To: {payload.email}")
    print(f"Subject: You've been invited to HireSense by {current_user.full_name}")
    print(f"Body:\\nHi {payload.name},\\n\\nYou've been invited to join the team as a {payload.role}.\\nPlease click here to accept.")
    print("="*50 + "\\n")
    
    return member

@router.delete("/{member_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_team_member(
    member_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    member = db.query(TeamMember).filter(TeamMember.id == member_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Team member not found")
    db.delete(member)
    db.commit()
    return None
