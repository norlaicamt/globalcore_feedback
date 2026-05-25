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
    new_product = crud.create_product(db=db, product=product)
    crud.create_audit_log(
        db,
        action_type="create_product",
        performed_by_id=admin.id,
        target_id=str(new_product.id),
        details={
            "description": f"Product '{new_product.name}' was created.",
            "name": new_product.name,
            "category": new_product.category,
            "entity_id": new_product.entity_id
        }
    )
    return new_product

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
    db_product = crud.get_product(db, product_id=product_id)
    if db_product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    
    old_name = db_product.name
    updated_product = crud.update_product(db, product_id=product_id, updates=product)
    
    crud.create_audit_log(
        db,
        action_type="update_product",
        performed_by_id=admin.id,
        target_id=str(product_id),
        details={
            "description": f"Product '{old_name}' details were updated.",
            "name": updated_product.name,
            "updates": product.model_dump(exclude_unset=True)
        }
    )
    return updated_product

@router.post("/{product_id}/duplicate", response_model=schemas.Product)
def duplicate_product(product_id: int, db: Session = Depends(get_db), admin: models.User = Depends(get_current_admin)):
    """Duplicate an existing product."""
    new_product = crud.duplicate_product(db, product_id=product_id)
    if new_product is None:
        raise HTTPException(status_code=404, detail="Product not found")
        
    crud.create_audit_log(
        db,
        action_type="duplicate_product",
        performed_by_id=admin.id,
        target_id=str(new_product.id),
        details={
            "description": f"Product '{new_product.name}' was duplicated from Product ID {product_id}.",
            "name": new_product.name,
            "source_product_id": product_id
        }
    )
    return new_product

@router.post("/bulk")
def bulk_import_products(products: List[schemas.ProductCreate], db: Session = Depends(get_db), admin: models.User = Depends(get_current_admin)):
    """Bulk import products from a list."""
    count = crud.bulk_import_products(db, [p.model_dump() for p in products])
    crud.create_audit_log(
        db,
        action_type="bulk_import_products",
        performed_by_id=admin.id,
        target_id="products",
        details={
            "description": f"Bulk imported {count} products.",
            "imported_count": count
        }
    )
    return {"status": "success", "imported_count": count}

@router.get("/{product_id}/analytics")
def get_product_analytics(product_id: int, db: Session = Depends(get_db)):
    """Get detailed feedback analytics for a specific product."""
    return crud.get_product_analytics(db, product_id=product_id)

@router.delete("/{product_id}")
def delete_product(product_id: int, db: Session = Depends(get_db), admin: models.User = Depends(get_current_admin)):
    """Deactivate a product (soft delete)."""
    db_product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if db_product is None:
        raise HTTPException(status_code=404, detail="Product not found")
        
    crud.delete_product(db, product_id=product_id)
    
    crud.create_audit_log(
        db,
        action_type="deactivate_product",
        performed_by_id=admin.id,
        target_id=str(product_id),
        details={
            "description": f"Product '{db_product.name}' was deactivated (soft-deleted).",
            "name": db_product.name
        }
    )
    return {"status": "success"}

@router.post("/{product_id}/reactivate")
def reactivate_product(product_id: int, db: Session = Depends(get_db), admin: models.User = Depends(get_current_admin)):
    """Reactivate a previously deactivated product."""
    db_product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if db_product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    
    db_product.is_active = True
    db.commit()
    
    crud.create_audit_log(
        db,
        action_type="reactivate_product",
        performed_by_id=admin.id,
        target_id=str(product_id),
        details={
            "description": f"Product '{db_product.name}' was reactivated.",
            "name": db_product.name
        }
    )
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

