from fastapi import APIRouter, Depends, HTTPException, Body, Header
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, cast, Date
from typing import List, Optional
from datetime import datetime, timedelta, timezone
from pydantic import BaseModel
import os
import uuid
from dotenv import load_dotenv

from app import models, schemas, crud
from app.database import get_db
from app.form_defaults import DEFAULT_FORM_CONFIG, migrate_step_schema
import copy

load_dotenv()

router = APIRouter(prefix="/admin", tags=["admin"])

ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "admin@globalcore.com")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD")
ADMIN_NAME = os.getenv("ADMIN_NAME", "GlobalCore Admin")

# Dependency to get admin user from session token
def get_current_admin(
    x_session_token: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    """
    Standard dependency to fetch and validate the administrative user session.
    Returns 401 if the token is missing/invalid, and 403 if the user lacks admin rights.
    """
    if not x_session_token:
        raise HTTPException(
            status_code=401, 
            detail="Session token missing. Please log in."
        )
    
    admin = db.query(models.User).filter(models.User.session_token == x_session_token).first()
    
    if not admin:
        raise HTTPException(status_code=401, detail="Invalid or expired session")
    
    if admin.role not in ["admin", "superadmin"]:
        raise HTTPException(status_code=403, detail="Access denied: Administrative privileges required")
        
    # We allow inactive admins so they can resume their activity via the UI
    # if not admin.is_active:
    #    raise HTTPException(status_code=403, detail="Account is deactivated")
        
    return admin


def has_global_admin_access(admin_user: models.User) -> bool:
    """
    Returns True if the admin is a Global Admin (has no organization_id or entity_id restriction).
    """
    return (admin_user.role in {"admin", "superadmin"}) and (admin_user.organization_id is None) and (admin_user.entity_id is None)


def is_globalcore_admin(db: Session, admin_user: models.User) -> bool:
    return admin_user.email == ADMIN_EMAIL


def apply_data_scope(query, model, admin_user: models.User):
    """
    Applies organization and entity-based scoping to a query.
    """
    if has_global_admin_access(admin_user):
        return query
    
    # Scoped admin: Filter by assigned organization_id first
    if hasattr(model, "organization_id") and admin_user.organization_id:
        query = query.filter(model.organization_id == admin_user.organization_id)
    
    # Then filter by entity_id if restricted
    if admin_user.entity_id:
        if model == models.User:
            # Scoped admins can see their own staff OR anyone explicitly marked as a "global user" (beneficiaries)
            query = query.filter(
                (models.User.entity_id == admin_user.entity_id) |
                (models.User.is_global_user == True) |
                (models.User.entity_id == None)
            )
        elif model == models.Feedback:
            query = query.filter(models.Feedback.entity_id == admin_user.entity_id)
        elif model == models.Department:
            query = query.filter(models.Department.entity_id == admin_user.entity_id)
        elif model == models.BroadcastLog:
            query = query.filter(models.BroadcastLog.entity_id == admin_user.entity_id)
        elif hasattr(model, "entity_id"):
            query = query.filter(model.entity_id == admin_user.entity_id)
            
    return query


# ?????????????????????????????????????????????
# AUTH
# ?????????????????????????????????????????????

@router.post("/login")
def admin_login(email: str, password: str, db: Session = Depends(get_db)):
    # Check Database for Admin users
    user = db.query(models.User).filter(models.User.email.ilike(email)).first()
    if user and user.password == password: # In production, use hash checking
        # Allow both 'admin' and 'superadmin' roles
        if user.role in ["admin", "superadmin"]:
            # if not user.is_active:
            #     raise HTTPException(status_code=403, detail="Account is deactivated")
            # Generate/Update session token
            token = str(uuid.uuid4())
            user.session_token = token
            user.last_login = datetime.now(timezone.utc)
            db.commit()
            
            return {
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "role": user.role,
                "is_active": user.is_active,
                "department": user.department,
                "entity_id": user.entity_id,
                "organization_id": user.organization_id,
                "session_token": token,
                "avatar_url": user.avatar_url,
                "position_title": user.position_title,
                "unit_name": user.unit_name,
                "phone": user.phone,
                "profile_completed": user.profile_completed
            }
        else:
            raise HTTPException(status_code=403, detail="Access denied: Not an administrator")
            
    raise HTTPException(status_code=401, detail="Invalid admin credentials")
 
 
@router.post("/presence")
def update_admin_presence(
    current_module: str = Body(..., embed=True),
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_current_admin)
):
    admin.last_seen = datetime.now(timezone.utc)
    admin.current_module = current_module
    db.commit()
    return {"status": "success"}


# ?????????????????????????????????????????????
# ANALYTICS
# ?????????????????????????????????????????????

@router.get("/analytics/snapshot")
def analytics_snapshot(days: int = 30, dept_name: Optional[str] = None, db: Session = Depends(get_db), admin: models.User = Depends(get_current_admin)):
    """Consolidated endpoint to fetch all dashboard data in a single request."""
    target_entity_id = admin.entity_id if not has_global_admin_access(admin) else None
    dept_scope = dept_name if has_global_admin_access(admin) else None
    
    return {
        "summary": crud.get_analytics_summary(db, entity_id=target_entity_id, dept_name=dept_scope, days=days),
        "volume": analytics_volume(days=days, dept_name=dept_name, db=db, admin=admin),
        "by_entity": analytics_by_entity(days=days, dept_name=dept_name, db=db, admin=admin),
        "by_status": analytics_by_status(days=days, dept_name=dept_name, db=db, admin=admin),
        "ratings": analytics_ratings(days=days, dept_name=dept_name, db=db, admin=admin),
        "top_users": analytics_top_users(8, dept_name=dept_name, db=db, admin=admin),
        "engagement": analytics_engagement(days, dept_name=dept_name, db=db, admin=admin),
        "sentiment": crud.get_sentiment_summary(db, entity_id=target_entity_id, dept_name=dept_scope, days=days),
        "user_distribution": crud.get_user_distribution(db, entity_id=target_entity_id, dept_name=dept_scope),
        "top_branches": crud.get_top_branches(db, entity_id=target_entity_id, limit=5, days=days),
        "feedback_type_distribution": crud.get_feedback_type_distribution(db, entity_id=target_entity_id, days=days),
        "program_rankings": crud.get_program_rankings(db, entity_id=target_entity_id, days=days),
        "recent_feedbacks": crud.get_feedbacks(
            db, limit=5, only_approved=False, 
            entity_id=target_entity_id if target_entity_id else (db.query(models.Entity.id).filter(models.Entity.name == dept_scope).scalar() if dept_scope else None),
            recipient_dept_id=None if not dept_scope or db.query(models.Entity).filter(models.Entity.name == dept_scope).first() else db.query(models.Department.id).filter(models.Department.name == dept_scope).scalar()
        )
    }

@router.get("/analytics/summary")
def analytics_summary(days: int = 30, dept_name: Optional[str] = None, entity_id: Optional[int] = None, db: Session = Depends(get_db), admin: models.User = Depends(get_current_admin)):
    target_entity_id = entity_id if has_global_admin_access(admin) else admin.entity_id
    return crud.get_analytics_summary(db, entity_id=target_entity_id, dept_name=dept_name if has_global_admin_access(admin) else None, days=days)


@router.get("/analytics/volume")
def analytics_volume(days: int = 30, dept_name: Optional[str] = None, entity_id: Optional[int] = None, db: Session = Depends(get_db), admin: models.User = Depends(get_current_admin)):
    since = datetime.now(timezone.utc) - timedelta(days=days)
    q = db.query(
        cast(models.Feedback.created_at, Date).label("day"),
        func.count(models.Feedback.id).label("count")
    ).filter(models.Feedback.created_at >= since)
    
    # Security: Scoped admins can only see their own entity, Global admins can filter by any entity_id
    target_entity_id = entity_id if has_global_admin_access(admin) else admin.entity_id
    if target_entity_id:
        q = q.filter(models.Feedback.entity_id == target_entity_id)
    elif dept_name:
        # Resolve entity_id from name (Interaction-First scoping)
        entity = db.query(models.Entity).filter(models.Entity.name == dept_name).first()
        if entity:
            q = q.filter(models.Feedback.entity_id == entity.id)
        else:
            q = q.filter(models.Feedback.recipient_dept_id == db.query(models.Department.id).filter(models.Department.name == dept_name).scalar_subquery())
        
    rows = q.group_by(cast(models.Feedback.created_at, Date))\
            .order_by(cast(models.Feedback.created_at, Date)).all()
    return [{"day": str(r.day), "count": r.count} for r in rows]


@router.get("/analytics/by-entity")
def analytics_by_entity(days: int = 30, dept_name: Optional[str] = None, entity_id: Optional[int] = None, db: Session = Depends(get_db), admin: models.User = Depends(get_current_admin)):
    since = datetime.now(timezone.utc) - timedelta(days=days)
    q = db.query(
        models.Entity.name,
        func.count(models.Feedback.id).label("count")
    ).outerjoin(models.Feedback, models.Feedback.entity_id == models.Entity.id)\
     .filter(models.Feedback.created_at >= since)
    
    # Apply scoping
    target_entity_id = entity_id if has_global_admin_access(admin) else admin.entity_id
    if target_entity_id:
        q = q.filter(models.Feedback.entity_id == target_entity_id)
    elif dept_name:
        entity = db.query(models.Entity).filter(models.Entity.name == dept_name).first()
        if entity:
            q = q.filter(models.Feedback.entity_id == entity.id)
        else:
            q = q.filter(models.Feedback.recipient_dept_id == db.query(models.Department.id).filter(models.Department.name == dept_name).scalar_subquery())
        
    rows = q.group_by(models.Entity.name)\
            .order_by(func.count(models.Feedback.id).desc()).all()
    return [{"name": r.name, "count": r.count} for r in rows]


@router.get("/analytics/by-department")
def analytics_by_department(db: Session = Depends(get_db), admin: models.User = Depends(get_current_admin)):
    rows = db.query(
        models.Department.name,
        func.count(models.Feedback.id).label("count")
    ).outerjoin(models.Feedback, models.Feedback.recipient_dept_id == models.Department.id)\
     .group_by(models.Department.name)\
     .order_by(func.count(models.Feedback.id).desc()).all()
    return [{"name": r.name, "count": r.count} for r in rows]


@router.get("/analytics/by-status")
def analytics_by_status(days: int = 30, dept_name: Optional[str] = None, entity_id: Optional[int] = None, db: Session = Depends(get_db), admin: models.User = Depends(get_current_admin)):
    since = datetime.now(timezone.utc) - timedelta(days=days)
    q = db.query(
        models.Feedback.status,
        func.count(models.Feedback.id).label("count")
    ).filter(models.Feedback.created_at >= since)
    
    target_entity_id = entity_id if has_global_admin_access(admin) else admin.entity_id
    if target_entity_id:
        q = q.filter(models.Feedback.entity_id == target_entity_id)
    elif dept_name:
        entity = db.query(models.Entity).filter(models.Entity.name == dept_name).first()
        if entity:
            q = q.filter(models.Feedback.entity_id == entity.id)
        else:
            q = q.filter(models.Feedback.recipient_dept_id == db.query(models.Department.id).filter(models.Department.name == dept_name).scalar_subquery())
    rows = q.group_by(models.Feedback.status).all()
    return [{"status": str(r.status).replace("FeedbackStatus.", ""), "count": r.count} for r in rows]


@router.get("/analytics/ratings")
def analytics_ratings(days: int = 30, dept_name: Optional[str] = None, entity_id: Optional[int] = None, db: Session = Depends(get_db), admin: models.User = Depends(get_current_admin)):
    since = datetime.now(timezone.utc) - timedelta(days=days)
    q = db.query(
        models.Feedback.rating,
        func.count(models.Feedback.id).label("count")
    ).filter(models.Feedback.rating != None, models.Feedback.created_at >= since)
    
    target_entity_id = entity_id if has_global_admin_access(admin) else admin.entity_id
    if target_entity_id:
        q = q.filter(models.Feedback.entity_id == target_entity_id)
    elif dept_name:
        entity = db.query(models.Entity).filter(models.Entity.name == dept_name).first()
        if entity:
            q = q.filter(models.Feedback.entity_id == entity.id)
        else:
            q = q.filter(models.Feedback.recipient_dept_id == db.query(models.Department.id).filter(models.Department.name == dept_name).scalar_subquery())
    rows = q.group_by(models.Feedback.rating)\
            .order_by(models.Feedback.rating).all()
    return [{"rating": r.rating, "count": r.count} for r in rows]


@router.get("/analytics/top-users")
def analytics_top_users(
    limit: int = 10,
    dept_name: Optional[str] = None,
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_current_admin),
):
    # If dept_name is explicitly passed (from snapshot), use it.
    # Otherwise, fall back to admin scoping rules.
    effective_dept = (
        dept_name
        if dept_name is not None
        else (None if has_global_admin_access(admin) else admin.department)
    )
    
    from sqlalchemy import select
    # Subqueries for point factors
    post_count_sq = (select(func.count(models.Feedback.id)).where((models.Feedback.sender_id == models.User.id) & (models.Feedback.is_approved == True)).scalar_subquery())
    recv_likes_sq = (select(func.count(models.Reaction.id)).join(models.Feedback, models.Reaction.feedback_id == models.Feedback.id).where((models.Feedback.sender_id == models.User.id) & (models.Reaction.is_like == True) & (models.Feedback.is_approved == True)).scalar_subquery())
    give_likes_sq = (select(func.count(models.Reaction.id)).where((models.Reaction.user_id == models.User.id) & (models.Reaction.is_like == True)).scalar_subquery())
    give_rlikes_sq = (select(func.count(models.ReplyReaction.id)).where((models.ReplyReaction.user_id == models.User.id) & (models.ReplyReaction.is_like == True)).scalar_subquery())
    give_comm_sq = (select(func.count(models.Reply.id)).where((models.Reply.user_id == models.User.id) & (models.Reply.parent_id == None)).scalar_subquery())

    # Calculate points in SQL or after fetch (SQL is better for sorting)
    # But for simplicity and consistency with the main list, we'll fetch and calc
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
    ).filter(models.User.role.notin_(["admin", "superadmin"]))
    
    if effective_dept:
        entity = db.query(models.Entity).filter(models.Entity.name == effective_dept).first()
        if entity:
            query = query.filter(
                (models.User.id.in_(db.query(models.Feedback.sender_id).filter(models.Feedback.entity_id == entity.id))) |
                (models.User.id.in_(db.query(models.UserContext.user_id).filter(models.UserContext.entity_id == entity.id)))
            )
        else:
            query = query.filter(
                (models.User.unit_name == effective_dept) |
                (models.User.program == effective_dept) |
                (models.User.department == effective_dept)
            )
        
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
def analytics_engagement(
    days: int = 30,
    dept_name: Optional[str] = None,
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_current_admin),
):
    since = datetime.now(timezone.utc) - timedelta(days=days)
    q = db.query(
        cast(models.Reply.created_at, Date).label("day"),
        func.count(models.Reply.id).label("comments"),
    ).filter(models.Reply.created_at >= since)\
     .join(models.Feedback, models.Reply.feedback_id == models.Feedback.id)\
     .join(models.User, models.Reply.user_id == models.User.id)\
     .filter(models.User.role.notin_(["admin", "superadmin"]))

    # Scoping
    if dept_name and has_global_admin_access(admin):
        entity = db.query(models.Entity).filter(models.Entity.name == dept_name).first()
        if entity:
            q = q.filter(models.Feedback.entity_id == entity.id)
        else:
            q = q.filter(models.Feedback.recipient_dept_id == db.query(models.Department.id).filter(models.Department.name == dept_name).scalar_subquery())
    else:
        q = apply_data_scope(q, models.Feedback, admin)

    rows = q.group_by(cast(models.Reply.created_at, Date))\
        .order_by(cast(models.Reply.created_at, Date)).all()
    return [{"day": str(r.day), "comments": r.comments} for r in rows]


@router.get("/analytics/by-location")
def analytics_by_location(dept_name: Optional[str] = None, db: Session = Depends(get_db), admin: models.User = Depends(get_current_admin)):
    effective_dept = dept_name if has_global_admin_access(admin) else admin.department
    q = db.query(
        models.Feedback.region,
        models.Feedback.city,
        func.count(models.Feedback.id).label("count")
    ).filter(models.Feedback.region != None)
    
    # Scoping
    if dept_name and has_global_admin_access(admin):
        entity = db.query(models.Entity).filter(models.Entity.name == dept_name).first()
        if entity:
            q = q.filter(models.Feedback.entity_id == entity.id)
        else:
            q = q.filter(models.Feedback.recipient_dept_id == db.query(models.Department.id).filter(models.Department.name == dept_name).scalar_subquery())
    else:
        q = apply_data_scope(q, models.Feedback, admin)
        
    rows = q.group_by(models.Feedback.region, models.Feedback.city)\
            .order_by(func.count(models.Feedback.id).desc()).all()
    return [{"region": r.region, "city": r.city, "count": r.count} for r in rows]


@router.get("/analytics/sentiment")
def analytics_sentiment(dept_name: Optional[str] = None, entity_id: Optional[int] = None, days: int = 30, db: Session = Depends(get_db), admin: models.User = Depends(get_current_admin)):
    """Analyze overall mood of user feedback."""
    target_entity_id = entity_id if has_global_admin_access(admin) else admin.entity_id
    return crud.get_sentiment_summary(db, entity_id=target_entity_id, dept_name=dept_name if has_global_admin_access(admin) else None, days=days)

# ?????????????????????????????????????????????
# USER MANAGEMENT
# ?????????????????????????????????????????????

@router.get("/users")
def admin_get_users(entity_id: Optional[int] = None, skip: int = 0, limit: int = 100, db: Session = Depends(get_db), admin: models.User = Depends(get_current_admin)):
    from sqlalchemy import select, func, literal_column
    
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
    
    # Apply program-based scoping
    query = apply_data_scope(query, models.User, admin)
    
    if entity_id:
        query = query.filter(models.User.entity_id == entity_id)
    
    # EXCLUSION: Hide global admins from account management list
    query = query.filter(models.User.role != "superadmin")
        
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
            "program": u.program, "entity_id": u.entity_id,
            "entity_name": (u.entity.name if u.entity else None) or u.program or u.department or None,
            "position_title": u.position_title, "role_identity": u.role_identity,
            "role": "user" if u.role == "maker" else u.role,
            "is_active": u.is_active, "avatar_url": u.avatar_url,
            "created_at": str(u.created_at),
            "last_login": str(u.last_login) if u.last_login else None,
            "last_seen": str(u.last_seen) if u.last_seen else None,
            "current_module": u.current_module,
            "total_posts": p_cnt,
            "impact_points": round(float(pts), 1)
        })
    return result

@router.get("/staff")
def admin_get_staff_list(db: Session = Depends(get_db), admin: models.User = Depends(get_current_admin)):
    """Returns a list of all administrative accounts. Restricted to Global Admins."""
    if not has_global_admin_access(admin):
        raise HTTPException(status_code=403, detail="Access denied: Only Global Admins can view the Staff Registry")
    
    staff = db.query(models.User).filter(models.User.role.in_(["admin", "superadmin"])).order_by(models.User.name).all()
    
    return [{
        "id": s.id,
        "name": s.name,
        "email": s.email,
        "role": s.role,
        "department": s.department,
        "last_login": s.last_login,
        "last_seen": s.last_seen,
        "current_module": s.current_module,
        "position_title": s.position_title
    } for s in staff]

@router.post("/users/{user_id}/reset-password")
def admin_reset_password(user_id: int, db: Session = Depends(get_db), admin: models.User = Depends(get_current_admin)):
    """Resets user password to a default 'Welcome123'."""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Authority Check: Scoped admins can only reset their own users
    if not has_global_admin_access(admin):
        if user.entity_id != admin.entity_id:
            raise HTTPException(status_code=403, detail="Cannot reset password for users outside your assigned program")
    from app import auth
    user.password = auth.get_password_hash("Welcome123")
    
    # Audit Log
    crud.create_audit_log(
        db, 
        action_type="password_reset",
        performed_by_id=admin.id,
        target_id=str(user_id),
        details={"user_email": user.email}
    )
    
    db.commit()
    return {"message": "Password reset successfully to Welcome123"}


@router.put("/users/{user_id}/status")
def admin_toggle_user_status(user_id: int, is_active: bool, db: Session = Depends(get_db), admin: models.User = Depends(get_current_admin)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Authority Check
    if not has_global_admin_access(admin):
        if user.entity_id != admin.entity_id:
            raise HTTPException(status_code=403, detail="Cannot manage users outside your program")
        if user.role in ["admin", "superadmin"]:
            raise HTTPException(status_code=403, detail="Program admins cannot manage other admins")

    user.is_active = is_active
    
    # Audit Log
    crud.create_audit_log(
        db, 
        action_type="deactivate_user" if not is_active else "reactivate_user",
        performed_by_id=admin.id,
        target_id=str(user_id),
        details={"user_email": user.email, "new_status": "active" if is_active else "inactive"}
    )
    
    db.commit()
    return {"id": user_id, "is_active": is_active}

@router.put("/users/{user_id}/role")
def admin_update_user_role(user_id: int, role: str, db: Session = Depends(get_db), admin: models.User = Depends(get_current_admin)):
    if not is_globalcore_admin(db, admin):
        raise HTTPException(status_code=403, detail="Only GlobalCore Admin can update roles")
        
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if role not in ["user", "admin", "maker"]:
        raise HTTPException(status_code=400, detail="Invalid role")
    
    # Restriction: Program Admins cannot promote to admin
    if not has_global_admin_access(admin) and role == "admin":
         raise HTTPException(status_code=403, detail="Program Admins cannot promote users to Admin")
    
    old_role = user.role
    # Backward-compat: map old "maker" naming to "user"
    user.role = "user" if role == "maker" else role
    
    # Audit Log
    crud.create_audit_log(
        db, 
        action_type="update_user_role",
        performed_by_id=admin.id,
        target_id=str(user_id),
        details={"user_email": user.email, "old_role": old_role, "new_role": role}
    )
    
    db.commit()
    return {"id": user_id, "role": role}

@router.put("/users/{user_id}/details")
def admin_update_user_details(
    user_id: int, 
    role: Optional[str] = None, 
    department: Optional[str] = None, 
    program: Optional[str] = None,
    entity_id: Optional[int] = None,
    position_title: Optional[str] = None,
    is_global_user: Optional[bool] = None,
    db: Session = Depends(get_db), 
    admin: models.User = Depends(get_current_admin)
):
    # General check: scoped admins can only edit within their scope
    if not has_global_admin_access(admin):
        target_user = db.query(models.User).filter(models.User.id == user_id).first()
        if not target_user or (admin.organization_id and target_user.organization_id != admin.organization_id):
            raise HTTPException(status_code=403, detail="Cannot manage users outside your organization")
        if admin.entity_id and target_user.entity_id != admin.entity_id:
            raise HTTPException(status_code=403, detail="Cannot manage users outside your assigned entity")
        
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Capture historical context for audit trail
    prev_role = user.role
    prev_program = user.program

    # 1. Self-Demotion Prevention
    if user_id == admin.id and role == "user":
        raise HTTPException(status_code=400, detail="Safety Lock: You cannot remove your own admin access.")

    # 2. Last Admin Protection
    if user.role == "admin" and role == "user" and user.entity_id:
        other_admins = db.query(models.User).filter(
            models.User.entity_id == user.entity_id,
            models.User.role == "admin",
            models.User.id != user.id,
            models.User.is_active == True
        ).count()
        if other_admins == 0:
            raise HTTPException(status_code=400, detail=f"Operational Lock: This program ({user.program}) must have at least one active assigned admin.")
        
    updates_made = {}
    if role and role in ["user", "admin", "maker"] and role != user.role:
        # Restriction: Scoped Admins cannot promote to admin unless it's their scope (already handled by outer check)
        # But we double lock promote-to-admin to global admins only for extra security
        if not has_global_admin_access(admin) and role == "admin":
            raise HTTPException(status_code=403, detail="Scoped Admins cannot promote users to Admin via this endpoint")
             
        normalized_role = "user" if role == "maker" else role
        updates_made["role"] = {"old": user.role, "new": normalized_role}
        user.role = normalized_role
        
    if department is not None and department != user.department:
        updates_made["department"] = {"old": user.department, "new": department}
        user.department = department if department else None
    if program is not None and program != user.program:
        updates_made["program"] = {"old": user.program, "new": program}
        user.program = program if program else None
    if entity_id is not None:
        # Sentinel -1 means "Unassign/None"
        target_entity_val = None if entity_id == -1 else entity_id
        
        if target_entity_val != user.entity_id:
            # Restriction: Scoped admins cannot assign users to entities outside their own
            if not has_global_admin_access(admin) and entity_id != admin.entity_id:
                 raise HTTPException(status_code=403, detail="You can only assign users to your own program")
                 
            updates_made["entity_id"] = {"old": user.entity_id, "new": target_entity_val}
            user.entity_id = target_entity_val
        
    if position_title is not None and position_title != user.position_title:
        updates_made["position_title"] = {"old": user.position_title, "new": position_title}
        user.position_title = position_title if position_title else None

    # is_global_user update
    if is_global_user is not None and is_global_user != user.is_global_user:
        updates_made["is_global_user"] = {"old": user.is_global_user, "new": is_global_user}
        user.is_global_user = is_global_user
        
    if updates_made:
        # Determine specific action tag for higher visibility
        action_tag = "update_user_details"
        if "entity_id" in updates_made: action_tag = "entity_assigned"
        if "role" in updates_made: action_tag = "role_changed"

        # Audit Log
        crud.create_audit_log(
            db, 
            action_type=action_tag,
            performed_by_id=admin.id,
            target_id=str(user_id),
            details={
                "user_email": user.email, 
                "updates": updates_made,
                "previous_role": prev_role,
                "previous_program": prev_program,
                "performed_at_scope": admin.department or "Global"
            }
        )
        db.commit()
        db.refresh(user)
        
    return {"id": user.id, "role": user.role, "department": user.department, "entity_id": user.entity_id}


# DELETE USER ENDPOINT REMOVED TO PRESERVE AUDIT TRAIL AND DATA INTEGRITY.
# Users should be 'Deactivated' instead of deleted.


# ?????????????????????????????????????????????
# FEEDBACK MANAGEMENT
# ?????????????????????????????????????????????

@router.get("/feedbacks/unassigned")
def get_unassigned_feedbacks(
    entity_id: Optional[int] = None,
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_current_admin)
):
    target_entity = entity_id
    if not target_entity:
        primary_ctx = db.query(models.UserContext).filter(models.UserContext.user_id == admin.id).first()
        if primary_ctx: target_entity = primary_ctx.entity_id
        elif admin.entity_id: target_entity = admin.entity_id

    if not target_entity: return []

    q = db.query(
        models.Feedback.id, models.Feedback.title, models.Feedback.description,
        models.Feedback.created_at, models.User.name.label("sender_name")
    ).outerjoin(models.User, models.Feedback.sender_id == models.User.id)\
     .filter(models.Feedback.entity_id == target_entity)\
     .filter(models.Feedback.recipient_user_id.is_(None))\
     .filter(models.Feedback.status.in_(["OPEN", "IN_PROGRESS"]))
     
    res = q.order_by(models.Feedback.created_at.desc()).all()
    return [{"id": r.id, "title": r.title, "description": r.description, "created_at": r.created_at, "sender_name": r.sender_name} for r in res]

class AssignFeedbackRequest(BaseModel):
    user_id: int

@router.post("/feedbacks/{feedback_id}/assign")
def assign_feedback(
    feedback_id: int,
    payload: AssignFeedbackRequest,
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_current_admin)
):
    fb = db.query(models.Feedback).filter(models.Feedback.id == feedback_id).first()
    if not fb: raise HTTPException(status_code=404, detail="Feedback not found")
    fb.recipient_user_id = payload.user_id
    db.commit()
    return {"success": True}

@router.get("/feedbacks")
def admin_get_feedbacks(
    skip: int = 0, limit: int = 50,
    status: Optional[str] = None,
    entity_id: Optional[int] = None,
    dept_name: Optional[str] = None,
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_current_admin)
):
    # Aliases for joining assignee user
    Assignee = models.User.__table__.alias("assignee")
    
    q = db.query(
        models.Feedback.id, models.Feedback.title, models.Feedback.description,
        models.Feedback.status, models.Feedback.is_anonymous, models.Feedback.created_at,
        models.Feedback.rating, models.Feedback.sender_id, models.Feedback.custom_data,
        models.Feedback.recipient_user_id,
        models.User.name.label("user_name"),
        models.Entity.name.label("entity_name"),
        models.Department.name.label("dept_name"),
        Assignee.c.name.label("assignee_name"),
        func.count(models.Reply.id).label("comments_count")
    ).outerjoin(models.User, models.Feedback.sender_id == models.User.id)\
     .outerjoin(models.Entity, models.Feedback.entity_id == models.Entity.id)\
     .outerjoin(models.Department, models.Feedback.recipient_dept_id == models.Department.id)\
     .outerjoin(Assignee, models.Feedback.recipient_user_id == Assignee.c.id)\
     .outerjoin(models.Reply, models.Reply.feedback_id == models.Feedback.id)\
     .group_by(models.Feedback.id, models.User.name, models.Entity.name, models.Department.name, Assignee.c.name)

    if status:
        q = q.filter(models.Feedback.status == status)
    if entity_id:
        q = q.filter(models.Feedback.entity_id == entity_id)

    # Use centralized scoping.
    q = apply_data_scope(q, models.Feedback, admin)

    # Global admins can additionally filter by entity name
    if has_global_admin_access(admin) and dept_name:
        q = q.filter(models.Entity.name == dept_name)

    rows = q.order_by(models.Feedback.created_at.desc()).offset(skip).limit(limit).all()
    return [{
        "id": r.id, "title": r.title, "description": r.description,
        "status": str(r.status).replace("FeedbackStatus.", ""),
        "is_anonymous": r.is_anonymous, "created_at": str(r.created_at),
        "rating": r.rating, "sender_id": r.sender_id,
        "user_name": r.user_name, "entity_name": r.entity_name,
        "dept_name": r.dept_name, "comments_count": r.comments_count,
        "custom_data": r.custom_data,
        "assigned_to_user_id": r.recipient_user_id,
        "assigned_to_name": r.assignee_name
    } for r in rows]


@router.put("/feedbacks/{feedback_id}/status")
def admin_update_feedback_status(feedback_id: int, status: str, db: Session = Depends(get_db), admin: models.User = Depends(get_current_admin)):
    feedback = db.query(models.Feedback).filter(models.Feedback.id == feedback_id).first()
    if not feedback:
        raise HTTPException(status_code=404, detail="Feedback found")

    # Scoping check
    if not has_global_admin_access(admin):
        if feedback.entity_id != admin.entity_id:
            raise HTTPException(status_code=403, detail="Cannot manage feedback for other programs")

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
    
    # If closing, record metadata
    if status == "CLOSED":
        feedback.closed_at = datetime.now(timezone.utc)
        feedback.closed_by_id = admin.id
        # No closure note from this simple status toggle unless we add it to the schema, 
        # but the unified reply is the preferred way.
    
    # Audit Log
    crud.create_audit_log(
        db, 
        action_type="update_feedback_status",
        performed_by_id=admin.id,
        target_id=str(feedback_id),
        details={"old_status": str(old_status), "new_status": status}
    )
    
    db.commit()

    # Status notifications removed as per "Interaction-First" vision (Discussion over Workflow)
    return {"id": feedback_id, "status": status}


@router.delete("/feedbacks/{feedback_id}", status_code=204)
def admin_delete_feedback(feedback_id: int, db: Session = Depends(get_db), admin: models.User = Depends(get_current_admin)):
    if not has_global_admin_access(admin):
        raise HTTPException(status_code=403, detail="Only admins can delete feedback")
        
    # Audit Log
    crud.create_audit_log(
        db, 
        action_type="delete_feedback",
        performed_by_id=admin.id,
        target_id=str(feedback_id)
    )
    
    crud.delete_feedback(db, feedback_id=feedback_id)


# ?????????????????????????????????????????????
# DEPARTMENTS
# ?????????????????????????????????????????????

@router.get("/scope-options")
def admin_get_scope_options(db: Session = Depends(get_db), admin: models.User = Depends(get_current_admin)):
    """
    Returns scope options for the dashboard dropdown.

    Head Admin should pick from the configured "program/office" list only.
    In this app, those are the stored Category Types in the `categories` table.
    """
    # Entity Types (Entity.name)
    ent_names = [
        r[0]
        for r in db.query(models.Entity.name)
        .filter(models.Entity.name != None)
        .all()
    ]
    ent_set = {str(n).strip() for n in ent_names if n and str(n).strip()}

    # Normalize + unique
    names = set(ent_set)

    return [{"name": n} for n in sorted(names, key=lambda x: x.lower())]

@router.get("/departments")
def admin_get_departments(db: Session = Depends(get_db), admin: models.User = Depends(get_current_admin)):
    rows = db.query(
        models.Department.id,
        models.Department.name,
        func.count(models.Feedback.id).label("count")
    ).outerjoin(models.Feedback, models.Feedback.recipient_dept_id == models.Department.id)\
     .group_by(models.Department.id, models.Department.name)\
     .order_by(models.Department.name).all()
    return [{"id": r.id, "name": r.name, "count": r.count} for r in rows]


@router.post("/departments")
def admin_create_department(name: str, entity_id: Optional[int] = None, db: Session = Depends(get_db), admin: models.User = Depends(get_current_admin)):
    dept = models.Department(name=name, entity_id=entity_id)
    db.add(dept)
    db.commit()
    db.refresh(dept)
    return dept


@router.put("/departments/{dept_id}")
def admin_update_department(dept_id: int, name: str, entity_id: Optional[int] = None, db: Session = Depends(get_db), admin: models.User = Depends(get_current_admin)):
    dept = db.query(models.Department).filter(models.Department.id == dept_id).first()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
    dept.name = name
    if entity_id is not None:
        dept.entity_id = entity_id
    db.commit()
    return dept


@router.delete("/departments/{dept_id}", status_code=204)
def admin_delete_department(dept_id: int, db: Session = Depends(get_db), admin: models.User = Depends(get_current_admin)):
    dept = db.query(models.Department).filter(models.Department.id == dept_id).first()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
    db.delete(dept)
    db.commit()


# ?????????????????????????????????????????????
# ENTITIES
# ?????????????????????????????????????????????

@router.get("/entities", response_model=List[schemas.Entity])
def get_entities(db: Session = Depends(get_db), admin: models.User = Depends(get_current_admin)):
    """
    Returns all programs (entities) scoped to the admin's organization.
    Uses joinedload to include creator information for transparency.
    """
    query = db.query(models.Entity).options(joinedload(models.Entity.created_by))
    
    if admin.organization_id:
        query = query.filter(models.Entity.organization_id == admin.organization_id)
    
    return query.all()

@router.post("/entities", response_model=schemas.Entity)
def create_entity(entity: schemas.EntityCreate, db: Session = Depends(get_db), admin: models.User = Depends(get_current_admin)):
    """
    Creates a new program. Restricts creation to global/org admins only.
    Automatically assigns the creator ID and organization ID based on the session.
    """
    if admin.entity_id:
        raise HTTPException(status_code=403, detail="You do not have permission to create programs")
    
    # Ensure org ID is assigned if admin belongs to one
    if admin.organization_id and not entity.organization_id:
        entity.organization_id = admin.organization_id
        
    try:
        new_ent = crud.create_entity(db, entity, created_by_id=admin.id)
        
        crud.create_audit_log(
            db,
            action_type="create_program",
            performed_by_id=admin.id,
            target_id=str(new_ent.id),
            details={
                "description": f"Program '{new_ent.name}' was created.",
                "name": new_ent.name
            }
        )
        
        return new_ent
    except Exception as e:
        if "UNIQUE constraint failed" in str(e) or "already exists" in str(e).lower():
            raise HTTPException(status_code=400, detail="A program with this name already exists")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/entities/{ent_id}")
def admin_update_entity(ent_id: int, entity: schemas.EntityCreate, db: Session = Depends(get_db), admin: models.User = Depends(get_current_admin)):
    db_ent = db.query(models.Entity).filter(models.Entity.id == ent_id).first()
    if not db_ent:
        raise HTTPException(status_code=404, detail="Entity not found")
    old_name = db_ent.name
    db_ent.name = entity.name
    if entity.description is not None:
        db_ent.description = entity.description
    if entity.icon is not None:
        db_ent.icon = entity.icon
    if entity.fields is not None:
        db_ent.fields = entity.fields
    db.commit()
    
    crud.create_audit_log(
        db,
        action_type="update_program",
        performed_by_id=admin.id,
        target_id=str(db_ent.id),
        details={
            "description": f"Program '{old_name}' settings were updated.",
            "new_name": db_ent.name,
            "icon_updated": entity.icon is not None
        }
    )
    
    return db_ent


@router.delete("/entities/{ent_id}", status_code=204)
def admin_delete_entity(ent_id: int, db: Session = Depends(get_db), admin: models.User = Depends(get_current_admin)):
    ent = db.query(models.Entity).filter(models.Entity.id == ent_id).first()
    if not ent:
        raise HTTPException(status_code=404, detail="Entity not found")
    
    usage_count = db.query(models.Feedback).filter(models.Feedback.entity_id == ent_id).count()
    if usage_count > 0:
        raise HTTPException(status_code=400, detail=f"Cannot delete entity '{ent.name}' because it is in use by {usage_count} feedback(s).")

    ent_name = ent.name
    db.delete(ent)
    db.commit()
    
    crud.create_audit_log(
        db,
        action_type="delete_program",
        performed_by_id=admin.id,
        target_id=str(ent_id),
        details={
            "description": f"Program '{ent_name}' was permanently deleted.",
            "name": ent_name
        }
    )

# ?????????????????????????????????????????????
# BRANCHES (LOCATIONS)
# ?????????????????????????????????????????????

@router.get("/branches", response_model=List[schemas.Branch])
def admin_get_branches(
    entity_id: Optional[int] = None, 
    only_active: bool = False,
    db: Session = Depends(get_db), 
    admin: models.User = Depends(get_current_admin)
):
    query = db.query(models.Branch)
    if entity_id:
        query = query.filter(models.Branch.entity_id == entity_id)
    if only_active:
        query = query.filter(models.Branch.is_active == True)
        
    query = apply_data_scope(query, models.Branch, admin)
    return query.all()

@router.post("/branches", response_model=schemas.Branch)
def admin_create_branch(branch: schemas.BranchCreate, db: Session = Depends(get_db), admin: models.User = Depends(get_current_admin)):
    # Security: Scoped admins can only create branches for their own entity
    if not has_global_admin_access(admin):
        if branch.entity_id != admin.entity_id:
             raise HTTPException(status_code=403, detail="You can only manage branches for your assigned program")
             
    db_branch = crud.create_branch(db, branch)
    
    # Audit Log
    crud.create_audit_log(
        db,
        action_type="create_branch",
        performed_by_id=admin.id,
        target_id=str(db_branch.id),
        details={
            "description": f"Office/Branch '{db_branch.name}' was registered.",
            "name": db_branch.name, 
            "entity_id": db_branch.entity_id
        }
    )
    
    return db_branch

@router.put("/branches/{branch_id}", response_model=schemas.Branch)
def admin_update_branch(branch_id: int, updates: schemas.BranchUpdate, db: Session = Depends(get_db), admin: models.User = Depends(get_current_admin)):
    db_branch = db.query(models.Branch).filter(models.Branch.id == branch_id).first()
    if not db_branch:
        raise HTTPException(status_code=404, detail="Branch not found")
        
    # Security: Scoped admins can only update their own branches
    if not has_global_admin_access(admin):
        if db_branch.entity_id != admin.entity_id:
             raise HTTPException(status_code=403, detail="Access denied")
             
    db_branch = crud.update_branch(db, branch_id, updates)
    
    # Audit Log
    crud.create_audit_log(
        db,
        action_type="update_branch",
        performed_by_id=admin.id,
        target_id=str(branch_id),
        details={
            "description": f"Office/Branch '{db_branch.name}' settings were updated.",
            "updates": updates.model_dump(exclude_unset=True)
        }
    )
    
    return db_branch

@router.delete("/branches/{branch_id}")
def admin_delete_branch(branch_id: int, db: Session = Depends(get_db), admin: models.User = Depends(get_current_admin)):
    db_branch = db.query(models.Branch).filter(models.Branch.id == branch_id).first()
    if not db_branch:
        raise HTTPException(status_code=404, detail="Branch not found")
        
    # Security: Scoped admins can only delete their own branches
    if not has_global_admin_access(admin):
        if db_branch.entity_id != admin.entity_id:
             raise HTTPException(status_code=403, detail="Access denied")
             
    crud.delete_branch(db, branch_id)
    
    # Audit Log
    crud.create_audit_log(
        db,
        action_type="deactivate_branch",
        performed_by_id=admin.id,
        target_id=str(branch_id),
        details={
            "description": f"Office/Branch '{db_branch.name}' was deactivated (soft-deleted).",
            "branch_id": branch_id
        }
    )
    
    return {"status": "deactivated"}

# ?????????????????????????????????????????????
# SYSTEM LABELS
# ?????????????????????????????????????????????

@router.get("/labels", response_model=List[schemas.SystemLabel])
def get_system_labels(db: Session = Depends(get_db), admin: Optional[models.User] = Depends(get_current_admin)):
    """
    Returns labels scoped to the current admin's organization.
    If no organization-specific labels exist, it falls back to global labels.
    """
    org_id = admin.organization_id if admin else None
    labels = crud.get_system_labels(db, organization_id=org_id)
    
    # If a scoped admin has no labels yet, they should see the global ones as a baseline
    if org_id and not labels:
        labels = crud.get_system_labels(db, organization_id=None)

    if not labels:
        # Seed defaults globally if completely empty
        defaults = [
            ("category_label", "Program"),
            ("entity_label", "Location"),
            ("category_label_plural", "Programs"),
            ("entity_label_plural", "Locations"),
            ("dept_label", "Department"),
            ("dept_label_plural", "Departments"),
            ("feedback_label", "Feedback"),
            ("feedback_label_plural", "Feedbacks")
        ]
        for k, v in defaults:
            crud.update_system_label(db, k, v)
        return crud.get_system_labels(db)
    return labels

@router.post("/labels")
def update_system_label(key: str, value: str, db: Session = Depends(get_db), admin: models.User = Depends(get_current_admin)):
    # Any admin (Global or Scoped) can change their own terminology
    org_id = admin.organization_id # None if global admin
    
    label = crud.update_system_label(db, key, value, organization_id=org_id)
    
    # Audit Log
    crud.create_audit_log(
        db,
        action_type="update_terminology",
        performed_by_id=admin.id,
        target_id=key,
        details={"key": key, "new_value": value, "org_id": org_id}
    )
    
    return label
@router.post("/labels/bulk")
def update_system_labels_bulk(data: dict = Body(...), db: Session = Depends(get_db), admin: models.User = Depends(get_current_admin)):
    # Any admin (Global or Scoped) can change their own terminology
    org_id = admin.organization_id # None if global admin
    
    updated_keys = []
    for key, value in data.items():
        crud.update_system_label(db, key, value, organization_id=org_id)
        updated_keys.append(key)
    
    # Single Audit Log for all changes
    crud.create_audit_log(
        db,
        action_type="bulk_update_terminology",
        performed_by_id=admin.id,
        target_id="system",
        details={"updated_labels": updated_keys, "org_id": org_id}
    )
    db.commit()
    return {"status": "success", "updated_count": len(updated_keys)}


@router.get("/settings", response_model=List[schemas.SystemSetting])
def get_admin_settings(db: Session = Depends(get_db)):
    return crud.get_system_settings(db)


@router.patch("/settings/{key}")
def update_admin_setting(key: str, payload: dict = Body(...), db: Session = Depends(get_db), admin: models.User = Depends(get_current_admin)):
    value = payload.get("value")
    if not has_global_admin_access(admin):
        raise HTTPException(status_code=403, detail="Only global admins can change system settings")
    
    setting = crud.update_system_setting(db, key, value)
    
    # Metadata Tracking for Branding
    if key in ["primary_organization_logo", "primary_organization_name", "primary_color"]:
        crud.update_system_setting(db, "logo_last_updated_at", datetime.now(timezone.utc).isoformat())
        crud.update_system_setting(db, "logo_updated_by", admin.name or admin.email)
    
    # Audit Log with refined action types
    action_type = "update_system_setting"
    if key == "primary_organization_logo":
        action_type = "update_org_logo" if value else "remove_org_logo"
    elif key == "primary_organization_name":
        action_type = "update_org_name"
    
    crud.create_audit_log(
        db,
        action_type=action_type,
        performed_by_id=admin.id,
        target_id=key,
        details={
            "key": key, 
            "new_value": value if key != "primary_organization_logo" else "[IMAGE_DATA]",
            "description": f"System setting '{key}' was updated by {admin.name or admin.email}."
        }
    )
    
    return setting


# ---------------------------------------------
# BROADCAST NOTIFICATION
# ---------------------------------------------

@router.get("/broadcast/recipient-count")
def get_broadcast_recipient_count(
    target_group: str = "all",
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_current_admin)
):
    """
    Returns the live count of recipients for the given target group.
    Follows the same selection logic as the broadcast dispatch.
    """
    is_global = has_global_admin_access(admin)
    query = db.query(models.User)
    
    if not is_global:
        # Scoped admins only see users in their own entity
        query = query.filter(models.User.entity_id == admin.entity_id)
        if target_group == "staff":
            query = query.filter(models.User.role.in_(["admin", "superadmin"]))
        elif target_group == "global":
            query = query.filter(models.User.role == "user")
    else:
        # Global admins can target everyone or specific cohorts
        if target_group == "global":
            query = query.filter(models.User.role == "user")
        elif target_group == "staff":
            query = query.filter(models.User.role.in_(["admin", "superadmin"]))
            
    return {"count": query.count()}


@router.post("/broadcast")
def admin_broadcast(
    subject: str, 
    message: str, 
    broadcast_type: str = "announcement",
    target_group: str = "all", # all, staff, global
    priority: str = "normal",
    status: str = "sent", # draft, scheduled, sent
    require_ack: bool = False,
    scheduled_at: Optional[datetime] = None,
    broadcast_id: Optional[int] = None,
    db: Session = Depends(get_db), 
    admin: models.User = Depends(get_current_admin)
):
    """
    Broadcast system allows Superadmins to reach everyone,
    and Program Admins to reach only their own staff and beneficiaries.
    Now supports Draft/Scheduled states and Priority levels.
    """
    source_tag = "SYSTEM"
    is_global = has_global_admin_access(admin)
    
    if not is_global:
        entity = db.query(models.Entity).filter(models.Entity.id == admin.entity_id).first()
        source_tag = entity.name.upper() if entity else "OFFICIAL"
    
    official_subject = f"[OFFICIAL] {source_tag} - {subject}"
    
    # 1. Selection Logic (Still needed even for counts in Drafts)
    query = db.query(models.User)
    if not is_global:
        query = query.filter(models.User.entity_id == admin.entity_id)
        if target_group == "staff":
            query = query.filter(models.User.role.in_(["admin", "superadmin"]))
        elif target_group == "global":
            query = query.filter(models.User.role == "user")
    else:
        if target_group == "global":
            query = query.filter(models.User.role == "user")
        elif target_group == "staff":
            query = query.filter(models.User.role.in_(["admin", "superadmin"]))

    recipient_count = query.count()
    
    # 2. Log logic: Update if broadcast_id provided, else Create
    if broadcast_id:
        broadcast_log = db.query(models.BroadcastLog).filter(models.BroadcastLog.id == broadcast_id).first()
        if not broadcast_log:
            raise HTTPException(status_code=404, detail="Original broadcast log not found")
        
        # Scope check
        if not is_global and broadcast_log.entity_id != admin.entity_id:
            raise HTTPException(status_code=403, detail="Unauthorized to update this broadcast")
            
        broadcast_log.subject = official_subject
        broadcast_log.message = message
        broadcast_log.sent_to_count = recipient_count
        broadcast_log.priority = priority
        broadcast_log.status = status
        broadcast_log.require_ack = require_ack
        broadcast_log.scheduled_at = scheduled_at
        db.commit()
        db.refresh(broadcast_log)
    else:
        broadcast_log = crud.create_broadcast_log(
            db, 
            subject=official_subject, 
            message=message, 
            count=recipient_count,
            entity_id=admin.entity_id if not is_global else None,
            priority=priority,
            status=status,
            require_ack=require_ack,
            scheduled_at=scheduled_at
        )
    
    # 3. Deliver Notifications (ONLY if status is 'sent')
    if status == "sent":
        users = query.all()
        notifications = []
        for user in users:
            notifications.append(models.Notification(
                user_id=user.id,
                actor_id=admin.id,
                type=models.NotificationType.ANNOUNCEMENT,
                feedback_id=None,
                entity_id=admin.entity_id if not is_global else None,
                subject=official_subject,
                message=message,
                broadcast_id=broadcast_log.id,
                broadcast_type=broadcast_type,
                priority=priority # Pass priority to notification for quick feed rendering
            ))
        
        if notifications:
            crud.create_notifications_bulk(db, notifications)

    # 4. Audit Log
    crud.create_audit_log(
        db, 
        action_type="broadcast_created",
        performed_by_id=admin.id,
        details={
            "subject": official_subject, 
            "sent_to_count": recipient_count, 
            "type": broadcast_type,
            "priority": priority,
            "status": status,
            "target_group": target_group
        }
    )
    
    return {"sent_to": recipient_count, "status": status, "broadcast_id": broadcast_log.id}

# --- END OF FEEDBACK OPERATIONS ---


@router.get("/audit-logs", response_model=List[schemas.AuditLog])
def get_audit_logs(skip: int = 0, limit: int = 200, db: Session = Depends(get_db), admin: models.User = Depends(get_current_admin)):
    if not has_global_admin_access(admin):
        # Department admins can only see their own department's audit logs
        return crud.get_audit_logs(db, skip=skip, limit=limit, dept_name=admin.department)
    return crud.get_audit_logs(db, skip=skip, limit=limit)

@router.post("/broadcasts/{broadcast_id}/archive")
def archive_broadcast(
    broadcast_id: int, 
    db: Session = Depends(get_db), 
    admin: models.User = Depends(get_current_admin)
):
    log = db.query(models.BroadcastLog).filter(models.BroadcastLog.id == broadcast_id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Broadcast not found")
    
    # Scope check
    if not has_global_admin_access(admin) and log.entity_id != admin.entity_id:
        raise HTTPException(status_code=403, detail="Unauthorized")
    
    log.status = "archived"
    db.commit()
    return {"status": "archived"}

@router.post("/broadcasts/{broadcast_id}/resend")
def resend_broadcast(
    broadcast_id: int, 
    db: Session = Depends(get_db), 
    admin: models.User = Depends(get_current_admin)
):
    log = db.query(models.BroadcastLog).filter(models.BroadcastLog.id == broadcast_id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Broadcast not found")
    
    if not has_global_admin_access(admin) and log.entity_id != admin.entity_id:
        raise HTTPException(status_code=403, detail="Unauthorized")

    # Get original target users (simplified for resend)
    query = db.query(models.User)
    if log.entity_id:
        query = query.filter(models.User.entity_id == log.entity_id)
    
    users = query.all()
    notifications = []
    for user in users:
        notifications.append(models.Notification(
            user_id=user.id,
            actor_id=admin.id,
            type=models.NotificationType.ANNOUNCEMENT,
            entity_id=log.entity_id,
            subject=log.subject,
            message=log.message,
            broadcast_id=log.id,
            priority=log.priority
        ))
    
    if notifications:
        crud.create_notifications_bulk(db, notifications)
    
    # Update count if it changed
    log.sent_to_count = len(users)
    log.status = "sent"
    db.commit()
    
    return {"resent_to": len(users)}

@router.get("/broadcasts/drafts", response_model=List[schemas.BroadcastLog])
def get_broadcast_drafts(
    db: Session = Depends(get_db), 
    admin: models.User = Depends(get_current_admin)
):
    entity_id = admin.entity_id if not has_global_admin_access(admin) else None
    return crud.get_broadcast_drafts(db, entity_id=entity_id)

@router.delete("/broadcasts/{broadcast_id}")
def delete_broadcast(
    broadcast_id: int, 
    db: Session = Depends(get_db), 
    admin: models.User = Depends(get_current_admin)
):
    log = db.query(models.BroadcastLog).filter(models.BroadcastLog.id == broadcast_id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Broadcast not found")
    
    if not has_global_admin_access(admin) and log.entity_id != admin.entity_id:
        raise HTTPException(status_code=403, detail="Unauthorized")
    
    if crud.delete_broadcast_log(db, broadcast_id):
        return {"status": "deleted"}
    raise HTTPException(status_code=500, detail="Failed to delete")
@router.get("/profile")
def get_admin_profile(db: Session = Depends(get_db), admin: models.User = Depends(get_current_admin)):
    db_admin = db.query(models.User).filter(models.User.id == admin.id).first()
    if not db_admin:
        raise HTTPException(status_code=404, detail="Admin profile not found")
    return {
        "id": db_admin.id,
        "name": db_admin.name,
        "email": db_admin.email,
        "role": db_admin.role,
        "role_title": "GlobalCore Admin" if db_admin.email == ADMIN_EMAIL else "Administrator",
        "department": db_admin.department,
        "unit_name": db_admin.unit_name,
        "position_title": db_admin.position_title,
        "phone": db_admin.phone,
        "avatar_url": db_admin.avatar_url,
        "two_factor_enabled": db_admin.two_factor_enabled,
        "push_notifications": db_admin.push_notifications,
        "email_notifications": db_admin.email_notifications,
        "notify_announcements": db_admin.notify_announcements,
        "notify_replies": db_admin.notify_replies,
        "notify_comments": db_admin.notify_comments,
        "notify_mentions": db_admin.notify_mentions,
        "notify_likes": db_admin.notify_likes,
        "weekly_digest": db_admin.weekly_digest,
        "biometrics_enabled": db_admin.biometrics_enabled,
        "show_activity_status": db_admin.show_activity_status,
        "profile_completed": db_admin.profile_completed,
        "completed_at": db_admin.completed_at,
        "last_login": db_admin.last_login,
    }


@router.put("/profile")
def update_admin_profile(payload: dict = Body(...), db: Session = Depends(get_db), admin: models.User = Depends(get_current_admin)):
    db_admin = db.query(models.User).filter(models.User.id == admin.id).first()
    if not db_admin:
        raise HTTPException(status_code=404, detail="Admin profile not found")

    allowed_fields = {
        "name", "password", "avatar_url", "two_factor_enabled", "push_notifications",
        "email_notifications", "notify_announcements", "notify_replies",
        "notify_comments", "notify_mentions", "notify_likes",
        "weekly_digest", "biometrics_enabled", "show_activity_status",
        "position_title", "unit_name", "phone"
    }
    changed = {}
    
    # Security: Verify current password if a new password is being set
    if "password" in payload:
        current_password = payload.get("current_password")
        if not current_password or db_admin.password != current_password:
            raise HTTPException(status_code=403, detail="Verification Failed: Current password is incorrect.")

    for key, value in payload.items():
        if key in allowed_fields:
            setattr(db_admin, key, value)
            changed[key] = value

    # Auto-completion check
    if db_admin.position_title and db_admin.unit_name and db_admin.phone:
        if not db_admin.profile_completed:
            db_admin.profile_completed = True
            db_admin.completed_at = datetime.now(timezone.utc)
            changed["profile_completed"] = True

    if changed:
        crud.create_audit_log(
            db,
            action_type="update_admin_profile",
            performed_by_id=admin.id,
            target_id=str(db_admin.id),
            details={"updated_fields": list(changed.keys())}
        )
        db.commit()
        db.refresh(db_admin)

    return {"message": "Profile updated", "updated_fields": list(changed.keys())}


@router.get("/profile/activity")
def get_admin_profile_activity(limit: int = 20, db: Session = Depends(get_db), admin: models.User = Depends(get_current_admin)):
    rows = db.query(models.AuditLog)\
        .filter(models.AuditLog.performed_by_id == admin.id)\
        .order_by(models.AuditLog.timestamp.desc())\
        .limit(limit).all()
    return rows


@router.get("/pending-suggestions")
def admin_get_pending_suggestions(skip: int = 0, limit: int = 20, db: Session = Depends(get_db), admin: models.User = Depends(get_current_admin)):
    """Get all user feedbacks that haven't been approved yet (moderation queue)."""
    return crud.get_pending_feedbacks(db, skip=skip, limit=limit)


@router.post("/approve-suggestion")
def admin_approve_suggestion(feedback_id: int, approved_name: str, db: Session = Depends(get_db), admin: models.User = Depends(get_current_admin)):
    """Approve a suggested name, edit it if needed, and update category choices."""
    feedback = crud.approve_feedback_choice(db, feedback_id=feedback_id, approved_name=approved_name)
    if not feedback:
        raise HTTPException(status_code=404, detail="Feedback suggestion not found")
    return {"status": "approved", "feedback_id": feedback_id, "approved_name": approved_name}


# ---------------------------------------------
#  Form Builder (Advanced)
# ---------------------------------------------

@router.get("/form-sections", response_model=List[schemas.FormSection])
def get_form_sections(db: Session = Depends(get_db), admin: models.User = Depends(get_current_admin)):
    """Get all form sections with their nested fields."""
    return db.query(models.FormSection).order_by(models.FormSection.order).all()


@router.post("/form-sections/save")
def save_form_sections(sections: List[schemas.FormSectionUpdate], db: Session = Depends(get_db), admin: models.User = Depends(get_current_admin)):
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
def save_form_fields(fields: List[schemas.FormFieldUpdate], db: Session = Depends(get_db), admin: models.User = Depends(get_current_admin)):
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
def delete_form_field(field_id: int, db: Session = Depends(get_db), admin: models.User = Depends(get_current_admin)):
    """Delete a single form field by ID."""
    field = db.query(models.FormField).filter(models.FormField.id == field_id).first()
    if not field:
        raise HTTPException(status_code=404, detail="Field not found")
    db.delete(field)
    db.commit()


# ---------------------------------------------
#  Form Builder (Entity-Based)
# ---------------------------------------------

@router.get("/entities/{ent_id}/form-config", response_model=schemas.FormConfig)
def get_entity_form_config(ent_id: int, db: Session = Depends(get_db), admin: models.User = Depends(get_current_admin)):
    """Fetch the custom form configuration for a specific entity."""
    entity = db.query(models.Entity).filter(models.Entity.id == ent_id).first()
    if not entity:
        raise HTTPException(status_code=404, detail="Entity not found")
    
    # Authority Check
    if not has_global_admin_access(admin) and admin.entity_id != ent_id:
        raise HTTPException(status_code=403, detail="Access denied: Cannot view config for other entities")
    
    # Return the config if exists, otherwise migrate and return defaults
    if entity.fields and isinstance(entity.fields, dict):
        migrated = migrate_step_schema(copy.deepcopy(entity.fields))
        return migrated
    
    # Return defaults
    return copy.deepcopy(DEFAULT_FORM_CONFIG)


@router.put("/entities/{ent_id}/form-config")
def update_entity_form_config(ent_id: int, config: schemas.FormConfig, db: Session = Depends(get_db), admin: models.User = Depends(get_current_admin)):
    """Update the custom form configuration for a specific entity."""
    entity = db.query(models.Entity).filter(models.Entity.id == ent_id).first()
    if not entity:
        raise HTTPException(status_code=404, detail="Entity not found")
    
    # Authority Check
    if not has_global_admin_access(admin) and admin.entity_id != ent_id:
        raise HTTPException(status_code=403, detail="Access denied: Cannot modify config for other entities")
    
    # Guardrails: Max 5 sections, 10 fields per section
    if len(config.sections) > 5:
        raise HTTPException(status_code=400, detail="Maximum 5 sections allowed")
    for section in config.sections:
        if len(section.fields) > 10:
            raise HTTPException(status_code=400, detail=f"Maximum 10 fields allowed in section '{section.title}'")
    
    # Store the configuration in the JSONB fields column
    entity.fields = config.model_dump()
    
    # Audit Log
    crud.create_audit_log(
        db,
        action_type="update_entity_form_config",
        performed_by_id=admin.id,
        target_id=str(ent_id),
        details={"entity_name": entity.name, "config_version": config.version}
    )
    
    db.commit()
    return {"message": "Form configuration updated successfully"}


@router.post("/audit/log-action")
def admin_log_action(action_type: str, details: dict = Body(...), db: Session = Depends(get_db), admin: models.User = Depends(get_current_admin)):
    """Generic endpoint for the frontend to log audit actions (e.g. Exports)."""
    crud.create_audit_log(
        db,
        action_type=action_type,
        performed_by_id=admin.id,
        details={**details, "scope": admin.department or "Global"}
    )
    db.commit()
    return {"status": "logged"}

# ---------------------------------------------
#  Broadcast & Communications
# ---------------------------------------------


@router.get("/broadcasts", response_model=List[schemas.BroadcastLog])
def admin_get_broadcasts(db: Session = Depends(get_db), admin: models.User = Depends(get_current_admin)):
    q = apply_data_scope(db.query(models.BroadcastLog), models.BroadcastLog, admin)
    return q.order_by(models.BroadcastLog.created_at.desc()).all()

@router.post("/broadcasts/{log_id}/archive")
def admin_archive_broadcast(log_id: int, db: Session = Depends(get_db), admin: models.User = Depends(get_current_admin)):
    log = db.query(models.BroadcastLog).filter(models.BroadcastLog.id == log_id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Log not found")
    
    # Scoping check
    if not has_global_admin_access(admin) and log.entity_id != admin.entity_id:
        raise HTTPException(status_code=403, detail="Cannot archive other program's broadcast")

    log.status = "archived"
    db.commit()
    return {"message": "Archived"}

@router.post("/broadcasts/{log_id}/resend")
def admin_resend_broadcast(log_id: int, db: Session = Depends(get_db), admin: models.User = Depends(get_current_admin)):
    log = db.query(models.BroadcastLog).filter(models.BroadcastLog.id == log_id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Log not found")
    
    # Scoping check
    if not has_global_admin_access(admin) and log.entity_id != admin.entity_id:
        raise HTTPException(status_code=403, detail="Cannot resend other program's broadcast")

    # Simple resend implementation: create notifications again
    query = db.query(models.User).filter(models.User.is_active == True)
    if not has_global_admin_access(admin):
        query = query.filter(models.User.entity_id == admin.entity_id)
    elif log.entity_id:
        query = query.filter(models.User.entity_id == log.entity_id)
    
    target_users = query.all()
    sent_count = 0
    for user in target_users:
        db_notif = models.Notification(
            user_id=user.id, 
            actor_id=admin.id,
            subject=log.subject, 
            message=log.message,
            type=models.NotificationType.broadcast, 
            priority=log.priority,
            require_ack=log.require_ack, 
            broadcast_id=log.id
        )
        db.add(db_notif)
        sent_count += 1
    
    log.status = "sent"
    log.created_at = datetime.now() # Update timestamp to now
    db.commit()
    return {"message": "Resent", "sent_to": sent_count}

@router.get("/broadcast-templates", response_model=List[schemas.BroadcastTemplate])
def get_broadcast_templates(db: Session = Depends(get_db), admin: models.User = Depends(get_current_admin)):
    q = apply_data_scope(db.query(models.BroadcastTemplate), models.BroadcastTemplate, admin)
    return q.order_by(models.BroadcastTemplate.name.asc()).all()

@router.post("/broadcast-templates", response_model=schemas.BroadcastTemplate)
def create_broadcast_template(
    payload: schemas.BroadcastTemplateCreate,
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_current_admin)
):
    return crud.create_broadcast_template(
        db, 
        name=payload.name, 
        title=payload.title, 
        message=payload.message,
        category=payload.category,
        entity_id=admin.entity_id,
        created_by_id=admin.id
    )

@router.put("/broadcast-templates/{tpl_id}", response_model=schemas.BroadcastTemplate)
def update_broadcast_template(
    tpl_id: int,
    payload: schemas.BroadcastTemplateBase,
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_current_admin)
):
    # Scoping check
    if not has_global_admin_access(admin):
        target = db.query(models.BroadcastTemplate).filter(models.BroadcastTemplate.id == tpl_id).first()
        if not target or target.entity_id != admin.entity_id:
            raise HTTPException(status_code=403, detail="Cannot edit other program's template")

    res = crud.update_broadcast_template(db, tpl_id, name=payload.name, title=payload.title, message=payload.message, category=payload.category)
    if res:
        return res
    raise HTTPException(status_code=404, detail="Template not found")

@router.delete("/broadcast-templates/{tpl_id}")
def delete_broadcast_template(tpl_id: int, db: Session = Depends(get_db), admin: models.User = Depends(get_current_admin)):
    # Governance Rule: Only Superadmins can permanently delete templates
    if not has_global_admin_access(admin):
        raise HTTPException(
            status_code=403, 
            detail="Governance Lock: Announcement templates can only be deleted by a Superadmin."
        )

    if crud.delete_broadcast_template(db, tpl_id):
        return {"message": "Deleted"}
    raise HTTPException(status_code=404, detail="Template not found")

# ---------------------------------------------
#  Workflow Templates (Interaction Studio)
# ---------------------------------------------

@router.get("/workflow-templates", response_model=List[schemas.WorkflowTemplate])
def get_workflow_templates(
    category: Optional[str] = None,
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_current_admin)
):
    """Fetch available workflow templates, categorized."""
    query = db.query(models.WorkflowTemplate).filter(models.WorkflowTemplate.is_active == True)
    
    if category:
        query = query.filter(models.WorkflowTemplate.category == category)
        
    # Scoping: 
    # 1. System templates (is_system=True)
    # 2. Global templates (is_global=True)
    # 3. Workspace templates (entity_id matches current admin)
    if not has_global_admin_access(admin):
        from sqlalchemy import or_
        query = query.filter(
            or_(
                models.WorkflowTemplate.is_system == True,
                models.WorkflowTemplate.is_global == True,
                models.WorkflowTemplate.entity_id == admin.entity_id,
                models.WorkflowTemplate.created_by_id == admin.id
            )
        )
        
    return query.order_by(models.WorkflowTemplate.is_system.desc(), models.WorkflowTemplate.is_global.desc(), models.WorkflowTemplate.name.asc()).all()

@router.post("/workflow-templates", response_model=schemas.WorkflowTemplate)
def create_workflow_template(
    payload: schemas.WorkflowTemplateCreate,
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_current_admin)
):
    """Save a workflow configuration as a reusable template."""
    # Only global admins can create system (global) templates
    is_global = payload.is_global and has_global_admin_access(admin)
    is_system = payload.is_system and has_global_admin_access(admin)
    
    db_tpl = models.WorkflowTemplate(
        name=payload.name,
        description=payload.description,
        category=payload.category,
        config=payload.config,
        version=payload.version,
        is_global=is_global,
        is_system=is_system,
        entity_id=payload.entity_id or admin.entity_id,
        created_by_id=admin.id
    )
    db.add(db_tpl)
    db.commit()
    db.refresh(db_tpl)
    
    # Audit Log
    crud.create_audit_log(
        db,
        action_type="create_workflow_template",
        performed_by_id=admin.id,
        target_id=str(db_tpl.id),
        details={"name": payload.name, "category": payload.category, "is_global": is_global}
    )
    
    return db_tpl

@router.delete("/workflow-templates/{tpl_id}")
def delete_workflow_template(
    tpl_id: int,
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_current_admin)
):
    """Deactivate a workflow template."""
    db_tpl = db.query(models.WorkflowTemplate).filter(models.WorkflowTemplate.id == tpl_id).first()
    if not db_tpl:
        raise HTTPException(status_code=404, detail="Template not found")
        
    # Security: 
    # 1. System templates are protected
    if db_tpl.is_system and not has_global_admin_access(admin):
        raise HTTPException(status_code=403, detail="System templates are protected and cannot be deleted")

    # 2. Only global admins or the creator can delete/deactivate
    if not has_global_admin_access(admin) and db_tpl.created_by_id != admin.id:
        raise HTTPException(status_code=403, detail="Access denied: Only the creator or global admin can delete this template")
        
    db_tpl.is_active = False
    db.commit()
    
    # Audit Log
    crud.create_audit_log(
        db,
        action_type="delete_workflow_template",
        performed_by_id=admin.id,
        target_id=str(tpl_id),
        details={"name": db_tpl.name}
    )
    
    return {"status": "deactivated"}
    
@router.put("/workflow-templates/{tpl_id}", response_model=schemas.WorkflowTemplate)
def update_workflow_template(
    tpl_id: int,
    payload: schemas.WorkflowTemplateUpdate,
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_current_admin)
):
    """Update an existing workflow template."""
    db_tpl = db.query(models.WorkflowTemplate).filter(models.WorkflowTemplate.id == tpl_id).first()
    if not db_tpl:
        raise HTTPException(status_code=404, detail="Template not found")
        
    # Security:
    # 1. System templates are protected
    if db_tpl.is_system and not has_global_admin_access(admin):
        raise HTTPException(status_code=403, detail="System templates are protected and cannot be modified")

    # 2. Only global admins or the creator can update
    if not has_global_admin_access(admin) and db_tpl.created_by_id != admin.id:
        raise HTTPException(status_code=403, detail="Access denied: Only the creator or global admin can edit this template")
        
    if payload.name is not None: db_tpl.name = payload.name
    if payload.description is not None: db_tpl.description = payload.description
    if payload.category is not None: db_tpl.category = payload.category
    if payload.config is not None: db_tpl.config = payload.config
    if payload.is_global is not None:
        db_tpl.is_global = payload.is_global and has_global_admin_access(admin)
    if payload.is_system is not None:
        db_tpl.is_system = payload.is_system and has_global_admin_access(admin)
        
    db.commit()
    db.refresh(db_tpl)
    
    # Audit Log
    crud.create_audit_log(
        db,
        action_type="update_workflow_template",
        performed_by_id=admin.id,
        target_id=str(tpl_id),
        details={"name": db_tpl.name}
    )
    
    return db_tpl

# --- RESPONSE TEMPLATES & UNIFIED REPLY ---

@router.get("/response-templates", response_model=List[schemas.ResponseTemplate])
def get_response_templates(db: Session = Depends(get_db), admin: models.User = Depends(get_current_admin)):
    """Fetch reusable response templates scoped to the admin's program."""
    query = db.query(models.ResponseTemplate)
    if not has_global_admin_access(admin):
        query = query.filter(
            (models.ResponseTemplate.entity_id == admin.entity_id) | 
            (models.ResponseTemplate.entity_id == None)
        )
    return query.order_by(models.ResponseTemplate.category.asc(), models.ResponseTemplate.name.asc()).all()

@router.post("/response-templates", response_model=schemas.ResponseTemplate)
def create_response_template(
    payload: schemas.ResponseTemplateCreate,
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_current_admin)
):
    """Save a new response template."""
    db_tpl = models.ResponseTemplate(
        name=payload.name,
        message=payload.message,
        category=payload.category,
        entity_id=payload.entity_id or admin.entity_id,
        created_by_id=admin.id
    )
    db.add(db_tpl)
    db.commit()
    db.refresh(db_tpl)
    return db_tpl

@router.delete("/response-templates/{tpl_id}")
def delete_response_template(tpl_id: int, db: Session = Depends(get_db), admin: models.User = Depends(get_current_admin)):
    """Remove a response template."""
    tpl = db.query(models.ResponseTemplate).filter(models.ResponseTemplate.id == tpl_id).first()
    if not tpl:
        raise HTTPException(status_code=404, detail="Template not found")
    
    if not has_global_admin_access(admin) and tpl.created_by_id != admin.id:
        raise HTTPException(status_code=403, detail="Access denied: Cannot delete templates created by others")
        
    db.delete(tpl)
    db.commit()
    return {"status": "deleted"}

@router.post("/feedbacks/{feedback_id}/unified-reply")
async def admin_unified_reply(
    feedback_id: int,
    payload: schemas.UnifiedReplyRequest,
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_current_admin)
):
    """
    Unified Dispatch:
    1. Saves official reply
    2. Optionally updates status
    3. Logs audit trail with previous/new status
    4. Triggers stored + real-time notifications
    5. Optionally saves as a new template
    """
    # 1. Validation
    msg = payload.message.strip()
    if not msg:
        raise HTTPException(status_code=400, detail="Response message cannot be empty")

    feedback = db.query(models.Feedback).filter(models.Feedback.id == feedback_id).first()
    if not feedback:
        raise HTTPException(status_code=404, detail="Feedback not found")

    # Scoping check
    if not has_global_admin_access(admin):
        if feedback.entity_id != admin.entity_id:
            raise HTTPException(status_code=403, detail="Access denied: Cannot respond to feedback outside your program scope")

    # 2. Save Official Reply
    db_reply = models.Reply(
        feedback_id=feedback_id,
        user_id=admin.id,
        message=msg,
        is_official=True,
        admin_id=admin.id,
        admin_name_snapshot=admin.name,
        admin_role_snapshot=admin.position_title or admin.role.capitalize()
    )
    db.add(db_reply)

    # 3. Handle Template Saving
    if payload.save_as_template:
        if not payload.template_name or not payload.template_category:
            raise HTTPException(status_code=400, detail="Template name and category are required when saving as template")
        
        # Check if name already exists in this scope to prevent duplicates
        exists = db.query(models.ResponseTemplate).filter(
            models.ResponseTemplate.name == payload.template_name,
            models.ResponseTemplate.entity_id == admin.entity_id
        ).first()
        
        if not exists:
            new_tpl = models.ResponseTemplate(
                name=payload.template_name,
                message=msg,
                category=payload.template_category,
                entity_id=admin.entity_id,
                created_by_id=admin.id
            )
            db.add(new_tpl)

    # 4. Optional Status Update & Audit Logging
    prev_status = str(feedback.status).split(".")[-1]
    new_status_str = prev_status
    
    if payload.new_status:
        feedback.status = payload.new_status
        new_status_str = str(payload.new_status).split(".")[-1]
        
        # If closing, record metadata
        if payload.new_status == models.FeedbackStatus.CLOSED:
            feedback.closed_at = datetime.now(timezone.utc)
            feedback.closed_by_id = admin.id
            feedback.closure_note = payload.closure_note

    # 5. Audit Log Entry
    crud.create_audit_log(
        db,
        action_type="admin_response_dispatch",
        performed_by_id=admin.id,
        target_id=str(feedback_id),
        details={
            "previous_status": prev_status,
            "new_status": new_status_str,
            "status_updated": payload.new_status is not None,
            "admin_role": admin.position_title or admin.role
        }
    )

    # 6. Create Stored Notification
    notif = models.Notification(
        user_id=feedback.sender_id,
        actor_id=admin.id,
        type=models.NotificationType.REPLY,
        feedback_id=feedback_id,
        message=f"Official response: {msg[:60]}...",
        is_read=False
    )
    db.add(notif)
    
    db.commit()
    
    # 7. Real-time Trigger (Best effort via imported sse_manager)
    try:
        from app.main import sse_manager
        await sse_manager.notify(feedback.sender_id)
    except Exception as e:
        print(f"SSE Notification failed: {e}")

    return {"status": "success", "reply_id": db_reply.id, "new_status": new_status_str}
@router.post("/reveal-identity/{feedback_id}")
def reveal_identity(
    feedback_id: int,
    admin: models.User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Securely reveals the identity of an anonymous feedback sender to an authorized administrator.
    Every reveal action is audited for governance and traceability.
    """
    feedback = db.query(models.Feedback).filter(models.Feedback.id == feedback_id).first()
    if not feedback:
        raise HTTPException(status_code=404, detail="Feedback not found")
        
    # Check scope to ensure admin can only reveal identity for feedback within their workspace
    feedback_scoped = apply_data_scope(db.query(models.Feedback).filter(models.Feedback.id == feedback_id), models.Feedback, admin).first()
    if not feedback_scoped:
        raise HTTPException(status_code=403, detail="Unauthorized access to this feedback context")

    # Handle cases with no linked sender
    if not feedback.sender_id:
        return {"name": "Truly Anonymous", "email": "N/A", "phone": "N/A", "note": "Feedback submitted without an account linkage"}

    user = db.query(models.User).filter(models.User.id == feedback.sender_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Linked sender record no longer exists")

    # LOG AUDIT ACTION
    audit = models.AuditLog(
        action_type="REVEAL_IDENTITY",
        performed_by_id=admin.id,
        target_id=str(feedback_id),
        details={
            "feedback_title": feedback.title,
            "revealed_user_id": user.id,
            "revealed_user_name": user.name,
            "reason": "Administrative Review"
        }
    )
    db.add(audit)
    db.commit()

    return {
        "name": user.name,
        "email": user.email,
        "phone": user.phone or "N/A",
        "role": user.role_identity or "General User"
    }

# --- INTERNAL NOTES ---
@router.post("/feedbacks/{feedback_id}/notes", response_model=schemas.InternalNote)
def add_internal_note(
    feedback_id: int,
    note: schemas.InternalNoteBase,
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_current_admin)
):
    note_create = schemas.InternalNoteCreate(feedback_id=feedback_id, message=note.message)
    return crud.create_internal_note(db, user_id=admin.id, note=note_create)

@router.get("/feedbacks/{feedback_id}/notes", response_model=List[schemas.InternalNote])
def get_internal_notes(
    feedback_id: int,
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_current_admin)
):
    return crud.get_internal_notes(db, feedback_id=feedback_id)

# --- ACCESS REQUESTS ---
@router.get("/access-requests", response_model=List[schemas.AdminRequest])
def list_access_requests(
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_current_admin)
):
    if not has_global_admin_access(admin):
        raise HTTPException(status_code=403, detail="Only Global Admins can review access requests")
    return crud.get_admin_requests(db, status=status)

@router.post("/access-requests/{request_id}/review", response_model=schemas.AdminRequest)
def review_access_request(
    request_id: int,
    review: schemas.AdminRequestUpdate,
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_current_admin)
):
    if not has_global_admin_access(admin):
        raise HTTPException(status_code=403, detail="Only Global Admins can review access requests")
    
    updated = crud.update_admin_request(db, request_id=request_id, reviewer_id=admin.id, status=review.status)
    if not updated:
        raise HTTPException(status_code=404, detail="Request not found")
    return updated

@router.get("/team", response_model=schemas.TeamOverviewResponse)
def get_service_team(
    entity_id: Optional[int] = None,
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_current_admin)
):
    """
    Get the service team members for coordination.
    """
    target_entity_id = entity_id
    
    if not target_entity_id:
        if admin.role in ["superadmin", "GlobalOverseer"]:
            return {"members": [], "total_active_cases": 0, "unassigned_cases": 0}
        
        primary_ctx = db.query(models.UserContext).filter(
            models.UserContext.user_id == admin.id,
            models.UserContext.role.in_(["admin", "staff", "coordinator", "service_admin"])
        ).first()
        
        if primary_ctx:
            target_entity_id = primary_ctx.entity_id
        elif admin.entity_id:
            target_entity_id = admin.entity_id
        else:
            return {"members": [], "total_active_cases": 0, "unassigned_cases": 0}
            
    return crud.get_service_team_members(db=db, entity_id=target_entity_id, current_user_id=admin.id)
