from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional

import crud
import schemas
import models
from database import get_db

router = APIRouter(prefix="/feedbacks", tags=["feedbacks"])

@router.post("/", response_model=schemas.Feedback)
def create_feedback(feedback: schemas.FeedbackCreate, db: Session = Depends(get_db)):
    if not feedback.recipient_user_id and not feedback.recipient_dept_id:
        raise HTTPException(status_code=400, detail="Either recipient_user_id or recipient_dept_id must be provided")
    return crud.create_feedback(db=db, feedback=feedback)

@router.get("/", response_model=List[schemas.Feedback])
def read_feedbacks(skip: int = 0, limit: int = 100, user_id: Optional[int] = None, dept_id: Optional[int] = None, db: Session = Depends(get_db)):
    return crud.get_feedbacks(db, skip=skip, limit=limit, user_id=user_id, dept_id=dept_id)

@router.get("/{feedback_id}", response_model=schemas.FeedbackDetail)
def read_feedback(feedback_id: int, db: Session = Depends(get_db)):
    db_feedback = crud.get_feedback(db, feedback_id=feedback_id)
    if db_feedback is None:
        raise HTTPException(status_code=404, detail="Feedback not found")
    return db_feedback

@router.put("/{feedback_id}/status", response_model=schemas.Feedback)
def update_feedback_status(feedback_id: int, status: models.FeedbackStatus, db: Session = Depends(get_db)):
    db_feedback = crud.update_feedback_status(db, feedback_id=feedback_id, status=status)
    if db_feedback is None:
        raise HTTPException(status_code=404, detail="Feedback not found")
    return db_feedback

@router.post("/{feedback_id}/replies", response_model=schemas.Reply)
def create_reply_for_feedback(feedback_id: int, reply: schemas.ReplyBase, db: Session = Depends(get_db)):
    db_feedback = crud.get_feedback(db, feedback_id=feedback_id)
    if not db_feedback:
        raise HTTPException(status_code=404, detail="Feedback not found")
    reply_data = schemas.ReplyCreate(**reply.model_dump(), feedback_id=feedback_id)
    return crud.create_reply(db=db, reply=reply_data)