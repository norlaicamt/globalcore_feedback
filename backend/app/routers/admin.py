from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, cast, Date
from typing import List, Optional
from datetime import datetime, timedelta, timezone
import os
from dotenv import load_dotenv

from app import models, schemas, crud
from app.database import get_db

load_dotenv()

router = APIRouter(prefix="/admin", tags=["admin"])

ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "admin@globalcore.com")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "YOUR_ADMIN_PASSWORD")
ADMIN_NAME = os.getenv("ADMIN_NAME", "GlobalCore Admin")


# ─────────────────────────────────────────────
# AUTH
# ─────────────────────────────────────────────

@router.post("/login")
def admin_login(email: str, password: str, db: Session = Depends(get_db)):
    # 1. Check Hardcoded Superadmin (from .env)
    if email == ADMIN_EMAIL and password == ADMIN_PASSWORD:
        return {
            "id": 0,
            "name": ADMIN_NAME,
            "email": ADMIN_EMAIL,
            "role": "superadmin",
            "is_active": True,
            "department": None,
            "avatar_url": None,
        }
    
    # 2. Check Database for Admin/Superadmin users
    user = db.query(models.User).filter(models.User.email == email).first()
    if user and user.password == password: # In production, use hash checking
        if user.role in ["admin", "superadmin"]:
            if not user.is_active:
                raise HTTPException(status_code=403, detail="Account is deactivated")
            return {
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "role": user.role,
                "is_active": user.is_active,
                "department": user.department,
                "avatar_url": user.avatar_url,
            }
        else:
            raise HTTPException(status_code=403, detail="Access denied: Not an administrator")
            
    raise HTTPException(status_code=401, detail="Invalid admin credentials")


# ─────────────────────────────────────────────
# ANALYTICS
# ─────────────────────────────────────────────

@router.get("/analytics/snapshot")
def analytics_snapshot(dept_name: Optional[str] = None, db: Session = Depends(get_db)):
    """Consolidated endpoint to fetch all dashboard data in a single request."""
    return {
        "summary": crud.get_analytics_summary(db, dept_name=dept_name),
        "volume": analytics_volume(30, dept_name, db),
        "by_category": analytics_by_category(dept_name, db),
        "by_department": analytics_by_department(db),
        "by_status": analytics_by_status(dept_name, db),
        "ratings": analytics_ratings(dept_name, db),
        "top_users": analytics_top_users(8, db),
        "engagement": analytics_engagement(30, db),
        "sentiment": crud.get_sentiment_summary(db, dept_name=dept_name)
    }

@router.get("/analytics/summary")
def analytics_summary(dept_name: Optional[str] = None, db: Session = Depends(get_db)):
    return crud.get_analytics_summary(db, dept_name=dept_name)


@router.get("/analytics/volume")
def analytics_volume(days: int = 30, dept_name: Optional[str] = None, db: Session = Depends(get_db)):
    since = datetime.now(timezone.utc) - timedelta(days=days)
    q = db.query(
        cast(models.Feedback.created_at, Date).label("day"),
        func.count(models.Feedback.id).label("count")
    ).filter(models.Feedback.created_at >= since)
    
    if dept_name:
        q = q.join(models.Department).filter(models.Department.name == dept_name)
        
    rows = q.group_by(cast(models.Feedback.created_at, Date))\
            .order_by(cast(models.Feedback.created_at, Date)).all()
    return [{"day": str(r.day), "count": r.count} for r in rows]


@router.get("/analytics/by-category")
def analytics_by_category(dept_name: Optional[str] = None, db: Session = Depends(get_db)):
    q = db.query(
        models.Category.name,
        func.count(models.Feedback.id).label("count")
    ).outerjoin(models.Feedback, models.Feedback.category_id == models.Category.id)
    
    if dept_name:
        q = q.join(models.Department, models.Feedback.recipient_dept_id == models.Department.id).filter(models.Department.name == dept_name)
        
    rows = q.group_by(models.Category.name)\
            .order_by(func.count(models.Feedback.id).desc()).all()
    return [{"name": r.name, "count": r.count} for r in rows]


@router.get("/analytics/by-department")
def analytics_by_department(db: Session = Depends(get_db)):
    rows = db.query(
        models.Department.name,
        func.count(models.Feedback.id).label("count")
    ).outerjoin(models.Feedback, models.Feedback.recipient_dept_id == models.Department.id)\
     .group_by(models.Department.name)\
     .order_by(func.count(models.Feedback.id).desc()).all()
    return [{"name": r.name, "count": r.count} for r in rows]


@router.get("/analytics/by-status")
def analytics_by_status(dept_name: Optional[str] = None, db: Session = Depends(get_db)):
    q = db.query(
        models.Feedback.status,
        func.count(models.Feedback.id).label("count")
    )
    if dept_name:
        q = q.join(models.Department).filter(models.Department.name == dept_name)
    rows = q.group_by(models.Feedback.status).all()
    return [{"status": str(r.status).replace("FeedbackStatus.", ""), "count": r.count} for r in rows]


@router.get("/analytics/ratings")
def analytics_ratings(dept_name: Optional[str] = None, db: Session = Depends(get_db)):
    q = db.query(
        models.Feedback.rating,
        func.count(models.Feedback.id).label("count")
    ).filter(models.Feedback.rating != None)
    if dept_name:
        q = q.join(models.Department).filter(models.Department.name == dept_name)
    rows = q.group_by(models.Feedback.rating)\
            .order_by(models.Feedback.rating).all()
    return [{"rating": r.rating, "count": r.count} for r in rows]


@router.get("/analytics/top-users")
def analytics_top_users(limit: int = 10, db: Session = Depends(get_db)):
    rows = db.query(
        models.User.id,
        models.User.name,
        models.User.email,
        models.User.department,
        func.count(models.Feedback.id).label("total_posts")
    ).outerjoin(models.Feedback, models.Feedback.sender_id == models.User.id)\
     .group_by(models.User.id, models.User.name, models.User.email, models.User.department)\
     .order_by(func.count(models.Feedback.id).desc())\
     .limit(limit).all()
    return [{"id": r.id, "name": r.name, "email": r.email, "department": r.department, "total_posts": r.total_posts} for r in rows]


@router.get("/analytics/engagement")
def analytics_engagement(days: int = 30, db: Session = Depends(get_db)):
    since = datetime.now(timezone.utc) - timedelta(days=days)
    rows = db.query(
        cast(models.Reply.created_at, Date).label("day"),
        func.count(models.Reply.id).label("comments")
    ).filter(models.Reply.created_at >= since)\
     .group_by(cast(models.Reply.created_at, Date))\
     .order_by(cast(models.Reply.created_at, Date)).all()
    return [{"day": str(r.day), "comments": r.comments} for r in rows]


@router.get("/analytics/by-location")
def analytics_by_location(dept_name: Optional[str] = None, db: Session = Depends(get_db)):
    q = db.query(
        models.Feedback.region,
        models.Feedback.city,
        func.count(models.Feedback.id).label("count")
    ).filter(models.Feedback.region != None)
    
    if dept_name:
        q = q.join(models.Department).filter(models.Department.name == dept_name)
        
    rows = q.group_by(models.Feedback.region, models.Feedback.city)\
            .order_by(func.count(models.Feedback.id).desc()).all()
    return [{"region": r.region, "city": r.city, "count": r.count} for r in rows]


@router.get("/analytics/sentiment")
def analytics_sentiment(dept_name: Optional[str] = None, db: Session = Depends(get_db)):
    """Analyze overall mood of user feedback."""
    return crud.get_sentiment_summary(db, dept_name=dept_name)

# ─────────────────────────────────────────────
# USER MANAGEMENT
# ─────────────────────────────────────────────

@router.get("/users")
def admin_get_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    from sqlalchemy import select, func, literal_column
    
    # 1. Post count (Approved only)
    post_count_sq = (
        select(func.count(models.Feedback.id))
        .where((models.Feedback.sender_id == models.User.id) & (models.Feedback.is_approved == True))
        .scalar_subquery()
        .label("posts_count")
    )
    
    # 2. Received Reactions (where User is the author of the feedback)
    recv_reac_sq = (
        select(func.count(models.Reaction.id))
        .join(models.Feedback, models.Reaction.feedback_id == models.Feedback.id)
        .where((models.Feedback.sender_id == models.User.id) & (models.Feedback.is_approved == True))
        .scalar_subquery()
        .label("recv_reac")
    )

    # 3. Received Comments (Top-level replies to user's approved feedback)
    recv_comm_sq = (
        select(func.count(models.Reply.id))
        .join(models.Feedback, models.Reply.feedback_id == models.Feedback.id)
        .where((models.Feedback.sender_id == models.User.id) & (models.Reply.parent_id == None) & (models.Feedback.is_approved == True))
        .scalar_subquery()
        .label("recv_comm")
    )

    # 4. Given Actions (Reactions + ReplyReactions given by this user)
    give_reac_sq = (select(func.count(models.Reaction.id)).where(models.Reaction.user_id == models.User.id).scalar_subquery())
    give_rreac_sq = (select(func.count(models.ReplyReaction.id)).where(models.ReplyReaction.user_id == models.User.id).scalar_subquery())
    
    # 5. Given Comments
    give_comm_sq = (select(func.count(models.Reply.id)).where(models.Reply.user_id == models.User.id).scalar_subquery())

    # Query with all factors
    users_with_stats = db.query(
        models.User,
        post_count_sq,
        recv_reac_sq,
        recv_comm_sq,
        give_reac_sq,
        give_rreac_sq,
        give_comm_sq
    ).order_by(models.User.id).offset(skip).limit(limit).all()

    result = []
    for u, p_cnt, r_recv, c_recv, r_give, rr_give, c_give in users_with_stats:
        p_cnt = p_cnt or 0
        r_recv = r_recv or 0
        c_recv = c_recv or 0
        actions_given = (r_give or 0) + (rr_give or 0)
        c_give = c_give or 0
        
        # Calculate points using the same weights as CRUD
        pts = (p_cnt * 3) + (r_recv * 1.5) + (c_recv * 1) + (actions_given * 0.5) + (c_give * 0.5)
        
        result.append({
            "id": u.id, "name": u.name, "email": u.email, "department": u.department,
            "is_active": u.is_active, "avatar_url": u.avatar_url,
            "created_at": str(u.created_at),
            "total_posts": p_cnt,
            "impact_points": round(float(pts), 1)
        })
    return result


@router.put("/users/{user_id}/status")
def admin_toggle_user_status(user_id: int, is_active: bool, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_active = is_active
    db.commit()
    return {"id": user_id, "is_active": is_active}

@router.put("/users/{user_id}/role")
def admin_update_user_role(user_id: int, role: str, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if role not in ["maker", "admin", "superadmin"]:
        raise HTTPException(status_code=400, detail="Invalid role")
    user.role = role
    db.commit()
    return {"id": user_id, "role": role}


@router.delete("/users/{user_id}", status_code=204)
def admin_delete_user(user_id: int, db: Session = Depends(get_db)):
    crud.delete_user(db, user_id=user_id)


# ─────────────────────────────────────────────
# FEEDBACK MANAGEMENT
# ─────────────────────────────────────────────

@router.get("/feedbacks")
def admin_get_feedbacks(
    skip: int = 0, limit: int = 50,
    status: Optional[str] = None,
    category_id: Optional[int] = None,
    dept_name: Optional[str] = None,
    db: Session = Depends(get_db)
):
    q = db.query(
        models.Feedback.id, models.Feedback.title, models.Feedback.description,
        models.Feedback.status, models.Feedback.is_anonymous, models.Feedback.created_at,
        models.Feedback.rating, models.Feedback.sender_id, models.Feedback.custom_data,
        models.User.name.label("user_name"),
        models.Category.name.label("category_name"),
        models.Department.name.label("dept_name"),
        func.count(models.Reply.id).label("comments_count")
    ).outerjoin(models.User, models.Feedback.sender_id == models.User.id)\
     .outerjoin(models.Category, models.Feedback.category_id == models.Category.id)\
     .outerjoin(models.Department, models.Feedback.recipient_dept_id == models.Department.id)\
     .outerjoin(models.Reply, models.Reply.feedback_id == models.Feedback.id)\
     .group_by(models.Feedback.id, models.User.name, models.Category.name, models.Department.name)

    if status:
        q = q.filter(models.Feedback.status == status)
    if category_id:
        q = q.filter(models.Feedback.category_id == category_id)
    if dept_name:
        q = q.filter(models.Department.name == dept_name)

    rows = q.order_by(models.Feedback.created_at.desc()).offset(skip).limit(limit).all()
    return [{
        "id": r.id, "title": r.title, "description": r.description,
        "status": str(r.status).replace("FeedbackStatus.", ""),
        "is_anonymous": r.is_anonymous, "created_at": str(r.created_at),
        "rating": r.rating, "sender_id": r.sender_id,
        "user_name": r.user_name, "category_name": r.category_name,
        "dept_name": r.dept_name, "comments_count": r.comments_count,
        "custom_data": r.custom_data
    } for r in rows]


@router.put("/feedbacks/{feedback_id}/status")
def admin_update_feedback_status(feedback_id: int, status: str, db: Session = Depends(get_db)):
    feedback = db.query(models.Feedback).filter(models.Feedback.id == feedback_id).first()
    if not feedback:
        raise HTTPException(status_code=404, detail="Feedback not found")

    status_map = {
        "OPEN": models.FeedbackStatus.OPEN,
        "IN_PROGRESS": models.FeedbackStatus.IN_PROGRESS,
        "RESOLVED": models.FeedbackStatus.RESOLVED,
        "CLOSED": models.FeedbackStatus.CLOSED,
    }
    if status not in status_map:
        raise HTTPException(status_code=400, detail="Invalid status")

    feedback.status = status_map[status]
    db.commit()

    # Notify the original poster
    if feedback.sender_id:
        notif = models.Notification(
            user_id=feedback.sender_id,
            actor_id=None,
            type="status_update",
            feedback_id=feedback_id,
            is_read=False,
        )
        db.add(notif)
        db.commit()

    return {"id": feedback_id, "status": status}


@router.delete("/feedbacks/{feedback_id}", status_code=204)
def admin_delete_feedback(feedback_id: int, db: Session = Depends(get_db)):
    crud.delete_feedback(db, feedback_id=feedback_id)


# ─────────────────────────────────────────────
# DEPARTMENTS
# ─────────────────────────────────────────────

@router.get("/departments")
def admin_get_departments(db: Session = Depends(get_db)):
    rows = db.query(
        models.Department.id,
        models.Department.name,
        func.count(models.Feedback.id).label("count")
    ).outerjoin(models.Feedback, models.Feedback.recipient_dept_id == models.Department.id)\
     .group_by(models.Department.id, models.Department.name)\
     .order_by(models.Department.name).all()
    return [{"id": r.id, "name": r.name, "count": r.count} for r in rows]


@router.post("/departments")
def admin_create_department(name: str, db: Session = Depends(get_db)):
    dept = models.Department(name=name)
    db.add(dept)
    db.commit()
    db.refresh(dept)
    return dept


@router.put("/departments/{dept_id}")
def admin_update_department(dept_id: int, name: str, db: Session = Depends(get_db)):
    dept = db.query(models.Department).filter(models.Department.id == dept_id).first()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
    dept.name = name
    db.commit()
    return dept


@router.delete("/departments/{dept_id}", status_code=204)
def admin_delete_department(dept_id: int, db: Session = Depends(get_db)):
    dept = db.query(models.Department).filter(models.Department.id == dept_id).first()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
    db.delete(dept)
    db.commit()


# ─────────────────────────────────────────────
# CATEGORIES
# ─────────────────────────────────────────────

@router.get("/categories")
def admin_get_categories(db: Session = Depends(get_db)):
    rows = db.query(
        models.Category.id,
        models.Category.name,
        models.Category.description,
        models.Category.icon,
        models.Category.fields,
        func.count(models.Feedback.id).label("count")
    ).outerjoin(models.Feedback, models.Feedback.category_id == models.Category.id)\
     .group_by(models.Category.id, models.Category.name, models.Category.description, models.Category.icon, models.Category.fields)\
     .order_by(models.Category.name).all()
    return [{"id": r.id, "name": r.name, "description": r.description, "icon": r.icon, "fields": r.fields, "count": r.count} for r in rows]


@router.post("/categories")
def admin_create_category(category: schemas.CategoryCreate, db: Session = Depends(get_db)):
    cat = models.Category(name=category.name, description=category.description, icon=category.icon, fields=category.fields)
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return cat


@router.put("/categories/{cat_id}")
def admin_update_category(cat_id: int, category: schemas.CategoryCreate, db: Session = Depends(get_db)):
    db_cat = db.query(models.Category).filter(models.Category.id == cat_id).first()
    if not db_cat:
        raise HTTPException(status_code=404, detail="Category not found")
    db_cat.name = category.name
    if category.description is not None:
        db_cat.description = category.description
    if category.icon is not None:
        db_cat.icon = category.icon
    if category.fields is not None:
        db_cat.fields = category.fields
    db.commit()
    return db_cat


@router.delete("/categories/{cat_id}", status_code=204)
def admin_delete_category(cat_id: int, db: Session = Depends(get_db)):
    cat = db.query(models.Category).filter(models.Category.id == cat_id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    
    usage_count = db.query(models.Feedback).filter(models.Feedback.category_id == cat_id).count()
    if usage_count > 0:
        raise HTTPException(status_code=400, detail=f"Cannot delete category '{cat.name}' because it is in use by {usage_count} feedback(s).")

    db.delete(cat)
    db.commit()


# ─────────────────────────────────────────────
# BROADCAST NOTIFICATION
# ─────────────────────────────────────────────

@router.post("/broadcast")
def admin_broadcast(subject: str, message: str, db: Session = Depends(get_db)):
    users = db.query(models.User).all()
    any_feedback = db.query(models.Feedback).first()
    if not any_feedback:
        raise HTTPException(status_code=400, detail="No feedback in system to broadcast against.")
    
    # Log the broadcast FIRST to get the ID
    broadcast_log = crud.create_broadcast_log(db, subject=subject, message=message, count=len(users))
    
    for user in users:
        notif = models.Notification(
            user_id=user.id,
            actor_id=None,
            type="broadcast",
            feedback_id=any_feedback.id,
            subject=subject,
            message=message,
            is_read=False,
            broadcast_id=broadcast_log.id
        )
        db.add(notif)
    
    db.commit()
    return {"sent_to": len(users), "subject": subject, "message": message, "broadcast_id": broadcast_log.id}

# ─────────────────────────────────────────────
# SYSTEM SETTINGS
# ─────────────────────────────────────────────

@router.get("/settings", response_model=List[schemas.SystemSetting])
def get_admin_settings(db: Session = Depends(get_db)):
    return crud.get_system_settings(db)

@router.patch("/settings/{key}", response_model=schemas.SystemSetting)
def update_admin_setting(key: str, value: str, db: Session = Depends(get_db)):
    return crud.update_system_setting(db, key=key, value=value)

@router.get("/broadcasts", response_model=List[schemas.BroadcastLog])
def get_broadcast_history(db: Session = Depends(get_db)):
    """Fetch history of announcements."""
    return crud.get_broadcast_logs(db)


# ─────────────────────────────────────────────
# ESTABLISHMENT MODERATION
# ─────────────────────────────────────────────

@router.get("/pending-suggestions")
def admin_get_pending_suggestions(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Fetch reports that are pending establishment approval."""
    rows = crud.get_pending_feedbacks(db, skip=skip, limit=limit)
    return [{
        "id": r.id, 
        "title": r.title, 
        "description": r.description,
        "category_id": r.category_id,
        "category_name": r.category_name,
        "user_name": r.user_name,
        "created_at": str(r.created_at)
    } for r in rows]

@router.post("/approve-suggestion")
def admin_approve_suggestion(feedback_id: int, approved_name: str, db: Session = Depends(get_db)):
    """Approve a suggested name, edit it if needed, and update category choices."""
    feedback = crud.approve_feedback_choice(db, feedback_id=feedback_id, approved_name=approved_name)
    if not feedback:
        raise HTTPException(status_code=404, detail="Feedback suggestion not found")
    return {"status": "approved", "feedback_id": feedback_id, "approved_name": approved_name}