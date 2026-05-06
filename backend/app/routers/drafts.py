from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app import crud, schemas
from app.database import get_db

router = APIRouter(prefix="/drafts", tags=["drafts"])

@router.get("/{user_id}", response_model=List[schemas.Draft])
def read_user_drafts(user_id: int, db: Session = Depends(get_db)):
    return crud.get_drafts(db, user_id=user_id)

@router.post("/{user_id}", response_model=schemas.Draft)
def create_user_draft(user_id: int, draft: schemas.DraftCreate, db: Session = Depends(get_db)):
    return crud.create_draft(db, user_id=user_id, draft=draft)

@router.put("/{draft_id}", response_model=schemas.Draft)
def update_user_draft(draft_id: int, updates: schemas.DraftUpdate, db: Session = Depends(get_db)):
    db_draft = crud.update_draft(db, draft_id=draft_id, updates=updates)
    if not db_draft:
        raise HTTPException(status_code=404, detail="Draft not found")
    return db_draft

@router.delete("/{draft_id}", status_code=204)
def delete_user_draft(draft_id: int, db: Session = Depends(get_db)):
    db_draft = crud.delete_draft(db, draft_id=draft_id)
    if not db_draft:
        raise HTTPException(status_code=404, detail="Draft not found")
    return None
