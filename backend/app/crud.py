from sqlalchemy.orm import Session
from sqlalchemy import func, select, case
from app import models
from app import schemas
import asyncio

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

def update_user(db: Session, user_id: int, updates: schemas.UserUpdate):
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if db_user:
        update_data = updates.model_dump(exclude_unset=True)
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
    from sqlalchemy.orm import aliased
    RecipientUser = aliased(models.User)
    
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
    query = db.query(
        models.Feedback.id,
        models.Feedback.title,
        models.Feedback.description,
        models.Feedback.category_id,
        models.Feedback.recipient_dept_id,
        models.Feedback.recipient_user_id,
        models.Feedback.status,
        models.Feedback.allow_comments,
        models.Feedback.is_anonymous,
        models.Feedback.created_at,
        models.Feedback.rating,
        models.Feedback.address,
        models.Feedback.region,
        models.Feedback.city,
        models.Feedback.barangay,
        models.Feedback.employee_name,
        models.Feedback.product_name,
        models.Feedback.attachments,
        models.Feedback.is_approved,
        case(
            (models.Feedback.is_anonymous == True, "Anonymous"),
            else_=models.User.name
        ).label("user_name"), 
        case(
            (models.Feedback.is_anonymous == True, 0),
            else_=models.Feedback.sender_id
        ).label("sender_id"),
        models.Department.name.label("recipient_dept_name"),
        RecipientUser.name.label("recipient_user_name"),
        replies_count_sq,
        likes_count_sq,
        dislikes_count_sq
    ).outerjoin(models.User, models.Feedback.sender_id == models.User.id)\
     .outerjoin(models.Department, models.Feedback.recipient_dept_id == models.Department.id)\
     .outerjoin(RecipientUser, models.Feedback.recipient_user_id == RecipientUser.id)

    if user_id:
        query = query.filter(
            (models.Feedback.sender_id == user_id) | 
            (models.Feedback.recipient_user_id == user_id)
        )
    if dept_id:
        query = query.filter(models.Feedback.recipient_dept_id == dept_id)
        
    # Moderation check: Regular lists skip unapproved
    query = query.filter(models.Feedback.is_approved == True)

    return query.order_by(models.Feedback.created_at.desc()).offset(skip).limit(limit).all()

def create_feedback(db: Session, feedback: schemas.FeedbackCreate):
    data = feedback.model_dump()
    mentions_data = data.pop("mentions", [])
    
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
                notif_type='mention',
                feedback_id=db_feedback.id
            )
            
    db.commit()
    db.refresh(db_feedback)
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

def get_public_feed(db: Session, skip: int = 0, limit: int = 10):
    from sqlalchemy.orm import aliased
    RecipientUser = aliased(models.User)

    from sqlalchemy.orm import joinedload
    
    # We still need the subqueries for counts
    from sqlalchemy.orm import joinedload
    
    # Pre-calculated counts for performance
    replies_count_sq = (
        select(func.count(models.Reply.id))
        .where(models.Reply.feedback_id == models.Feedback.id)
        .scalar_subquery()
    )
    likes_count_sq = (
        select(func.count(models.Reaction.id))
        .where((models.Reaction.feedback_id == models.Feedback.id) & (models.Reaction.is_like == True))
        .scalar_subquery()
    )
    dislikes_count_sq = (
        select(func.count(models.Reaction.id))
        .where((models.Reaction.feedback_id == models.Feedback.id) & (models.Reaction.is_like == False))
        .scalar_subquery()
    )

    feedbacks = db.query(models.Feedback).options(joinedload(models.Feedback.mentions)).filter(models.Feedback.is_approved == True).order_by(models.Feedback.created_at.desc()).offset(skip).limit(limit).all()
    
    # Populate extra fields for frontend
    for f in feedbacks:
        # Resolve mentions string fallback for legacy support if needed
        # f.employee_name_list = ", ".join([f"{m.employee_prefix} {m.employee_name}".strip() for m in f.mentions])
        
        if f.is_anonymous:
            f.user_name = "Anonymous"
            f.sender_avatar_url = None
            f.sender_id = 0
            f.sender_show_status = True
        else:
            f.user_name = f.sender.name if f.sender else "Someone"
            f.sender_avatar_url = f.sender.avatar_url if f.sender else None
            f.sender_id = f.sender_id
            f.sender_show_status = f.sender.show_activity_status if f.sender else True
        
        f.recipient_dept_name = f.recipient_dept.name if f.recipient_dept else None
        f.recipient_user_name = f.recipient_user.name if f.recipient_user else None
        
        f.replies_count = db.query(func.count(models.Reply.id)).filter(models.Reply.feedback_id == f.id).scalar()
        f.likes_count = db.query(func.count(models.Reaction.id)).filter(models.Reaction.feedback_id == f.id, models.Reaction.is_like == True).scalar()
        f.dislikes_count = db.query(func.count(models.Reaction.id)).filter(models.Reaction.feedback_id == f.id, models.Reaction.is_like == False).scalar()

    return feedbacks

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
            notif_type='comment',
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
                notif_type='reply',
                feedback_id=reply.feedback_id,
                reply_id=db_reply.id
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
        if feedback and feedback.sender_id != user_id:
            create_notification(
                db,
                user_id=feedback.sender_id,
                actor_id=user_id,
                notif_type='like' if is_like else 'dislike',
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
        if reply and reply.user_id != user_id:
            create_notification(
                db,
                user_id=reply.user_id,
                actor_id=user_id,
                notif_type='like' if is_like else 'dislike',
                feedback_id=reply.feedback_id,
                reply_id=reply_id
            )
            
        return new_reaction

# Notification operations
def create_notification(db: Session, user_id: int, actor_id: int, notif_type: str, feedback_id: int, reply_id: int = None, message: str = None, subject: str = None, broadcast_id: int = None):
    notif = models.Notification(
        user_id=user_id,
        actor_id=actor_id,
        type=notif_type,
        feedback_id=feedback_id,
        reply_id=reply_id,
        message=message,
        subject=subject,
        broadcast_id=broadcast_id,
        is_read=False
    )
    db.add(notif)
    db.commit()
    db.refresh(notif)
    
    # SSE Trigger to the stream
    from app.sse import sse_manager
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            asyncio.create_task(sse_manager.notify(user_id))
    except (RuntimeError, Exception):
        # Fallback if no loop is running (rare but good to have)
        pass
        
    return notif

def get_notifications(db: Session, user_id: int):
    return db.query(
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
        models.User.name.label("actor_name"),
        models.Feedback.title.label("feedback_title"),
        models.Reply.message.label("reply_message")
    ).outerjoin(models.User, models.Notification.actor_id == models.User.id) \
     .outerjoin(models.Feedback, models.Notification.feedback_id == models.Feedback.id) \
     .outerjoin(models.Reply, models.Notification.reply_id == models.Reply.id) \
     .filter(models.Notification.user_id == user_id) \
     .order_by(models.Notification.created_at.desc()) \
     .all()

def mark_notifications_as_read(db: Session, user_id: int):
    db.query(models.Notification).filter(models.Notification.user_id == user_id, models.Notification.is_read == False).update({"is_read": True}, synchronize_session=False)
    db.commit()
    return True

# Analytics & Performance
def get_user_impact_stats(db: Session, user_id: int):
    posts_count = db.query(func.count(models.Feedback.id))\
        .filter(models.Feedback.sender_id == user_id, models.Feedback.is_approved == True).scalar() or 0
    
    received_reactions = db.query(func.count(models.Reaction.id))\
        .join(models.Feedback, models.Reaction.feedback_id == models.Feedback.id)\
        .filter(models.Feedback.sender_id == user_id, models.Feedback.is_approved == True).scalar() or 0
    
    received_comments = db.query(func.count(models.Reply.id))\
        .join(models.Feedback, models.Reply.feedback_id == models.Feedback.id)\
        .filter(models.Feedback.sender_id == user_id, models.Reply.parent_id == None, models.Feedback.is_approved == True).scalar() or 0
    
    given_comments = db.query(func.count(models.Reply.id)).filter(models.Reply.user_id == user_id).scalar() or 0
    given_reactions = db.query(func.count(models.Reaction.id)).filter(models.Reaction.user_id == user_id).scalar() or 0
    given_reply_reactions = db.query(func.count(models.ReplyReaction.id)).filter(models.ReplyReaction.user_id == user_id).scalar() or 0
    
    likes_received = db.query(func.count(models.Reaction.id))\
        .join(models.Feedback, models.Reaction.feedback_id == models.Feedback.id)\
        .filter(models.Feedback.sender_id == user_id, models.Reaction.is_like == True, models.Feedback.is_approved == True).scalar() or 0

    total_points = (posts_count * 3) + (received_reactions * 1.5) + (received_comments * 1) + \
                   ((given_reactions + given_reply_reactions) * 0.5) + (given_comments * 0.5)

    return {
        'impact_points': round(float(total_points), 1),
        'posts_count': posts_count,
        'likes_received': likes_received
    }

def get_sentiment_summary(db: Session):
    feedbacks = db.query(models.Feedback.description).all()
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

# Broadcast History
def create_broadcast_log(db: Session, subject: str, message: str, count: int):
    log = models.BroadcastLog(subject=subject, message=message, sent_to_count=count)
    db.add(log)
    db.commit()
    db.refresh(log)
    return log

# Moderation Operations
def get_pending_feedbacks(db: Session, skip: int = 0, limit: int = 100):
    from sqlalchemy.orm import aliased
    RecipientUser = aliased(models.User)
    
    return db.query(
        models.Feedback.id,
        models.Feedback.title,
        models.Feedback.description,
        models.Feedback.category_id,
        models.Feedback.sender_id,
        models.Feedback.recipient_user_id,
        models.Feedback.recipient_dept_id,
        models.Feedback.status,
        models.Feedback.is_approved,
        models.Feedback.created_at,
        models.User.name.label("user_name"),
        models.Category.name.label("category_name")
    ).join(models.User, models.Feedback.sender_id == models.User.id) \
     .join(models.Category, models.Feedback.category_id == models.Category.id) \
     .filter(models.Feedback.is_approved == False) \
     .order_by(models.Feedback.created_at.desc()) \
     .offset(skip).limit(limit).all()

def approve_feedback_choice(db: Session, feedback_id: int, approved_name: str):
    import json
    from datetime import datetime, timezone
    db_fb = db.query(models.Feedback).filter(models.Feedback.id == feedback_id).first()
    if not db_fb: return None
    
    # 1. Update Category choices list
    db_cat = db.query(models.Category).filter(models.Category.id == db_fb.category_id).first()
    if db_cat:
        try:
            choices = json.loads(db_cat.description or "[]")
            if approved_name not in choices:
                choices.append(approved_name)
                db_cat.description = json.dumps(choices)
        except Exception: pass
    
    # 2. Update Feedback title and approve
    # Title is usually "Category Name: Establishment Name"
    cat_label = db_cat.name if db_cat else "Feedback"
    db_fb.title = f"{cat_label}: {approved_name}"
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
    feedbacks = db.query(models.Feedback).options(joinedload(models.Feedback.mentions)).filter(models.Feedback.sender_id == user_id).all()
    for f in feedbacks:
        results.append({
            "id": f"post_{f.id}",
            "type": "post",
            "feedback_id": f.id,
            "title": f.title,
            "message": f.description[:100],
            "mentions": f.mentions,
            "created_at": f.created_at
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

def get_user_profiles(db: Session):
    return db.query(
        models.User.id,
        models.User.name,
        models.User.department,
        models.User.avatar_url,
        models.User.show_activity_status,
        models.User.created_at
    ).all()