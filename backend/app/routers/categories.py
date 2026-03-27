from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app import crud
from app import schemas
from app.database import get_db

router = APIRouter(prefix="/categories", tags=["categories"])

@router.post("/", response_model=schemas.Category)
def create_category(category: schemas.CategoryCreate, db: Session = Depends(get_db)):
    return crud.create_category(db=db, category=category)

@router.get("/", response_model=List[schemas.Category])
def read_categories(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_categories(db, skip=skip, limit=limit)