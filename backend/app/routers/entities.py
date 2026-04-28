from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import copy

from app import crud
from app import schemas
from app.database import get_db
from app.form_defaults import DEFAULT_FORM_CONFIG, migrate_step_schema
from app import models

router = APIRouter(prefix="/entities", tags=["entities"])

@router.get("/{entity_id}/form-config", response_model=schemas.FormConfig)
def get_entity_form_config(entity_id: int, db: Session = Depends(get_db)):
    """Public endpoint to fetch form configuration for an entity."""
    entity = db.query(models.Entity).filter(models.Entity.id == entity_id).first()
    if not entity:
        raise HTTPException(status_code=404, detail="Entity not found")
    
    if entity.fields and isinstance(entity.fields, dict):
        # If the config is explicitly empty (no steps), return it as is
        if not entity.fields.get("steps") or len(entity.fields.get("steps")) == 0:
             return { "version": 3, "steps": [], "sections": [], "terminology": {} }
        return migrate_step_schema(copy.deepcopy(entity.fields))
    
    # Only return default if the field is completely null (never initialized)
    if entity.fields is None:
        return copy.deepcopy(DEFAULT_FORM_CONFIG)
        
    return { "version": 3, "steps": [], "sections": [], "terminology": {} }

@router.post("/", response_model=schemas.Entity)
def create_entity(entity: schemas.EntityCreate, db: Session = Depends(get_db)):
    return crud.create_entity(db=db, entity=entity)

@router.get("/", response_model=List[schemas.Entity])
def read_entities(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_entities(db, skip=skip, limit=limit)

@router.get("/{entity_id}", response_model=schemas.Entity)
def read_entity(entity_id: int, db: Session = Depends(get_db)):
    entity = db.query(crud.models.Entity).filter(crud.models.Entity.id == entity_id).first()
    if not entity:
        raise HTTPException(status_code=404, detail="Entity not found")
    return entity
