from sqlalchemy.orm import Session
from sqlalchemy import func
import models
import schemas

# User operations
def get_user(db: Session, user_id: int):
    return db.query(models.User).filter(models.User.id == user_id).first()

def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

def get_users(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.User).offset(skip).limit(limit).all()

def create_user(db: Session, user: schemas.UserCreate):
    db_user = models.User(**user.model_dump())
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

# Department operations
def get_departments(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Department).offset(skip).limit(limit).all()

def create_department(db: Session, department: schemas.DepartmentCreate):
    db_dept = models.Department(**department.model_dump())
    db.add(db_dept)
    db.commit()
    db.refresh(db_dept)
    return db_dept

# Category operations
def get_categories(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Category).offset(skip).limit(limit).all()

def create_category(db: Session, category: schemas.CategoryCreate):
    db_cat = models.Category(**category.model_dump())
    db.add(db_cat)
    db.commit()
    db.refresh(db_cat)
    return db_cat

# Feedback operations
def get_feedbacks(db: Session, skip: int = 0, limit: int = 100, user_id: int = None, dept_id: int = None):
    query = db.query(models.Feedback)
    if user_id:
        query = query.filter(
            (models.Feedback.sender_id == user_id) | 
            (models.Feedback.recipient_user_id == user_id)
        )
    if dept_id:
        query = query.filter(models.Feedback.recipient_dept_id == dept_id)
    return query.order_by(models.Feedback.created_at.desc()).offset(skip).limit(limit).all()

def get_feedback(db: Session, feedback_id: int):
    return db.query(models.Feedback).filter(models.Feedback.id == feedback_id).first()

def create_feedback(db: Session, feedback: schemas.FeedbackCreate):
    db_feedback = models.Feedback(**feedback.model_dump())
    db.add(db_feedback)
    db.commit()
    db.refresh(db_feedback)
    return db_feedback

def update_feedback_status(db: Session, feedback_id: int, status: models.FeedbackStatus):
    db_feedback = db.query(models.Feedback).filter(models.Feedback.id == feedback_id).first()
    if db_feedback:
        db_feedback.status = status
        db.commit()
        db.refresh(db_feedback)
    return db_feedback

# Reply operations
def create_reply(db: Session, reply: schemas.ReplyCreate):
    db_reply = models.Reply(**reply.model_dump())
    db.add(db_reply)
    db.commit()
    db.refresh(db_reply)
    return db_reply

# Analytics operations
def get_analytics_summary(db: Session):
    total_feedback = db.query(models.Feedback).count()
    by_status = db.query(models.Feedback.status, func.count(models.Feedback.id)).group_by(models.Feedback.status).all()
    by_category = db.query(models.Category.name, func.count(models.Feedback.id)).outerjoin(models.Feedback).group_by(models.Category.name).all()
    
    return {
        "total_feedback": total_feedback,
        "by_status": dict(by_status),
        "by_category": dict(by_category)
    }