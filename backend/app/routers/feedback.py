from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional

from app import crud
from app import schemas
from app import models
from app.database import get_db

router = APIRouter(prefix="/feedbacks", tags=["feedbacks"])

@router.post("/", response_model=schemas.Feedback)
def create_feedback(feedback: schemas.FeedbackCreate, db: Session = Depends(get_db)):
    # General feedback (no specific recipient) is allowed
    return crud.create_feedback(db=db, feedback=feedback)

@router.get("/", response_model=List[schemas.Feedback])
def read_feedbacks(
    recipient_user_id: Optional[int] = None, 
    sender_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 10,
    user_id: Optional[int] = None,
    mentioned_user_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """The primary public newsfeed. Optionally filter by recipient or sender."""
    return crud.get_feedbacks(
        db, 
        skip=skip, 
        limit=limit, 
        sender_id=sender_id, 
        recipient_user_id=recipient_user_id,
        mentioned_user_id=mentioned_user_id,
        current_user_id=user_id
    )

@router.get("/{feedback_id}", response_model=schemas.FeedbackDetail)
def read_feedback(feedback_id: int, db: Session = Depends(get_db)):
    db_feedback = crud.get_feedback(db, feedback_id=feedback_id)
    if db_feedback is None:
        raise HTTPException(status_code=404, detail="Feedback not found")
    return db_feedback

@router.put("/{feedback_id}", response_model=schemas.Feedback)
def update_feedback(feedback_id: int, updates: schemas.FeedbackUpdateFull, db: Session = Depends(get_db)):
    db_feedback = crud.update_feedback(db, feedback_id=feedback_id, updates=updates)
    if db_feedback is None:
        raise HTTPException(status_code=404, detail="Feedback not found")
    return db_feedback

@router.delete("/{feedback_id}", status_code=204)
def delete_feedback(feedback_id: int, db: Session = Depends(get_db)):
    db_feedback = crud.delete_feedback(db, feedback_id=feedback_id)
    if db_feedback is None:
        raise HTTPException(status_code=404, detail="Feedback not found")
    return None

@router.put("/{feedback_id}/status", response_model=schemas.Feedback)
def update_feedback_status(feedback_id: int, status: models.FeedbackStatus, db: Session = Depends(get_db)):
    db_feedback = crud.update_feedback_status(db, feedback_id=feedback_id, status=status)
    if db_feedback is None:
        raise HTTPException(status_code=404, detail="Feedback not found")
    return db_feedback

@router.get("/{feedback_id}/replies", response_model=List[schemas.ReplyWithUser])
def read_feedback_replies(feedback_id: int, user_id: Optional[int] = None, db: Session = Depends(get_db)):
    db_feedback = crud.get_feedback(db, feedback_id=feedback_id)
    if db_feedback is None:
        raise HTTPException(status_code=404, detail="Feedback not found")
    return crud.get_replies_for_feedback(db, feedback_id=feedback_id, current_user_id=user_id)

@router.post("/{feedback_id}/replies", response_model=schemas.Reply)
def create_feedback_reply(feedback_id: int, reply: schemas.ReplyBase, db: Session = Depends(get_db)):
    db_feedback = crud.get_feedback(db, feedback_id=feedback_id)
    if db_feedback is None:
        raise HTTPException(status_code=404, detail="Feedback not found")
    if getattr(db_feedback, "allow_comments", True) is False:
        raise HTTPException(status_code=400, detail="Comments are disabled for this feedback")
    reply_create = schemas.ReplyCreate(
        message=reply.message,
        user_id=reply.user_id,
        feedback_id=feedback_id,
        parent_id=reply.parent_id
    )
    return crud.create_reply(db=db, reply=reply_create)

@router.put("/{feedback_id}/replies/{reply_id}", response_model=schemas.Reply)
def update_feedback_reply(feedback_id: int, reply_id: int, reply: schemas.ReplyBase, db: Session = Depends(get_db)):
    db_reply = crud.update_reply(db, reply_id=reply_id, new_message=reply.message)
    if db_reply is None:
        raise HTTPException(status_code=404, detail="Reply not found")
    return db_reply

@router.delete("/{feedback_id}/replies/{reply_id}", status_code=204)
def delete_feedback_reply(feedback_id: int, reply_id: int, db: Session = Depends(get_db)):
    db_reply = crud.delete_reply(db, reply_id=reply_id)
    if db_reply is None:
        raise HTTPException(status_code=404, detail="Reply not found")

# --- REACTIONS ---
class ReactionRequest(schemas.ReactionCreate):
    pass

@router.post("/{feedback_id}/reactions")
def toggle_reaction(feedback_id: int, body: schemas.ReactionCreate, db: Session = Depends(get_db)):
    """Toggle Like (is_like=true) or Dislike (is_like=false). Returns None on unreact."""
    result = crud.toggle_reaction(db, user_id=body.user_id, feedback_id=feedback_id, is_like=body.is_like)
    return result or {"status": "removed"}

@router.get("/{feedback_id}/reactions")
def get_reactions(feedback_id: int, user_id: Optional[int] = None, db: Session = Depends(get_db)):
    """Get like/dislike counts plus current user's reaction."""
    return crud.get_reactions_summary(db, feedback_id=feedback_id, current_user_id=user_id)

@router.post("/{feedback_id}/replies/{reply_id}/reactions")
def toggle_reply_reaction(feedback_id: int, reply_id: int, body: schemas.ReplyReactionCreate, db: Session = Depends(get_db)):
    """Toggle Like/Dislike on a comment."""
    result = crud.toggle_reply_reaction(db, user_id=body.user_id, reply_id=reply_id, is_like=body.is_like)
    return result or {"status": "removed"}