from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app import crud
from app import schemas
from app.database import get_db

router = APIRouter(prefix="/users", tags=["users"])

@router.post("/", response_model=schemas.User)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    return crud.create_user(db=db, user=user)

@router.get("/", response_model=List[schemas.User])
def read_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    users = crud.get_users(db, skip=skip, limit=limit)
    return users

@router.get("/{user_id}", response_model=schemas.User)
def read_user(user_id: int, db: Session = Depends(get_db)):
    db_user = crud.get_user(db, user_id=user_id)
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Calculate impact stats
    stats = crud.get_user_impact_stats(db, user_id)
    
    # Convert to schema-compatible model
    user_data = schemas.User.model_validate(db_user)
    user_data.impact_points = stats["impact_points"]
    user_data.likes_received = stats["likes_received"]
    user_data.posts_count = stats["posts_count"]
    
    return user_data

@router.put("/{user_id}", response_model=schemas.User)
def update_user(user_id: int, user_update: schemas.UserUpdate, db: Session = Depends(get_db)):
    db_user = crud.get_user(db, user_id=user_id)
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return crud.update_user(db=db, user_id=user_id, updates=user_update)

@router.get("/{user_id}/notifications", response_model=List[schemas.Notification])
def get_user_notifications(user_id: int, db: Session = Depends(get_db)):
    return crud.get_notifications(db, user_id=user_id)

@router.post("/{user_id}/notifications/read", status_code=204)
def mark_user_notifications_as_read(user_id: int, db: Session = Depends(get_db)):
    crud.mark_notifications_as_read(db, user_id=user_id)
    return None

@router.delete("/{user_id}", status_code=204)
def delete_user(user_id: int, db: Session = Depends(get_db)):
    db_user = crud.delete_user(db, user_id=user_id)
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")

@router.get("/{user_id}/activity", response_model=List[schemas.ActivityEntry])
def get_user_activity(user_id: int, db: Session = Depends(get_db)):
    return crud.get_user_activity(db, user_id=user_id)