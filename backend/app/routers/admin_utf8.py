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
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD")
ADMIN_NAME = os.getenv("ADMIN_NAME", "GlobalCore Admin")

# Dependency to get admin context from headers (simulating JWT for prototype)
from fastapi import Header
def get_admin_context(
    x_admin_id: Optional[int] = Header(None),
    x_admin_role: Optional[str] = Header(None),
    x_admin_dept: Optional[str] = Header(None)
):
    if x_admin_id is None or x_admin_role is None:
        # Fallback for paths that might not have headers yet or for Superadmin .env check
        return {"id": 0, "role": "superadmin", "department": None}
    return {"id": x_admin_id, "role": x_admin_role, "department": x_admin_dept}


# â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
# AUTH
# â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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


# â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
# ANALYTICS
# â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

@router.get("/analytics/snapshot")
def analytics_snapshot(dept_name: Optional[str] = None, db: Session = Depends(get_db), admin: dict = Depends(get_admin_context)):
    """Consolidated endpoint to fetch all dashboard data in a single request."""
    # Enforce departmental scoping
    effective_dept = admin["department"] if admin["role"] != "superadmin" else dept_name
    
    return {
        "summary": crud.get_analytics_summary(db, dept_name=effective_dept),
        "volume": analytics_volume(30, effective_dept, db, admin),
        "by_category": analytics_by_category(effective_dept, db, admin),
        "by_department": analytics_by_department(db),
        "by_status": analytics_by_status(effective_dept, db, admin),
        "ratings": analytics_ratings(effective_dept, db, admin),
        "top_users": analytics_top_users(8, db, admin),
        "engagement": analytics_engagement(30, db, admin),
        "sentiment": crud.get_sentiment_summary(db, dept_name=effective_dept)
    }

@router.get("/analytics/summary")
def analytics_summary(dept_name: Optional[str] = None, db: Session = Depends(get_db), admin: dict = Depends(get_admin_context)):
    effective_dept = admin["department"] if admin["role"] != "superadmin" else dept_name
    return crud.get_analytics_summary(db, dept_name=effective_dept)


@router.get("/analytics/volume")
def analytics_volume(days: int = 30, dept_name: Optional[str] = None, db: Session = Depends(get_db), admin: dict = Depends(get_admin_context)):
    effective_dept = admin["department"] if admin["role"] != "superadmin" else dept_name
    since = datetime.now(timezone.utc) - timedelta(days=days)
    q = db.query(
        cast(models.Feedback.created_at, Date).label("day"),
        func.count(models.Feedback.id).label("count")
    ).filter(models.Feedback.created_at >= since)
    
    if effective_dept:
        q = q.join(models.Department).filter(models.Department.name == effective_dept)
        
    rows = q.group_by(cast(models.Feedback.created_at, Date))\
            .order_by(cast(models.Feedback.created_at, Date)).all()
    return [{"day": str(r.day), "count": r.count} for r in rows]


@router.get("/analytics/by-category")
def analytics_by_category(dept_name: Optional[str] = None, db: Session = Depends(get_db), admin: dict = Depends(get_admin_context)):
    effective_dept = admin["department"] if admin["role"] != "superadmin" else dept_name
    q = db.query(
        models.Category.name,
        func.count(models.Feedback.id).label("count")
    ).outerjoin(models.Feedback, models.Feedback.category_id == models.Category.id)
    
    if effective_dept:
        q = q.join(models.Department, models.Feedback.recipient_dept_id == models.Department.id).filter(models.Department.name == effective_dept)
        
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
def analytics_by_status(dept_name: Optional[str] = None, db: Session = Depends(get_db), admin: dict = Depends(get_admin_context)):
    effective_dept = admin["department"] if admin["role"] != "superadmin" else dept_name
    q = db.query(
        models.Feedback.status,
        func.count(models.Feedback.id).label("count")
    )
    if effective_dept:
        q = q.join(models.Department).filter(models.Department.name == effective_dept)
    rows = q.group_by(models.Feedback.status).all()
    return [{"status": str(r.status).replace("FeedbackStatus.", ""), "count": r.count} for r in rows]


@router.get("/analytics/ratings")
def analytics_ratings(dept_name: Optional[str] = None, db: Session = Depends(get_db), admin: dict = Depends(get_admin_context)):
    effective_dept = admin["department"] if admin["role"] != "superadmin" else dept_name
    q = db.query(
        models.Feedback.rating,
        func.count(models.Feedback.id).label("count")
    ).filter(models.Feedback.rating != None)
    if effective_dept:
        q = q.join(models.Department).filter(models.Department.name == effective_dept)
    rows = q.group_by(models.Feedback.rating)\
            .order_by(models.Feedback.rating).all()
    return [{"rating": r.rating, "count": r.count} for r in rows]


@router.get("/analytics/top-users")
def analytics_top_users(limit: int = 10, db: Session = Depends(get_db), admin: dict = Depends(get_admin_context)):
    effective_dept = admin["department"] if admin["role"] != "superadmin" else None
    
    from sqlalchemy import select
    # Subqueries for point factors
    post_count_sq = (select(func.count(models.Feedback.id)).where((models.Feedback.sender_id == models.User.id) & (models.Feedback.is_approved == True)).scalar_subquery())
    recv_likes_sq = (select(func.count(models.Reaction.id)).join(models.Feedback, models.Reaction.feedback_id == models.Feedback.id).where((models.Feedback.sender_id == models.User.id) & (models.Reaction.is_like == True) & (models.Feedback.is_approved == True)).scalar_subquery())
    give_likes_sq = (select(func.count(models.Reaction.id)).where((models.Reaction.user_id == models.User.id) & (models.Reaction.is_like == True)).scalar_subquery())
    give_rlikes_sq = (select(func.count(models.ReplyReaction.id)).where((models.ReplyReaction.user_id == models.User.id) & (models.ReplyReaction.is_like == True)).scalar_subquery())
    give_comm_sq = (select(func.count(models.Reply.id)).where((models.Reply.user_id == models.User.id) & (models.Reply.parent_id == None)).scalar_subquery())

    query = db.query(
        models.User.id,
        models.User.name,
        models.User.email,
        models.User.department,
        post_count_sq.label("p_cnt"),
        recv_likes_sq.label("r_likes"),
        give_likes_sq.label("r_give"),
        give_rlikes_sq.label("rr_give"),
        give_comm_sq.label("c_give")
    )
    
    if effective_dept:
        query = query.filter(models.User.department == effective_dept)
        
    rows = query.all()
    
    # Calculate points and sort
    results = []
    for r in rows:
        p_cnt = r.p_cnt or 0
        r_lks = r.r_likes or 0
        g_lks = (r.r_give or 0) + (r.rr_give or 0)
        g_cms = r.c_give or 0
        
        pts = (p_cnt * 3) + (r_lks * 0.5) + (g_lks * 0.5) + (g_cms * 0.3)
        results.append({
            "id": r.id, "name": r.name, "email": r.email, "department": r.department, 
            "total_posts": p_cnt, "impact_points": round(float(pts), 1)
        })
    
    results.sort(key=lambda x: x["impact_points"], reverse=True)
    return results[:limit]


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
def analytics_by_location(dept_name: Optional[str] = None, db: Session = Depends(get_db), admin: dict = Depends(get_admin_context)):
    effective_dept = admin["department"] if admin["role"] != "superadmin" else dept_name
    q = db.query(
        models.Feedback.region,
        models.Feedback.city,
        func.count(models.Feedback.id).label("count")
    ).filter(models.Feedback.region != None)
    
    if effective_dept:
        q = q.join(models.Department).filter(models.Department.name == effective_dept)
        
    rows = q.group_by(models.Feedback.region, models.Feedback.city)\
            .order_by(func.count(models.Feedback.id).desc()).all()
    return [{"region": r.region, "city": r.city, "count": r.count} for r in rows]


@router.get("/analytics/sentiment")
def analytics_sentiment(dept_name: Optional[str] = None, db: Session = Depends(get_db)):
    """Analyze overall mood of user feedback."""
    return crud.get_sentiment_summary(db, dept_name=dept_name)

# â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
# USER MANAGEMENT
# â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

@router.get("/users")
def admin_get_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), admin: dict = Depends(get_admin_context)):
    from sqlalchemy import select, func, literal_column
    
    # Enforce departmental scoping
    dept_name = admin["department"] if admin["role"] != "superadmin" else None
    
    # 1. Post count (Approved only)
    post_count_sq = (
        select(func.count(models.Feedback.id))
        .where((models.Feedback.sender_id == models.User.id) & (models.Feedback.is_approved == True))
        .scalar_subquery()
        .label("posts_count")
    )
    
    # 2. Received Likes (where User is the author of the feedback)
    recv_likes_sq = (
        select(func.count(models.Reaction.id))
        .join(models.Feedback, models.Reaction.feedback_id == models.Feedback.id)
        .where((models.Feedback.sender_id == models.User.id) & (models.Reaction.is_like == True) & (models.Feedback.is_approved == True))
        .scalar_subquery()
        .label("recv_likes")
    )

    # 3. Given Likes (Reactions + ReplyReactions given by this user)
    give_likes_sq = (select(func.count(models.Reaction.id)).where((models.Reaction.user_id == models.User.id) & (models.Reaction.is_like == True)).scalar_subquery())
    give_rlikes_sq = (select(func.count(models.ReplyReaction.id)).where((models.ReplyReaction.user_id == models.User.id) & (models.ReplyReaction.is_like == True)).scalar_subquery())
    
    # 4. Given Comments (Top-level only)
    give_comm_sq = (select(func.count(models.Reply.id)).where((models.Reply.user_id == models.User.id) & (models.Reply.parent_id == None)).scalar_subquery())

    # Query with all factors
    query = db.query(
        models.User,
        post_count_sq,
        recv_likes_sq,
        give_likes_sq,
        give_rlikes_sq,
        give_comm_sq
    )
    
    if dept_name:
        query = query.filter(models.User.department == dept_name)
        
    users_with_stats = query.order_by(models.User.id).offset(skip).limit(limit).all()

    result = []
    for u, p_cnt, r_likes, r_give, rr_give, c_give in users_with_stats:
        p_cnt = p_cnt or 0
        r_likes = r_likes or 0
        r_give = r_give or 0
        rr_give = rr_give or 0
        c_give = c_give or 0
        
        # Calculate points using the same weights as CRUD
        pts = (p_cnt * 3) + (r_likes * 0.5) + ((r_give + rr_give) * 0.5) + (c_give * 0.3)
        
        result.append({
            "id": u.id, "name": u.name, "email": u.email, "department": u.department,
            "is_active": u.is_active, "avatar_url": u.avatar_url,
            "created_at": str(u.created_at),
            "total_posts": p_cnt,
            "impact_points": round(float(pts), 1)
        })
    return result


@router.put("/users/{user_id}/status")
def admin_toggle_user_status(user_id: int, is_active: bool, db: Session = Depends(get_db), admin: dict = Depends(get_admin_context)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Authority Check
    if admin["role"] != "superadmin":
        if user.department != admin["department"]:
            raise HTTPException(status_code=403, detail="Cannot manage users outside your department")
        if user.role in ["admin", "superadmin"]:
            raise HTTPException(status_code=403, detail="Departmental admins cannot manage other admins")

    user.is_active = is_active
    
    # Audit Log
    crud.create_audit_log(
        db, 
        action_type="deactivate_user" if not is_active else "reactivate_user",
        performed_by_id=admin["id"],
        target_id=str(user_id),
        details={"user_email": user.email, "new_status": "active" if is_active else "inactive"}
    )
    
    db.commit()
    return {"id": user_id, "is_active": is_active}

@router.put("/users/{user_id}/role")
def admin_update_user_role(user_id: int, role: str, db: Session = Depends(get_db), admin: dict = Depends(get_admin_context)):
    if admin["role"] != "superadmin":
        raise HTTPException(status_code=403, detail="Only Superadmins can update roles")
        
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if role not in ["maker", "admin", "superadmin"]:
        raise HTTPException(status_code=400, detail="Invalid role")
    
    old_role = user.role
    user.role = role
    
    # Audit Log
    crud.create_audit_log(
        db, 
        action_type="update_user_role",
        performed_by_id=admin["id"],
        target_id=str(user_id),
        details={"user_email": user.email, "old_role": old_role, "new_role": role}
    )
    
    db.commit()
    return {"id": user_id, "role": role}

@router.put("/users/{user_id}/details")
def admin_update_user_details(user_id: int, role: Optional[str] = None, department: Optional[str] = None, db: Session = Depends(get_db), admin: dict = Depends(get_admin_context)):
    if admin["role"] != "superadmin":
        raise HTTPException(status_code=403, detail="Only Superadmins can update user details completely")
        
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    updates_made = {}
    if role and role in ["maker", "admin", "superadmin"] and role != user.role:
        updates_made["role"] = {"old": user.role, "new": role}
        user.role = role
        
    if department is not None and department != user.department:
        updates_made["department"] = {"old": user.department, "new": department}
        user.department = department if department else None
        
    if updates_made:
        # Audit Log
        crud.create_audit_log(
            db, 
            action_type="update_user_details",
            performed_by_id=admin["id"],
            target_id=str(user_id),
            details={"user_email": user.email, "updates": updates_made}
        )
        db.commit()
        db.refresh(user)
        
    return {"id": user.id, "role": user.role, "department": user.department}


@router.delete("/users/{user_id}", status_code=204)
def admin_delete_user(user_id: int, db: Session = Depends(get_db), admin: dict = Depends(get_admin_context)):
    if admin["role"] != "superadmin":
        raise HTTPException(status_code=403, detail="Only Superadmins can permanently delete users")
        
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Audit Log
    crud.create_audit_log(
        db, 
        action_type="delete_user",
        performed_by_id=admin["id"],
        target_id=str(user_id),
        details={"user_email": user.email}
    )
    
    crud.delete_user(db, user_id=user_id)


# â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
# FEEDBACK MANAGEMENT
# â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

@router.get("/feedbacks")
def admin_get_feedbacks(
    skip: int = 0, limit: int = 50,
    status: Optional[str] = None,
    category_id: Optional[int] = None,
    dept_name: Optional[str] = None,
    db: Session = Depends(get_db),
    admin: dict = Depends(get_admin_context)
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
    
    effective_dept = admin["department"] if admin["role"] != "superadmin" else dept_name
    if effective_dept:
        q = q.filter(models.Department.name == effective_dept)

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
def admin_update_feedback_status(feedback_id: int, status: str, db: Session = Depends(get_db), admin: dict = Depends(get_admin_context)):
    feedback = db.query(models.Feedback).filter(models.Feedback.id == feedback_id).first()
    if not feedback:
        raise HTTPException(status_code=404, detail="Feedback found")

    # Scoping check
    if admin["role"] != "superadmin":
        dept = db.query(models.Department).filter(models.Department.id == feedback.recipient_dept_id).first()
        if not dept or dept.name != admin["department"]:
            raise HTTPException(status_code=403, detail="Cannot manage feedback for other departments")

    status_map = {
        "OPEN": models.FeedbackStatus.OPEN,
        "IN_PROGRESS": models.FeedbackStatus.IN_PROGRESS,
        "RESOLVED": models.FeedbackStatus.RESOLVED,
        "CLOSED": models.FeedbackStatus.CLOSED,
    }
    if status not in status_map:
        raise HTTPException(status_code=400, detail="Invalid status")

    old_status = feedback.status
    feedback.status = status_map[status]
    
    # Audit Log
    crud.create_audit_log(
        db, 
        action_type="update_feedback_status",
        performed_by_id=admin["id"],
        target_id=str(feedback_id),
        details={"old_status": str(old_status), "new_status": status}
    )
    
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
def admin_delete_feedback(feedback_id: int, db: Session = Depends(get_db), admin: dict = Depends(get_admin_context)):
    if admin["role"] != "superadmin":
        raise HTTPException(status_code=403, detail="Only Superadmins can delete feedback")
        
    # Audit Log
    crud.create_audit_log(
        db, 
        action_type="delete_feedback",
        performed_by_id=admin["id"],
        target_id=str(feedback_id)
    )
    
    crud.delete_feedback(db, feedback_id=feedback_id)


# â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
# DEPARTMENTS
# â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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


# â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
# CATEGORIES
# â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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


# â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
# BROADCAST NOTIFICATION
# â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

@router.post("/broadcast")
def admin_broadcast(
    subject: str, 
    message: str, 
    broadcast_type: str = "announcement",
    db: Session = Depends(get_db), 
    admin: dict = Depends(get_admin_context)
):
    # Enforce departmental scoping
    dept_name = admin["department"] if admin["role"] != "superadmin" else None
    
    query = db.query(models.User)
    if dept_name:
        query = query.filter(models.User.department == dept_name)
    
    users = query.all()
    any_feedback = db.query(models.Feedback).first()
    if not any_feedback:
        raise HTTPException(status_code=400, detail="No feedback in system to broadcast against.")
    
    # Prepend department tag if not superadmin
    official_subject = f"[OFFICIAL] {dept_name.upper()} - {subject}" if dept_name else subject
    
    # Log the broadcast FIRST to get the ID
    broadcast_log = crud.create_broadcast_log(db, subject=official_subject, message=message, count=len(users))
    
    for user in users:
        notif = models.Notification(
            user_id=user.id,
            actor_id=None,
            type="broadcast",
            broadcast_type=broadcast_type,
            feedback_id=any_feedback.id,
            subject=official_subject,
            message=message,
            is_read=False,
            broadcast_id=broadcast_log.id
        )
        db.add(notif)
    
    # Audit Log
    crud.create_audit_log(
        db, 
        action_type="broadcast_created",
        performed_by_id=admin["id"],
        details={"subject": official_subject, "sent_to_count": len(users), "type": broadcast_type}
    )
    
    db.commit()
    return {"sent_to": len(users), "subject": official_subject, "message": message, "broadcast_id": broadcast_log.id}


@router.get("/audit-logs", response_model=List[schemas.AuditLog])
def get_audit_logs(skip: int = 0, limit: int = 200, db: Session = Depends(get_db), admin: dict = Depends(get_admin_context)):
    if admin["role"] != "superadmin":
        # Department admins can only see their own department's audit logs
        return crud.get_audit_logs(db, skip=skip, limit=limit, dept_name=admin["department"])
    return crud.get_audit_logs(db, skip=skip, limit=limit)

# â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”@router.post("/approve-suggestion")
def admin_approve_suggestion(feedback_id: int, approved_name: str, db: Session = Depends(get_db)):
    """Approve a suggested name, edit it if needed, and update category choices."""
    feedback = crud.approve_feedback_choice(db, feedback_id=feedback_id, approved_name=approved_name)
    if not feedback:
        raise HTTPException(status_code=404, detail="Feedback suggestion not found")
    return {"status": "approved", "feedback_id": feedback_id, "approved_name": approved_name}

# ---------------------------------------------
#  Form Builder (Advanced)
# ---------------------------------------------

@router.get("/form-sections", response_model=List[schemas.FormSection])
def get_form_sections(db: Session = Depends(get_db)):
    """Get all form sections with their nested fields."""
    return db.query(models.FormSection).order_by(models.FormSection.order).all()

@router.post("/form-sections/save")
def save_form_sections(sections: List[schemas.FormSectionUpdate], db: Session = Depends(get_db)):
    """Bulk-save (replace) all sections and their fields. Deletes existing and re-inserts."""
    # 1. Clear existing
    db.query(models.FormField).delete()
    db.query(models.FormSection).delete()
    
    # 2. Insert new structure
    for i, s in enumerate(sections):
        db_section = models.FormSection(
            name=s.name,
            order=i,
            is_active=s.is_active
        )
        db.add(db_section)
        db.flush() # get the id
        
        if s.fields:
            for j, f in enumerate(s.fields):
                db_field = models.FormField(
                    section_id=db_section.id,
                    field_key=f.field_key or f.label.lower().replace(" ", "_"),
                    label=f.label,
                    field_type=f.field_type,
                    is_required=f.is_required,
                    placeholder=f.placeholder,
                    options=f.options,
                    order=j,
                    is_active=f.is_active
                )
                db.add(db_field)
                
    db.commit()
    return {"status": "success", "sections_saved": len(sections)}

@router.get("/form-fields", response_model=List[schemas.FormField])
def get_form_fields(db: Session = Depends(get_db)):
    """Flat list of all active fields for simple user form rendering."""
    return db.query(models.FormField).filter(models.FormField.is_active == True).order_by(models.FormField.order).all()

@router.post("/form-fields/save")
def save_form_fields(fields: List[schemas.FormFieldUpdate], db: Session = Depends(get_db)):
    """Legacy flat save. Clears sections and saves flat list."""
    db.query(models.FormField).delete()
    db.query(models.FormSection).delete()
    for i, f in enumerate(fields):
        db_field = models.FormField(
            field_key=f.field_key or f.label.lower().replace(" ", "_"),
            label=f.label,
            field_type=f.field_type,
            is_required=f.is_required,
            placeholder=f.placeholder,
            options=f.options,
            order=i
        )
        db.add(db_field)
    db.commit()
    return {"saved": len(fields)}

@router.delete("/form-fields/{field_id}", status_code=204)
def delete_form_field(field_id: int, db: Session = Depends(get_db)):
    """Delete a single form field by ID."""
    field = db.query(models.FormField).filter(models.FormField.id == field_id).first()
    if not field:
        raise HTTPException(status_code=404, detail="Field not found")
    db.delete(field)
    db.commit()
