from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app import crud
from app import schemas
from app.database import get_db

router = APIRouter(prefix="/categories", tags=["categories"])

@router.post("/", response_model=schemas.Entity)
def create_category(category: schemas.EntityCreate, db: Session = Depends(get_db)):
    return crud.create_entity(db=db, entity=category)

@router.get("/", response_model=List[schemas.Entity])
def read_categories(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_entities(db, skip=skip, limit=limit)