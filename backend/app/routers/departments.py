from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app import crud
from app import schemas
from app.database import get_db

router = APIRouter(prefix="/departments", tags=["departments"])

@router.post("/", response_model=schemas.Department)
def create_department(department: schemas.DepartmentCreate, db: Session = Depends(get_db)):
    return crud.create_department(db=db, department=department)

@router.get("/", response_model=List[schemas.Department])
def read_departments(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_departments(db, skip=skip, limit=limit)