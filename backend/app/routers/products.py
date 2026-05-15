from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app import crud, models, schemas
from app.database import get_db
from app.routers.admin import get_current_admin

router = APIRouter(
    prefix="/products",
    tags=["products"],
)

@router.post("/", response_model=schemas.Product)
def create_product(product: schemas.ProductCreate, db: Session = Depends(get_db), admin: models.User = Depends(get_current_admin)):
    """Add a new product to the catalog."""
    return crud.create_product(db=db, product=product)

@router.get("/", response_model=List[schemas.Product])
def read_products(
    skip: int = 0, 
    limit: int = 100, 
    entity_id: Optional[int] = None, 
    branch_id: Optional[int] = None,
    only_active: bool = True,
    db: Session = Depends(get_db)
):
    """Retrieve products with optional filtering by entity or branch."""
    return crud.get_products(db, skip=skip, limit=limit, entity_id=entity_id, branch_id=branch_id, only_active=only_active)

@router.get("/{product_id}", response_model=schemas.Product)
def read_product(product_id: int, db: Session = Depends(get_db)):
    """Fetch details of a specific product."""
    db_product = crud.get_product(db, product_id=product_id)
    if db_product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return db_product

@router.put("/{product_id}", response_model=schemas.Product)
def update_product(product_id: int, product: schemas.ProductUpdate, db: Session = Depends(get_db), admin: models.User = Depends(get_current_admin)):
    """Update product information."""
    db_product = crud.update_product(db, product_id=product_id, updates=product)
    if db_product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return db_product

@router.post("/{product_id}/duplicate", response_model=schemas.Product)
def duplicate_product(product_id: int, db: Session = Depends(get_db), admin: models.User = Depends(get_current_admin)):
    """Duplicate an existing product."""
    db_product = crud.duplicate_product(db, product_id=product_id)
    if db_product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return db_product

@router.post("/bulk")
def bulk_import_products(products: List[schemas.ProductCreate], db: Session = Depends(get_db), admin: models.User = Depends(get_current_admin)):
    """Bulk import products from a list."""
    count = crud.bulk_import_products(db, [p.model_dump() for p in products])
    return {"status": "success", "imported_count": count}

@router.get("/{product_id}/analytics")
def get_product_analytics(product_id: int, db: Session = Depends(get_db)):
    """Get detailed feedback analytics for a specific product."""
    return crud.get_product_analytics(db, product_id=product_id)

@router.delete("/{product_id}")
def delete_product(product_id: int, db: Session = Depends(get_db), admin: models.User = Depends(get_current_admin)):
    """Deactivate a product (soft delete)."""
    db_product = crud.delete_product(db, product_id=product_id)
    if db_product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"status": "success"}

# --- EVALUATION TEMPLATES ---

@router.get("/templates/all", response_model=List[schemas.ProductEvaluationTemplate])
def read_product_evaluation_templates(db: Session = Depends(get_db)):
    """Fetch all product evaluation templates."""
    return crud.get_product_evaluation_templates(db)

@router.post("/templates", response_model=schemas.ProductEvaluationTemplate)
def create_product_evaluation_template(template: schemas.ProductEvaluationTemplateCreate, db: Session = Depends(get_db)):
    """Create a new evaluation template."""
    return crud.create_product_evaluation_template(db, template)

@router.put("/templates/{template_id}", response_model=schemas.ProductEvaluationTemplate)
def update_product_evaluation_template(template_id: int, template: schemas.ProductEvaluationTemplateBase, db: Session = Depends(get_db)):
    """Update an evaluation template."""
    db_template = crud.update_product_evaluation_template(db, template_id, template)
    if db_template is None:
        raise HTTPException(status_code=404, detail="Template not found")
    return db_template

@router.delete("/templates/{template_id}")
def delete_product_evaluation_template(template_id: int, db: Session = Depends(get_db)):
    """Delete an evaluation template."""
    success = crud.delete_product_evaluation_template(db, template_id)
    if not success:
        raise HTTPException(status_code=404, detail="Template not found")
    return {"status": "success"}

