from fastapi import APIRouter, Depends, HTTPException, Body, Header
from sqlalchemy.orm import Session
from sqlalchemy import func, cast, Date
from typing import List, Optional
from datetime import datetime, timedelta, timezone
import os
import uuid
from dotenv import load_dotenv

from app import models, schemas, crud
from app.database import get_db

load_dotenv()

router = APIRouter(prefix="/admin", tags=["admin"])

ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "admin@globalcore.com")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "YOUR_ADMIN_PASSWORD")
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
        
    if not admin.is_active:
        raise HTTPException(status_code=403, detail="Account is deactivated")
        
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
                (models.User.is_global_user == True)
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
            if not user.is_active:
                raise HTTPException(status_code=403, detail="Account is deactivated")
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


# ?????????????????????????????????????????????
# ANALYTICS
# ?????????????????????????????????????????????

@router.get("/analytics/snapshot")
def analytics_snapshot(dept_name: Optional[str] = None, db: Session = Depends(get_db), admin: models.User = Depends(get_current_admin)):
    """Consolidated endpoint to fetch all dashboard data in a single request."""
    # Logic: Global admins can use dept_name param. Scoped admins are locked to their entity_id.
    target_entity_id = admin.entity_id if not has_global_admin_access(admin) else None
    
    return {
        "summary": crud.get_analytics_summary(db, entity_id=target_entity_id, dept_name=dept_name if has_global_admin_access(admin) else None),
        "volume": analytics_volume(30, dept_name, db, admin),
        "by_entity": analytics_by_entity(dept_name, db, admin),
        "by_department": analytics_by_department(db),
        "by_status": analytics_by_status(dept_name, db, admin),
        "ratings": analytics_ratings(dept_name, db, admin),
        "top_users": analytics_top_users(8, dept_name=dept_name, db=db, admin=admin),
        "engagement": analytics_engagement(30, dept_name=dept_name, db=db, admin=admin),
        "sentiment": crud.get_sentiment_summary(db, entity_id=target_entity_id, dept_name=dept_name if has_global_admin_access(admin) else None),
        "user_distribution": crud.get_user_distribution(db, entity_id=target_entity_id, dept_name=dept_name if has_global_admin_access(admin) else None),
        "top_branches": crud.get_top_branches(db, entity_id=target_entity_id, limit=5),
        "feedback_type_distribution": crud.get_feedback_type_distribution(db, entity_id=target_entity_id)
    }

@router.get("/analytics/summary")
def analytics_summary(dept_name: Optional[str] = None, db: Session = Depends(get_db), admin: models.User = Depends(get_current_admin)):
    target_entity_id = admin.entity_id if not has_global_admin_access(admin) else None
    return crud.get_analytics_summary(db, entity_id=target_entity_id, dept_name=dept_name if has_global_admin_access(admin) else None)


@router.get("/analytics/volume")
def analytics_volume(days: int = 30, dept_name: Optional[str] = None, db: Session = Depends(get_db), admin: models.User = Depends(get_current_admin)):
    effective_dept = dept_name if has_global_admin_access(admin) else admin.department
    since = datetime.now(timezone.utc) - timedelta(days=days)
    q = db.query(
        cast(models.Feedback.created_at, Date).label("day"),
        func.count(models.Feedback.id).label("count")
    ).filter(models.Feedback.created_at >= since)
    
    q = apply_data_scope(q, models.Feedback, admin)
        
    rows = q.group_by(cast(models.Feedback.created_at, Date))\
            .order_by(cast(models.Feedback.created_at, Date)).all()
    return [{"day": str(r.day), "count": r.count} for r in rows]


@router.get("/analytics/by-entity")
def analytics_by_entity(dept_name: Optional[str] = None, db: Session = Depends(get_db), admin: models.User = Depends(get_current_admin)):
    effective_dept = dept_name if has_global_admin_access(admin) else admin.department
    q = db.query(
        models.Entity.name,
        func.count(models.Feedback.id).label("count")
    ).outerjoin(models.Feedback, models.Feedback.entity_id == models.Entity.id)
    
    # Apply scoping
    q = apply_data_scope(q, models.Feedback, admin)
        
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
def analytics_by_status(dept_name: Optional[str] = None, db: Session = Depends(get_db), admin: models.User = Depends(get_current_admin)):
    effective_dept = dept_name if has_global_admin_access(admin) else admin.department
    q = db.query(
        models.Feedback.status,
        func.count(models.Feedback.id).label("count")
    )
    q = apply_data_scope(q, models.Feedback, admin)
    rows = q.group_by(models.Feedback.status).all()
    return [{"status": str(r.status).replace("FeedbackStatus.", ""), "count": r.count} for r in rows]


@router.get("/analytics/ratings")
def analytics_ratings(dept_name: Optional[str] = None, db: Session = Depends(get_db), admin: models.User = Depends(get_current_admin)):
    effective_dept = dept_name if has_global_admin_access(admin) else admin.department
    q = db.query(
        models.Feedback.rating,
        func.count(models.Feedback.id).label("count")
    ).filter(models.Feedback.rating != None)
    q = apply_data_scope(q, models.Feedback, admin)
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
    )
    
    if effective_dept:
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
    effective_dept = (
        dept_name
        if dept_name is not None
        else (None if has_global_admin_access(admin) else admin.department)
    )
    since = datetime.now(timezone.utc) - timedelta(days=days)
    q = db.query(
        cast(models.Reply.created_at, Date).label("day"),
        func.count(models.Reply.id).label("comments"),
    ).filter(models.Reply.created_at >= since)\
     .join(models.Feedback, models.Reply.feedback_id == models.Feedback.id)

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
    
    q = apply_data_scope(q, models.Feedback, admin)
        
    rows = q.group_by(models.Feedback.region, models.Feedback.city)\
            .order_by(func.count(models.Feedback.id).desc()).all()
    return [{"region": r.region, "city": r.city, "count": r.count} for r in rows]


@router.get("/analytics/sentiment")
def analytics_sentiment(dept_name: Optional[str] = None, db: Session = Depends(get_db), admin: models.User = Depends(get_current_admin)):
    """Analyze overall mood of user feedback."""
    target_entity_id = admin.entity_id if not has_global_admin_access(admin) else None
    return crud.get_sentiment_summary(db, entity_id=target_entity_id, dept_name=dept_name if has_global_admin_access(admin) else None)

# ?????????????????????????????????????????????
# USER MANAGEMENT
# ?????????????????????????????????????????????

@router.get("/users")
def admin_get_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), admin: models.User = Depends(get_current_admin)):
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
            "total_posts": p_cnt,
            "impact_points": round(float(pts), 1)
        })
    return result


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
    if entity_id is not None and entity_id != user.entity_id:
        # Restriction: Scoped admins cannot assign users to entities outside their own
        if not has_global_admin_access(admin) and entity_id != admin.entity_id:
             raise HTTPException(status_code=403, detail="You can only assign users to your own program")
             
        updates_made["entity_id"] = {"old": user.entity_id, "new": entity_id}
        user.entity_id = entity_id
        
    if position_title is not None and position_title != user.position_title:
        updates_made["position_title"] = {"old": user.position_title, "new": position_title}
        user.position_title = position_title if position_title else None

    # NEW: is_global_user update
    is_global_user = payload.get("is_global_user")
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
            details={"user_email": user.email, "updates": updates_made}
        )
        db.commit()
        db.refresh(user)
        
    return {"id": user.id, "role": user.role, "department": user.department, "entity_id": user.entity_id}


@router.delete("/users/{user_id}", status_code=204)
def admin_delete_user(user_id: int, db: Session = Depends(get_db), admin: models.User = Depends(get_current_admin)):
    if not is_globalcore_admin(db, admin):
        raise HTTPException(status_code=403, detail="Only GlobalCore Admin can permanently delete users")
        
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Audit Log
    crud.create_audit_log(
        db, 
        action_type="delete_user",
        performed_by_id=admin.id,
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
    entity_id: Optional[int] = None,
    dept_name: Optional[str] = None,
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_current_admin)
):
    q = db.query(
        models.Feedback.id, models.Feedback.title, models.Feedback.description,
        models.Feedback.status, models.Feedback.is_anonymous, models.Feedback.created_at,
        models.Feedback.rating, models.Feedback.sender_id, models.Feedback.custom_data,
        models.User.name.label("user_name"),
        models.Entity.name.label("entity_name"),
        models.Department.name.label("dept_name"),
        func.count(models.Reply.id).label("comments_count")
    ).outerjoin(models.User, models.Feedback.sender_id == models.User.id)\
     .outerjoin(models.Entity, models.Feedback.entity_id == models.Entity.id)\
     .outerjoin(models.Department, models.Feedback.recipient_dept_id == models.Department.id)\
     .outerjoin(models.Reply, models.Reply.feedback_id == models.Feedback.id)\
     .group_by(models.Feedback.id, models.User.name, models.Entity.name, models.Department.name)

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
        "custom_data": r.custom_data
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

@router.get("/entities")
def admin_get_entities(db: Session = Depends(get_db), admin: models.User = Depends(get_current_admin)):
    rows = db.query(
        models.Entity.id,
        models.Entity.name,
        models.Entity.description,
        models.Entity.icon,
        models.Entity.fields,
        func.count(models.Feedback.id).label("count")
    ).outerjoin(models.Feedback, models.Feedback.entity_id == models.Entity.id)\
     .group_by(models.Entity.id, models.Entity.name, models.Entity.description, models.Entity.icon, models.Entity.fields)\
     .order_by(models.Entity.name).all()
    return [{"id": r.id, "name": r.name, "description": r.description, "icon": r.icon, "fields": r.fields, "count": r.count} for r in rows]


@router.post("/entities")
def admin_create_entity(entity: schemas.EntityCreate, db: Session = Depends(get_db), admin: models.User = Depends(get_current_admin)):
    ent = models.Entity(name=entity.name, description=entity.description, icon=entity.icon, fields=entity.fields, organization_id=entity.organization_id)
    db.add(ent)
    db.commit()
    db.refresh(ent)
    return ent


@router.put("/entities/{ent_id}")
def admin_update_entity(ent_id: int, entity: schemas.EntityCreate, db: Session = Depends(get_db), admin: models.User = Depends(get_current_admin)):
    db_ent = db.query(models.Entity).filter(models.Entity.id == ent_id).first()
    if not db_ent:
        raise HTTPException(status_code=404, detail="Entity not found")
    db_ent.name = entity.name
    if entity.description is not None:
        db_ent.description = entity.description
    if entity.icon is not None:
        db_ent.icon = entity.icon
    if entity.fields is not None:
        db_ent.fields = entity.fields
    db.commit()
    return db_ent


@router.delete("/entities/{ent_id}", status_code=204)
def admin_delete_entity(ent_id: int, db: Session = Depends(get_db), admin: models.User = Depends(get_current_admin)):
    ent = db.query(models.Entity).filter(models.Entity.id == ent_id).first()
    if not ent:
        raise HTTPException(status_code=404, detail="Entity not found")
    
    usage_count = db.query(models.Feedback).filter(models.Feedback.entity_id == ent_id).count()
    if usage_count > 0:
        raise HTTPException(status_code=400, detail=f"Cannot delete entity '{ent.name}' because it is in use by {usage_count} feedback(s).")

    db.delete(ent)
    db.commit()

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
def get_system_labels(db: Session = Depends(get_db)):
    labels = crud.get_system_labels(db)
    if not labels:
        # Seed defaults if empty
        defaults = [
            ("category_label", "Entity / Service"),
            ("entity_label", "Entity"),
            ("category_label_plural", "Entities / Services"),
            ("entity_label_plural", "Entities"),
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
    if not has_global_admin_access(admin):
        raise HTTPException(status_code=403, detail="Only global admins can change terminology")
    
    label = crud.update_system_label(db, key, value)
    
    # Audit Log
    crud.create_audit_log(
        db,
        action_type="update_terminology",
        performed_by_id=admin.id,
        target_id=key,
        details={"key": key, "new_value": value}
    )
    
    return label
@router.post("/labels/bulk")
def update_system_labels_bulk(data: dict = Body(...), db: Session = Depends(get_db), admin: models.User = Depends(get_current_admin)):
    if not has_global_admin_access(admin):
        raise HTTPException(status_code=403, detail="Only global admins can change terminology")
    
    updated_keys = []
    for key, value in data.items():
        crud.update_system_label(db, key, value)
        updated_keys.append(key)
    
    # Single Audit Log for all changes
    crud.create_audit_log(
        db,
        action_type="bulk_update_terminology",
        performed_by_id=admin.id,
        target_id="system",
        details={"updated_labels": updated_keys}
    )
    db.commit()
    return {"status": "success", "updated_count": len(updated_keys)}


@router.get("/settings", response_model=List[schemas.SystemSetting])
def get_admin_settings(db: Session = Depends(get_db)):
    return crud.get_system_settings(db)


@router.patch("/settings/{key}")
def update_admin_setting(key: str, value: str, db: Session = Depends(get_db), admin: models.User = Depends(get_current_admin)):
    if not has_global_admin_access(admin):
        raise HTTPException(status_code=403, detail="Only global admins can change system settings")
    
    setting = crud.update_system_setting(db, key, value)
    
    # Audit Log
    crud.create_audit_log(
        db,
        action_type="update_system_setting",
        performed_by_id=admin.id,
        target_id=key,
        details={"key": key, "new_value": value}
    )
    
    return setting


# ?????????????????????????????????????????????
# BROADCAST NOTIFICATION
# ?????????????????????????????????????????????

@router.post("/broadcast")
def admin_broadcast(
    subject: str, 
    message: str, 
    broadcast_type: str = "announcement",
    target_group: str = "all", # all, staff, global
    db: Session = Depends(get_db), 
    admin: models.User = Depends(get_current_admin)
):
    """
    Broadcast system allows Superadmins to reach everyone,
    and Program Admins to reach only their own staff and beneficiaries.
    """
    source_tag = "SYSTEM"
    is_global = has_global_admin_access(admin)
    
    if not is_global:
        entity = db.query(models.Entity).filter(models.Entity.id == admin.entity_id).first()
        source_tag = entity.name.upper() if entity else "OFFICIAL"
    
    official_subject = f"[OFFICIAL] {source_tag} - {subject}"
    
    # Selection Logic Refinement
    query = db.query(models.User)
    
    if not is_global:
        # Program Admin Scope: STRICTLY within their own entity_id
        # Both staff AND beneficiaries in that program will have the same entity_id
        query = query.filter(models.User.entity_id == admin.entity_id)
        
        if target_group == "staff":
            query = query.filter(models.User.role.in_(["admin", "superadmin"]))
        elif target_group == "global":
            query = query.filter(models.User.is_global_user == True)
    else:
        # Superadmin Scope: Global access
        if target_group == "global":
            query = query.filter(models.User.is_global_user == True)
        elif target_group == "staff":
            query = query.filter(models.User.role.in_(["admin", "superadmin"]))

    users = query.all()
    
    # 1. Log the broadcast record
    broadcast_log = crud.create_broadcast_log(
        db, 
        subject=official_subject, 
        message=message, 
        count=len(users),
        entity_id=admin.entity_id if not is_global else None
    )
    
    # 2. Prepare Bulk Notifications
    notifications = []
    for user in users:
        notifications.append(models.Notification(
            user_id=user.id,
            actor_id=admin.id, # Attributed to sending admin
            type=models.NotificationType.ANNOUNCEMENT,
            feedback_id=None, # Broadcasts are system-wide
            entity_id=admin.entity_id if not is_global else None,
            subject=official_subject,
            message=message,
            broadcast_id=broadcast_log.id,
            broadcast_type=broadcast_type
        ))
    
    if notifications:
        crud.create_notifications_bulk(db, notifications)
    
    # 3. Audit Log
    crud.create_audit_log(
        db, 
        action_type="broadcast_created",
        performed_by_id=admin.id,
        details={
            "subject": official_subject, 
            "sent_to_count": len(users), 
            "type": broadcast_type,
            "target_group": target_group
        }
    )
    
    return {"sent_to": len(users), "subject": official_subject, "message": message, "broadcast_id": broadcast_log.id}


@router.get("/broadcasts", response_model=List[schemas.BroadcastLog])
def admin_get_broadcast_logs(db: Session = Depends(get_db), admin: models.User = Depends(get_current_admin)):
    # Use centralized scoping
    q = apply_data_scope(db.query(models.BroadcastLog), models.BroadcastLog, admin)
    return q.order_by(models.BroadcastLog.created_at.desc()).all()


@router.get("/audit-logs", response_model=List[schemas.AuditLog])
def get_audit_logs(skip: int = 0, limit: int = 200, db: Session = Depends(get_db), admin: models.User = Depends(get_current_admin)):
    if not has_global_admin_access(admin):
        # Department admins can only see their own department's audit logs
        return crud.get_audit_logs(db, skip=skip, limit=limit, dept_name=admin.department)
    return crud.get_audit_logs(db, skip=skip, limit=limit)


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
