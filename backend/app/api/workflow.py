from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.schema import User, WorkflowStage
from app.schemas.schemas import WorkflowStageCreate, WorkflowStageResponse
from app.api.deps import get_current_user
from typing import List

router = APIRouter()

@router.get("", response_model=List[WorkflowStageResponse])
def get_workflow_stages(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    stages = db.query(WorkflowStage).order_by(WorkflowStage.order_index).all()
    if not stages:
        # Create default stages
        default_stages = ["Applied", "Screening", "Interviewing", "Offer"]
        for idx, name in enumerate(default_stages):
            stage = WorkflowStage(name=name, order_index=idx, user_id=current_user.id)
            db.add(stage)
        db.commit()
        stages = db.query(WorkflowStage).order_by(WorkflowStage.order_index).all()
    return stages

from sqlalchemy import func

@router.post("", response_model=WorkflowStageResponse)
def create_workflow_stage(
    payload: WorkflowStageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    max_index = db.query(func.max(WorkflowStage.order_index)).scalar()
    next_index = (max_index or 0) + 1
    
    stage = WorkflowStage(
        name=payload.name,
        order_index=next_index,
        user_id=current_user.id
    )
    db.add(stage)
    db.commit()
    db.refresh(stage)
    return stage
