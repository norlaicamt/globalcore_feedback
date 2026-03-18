from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
import crud
from database import get_db

router = APIRouter(prefix="/analytics", tags=["analytics"])

@router.get("/dashboard")
def get_dashboard_stats(db: Session = Depends(get_db)):
    return crud.get_analytics_summary(db)