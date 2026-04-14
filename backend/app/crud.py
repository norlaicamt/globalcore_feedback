from sqlalchemy.orm import Session, joinedload, aliased, joinedload as _joinedload
from sqlalchemy import func, select, case
from app import models
from app import schemas
import asyncio
from typing import Optional, List

# User operations
def get_user(db: Session, user_id: int):
    return db.query(models.User).filter(models.User.id == user_id).first()

def get_user_by_email(db: Session, email: str):
    if not email: return None
    return db.query(models.User).filter(models.User.email.ilike(email)).first()

def get_user_by_login_id(db: Session, login_id: str):
    if not login_id: return None
    from sqlalchemy import or_
    return db.query(models.User).filter(
        or_(
            models.User.email.ilike(login_id),
            models.User.username.ilike(login_id)
        )
    ).first()

def get_users(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.User).offset(skip).limit(limit).all()

def get_user_profiles(db: Session):
    return db.query(
        models.User.id,
        models.User.name,
        func.coalesce(models.User.unit_name, models.User.program, models.User.department).label("department"),
        models.User.program,
        models.User.role_identity,
        models.User.avatar_url,
        models.User.show_activity_status,
        models.User.created_at
    ).filter(models.User.is_active == True).all()

def search_users(db: Session, query: str = None, roles: List[str] = None, limit: int = 10):
    q = db.query(
        models.User.id,
        models.User.name,
        models.User.username,
        func.coalesce(models.User.unit_name, models.User.program, models.User.department).label("department"),
        models.User.role_identity,
        models.User.avatar_url,
        models.User.role
    ).filter(models.User.is_active == True)
    
    if roles:
        q = q.filter(models.User.role.in_(roles))
        
    if query:
        from sqlalchemy import or_
        q = q.filter(or_(
            models.User.name.ilike(f"%{query}%"),
            models.User.username.ilike(f"%{query}%")
        ))
        
    return q.limit(limit).all()

def create_user(db: Session, user: schemas.UserCreate):
    data = user.model_dump()
    if "email" in data:
        data["email"] = data["email"].lower()
    db_user = models.User(**data)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def update_user(db: Session, user_id: int, updates: schemas.UserUpdate):
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if db_user:
        update_data = updates.model_dump(exclude_unset=True)
        
        # Data Integrity: Normalize email and check for collisions
        if "email" in update_data:
            new_email = update_data["email"].lower()
            if new_email != db_user.email:
                existing = db.query(models.User).filter(models.User.email.ilike(new_email)).first()
                if existing:
                    # In this generic CRUD, we'll raise an error that the router can handle
                    raise ValueError(f"Email {new_email} is already taken")
            update_data["email"] = new_email
            
        for key, value in update_data.items():
            setattr(db_user, key, value)
        db.commit()
        db.refresh(db_user)
    return db_user

def delete_user(db: Session, user_id: int):
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if db_user:
        db.query(models.Reply).filter(models.Reply.user_id == user_id).delete(synchronize_session=False)
        
        feedbacks = db.query(models.Feedback).filter(models.Feedback.sender_id == user_id).all()
        for fb in feedbacks:
            db.query(models.Reply).filter(models.Reply.feedback_id == fb.id).delete(synchronize_session=False)
            db.delete(fb)

        db.query(models.Feedback).filter(models.Feedback.recipient_user_id == user_id).update({"recipient_user_id": None}, synchronize_session=False)
        db.query(models.Reaction).filter(models.Reaction.user_id == user_id).delete(synchronize_session=False)
        db.delete(db_user)
        db.commit()
    return db_user

def deactivate_user(db: Session, user_id: int, days: int):
    from datetime import datetime, timedelta, timezone
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if db_user:
        db_user.is_active = False
        if days > 0:
            db_user.deactivated_until = datetime.now(timezone.utc) + timedelta(days=days)
        else:
            db_user.deactivated_until = None
        db.commit()
        db.refresh(db_user)
    return db_user

def update_user_password(db: Session, user_id: int, old_password: str, new_password: str):
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        return None
    
    # Verify old password
    # NOTE: In a real system, use pwd_context.verify(old_password, db_user.password)
    # But current system uses plain text for simplicity (based on previous observations of login)
    if db_user.password != old_password:
        return False
    
    db_user.password = new_password
    db.commit()
    return True

# Department operations
def get_departments(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Department).offset(skip).limit(limit).all()

def create_department(db: Session, department: schemas.DepartmentCreate):
    data = department.model_dump()
    db_dept = models.Department(**data)
    db.add(db_dept)
    db.commit()
    db.refresh(db_dept)
    return db_dept

# Entity operations
def get_entities(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Entity).offset(skip).limit(limit).all()

def create_entity(db: Session, entity: schemas.EntityCreate):
    db_ent = models.Entity(**entity.model_dump())
    db.add(db_ent)
    db.commit()
    db.refresh(db_ent)
    return db_ent

# Branch operations
def get_branches(db: Session, skip: int = 0, limit: int = 100, entity_id: int = None, only_active: bool = True):
    fb_count_sub = db.query(
        models.Feedback.branch_id,
        func.count(models.Feedback.id).label("cnt")
    ).group_by(models.Feedback.branch_id).subquery()

    query = db.query(
        models.Branch,
        func.coalesce(fb_count_sub.c.cnt, 0).label("feedback_count")
    ).outerjoin(fb_count_sub, models.Branch.id == fb_count_sub.c.branch_id)
    
    if entity_id:
        query = query.filter(models.Branch.entity_id == entity_id)
    if only_active:
        query = query.filter(models.Branch.is_active == True)
        
    results = query.offset(skip).limit(limit).all()
    
    # Map back to objects with dynamic attributes
    branches = []
    for row in results:
        b = row[0]
        b.feedback_count = row.feedback_count
        branches.append(b)
    return branches

def create_branch(db: Session, branch: schemas.BranchCreate):
    db_branch = models.Branch(**branch.model_dump())
    db.add(db_branch)
    db.commit()
    db.refresh(db_branch)
    return db_branch

def update_branch(db: Session, branch_id: int, updates: schemas.BranchUpdate):
    db_branch = db.query(models.Branch).filter(models.Branch.id == branch_id).first()
    if db_branch:
        update_data = updates.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_branch, key, value)
        db.commit()
        db.refresh(db_branch)
    return db_branch

def delete_branch(db: Session, branch_id: int):
    db_branch = db.query(models.Branch).filter(models.Branch.id == branch_id).first()
    if db_branch:
        # User refinement: instead of hard deleting, we deactivate.
        db_branch.is_active = False
        db.commit()
    return db_branch

# Organization operations
def get_organizations(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Organization).offset(skip).limit(limit).all()

def create_organization(db: Session, organization: schemas.OrganizationCreate):
    db_org = models.Organization(**organization.model_dump())
    db.add(db_org)
    db.commit()
    db.refresh(db_org)
    return db_org

# Feedback operations
def get_feedbacks(
    db: Session, 
    skip: int = 0, 
    limit: int = 100, 
    sender_id: int = None, 
    recipient_user_id: int = None,
    recipient_dept_id: int = None,
    mentioned_user_id: int = None,
    current_user_id: int = None,
    only_approved: bool = True
):
    """Unified and optimized feedback retrieval with counts and relations."""
    # Scalar subqueries for counts (single query execution for all)
    replies_count_sq = (
        select(func.count(models.Reply.id))
        .where(models.Reply.feedback_id == models.Feedback.id)
        .scalar_subquery()
        .label("replies_count")
    )
    likes_count_sq = (
        select(func.count(models.Reaction.id))
        .where((models.Reaction.feedback_id == models.Feedback.id) & (models.Reaction.is_like == True))
        .scalar_subquery()
        .label("likes_count")
    )
    dislikes_count_sq = (
        select(func.count(models.Reaction.id))
        .where((models.Reaction.feedback_id == models.Feedback.id) & (models.Reaction.is_like == False))
        .scalar_subquery()
        .label("dislikes_count")
    )

    # Base query starts with Feedback and subqueries
    query = db.query(
        models.Feedback,
        replies_count_sq,
        likes_count_sq,
        dislikes_count_sq
    ).options(
        joinedload(models.Feedback.mentions),
        joinedload(models.Feedback.sender),
        joinedload(models.Feedback.recipient_user),
        joinedload(models.Feedback.recipient_dept),
        joinedload(models.Feedback.entity),
        joinedload(models.Feedback.branch)
    )

    # If mentioned_user_id provided, join with FeedbackMention
    if mentioned_user_id:
        query = query.join(models.FeedbackMention).filter(
            models.FeedbackMention.user_id == mentioned_user_id,
            models.Feedback.sender_id != mentioned_user_id
        )

    # If current_user_id provided, also get current user's reaction
    if current_user_id:
        user_reaction_sq = (
            select(models.Reaction.is_like)
            .where((models.Reaction.feedback_id == models.Feedback.id) & (models.Reaction.user_id == current_user_id))
            .scalar_subquery()
            .label("user_reaction")
        )
        query = query.add_columns(user_reaction_sq)

    # Apply filters
    if only_approved:
        query = query.filter(models.Feedback.is_approved == True)
    
    if sender_id:
        query = query.filter(models.Feedback.sender_id == sender_id)
    
    if recipient_user_id:
        query = query.filter(models.Feedback.recipient_user_id == recipient_user_id)
        
    if recipient_dept_id:
        query = query.filter(models.Feedback.recipient_dept_id == recipient_dept_id)

    rows = query.order_by(models.Feedback.created_at.desc()).offset(skip).limit(limit).all()
    
    results = []
    for row in rows:
        # row[0] is the Feedback object, the rest are labeled subquery results
        fb = row[0]
        fb.replies_count = row.replies_count
        fb.likes_count = row.likes_count
        fb.dislikes_count = row.dislikes_count
        if current_user_id:
            fb.user_reaction = row.user_reaction
        
        # Populate UI helpers (avoiding lazy loading)
        if fb.is_anonymous:
            fb.user_name = "Anonymous"
            fb.sender_avatar_url = None
            fb.sender_id_display = 0
            fb.sender_show_status = True
        else:
            fb.user_name = fb.sender.name if fb.sender else "Someone"
            fb.sender_avatar_url = fb.sender.avatar_url if fb.sender else None
            fb.sender_id_display = fb.sender_id
            fb.sender_show_status = fb.sender.show_activity_status if fb.sender else True
        
        fb.recipient_dept_name = fb.recipient_dept.name if fb.recipient_dept else None
        fb.recipient_user_name = fb.recipient_user.name if fb.recipient_user else None
        fb.entity_name = fb.entity.name if fb.entity else None
        
        # Refined Waterfall Logic for Branch Name
        fb.branch_name = fb.branch_name_snapshot
        if not fb.branch_name and fb.branch:
            fb.branch_name = fb.branch.name
        if not fb.branch_name:
            fb.branch_name = fb.manual_location_text
        if not fb.branch_name:
            fb.branch_name = "Unknown Location"
            
        # Append Inactive status if applicable
        if fb.branch and not fb.branch.is_active:
            fb.branch_name += " (Inactive)"
        
        results.append(fb)

    return results


def create_feedback(db: Session, feedback: schemas.FeedbackCreate):
    data = feedback.model_dump()
    mentions_data = data.pop("mentions", [])
    
    # 1. Branch Validation & Snapshot logic
    branch_id = data.get("branch_id")
    entity_id = data.get("entity_id")
    
    if branch_id:
        branch = db.query(models.Branch).filter(models.Branch.id == branch_id).first()
        if not branch:
            # Raise ValueError so router can handle as 400
            raise ValueError("Selected branch does not exist")
        
        # User Refinement: Strict entity-based scoping
        if branch.entity_id != entity_id:
            raise ValueError("Invalid branch for the selected program/entity")
            
        # User Refinement: Snapshot branch name for historical consistency
        data["branch_name_snapshot"] = branch.name
    
    db_feedback = models.Feedback(**data)
    db.add(db_feedback)
    db.commit()
    db.refresh(db_feedback)
    
    # Process mentions
    for m in mentions_data:
        db_mention = models.FeedbackMention(
            feedback_id=db_feedback.id,
            user_id=m.get("user_id"),
            employee_name=m.get("employee_name"),
            employee_prefix=m.get("employee_prefix")
        )
        db.add(db_mention)
        
        # Notify mentioned employee if linked to a user
        if m.get("user_id"):
            create_notification(
                db,
                user_id=m.get("user_id"),
                actor_id=db_feedback.sender_id,
                notif_type=models.NotificationType.MENTION,
                feedback_id=db_feedback.id
            )
            
    db.commit()
    db.refresh(db_feedback)
    
    # Notify Entity Admins about New Feedback
    entity_admins = db.query(models.User).filter(
        models.User.entity_id == db_feedback.entity_id,
        models.User.role.in_(["admin", "superadmin"]),
        models.User.notify_new_feedback == True
    ).all()
    
    for admin in entity_admins:
        if admin.id != db_feedback.sender_id:
            create_notification(
                db,
                user_id=admin.id,
                actor_id=db_feedback.sender_id,
                notif_type=models.NotificationType.NEW_FEEDBACK,
                feedback_id=db_feedback.id
            )
    
    # Notify Assigned User
    if db_feedback.recipient_user_id:
        create_notification(
            db,
            user_id=db_feedback.recipient_user_id,
            actor_id=db_feedback.sender_id,
            notif_type=models.NotificationType.ASSIGNED,
            feedback_id=db_feedback.id
        )

    return db_feedback

def get_feedback(db: Session, feedback_id: int):
    return db.query(models.Feedback).filter(models.Feedback.id == feedback_id).first()

def update_feedback_status(db: Session, feedback_id: int, status: models.FeedbackStatus):
    db_feedback = db.query(models.Feedback).filter(models.Feedback.id == feedback_id).first()
    if db_feedback:
        db_feedback.status = status
        db.commit()
        db_feedback.updated_at = func.now()
        db.refresh(db_feedback)
    return db_feedback

def update_feedback(db: Session, feedback_id: int, updates: schemas.FeedbackUpdateFull):
    db_feedback = db.query(models.Feedback).filter(models.Feedback.id == feedback_id).first()
    if db_feedback:
        if updates.title is not None:
            db_feedback.title = updates.title
        if updates.description is not None:
            db_feedback.description = updates.description
        db.commit()
        db.refresh(db_feedback)
    return db_feedback

def delete_feedback(db: Session, feedback_id: int):
    db_feedback = db.query(models.Feedback).filter(models.Feedback.id == feedback_id).first()
    if db_feedback:
        reply_ids = db.query(models.Reply.id).filter(models.Reply.feedback_id == feedback_id).subquery()
        db.query(models.ReplyReaction).filter(models.ReplyReaction.reply_id.in_(select(reply_ids))).delete(synchronize_session=False)
        db.query(models.Reply).filter(models.Reply.feedback_id == feedback_id).delete(synchronize_session=False)
        db.query(models.Notification).filter(models.Notification.feedback_id == feedback_id).delete(synchronize_session=False)
        db.delete(db_feedback)
        db.commit()
    return db_feedback

# Reply operations
def get_replies_for_feedback(db: Session, feedback_id: int, current_user_id: int = None):
    # Join with User to get reply author info, but mask if feedback is anonymous? 
    # Actually, replies themselves aren't anonymous currently, but if we want full privacy, 
    # we should check if the reply's author wants to be anonymous (if that feature exists).
    # For now, we only mask the feedback author.
    replies = db.query(models.Reply).filter(models.Reply.feedback_id == feedback_id).order_by(models.Reply.created_at.asc()).all()
    for r in replies:
        # Load user explicitly for now (SQLAlchemy lazy load)
        _ = r.user 
        r.likes_count = db.query(models.ReplyReaction).filter(models.ReplyReaction.reply_id == r.id, models.ReplyReaction.is_like == True).count()
        r.dislikes_count = db.query(models.ReplyReaction).filter(models.ReplyReaction.reply_id == r.id, models.ReplyReaction.is_like == False).count()
        r.user_reaction = None
        if current_user_id:
            ur = db.query(models.ReplyReaction).filter(models.ReplyReaction.reply_id == r.id, models.ReplyReaction.user_id == current_user_id).first()
            if ur:
                r.user_reaction = ur.is_like
    return replies

def create_reply(db: Session, reply: schemas.ReplyCreate):
    db_reply = models.Reply(
        feedback_id=reply.feedback_id,
        user_id=reply.user_id,
        parent_id=reply.parent_id,
        message=reply.message
    )
    db.add(db_reply)
    db.commit()
    db.refresh(db_reply)
    
    # Notify feedback author
    feedback = db.query(models.Feedback).filter(models.Feedback.id == db_reply.feedback_id).first()
    if feedback and feedback.sender_id != db_reply.user_id:
        create_notification(
            db,
            user_id=feedback.sender_id,
            actor_id=db_reply.user_id,
            notif_type=models.NotificationType.COMMENT,
            feedback_id=feedback.id,
            reply_id=db_reply.id
        )

    # Notify parent comment author
    if reply.parent_id:
        parent_comment = db.query(models.Reply).filter(models.Reply.id == reply.parent_id).first()
        if parent_comment and parent_comment.user_id != reply.user_id:
            create_notification(
                db,
                user_id=parent_comment.user_id,
                actor_id=reply.user_id,
                notif_type=models.NotificationType.REPLY,
                feedback_id=reply.feedback_id,
                reply_id=db_reply.id
            )
            
    # High Activity Alert Check
    reply_count = db.query(models.Reply).filter(models.Reply.feedback_id == db_reply.feedback_id).count()
    if reply_count >= 10: # Threshold for "High Activity"
        # Notify Admin/Recipient user
        target_ids = []
        if feedback.recipient_user_id: target_ids.append(feedback.recipient_user_id)
        
        # Also notify entity admins who want high activity alerts
        admins = db.query(models.User).filter(
            models.User.entity_id == feedback.entity_id,
            models.User.role.in_(["admin", "superadmin"]),
            models.User.notify_high_activity == True
        ).all()
        for a in admins:
            if a.id not in target_ids: target_ids.append(a.id)
            
        for uid in target_ids:
            if uid != db_reply.user_id:
                create_notification(
                    db,
                    user_id=uid,
                    actor_id=db_reply.user_id,
                    notif_type=models.NotificationType.COMMENT, # Reuse comment type but maybe add a "high activity" meta
                    feedback_id=feedback.id,
                    message=f"🔥 High Activity: {feedback.title} now has {reply_count} comments."
                )
        
    return db_reply

def update_reply(db: Session, reply_id: int, new_message: str):
    db_reply = db.query(models.Reply).filter(models.Reply.id == reply_id).first()
    if db_reply:
        db_reply.message = new_message
        db.commit()
        db.refresh(db_reply)
    return db_reply

def delete_reply(db: Session, reply_id: int):
    db_reply = db.query(models.Reply).filter(models.Reply.id == reply_id).first()
    if db_reply:
        db.delete(db_reply)
        db.commit()
    return db_reply

# Reaction operations
def get_reactions(db: Session, feedback_id: int):
    return db.query(models.Reaction).filter(models.Reaction.feedback_id == feedback_id).all()

def get_reactions_summary(db: Session, feedback_id: int, current_user_id: int = None):
    likes = db.query(models.Reaction).filter(models.Reaction.feedback_id == feedback_id, models.Reaction.is_like == True).count()
    dislikes = db.query(models.Reaction).filter(models.Reaction.feedback_id == feedback_id, models.Reaction.is_like == False).count()
    user_reaction = None
    if current_user_id:
        existing = db.query(models.Reaction).filter(models.Reaction.feedback_id == feedback_id, models.Reaction.user_id == current_user_id).first()
        if existing:
            user_reaction = existing.is_like
    return {"likes": likes, "dislikes": dislikes, "user_reaction": user_reaction}

def create_reaction(db: Session, reaction: schemas.ReactionCreate):
    db_reaction = models.Reaction(**reaction.model_dump())
    db.add(db_reaction)
    db.commit()
    db.refresh(db_reaction)
    return db_reaction

def toggle_reaction(db: Session, user_id: int, feedback_id: int, is_like: bool):
    existing = db.query(models.Reaction).filter(
        models.Reaction.user_id == user_id,
        models.Reaction.feedback_id == feedback_id
    ).first()

    if existing:
        if existing.is_like == is_like:
            db.delete(existing)
            db.commit()
            return None
        else:
            existing.is_like = is_like
            db.commit()
            db.refresh(existing)
            return existing
    else:
        new_reaction = models.Reaction(user_id=user_id, feedback_id=feedback_id, is_like=is_like)
        db.add(new_reaction)
        db.commit()
        db.refresh(new_reaction)
        
        feedback = db.query(models.Feedback).filter(models.Feedback.id == feedback_id).first()
        if feedback and feedback.sender_id != user_id and is_like:
            create_notification(
                db,
                user_id=feedback.sender_id,
                actor_id=user_id,
                notif_type=models.NotificationType.LIKE,
                feedback_id=feedback_id
            )
            
        return new_reaction

def toggle_reply_reaction(db: Session, user_id: int, reply_id: int, is_like: bool):
    existing = db.query(models.ReplyReaction).filter(
        models.ReplyReaction.user_id == user_id,
        models.ReplyReaction.reply_id == reply_id
    ).first()

    if existing:
        if existing.is_like == is_like:
            db.delete(existing)
            db.commit()
            return None
        else:
            existing.is_like = is_like
            db.commit()
            db.refresh(existing)
            return existing
    else:
        new_reaction = models.ReplyReaction(user_id=user_id, reply_id=reply_id, is_like=is_like)
        db.add(new_reaction)
        db.commit()
        db.refresh(new_reaction)
        
        reply = db.query(models.Reply).filter(models.Reply.id == reply_id).first()
        if reply and reply.user_id != user_id and is_like:
            create_notification(
                db,
                user_id=reply.user_id,
                actor_id=user_id,
                notif_type=models.NotificationType.LIKE,
                feedback_id=reply.feedback_id,
                reply_id=reply_id
            )
            
        return new_reaction

# Notification operations
def create_notifications_bulk(db: Session, notifications: List[models.Notification]):
    """Optimized creation of multiple notifications (e.g. for broadcasts)."""
    db.add_all(notifications)
    db.commit()
    # Pings SSE manager for each recipient (minimal impact if not subscribed)
    from app.sse import sse_manager
    import asyncio
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            for n in notifications:
                asyncio.create_task(sse_manager.notify(n.user_id))
    except (RuntimeError, Exception): pass

def create_notification(db: Session, user_id: int, actor_id: int, notif_type: models.NotificationType, feedback_id: Optional[int] = None, reply_id: int = None, message: str = None, subject: str = None, broadcast_id: int = None, entity_id: int = None):
    # 1. Smart Grouping for Likes
    if notif_type == models.NotificationType.LIKE:
        existing = db.query(models.Notification).filter(
            models.Notification.user_id == user_id,
            models.Notification.feedback_id == feedback_id,
            models.Notification.type == models.NotificationType.LIKE,
            models.Notification.is_read == False
        ).first()
        
        if existing:
            meta = existing.meta or {"actor_count": 1, "actor_ids": [existing.actor_id]}
            if actor_id not in meta.get("actor_ids", []):
                meta["actor_ids"].append(actor_id)
                meta["actor_count"] = len(meta["actor_ids"])
                existing.meta = meta
                
                # Update message for grouped display
                actor_user = db.query(models.User).filter(models.User.id == actor_id).first()
                others_count = meta["actor_count"] - 1
                if others_count > 0:
                    existing.message = f"{actor_user.name} and {others_count} others liked your feedback"
                
                db.commit()
                db.refresh(existing)
                deliver_notification(db, existing)
                return existing

    # 2. Standard Creation
    notif = models.Notification(
        user_id=user_id,
        actor_id=actor_id,
        type=notif_type,
        feedback_id=feedback_id,
        reply_id=reply_id,
        message=message,
        subject=subject,
        broadcast_id=broadcast_id,
        entity_id=entity_id,
        is_read=False,
        meta={"actor_ids": [actor_id], "actor_count": 1} if notif_type == models.NotificationType.LIKE else None
    )
    db.add(notif)
    db.commit()
    db.refresh(notif)
    
    deliver_notification(db, notif)
    return notif

def deliver_notification(db: Session, notif: models.Notification):
    """Layer 2: Check preferences and deliver (SSE/Push/Email)."""
    user = db.query(models.User).filter(models.User.id == notif.user_id).first()
    if not user: return
    
    # Map Type to Preference Flag
    pref_map = {
        models.NotificationType.REPLY: user.notify_replies,
        models.NotificationType.COMMENT: user.notify_comments,
        models.NotificationType.MENTION: user.notify_mentions,
        models.NotificationType.LIKE: user.notify_likes,
        models.NotificationType.ANNOUNCEMENT: user.notify_announcements,
        models.NotificationType.NEW_FEEDBACK: user.notify_new_feedback, # New
        models.NotificationType.ASSIGNED: user.notify_assigned       # New
    }
    
    should_deliver = pref_map.get(notif.type, True)
    if not should_deliver: return

    # A. Bell (SSE) - Immediate visibility
    from app.sse import sse_manager
    try:
        import asyncio
        loop = asyncio.get_event_loop()
        if loop.is_running():
            asyncio.create_task(sse_manager.notify(notif.user_id))
    except (RuntimeError, Exception): pass

    # B. Email / Push - (Placeholders for production services)
    if user.email_notifications:
        # deliver_via_email(user.email, notif)
        pass
    if user.push_notifications:
        # deliver_via_push(user.id, notif)
        pass

def get_notifications(db: Session, user_id: int):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user: return []

    notifs_query = db.query(
        models.Notification.id,
        models.Notification.user_id,
        models.Notification.actor_id,
        models.Notification.type,
        models.Notification.feedback_id,
        models.Notification.reply_id,
        models.Notification.is_read,
        models.Notification.message,
        models.Notification.subject,
        models.Notification.created_at,
        models.Notification.meta,
        models.User.name.label("actor_name"),
        models.Feedback.title.label("feedback_title"),
        models.Reply.message.label("reply_message")
    ).outerjoin(models.User, models.Notification.actor_id == models.User.id) \
     .outerjoin(models.Feedback, models.Notification.feedback_id == models.Feedback.id) \
     .outerjoin(models.Reply, models.Notification.reply_id == models.Reply.id) \
     .filter(models.Notification.user_id == user_id)

    # Apply preference filtering (Bell Visibility)
    active_filters = []
    if not user.notify_replies: active_filters.append(models.NotificationType.REPLY)
    if not user.notify_comments: active_filters.append(models.NotificationType.COMMENT)
    if not user.notify_mentions: active_filters.append(models.NotificationType.MENTION)
    if not user.notify_likes: active_filters.append(models.NotificationType.LIKE)
    if not user.notify_announcements: active_filters.append(models.NotificationType.ANNOUNCEMENT)
    
    if active_filters:
        notifs_query = notifs_query.filter(~models.Notification.type.in_(active_filters))

    return notifs_query.order_by(models.Notification.created_at.desc()).all()

def mark_notifications_as_read(db: Session, user_id: int):
    db.query(models.Notification).filter(models.Notification.user_id == user_id, models.Notification.is_read == False).update({"is_read": True}, synchronize_session=False)
    db.commit()
    return True

def acknowledge_broadcast(db: Session, broadcast_id: int, user_id: int):
    """Marks a broadcast notification as acknowledged and increments the read_count."""
    notif = db.query(models.Notification).filter(
        models.Notification.broadcast_id == broadcast_id,
        models.Notification.user_id == user_id
    ).first()
    
    if notif and not notif.is_acknowledged:
        # Mark notification as acknowledged
        notif.is_acknowledged = True
        
        # Increment read_count on the log itself
        log = db.query(models.BroadcastLog).filter(models.BroadcastLog.id == broadcast_id).first()
        if log:
            log.read_count += 1
            
        db.commit()
        return True
    return False

# Analytics & Performance
def get_user_impact_stats(db: Session, user_id: int):
    posts_count = db.query(func.count(models.Feedback.id))\
        .filter(models.Feedback.sender_id == user_id, models.Feedback.is_approved == True).scalar() or 0
    
    likes_received = db.query(func.count(models.Reaction.id))\
        .join(models.Feedback, models.Reaction.feedback_id == models.Feedback.id)\
        .filter(models.Feedback.sender_id == user_id, models.Reaction.is_like == True, models.Feedback.is_approved == True).scalar() or 0

    likes_given = db.query(func.count(models.Reaction.id))\
        .filter(models.Reaction.user_id == user_id, models.Reaction.is_like == True).scalar() or 0
    
    reply_likes_given = db.query(func.count(models.ReplyReaction.id))\
        .filter(models.ReplyReaction.user_id == user_id, models.ReplyReaction.is_like == True).scalar() or 0
    
    major_comments_given = db.query(func.count(models.Reply.id))\
        .filter(models.Reply.user_id == user_id, models.Reply.parent_id == None).scalar() or 0

    # New Point System:
    # 3 for feedback (posts)
    # 0.5 for likes received
    # 0.5 for likes given
    # 0.3 for user comment (not reply)
    total_points = (posts_count * 3) + (likes_received * 0.5) + \
                   ((likes_given + reply_likes_given) * 0.5) + (major_comments_given * 0.3)

    return {
        'impact_points': round(float(total_points), 1),
        'posts_count': posts_count,
        'likes_received': likes_received
    }

def get_analytics_summary(db: Session, dept_name: Optional[str] = None, entity_id: Optional[int] = None):
    # Base queries
    fb_q = db.query(models.Feedback)
    u_q = db.query(models.User)
    c_q = db.query(models.Reply)
    r_q = db.query(models.Reaction)

    if entity_id:
        fb_q = fb_q.filter(models.Feedback.entity_id == entity_id)
        u_q = u_q.filter(models.User.entity_id == entity_id)
        c_q = c_q.join(models.Feedback).filter(models.Feedback.entity_id == entity_id)
        r_q = r_q.join(models.Feedback).filter(models.Feedback.entity_id == entity_id)
    elif dept_name:
        dept_exists = db.query(models.Department.id).filter(models.Department.name == dept_name).first() is not None
        # Filter everything by department
        if dept_exists:
            dept_filter = db.query(models.Department.id).filter(models.Department.name == dept_name).scalar_subquery()
            fb_q = fb_q.filter(models.Feedback.recipient_dept_id == dept_filter)
            u_q = u_q.filter(models.User.unit_name == dept_name)
            c_q = c_q.join(models.Feedback).filter(models.Feedback.recipient_dept_id == dept_filter)
            r_q = r_q.join(models.Feedback).filter(models.Feedback.recipient_dept_id == dept_filter)
        else:
            # Fallback scope: interpret selected "department" as entity name.
            fb_q = fb_q.join(models.Entity, models.Feedback.entity_id == models.Entity.id).filter(models.Entity.name == dept_name)
            c_q = c_q.join(models.Feedback).join(models.Entity, models.Feedback.entity_id == models.Entity.id).filter(models.Entity.name == dept_name)
            r_q = r_q.join(models.Feedback).join(models.Entity, models.Feedback.entity_id == models.Entity.id).filter(models.Entity.name == dept_name)
            u_q = u_q.filter(
                (models.User.unit_name == dept_name) |
                (models.User.program == dept_name) |
                (models.User.department == dept_name)
            )

    total_feedback = fb_q.count()
    total_users = u_q.count()
    total_comments = c_q.count()
    total_reactions = r_q.count()

    avg_rating = fb_q.with_entities(func.avg(models.Feedback.rating)).scalar()
    avg_rating = round(float(avg_rating), 2) if avg_rating else 0.0

    anon_count = fb_q.filter(models.Feedback.is_anonymous == True).count()
    anon_rate = round((anon_count / total_feedback * 100), 1) if total_feedback else 0

    return {
        "total_feedback": total_feedback,
        "total_users": total_users,
        "total_comments": total_comments,
        "total_reactions": total_reactions,
        "avg_rating": avg_rating,
        "anonymous_rate": anon_rate,
    }

def get_top_branches(db: Session, entity_id: Optional[int] = None, limit: int = 5):
    """Returns top branches based on feedback count and average rating."""
    query = db.query(
        models.Branch.name,
        func.count(models.Feedback.id).label("count"),
        func.avg(models.Feedback.rating).label("avg_rating")
    ).join(models.Feedback, models.Feedback.branch_id == models.Branch.id)
    
    if entity_id:
        query = query.filter(models.Feedback.entity_id == entity_id)
        
    rows = query.group_by(models.Branch.name)\
                .order_by(func.count(models.Feedback.id).desc())\
                .limit(limit).all()
                
    return [{"name": r.name, "count": r.count, "avg_rating": round(float(r.avg_rating), 2) if r.avg_rating else 0.0} for r in rows]

def get_feedback_type_distribution(db: Session, entity_id: Optional[int] = None):
    """Calculates percentage breakdown of feedback types."""
    query = db.query(
        models.Feedback.feedback_type,
        func.count(models.Feedback.id)
    )
    
    if entity_id:
        query = query.filter(models.Feedback.entity_id == entity_id)
        
    stats = query.group_by(models.Feedback.feedback_type).all()
    total = sum(s[1] for s in stats)
    
    if total == 0:
        return {t: 0 for t in ["Complaint", "Suggestion", "Appreciation", "Inquiry"]}
        
    return {
        s[0]: round((s[1] / total) * 100, 1) if s[0] else 0 for s in stats
    }

def get_sentiment_summary(db: Session, dept_name: Optional[str] = None, entity_id: Optional[int] = None):
    """Analyze overall mood of user feedback."""
    q = db.query(models.Feedback.description)
    if entity_id:
        q = q.filter(models.Feedback.entity_id == entity_id)
    elif dept_name:
        dept_exists = db.query(models.Department.id).filter(models.Department.name == dept_name).first() is not None
        if dept_exists:
            q = q.join(models.Department).filter(models.Department.name == dept_name)
        else:
            q = q.join(models.Entity).filter(models.Entity.name == dept_name)
    
    feedbacks = q.all()
    pos_words = {"great", "excellent", "good", "happy", "thanks", "improved", "perfect", "amazing", "love", "awesome", "fast", "efficient"}
    neg_words = {"broken", "failed", "slow", "terrible", "bad", "frustrated", "error", "problem", "urgent", "wrong", "annoying", "poor"}
    
    counts = {"positive": 0, "neutral": 0, "frustrated": 0}
    for (desc,) in feedbacks:
        if not desc:
            counts["neutral"] += 1
            continue
        lower_desc = desc.lower()
        has_pos = any(w in lower_desc for w in pos_words)
        has_neg = any(w in lower_desc for w in neg_words)
        if has_neg: counts["frustrated"] += 1
        elif has_pos: counts["positive"] += 1
        else: counts["neutral"] += 1
    return counts

# System Settings Operations
def get_system_settings(db: Session):
    return db.query(models.SystemSetting).all()

def update_system_setting(db: Session, key: str, value: str):
    db_setting = db.query(models.SystemSetting).filter(models.SystemSetting.key == key).first()
    if db_setting:
        db_setting.value = value
    else:
        db_setting = models.SystemSetting(key=key, value=value)
        db.add(db_setting)
    db.commit()
    db.refresh(db_setting)
    return db_setting

def get_system_labels(db: Session, organization_id: int = None):
    query = db.query(models.SystemLabel)
    if organization_id:
        query = query.filter(models.SystemLabel.organization_id == organization_id)
    return query.all()

def update_system_label(db: Session, key: str, value: str, organization_id: int = None):
    db_label = db.query(models.SystemLabel).filter(
        models.SystemLabel.key == key,
        models.SystemLabel.organization_id == organization_id
    ).first()
    if db_label:
        db_label.value = value
    else:
        db_label = models.SystemLabel(key=key, value=value, organization_id=organization_id)
        db.add(db_label)
    db.commit()
    db.refresh(db_label)
    return db_label

# Broadcast History
def create_broadcast_log(db: Session, subject: str, message: str, count: int, entity_id: Optional[int] = None):
    log = models.BroadcastLog(subject=subject, message=message, sent_to_count=count, entity_id=entity_id)
    db.add(log)
    db.commit()
    db.refresh(log)
    return log

def get_broadcast_logs(db: Session, entity_id: Optional[int] = None):
    query = db.query(models.BroadcastLog)
    if entity_id:
        query = query.filter(models.BroadcastLog.entity_id == entity_id)
    return query.order_by(models.BroadcastLog.created_at.desc()).all()

# Moderation Operations
def get_pending_feedbacks(db: Session, skip: int = 0, limit: int = 100):
    from sqlalchemy.orm import aliased
    RecipientUser = aliased(models.User)
    
    return db.query(
        models.Feedback.id,
        models.Feedback.title,
        models.Feedback.description,
        models.Feedback.entity_id,
        models.Feedback.sender_id,
        models.Feedback.recipient_user_id,
        models.Feedback.recipient_dept_id,
        models.Feedback.status,
        models.Feedback.is_approved,
        models.Feedback.created_at,
        models.User.name.label("user_name"),
        models.Entity.name.label("entity_name")
    ).join(models.User, models.Feedback.sender_id == models.User.id) \
     .join(models.Entity, models.Feedback.entity_id == models.Entity.id) \
     .filter(models.Feedback.is_approved == False) \
     .order_by(models.Feedback.created_at.desc()) \
     .offset(skip).limit(limit).all()

def approve_feedback_choice(db: Session, feedback_id: int, approved_name: str):
    import json
    from datetime import datetime, timezone
    db_fb = db.query(models.Feedback).filter(models.Feedback.id == feedback_id).first()
    if not db_fb: return None
    
    # 1. Update Entity choices list
    db_ent = db.query(models.Entity).filter(models.Entity.id == db_fb.entity_id).first()
    if db_ent:
        try:
            choices = json.loads(db_ent.description or "[]")
            if approved_name not in choices:
                choices.append(approved_name)
                db_ent.description = json.dumps(choices)
        except Exception: pass
    
    # 2. Update Feedback title and approve
    # Title is usually "Entity Name: Establishment Name"
    ent_label = db_ent.name if db_ent else "Feedback"
    db_fb.title = f"{ent_label}: {approved_name}"
    db_fb.is_approved = True
    
    # Update timestamp so it appears "Just Now" in public feed
    db_fb.created_at = datetime.now(timezone.utc)
    
    # 3. Create Notification for user
    notif = models.Notification(
        user_id=db_fb.sender_id,
        actor_id=None, # System/Admin action
        type="approval",
        feedback_id=feedback_id,
        message="Your feedback is approved and you can now see it in the feeds/posts.",
        is_read=False
    )
    db.add(notif)
    
    db.commit()
    db.refresh(db_fb)
    return db_fb
        
def create_reset_token(db: Session, email: str):
    import uuid
    from datetime import datetime, timedelta, timezone
    user = db.query(models.User).filter(models.User.email.ilike(email)).first()
    if not user:
        return None
    
    # Invalidate previous tokens
    db.query(models.PasswordResetToken).filter(models.PasswordResetToken.user_id == user.id).update({"is_used": True})
    
    token = str(uuid.uuid4())
    db_token = models.PasswordResetToken(
        user_id=user.id,
        token=token,
        expires_at=datetime.now(timezone.utc) + timedelta(minutes=30)
    )
    db.add(db_token)
    db.commit()
    return token

def reset_password_with_token(db: Session, token: str, new_password: str):
    from datetime import datetime, timezone
    db_token = db.query(models.PasswordResetToken).filter(
        models.PasswordResetToken.token == token,
        models.PasswordResetToken.is_used == False,
        models.PasswordResetToken.expires_at > datetime.now(timezone.utc)
    ).first()
    
    if not db_token:
        return False
    
    user = db.query(models.User).filter(models.User.id == db_token.user_id).first()
    if user:
        user.password = new_password
        db_token.is_used = True
        db.commit()
        return True
    return False

def get_broadcast_logs(db: Session):
    logs = db.query(models.BroadcastLog).order_by(models.BroadcastLog.created_at.desc()).all()
    for log in logs:
        log.read_count = db.query(models.Notification).filter(
            models.Notification.broadcast_id == log.id,
            models.Notification.is_read == True
        ).count()
    return logs

def get_user_activity(db: Session, user_id: int):
    results = []
    
    # 1. User's Posts
    feedbacks = db.query(models.Feedback)\
        .options(joinedload(models.Feedback.mentions))\
        .outerjoin(models.Branch, models.Feedback.branch_id == models.Branch.id)\
        .outerjoin(models.Entity, models.Feedback.entity_id == models.Entity.id)\
        .filter(models.Feedback.sender_id == user_id).all()
        
    for f in feedbacks:
        results.append({
            "id": f"post_{f.id}",
            "type": "post",
            "feedback_id": f.id,
            "title": f.title,
            "message": f.description[:100],
            "mentions": f.mentions,
            "created_at": f.created_at,
            "rating": f.rating,
            "branch_name": f.branch.name if f.branch else f.branch_name_snapshot,
            "region": f.region,
            "city": f.city,
            "province": f.province,
            "barangay": f.barangay,
            "entity_name": f.entity.name if f.entity else None
        })
        
    # 2. User's Comments
    replies = db.query(models.Reply).filter(models.Reply.user_id == user_id).all()
    for r in replies:
        fb = db.query(models.Feedback).filter(models.Feedback.id == r.feedback_id).first()
        results.append({
            "id": f"comment_{r.id}",
            "type": "comment",
            "feedback_id": r.feedback_id,
            "title": fb.title if fb else "Deleted Post",
            "message": r.message,
            "created_at": r.created_at
        })
        
    # 3. User's Reactions (Feedback)
    reactions = db.query(models.Reaction).filter(models.Reaction.user_id == user_id).all()
    for rx in reactions:
        fb = db.query(models.Feedback).filter(models.Feedback.id == rx.feedback_id).first()
        results.append({
            "id": f"react_{rx.id}",
            "type": "like" if rx.is_like else "dislike",
            "feedback_id": rx.feedback_id,
            "title": fb.title if fb else "Deleted Post",
            "message": "Liked this post" if rx.is_like else "Disliked this post",
            "created_at": rx.created_at
        })
        
    # Sort by date DESC
    results.sort(key=lambda x: x["created_at"], reverse=True)
    return results[:50]

def get_user_distribution(db: Session, dept_name: Optional[str] = None, entity_id: Optional[int] = None):
    """Provides breakdown of users by Entity and Role Identity with Admin mapping."""
    from sqlalchemy import case
    # 1. By Entity / Service (Priority: Entity.name -> unit_name fallback)
    entity_label = func.coalesce(models.Entity.name, models.User.unit_name).label("name")
    entity_q = db.query(
        entity_label,
        func.count(models.User.id).label("value")
    ).outerjoin(models.Entity, models.User.entity_id == models.Entity.id)\
     .filter(entity_label != None, entity_label != "")
    
    if entity_id:
        entity_q = entity_q.filter(models.User.entity_id == entity_id)
    elif dept_name:
        entity_q = entity_q.filter(models.User.unit_name == dept_name)
    
    entity_dist = entity_q.group_by(entity_label).all()
    
    # 2. By Role Identity (Admins mapped to Employee)
    role_label = case(
        (models.User.role.in_(["admin", "superadmin"]), "Employee"),
        else_=models.User.role_identity
    ).label("name")
    
    role_q = db.query(
        role_label,
        func.count(models.User.id).label("value")
    ).filter(role_label != None, role_label != "")
    
    if entity_id:
        role_q = role_q.filter(models.User.entity_id == entity_id)
    elif dept_name:
        role_q = role_q.filter(models.User.unit_name == dept_name)
    else:
        # Fallback: if no scope, maybe default to some filter? No, global system.
        pass
    
    role_dist = role_q.group_by(role_label).all()

    # Format for recharts
    format_data = lambda rows: [{"name": r.name, "value": r.value} for r in rows if r.name]
    
    return {
        "by_entity": format_data(entity_dist),
        "by_role": format_data(role_dist)
    }
# Audit Logs
def create_audit_log(db: Session, action_type: str, performed_by_id: int, target_id: str = None, details: dict = None):
    db_log = models.AuditLog(
        action_type=action_type,
        performed_by_id=performed_by_id,
        target_id=target_id,
        details=details
    )
    db.add(db_log)
    db.commit()
    db.refresh(db_log)
    return db_log

def get_audit_logs(db: Session, skip: int = 0, limit: int = 200, dept_name: Optional[str] = None, entity_id: Optional[int] = None):
    query = db.query(models.AuditLog).options(joinedload(models.AuditLog.performed_by))
    
    if entity_id:
        query = query.join(models.User, models.AuditLog.performed_by_id == models.User.id)\
                     .filter(models.User.entity_id == entity_id)
    elif dept_name:
        query = query.join(models.User, models.AuditLog.performed_by_id == models.User.id)\
                     .filter(models.User.department == dept_name)
    
    return query.order_by(models.AuditLog.timestamp.desc()).offset(skip).limit(limit).all()

def create_reset_token(db: Session, email: str):
    import uuid
    from datetime import datetime, timedelta, timezone
    user = db.query(models.User).filter(models.User.email.ilike(email)).first()
    if not user:
        return None
    
    # Invalidate previous tokens
    db.query(models.PasswordResetToken).filter(models.PasswordResetToken.user_id == user.id).update({"is_used": True})
    
    token = str(uuid.uuid4())
    db_token = models.PasswordResetToken(
        user_id=user.id,
        token=token,
        expires_at=datetime.now(timezone.utc) + timedelta(minutes=30)
    )
    db.add(db_token)
    db.commit()
    return token

def reset_password_with_token(db: Session, token: str, new_password: str):
    from datetime import datetime, timezone
    db_token = db.query(models.PasswordResetToken).filter(
        models.PasswordResetToken.token == token,
        models.PasswordResetToken.is_used == False,
        models.PasswordResetToken.expires_at > datetime.now(timezone.utc)
    ).first()
    
    if not db_token:
        return False
    
    user = db.query(models.User).filter(models.User.id == db_token.user_id).first()
    if user:
        user.password = new_password
        db_token.is_used = True
        # Invalidate all other tokens for this user
        db.query(models.PasswordResetToken).filter(models.PasswordResetToken.user_id == user.id).update({"is_used": True})
        db.commit()
        return True
    return False
