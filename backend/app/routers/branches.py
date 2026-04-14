from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional

from app import crud
from app import schemas
from app.database import get_db

router = APIRouter(prefix="/branches", tags=["branches"])

@router.post("/", response_model=schemas.Branch)
def create_branch(branch: schemas.BranchCreate, db: Session = Depends(get_db)):
    return crud.create_branch(db=db, branch=branch)

@router.get("/", response_model=List[schemas.Branch])
def read_branches(
    entity_id: Optional[int] = None, 
    only_active: bool = True,
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db)
):
    return crud.get_branches(db, skip=skip, limit=limit, entity_id=entity_id, only_active=only_active)

@router.get("/{branch_id}", response_model=schemas.Branch)
def read_branch(branch_id: int, db: Session = Depends(get_db)):
    db_branch = db.query(crud.models.Branch).filter(crud.models.Branch.id == branch_id).first()
    if not db_branch:
        raise HTTPException(status_code=404, detail="Branch not found")
    return db_branch

@router.put("/{branch_id}", response_model=schemas.Branch)
def update_branch(branch_id: int, updates: schemas.BranchUpdate, db: Session = Depends(get_db)):
    db_branch = crud.update_branch(db, branch_id=branch_id, updates=updates)
    if not db_branch:
        raise HTTPException(status_code=404, detail="Branch not found")
    return db_branch

@router.delete("/{branch_id}")
def delete_branch(branch_id: int, db: Session = Depends(get_db)):
    db_branch = crud.delete_branch(db, branch_id=branch_id)
    if not db_branch:
        raise HTTPException(status_code=404, detail="Branch not found")
    return {"status": "deactivated"}
