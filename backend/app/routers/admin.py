from fastapi import APIRouter, Depends, HTTPException, Body
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

# Dependency to get admin context from headers (simulating JWT for prototype)
from fastapi import Header
def get_admin_context(
    x_admin_id: Optional[int] = Header(None),
    x_admin_role: Optional[str] = Header(None),
    x_admin_dept: Optional[str] = Header(None)
):
    if x_admin_id is None or x_admin_role is None:
        # Fallback for paths that might not have headers yet
        return {"id": 0, "role": "admin", "department": None}
    return {"id": x_admin_id, "role": x_admin_role, "department": x_admin_dept}


def has_global_admin_access(admin: dict) -> bool:
    return admin.get("role") in {"admin", "superadmin"}


def is_globalcore_admin(db: Session, admin: dict) -> bool:
    admin_user = db.query(models.User).filter(models.User.id == admin.get("id")).first()
    return bool(admin_user and admin_user.email == ADMIN_EMAIL)


def apply_scope_filter(db: Session, query, scope_name: Optional[str]):
    """Apply scope filter using Department name first, then Category name fallback."""
    if not scope_name:
        return query
    dept_exists = db.query(models.Department.id).filter(models.Department.name == scope_name).first() is not None
    if dept_exists:
        return query.join(models.Department).filter(models.Department.name == scope_name)
    return query.join(models.Category, models.Feedback.category_id == models.Category.id).filter(models.Category.name == scope_name)


# ?????????????????????????????????????????????
# AUTH
# ?????????????????????????????????????????????

@router.post("/login")
def admin_login(email: str, password: str, db: Session = Depends(get_db)):
    # Check Database for Admin users
    user = db.query(models.User).filter(models.User.email == email).first()
    if user and user.password == password: # In production, use hash checking
        if user.role == "admin":
            if not user.is_active:
                raise HTTPException(status_code=403, detail="Account is deactivated")
            crud.create_audit_log(
                db,
                action_type="login",
                performed_by_id=user.id,
                target_id=str(user.id),
                details={"email": user.email}
            )
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


# ?????????????????????????????????????????????
# ANALYTICS
# ?????????????????????????????????????????????

@router.get("/analytics/snapshot")
def analytics_snapshot(dept_name: Optional[str] = None, db: Session = Depends(get_db), admin: dict = Depends(get_admin_context)):
    """Consolidated endpoint to fetch all dashboard data in a single request."""
    # Enforce departmental scoping
    effective_dept = dept_name if has_global_admin_access(admin) else admin["department"]
    
    return {
        "summary": crud.get_analytics_summary(db, dept_name=effective_dept),
        "volume": analytics_volume(30, effective_dept, db, admin),
        "by_category": analytics_by_category(effective_dept, db, admin),
        "by_department": analytics_by_department(db),
        "by_status": analytics_by_status(effective_dept, db, admin),
        "ratings": analytics_ratings(effective_dept, db, admin),
        "top_users": analytics_top_users(8, db, admin),
        "engagement": analytics_engagement(30, db),
        "sentiment": crud.get_sentiment_summary(db, dept_name=effective_dept)
    }

@router.get("/analytics/summary")
def analytics_summary(dept_name: Optional[str] = None, db: Session = Depends(get_db), admin: dict = Depends(get_admin_context)):
    effective_dept = dept_name if has_global_admin_access(admin) else admin["department"]
    return crud.get_analytics_summary(db, dept_name=effective_dept)


@router.get("/analytics/volume")
def analytics_volume(days: int = 30, dept_name: Optional[str] = None, db: Session = Depends(get_db), admin: dict = Depends(get_admin_context)):
    effective_dept = dept_name if has_global_admin_access(admin) else admin["department"]
    since = datetime.now(timezone.utc) - timedelta(days=days)
    q = db.query(
        cast(models.Feedback.created_at, Date).label("day"),
        func.count(models.Feedback.id).label("count")
    ).filter(models.Feedback.created_at >= since)
    
    q = apply_scope_filter(db, q, effective_dept)
        
    rows = q.group_by(cast(models.Feedback.created_at, Date))\
            .order_by(cast(models.Feedback.created_at, Date)).all()
    return [{"day": str(r.day), "count": r.count} for r in rows]


@router.get("/analytics/by-category")
def analytics_by_category(dept_name: Optional[str] = None, db: Session = Depends(get_db), admin: dict = Depends(get_admin_context)):
    effective_dept = dept_name if has_global_admin_access(admin) else admin["department"]
    q = db.query(
        models.Category.name,
        func.count(models.Feedback.id).label("count")
    ).outerjoin(models.Feedback, models.Feedback.category_id == models.Category.id)
    
    if effective_dept:
        dept_exists = db.query(models.Department.id).filter(models.Department.name == effective_dept).first() is not None
        if dept_exists:
            q = q.join(models.Department, models.Feedback.recipient_dept_id == models.Department.id).filter(models.Department.name == effective_dept)
        else:
            q = q.filter(models.Category.name == effective_dept)
        
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
    effective_dept = dept_name if has_global_admin_access(admin) else admin["department"]
    q = db.query(
        models.Feedback.status,
        func.count(models.Feedback.id).label("count")
    )
    q = apply_scope_filter(db, q, effective_dept)
    rows = q.group_by(models.Feedback.status).all()
    return [{"status": str(r.status).replace("FeedbackStatus.", ""), "count": r.count} for r in rows]


@router.get("/analytics/ratings")
def analytics_ratings(dept_name: Optional[str] = None, db: Session = Depends(get_db), admin: dict = Depends(get_admin_context)):
    effective_dept = dept_name if has_global_admin_access(admin) else admin["department"]
    q = db.query(
        models.Feedback.rating,
        func.count(models.Feedback.id).label("count")
    ).filter(models.Feedback.rating != None)
    q = apply_scope_filter(db, q, effective_dept)
    rows = q.group_by(models.Feedback.rating)\
            .order_by(models.Feedback.rating).all()
    return [{"rating": r.rating, "count": r.count} for r in rows]


@router.get("/analytics/top-users")
def analytics_top_users(limit: int = 10, db: Session = Depends(get_db), admin: dict = Depends(get_admin_context)):
    effective_dept = None if has_global_admin_access(admin) else admin["department"]
    
    query = db.query(
        models.User.id,
        models.User.name,
        models.User.email,
        models.User.department,
        func.count(models.Feedback.id).label("total_posts")
    ).outerjoin(models.Feedback, models.Feedback.sender_id == models.User.id)
    
    if effective_dept:
        query = query.filter(models.User.department == effective_dept)
        
    rows = query.group_by(models.User.id, models.User.name, models.User.email, models.User.department)\
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
def analytics_by_location(dept_name: Optional[str] = None, db: Session = Depends(get_db), admin: dict = Depends(get_admin_context)):
    effective_dept = dept_name if has_global_admin_access(admin) else admin["department"]
    q = db.query(
        models.Feedback.region,
        models.Feedback.city,
        func.count(models.Feedback.id).label("count")
    ).filter(models.Feedback.region != None)
    
    q = apply_scope_filter(db, q, effective_dept)
        
    rows = q.group_by(models.Feedback.region, models.Feedback.city)\
            .order_by(func.count(models.Feedback.id).desc()).all()
    return [{"region": r.region, "city": r.city, "count": r.count} for r in rows]


@router.get("/analytics/sentiment")
def analytics_sentiment(dept_name: Optional[str] = None, db: Session = Depends(get_db)):
    """Analyze overall mood of user feedback."""
    return crud.get_sentiment_summary(db, dept_name=dept_name)

# ?????????????????????????????????????????????
# USER MANAGEMENT
# ?????????????????????????????????????????????

@router.get("/users")
def admin_get_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), admin: dict = Depends(get_admin_context)):
    from sqlalchemy import select, func, literal_column
    
    # Enforce departmental scoping
    dept_name = None if has_global_admin_access(admin) else admin["department"]
    
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
    query = db.query(
        models.User,
        post_count_sq,
        recv_reac_sq,
        recv_comm_sq,
        give_reac_sq,
        give_rreac_sq,
        give_comm_sq
    )
    
    if dept_name:
        query = query.filter(models.User.department == dept_name)
        
    users_with_stats = query.order_by(models.User.id).offset(skip).limit(limit).all()

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
            "id": u.id, "name": u.name, "email": u.email, "department": u.department, "program": u.program,
            "role": "user" if u.role == "maker" else u.role,
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
    if not has_global_admin_access(admin):
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
    if not is_globalcore_admin(db, admin):
        raise HTTPException(status_code=403, detail="Only GlobalCore Admin can update roles")
        
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if role not in ["user", "admin", "maker"]:
        raise HTTPException(status_code=400, detail="Invalid role")
    
    old_role = user.role
    # Backward-compat: map old "maker" naming to "user"
    user.role = "user" if role == "maker" else role
    
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
def admin_update_user_details(user_id: int, role: Optional[str] = None, department: Optional[str] = None, program: Optional[str] = None, db: Session = Depends(get_db), admin: dict = Depends(get_admin_context)):
    if not has_global_admin_access(admin):
        raise HTTPException(status_code=403, detail="Only admins can update user details completely")
        
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    updates_made = {}
    if role and role in ["user", "admin", "maker"] and role != user.role:
        normalized_role = "user" if role == "maker" else role
        updates_made["role"] = {"old": user.role, "new": normalized_role}
        user.role = normalized_role
        
    if department is not None and department != user.department:
        updates_made["department"] = {"old": user.department, "new": department}
        user.department = department if department else None
    if program is not None and program != user.program:
        updates_made["program"] = {"old": user.program, "new": program}
        user.program = program if program else None
        
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
        
    return {"id": user.id, "role": user.role, "department": user.department, "program": user.program}


@router.delete("/users/{user_id}", status_code=204)
def admin_delete_user(user_id: int, db: Session = Depends(get_db), admin: dict = Depends(get_admin_context)):
    if not is_globalcore_admin(db, admin):
        raise HTTPException(status_code=403, detail="Only GlobalCore Admin can permanently delete users")
        
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


# ?????????????????????????????????????????????
# FEEDBACK MANAGEMENT
# ?????????????????????????????????????????????

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
    
    effective_dept = dept_name if has_global_admin_access(admin) else admin["department"]
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
    if not has_global_admin_access(admin):
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
    if not has_global_admin_access(admin):
        raise HTTPException(status_code=403, detail="Only admins can delete feedback")
        
    # Audit Log
    crud.create_audit_log(
        db, 
        action_type="delete_feedback",
        performed_by_id=admin["id"],
        target_id=str(feedback_id)
    )
    
    crud.delete_feedback(db, feedback_id=feedback_id)


# ?????????????????????????????????????????????
# DEPARTMENTS
# ?????????????????????????????????????????????

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


# ?????????????????????????????????????????????
# CATEGORIES
# ?????????????????????????????????????????????

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


# ?????????????????????????????????????????????
# BROADCAST NOTIFICATION
# ?????????????????????????????????????????????

@router.post("/broadcast")
def admin_broadcast(
    subject: str, 
    message: str, 
    broadcast_type: str = "announcement",
    db: Session = Depends(get_db), 
    admin: dict = Depends(get_admin_context)
):
    # Enforce departmental scoping
    dept_name = None if has_global_admin_access(admin) else admin["department"]
    
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
    if not has_global_admin_access(admin):
        # Department admins can only see their own department's audit logs
        return crud.get_audit_logs(db, skip=skip, limit=limit, dept_name=admin["department"])
    return crud.get_audit_logs(db, skip=skip, limit=limit)


@router.get("/profile")
def get_admin_profile(db: Session = Depends(get_db), admin: dict = Depends(get_admin_context)):
    db_admin = db.query(models.User).filter(models.User.id == admin.get("id")).first()
    if not db_admin:
        raise HTTPException(status_code=404, detail="Admin profile not found")
    return {
        "id": db_admin.id,
        "name": db_admin.name,
        "email": db_admin.email,
        "role": db_admin.role,
        "role_title": "GlobalCore Admin" if db_admin.email == ADMIN_EMAIL else "Administrator",
        "department": db_admin.department,
        "avatar_url": db_admin.avatar_url,
        "two_factor_enabled": db_admin.two_factor_enabled,
        "push_notifications": db_admin.push_notifications,
        "email_notifications": db_admin.email_notifications,
        "status_updates": db_admin.status_updates,
        "reply_notifications": db_admin.reply_notifications,
        "weekly_digest": db_admin.weekly_digest,
        "biometrics_enabled": db_admin.biometrics_enabled,
        "show_activity_status": db_admin.show_activity_status,
    }


@router.put("/profile")
def update_admin_profile(payload: dict = Body(...), db: Session = Depends(get_db), admin: dict = Depends(get_admin_context)):
    db_admin = db.query(models.User).filter(models.User.id == admin.get("id")).first()
    if not db_admin:
        raise HTTPException(status_code=404, detail="Admin profile not found")

    allowed_fields = {
        "name", "password", "avatar_url", "two_factor_enabled", "push_notifications",
        "email_notifications", "status_updates", "reply_notifications",
        "weekly_digest", "biometrics_enabled", "show_activity_status"
    }
    changed = {}
    for key, value in payload.items():
        if key in allowed_fields:
            setattr(db_admin, key, value)
            changed[key] = value

    if changed:
        crud.create_audit_log(
            db,
            action_type="update_admin_profile",
            performed_by_id=admin["id"],
            target_id=str(db_admin.id),
            details={"updated_fields": list(changed.keys())}
        )
        db.commit()
        db.refresh(db_admin)

    return {"message": "Profile updated", "updated_fields": list(changed.keys())}


@router.get("/profile/activity")
def get_admin_profile_activity(limit: int = 20, db: Session = Depends(get_db), admin: dict = Depends(get_admin_context)):
    rows = db.query(models.AuditLog)\
        .filter(models.AuditLog.performed_by_id == admin.get("id"))\
        .order_by(models.AuditLog.timestamp.desc())\
        .limit(limit).all()
    return rows


@router.post("/approve-suggestion")
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
        db.flush()  # get the id
        
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
