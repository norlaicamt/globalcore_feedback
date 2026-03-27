from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, Boolean, Enum, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.database import Base
import enum

class FeedbackStatus(str, enum.Enum):
    OPEN = "OPEN"
    IN_PROGRESS = "IN_PROGRESS"
    RESOLVED = "RESOLVED"
    CLOSED = "CLOSED"

class User(Base):
    __tablename__ = "global_user"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    is_active = Column(Boolean, default=True)
    username = Column(String, unique=True, index=True, nullable=True)
    phone = Column(String, nullable=True)
    department = Column(String, nullable=True)
    password = Column(String, nullable=True)
    two_factor_enabled = Column(Boolean, default=False)
    role = Column(String, default="maker")
    show_activity_status = Column(Boolean, default=True)
    avatar_url = Column(Text, nullable=True)  # base64 data URI or URL
    
    # New Preference Fields
    push_notifications = Column(Boolean, default=True)
    email_notifications = Column(Boolean, default=False)
    status_updates = Column(Boolean, default=True)
    reply_notifications = Column(Boolean, default=True)
    weekly_digest = Column(Boolean, default=False)
    biometrics_enabled = Column(Boolean, default=True)


class Department(Base):
    __tablename__ = "departments"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)

class Category(Base):
    __tablename__ = "categories"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    description = Column(String, nullable=True)

class Feedback(Base):
    __tablename__ = "feedbacks"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    description = Column(Text)
    
    sender_id = Column(Integer, ForeignKey("global_user.id"))
    recipient_user_id = Column(Integer, ForeignKey("global_user.id"), nullable=True)
    recipient_dept_id = Column(Integer, ForeignKey("departments.id"), nullable=True)
    category_id = Column(Integer, ForeignKey("categories.id"))
    rating = Column(Integer, nullable=True) # 1-5 stars
    address = Column(String, nullable=True)
    region = Column(String, nullable=True)
    city = Column(String, nullable=True)
    barangay = Column(String, nullable=True)
    employee_name = Column(String, nullable=True)
    product_name = Column(String, nullable=True)
    attachments = Column(Text, nullable=True) # JSON-encoded list of Base64 strings or URLs
    
    status = Column(Enum(FeedbackStatus), default=FeedbackStatus.OPEN)
    allow_comments = Column(Boolean, default=True)
    is_anonymous = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    sender = relationship("User", foreign_keys=[sender_id])
    recipient_user = relationship("User", foreign_keys=[recipient_user_id])
    recipient_dept = relationship("Department")
    category = relationship("Category")
    replies = relationship("Reply", back_populates="feedback")
    reactions = relationship("Reaction", back_populates="feedback", cascade="all, delete-orphan")

class Reaction(Base):
    __tablename__ = "reactions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("global_user.id"))
    feedback_id = Column(Integer, ForeignKey("feedbacks.id"))
    is_like = Column(Boolean) # True = Like, False = Dislike
    
    __table_args__ = (UniqueConstraint('user_id', 'feedback_id', name='_user_feedback_uc'),)
    
    user = relationship("User")
    feedback = relationship("Feedback", back_populates="reactions")

class Reply(Base):
    __tablename__ = "replies"

    id = Column(Integer, primary_key=True, index=True)
    feedback_id = Column(Integer, ForeignKey("feedbacks.id"))
    user_id = Column(Integer, ForeignKey("global_user.id"))
    parent_id = Column(Integer, ForeignKey("replies.id"), nullable=True) # For nested replies
    message = Column(Text)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    feedback = relationship("Feedback", back_populates="replies")
    user = relationship("User")
    reactions = relationship("ReplyReaction", back_populates="reply", cascade="all, delete-orphan")
    
    # Self-referential relationship for nesting
    parent = relationship("Reply", remote_side=[id], backref="replies_nested")

class ReplyReaction(Base):
    __tablename__ = "reply_reactions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("global_user.id"))
    reply_id = Column(Integer, ForeignKey("replies.id"))
    is_like = Column(Boolean) # True = Like, False = Dislike
    
    __table_args__ = (UniqueConstraint('user_id', 'reply_id', name='_user_reply_uc'),)
    
    user = relationship("User")
    reply = relationship("Reply", back_populates="reactions")

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("global_user.id"))  # Recipient
    actor_id = Column(Integer, ForeignKey("global_user.id")) # Who did it
    type = Column(String) # 'comment', 'like', 'dislike'
    feedback_id = Column(Integer, ForeignKey("feedbacks.id"))
    reply_id = Column(Integer, ForeignKey("replies.id"), nullable=True)
    message = Column(String, nullable=True)  # New field for broadcast message
    subject = Column(String, nullable=True)  # New field for broadcast title
    broadcast_id = Column(Integer, ForeignKey("broadcast_logs.id"), nullable=True)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", foreign_keys=[user_id])
    actor = relationship("User", foreign_keys=[actor_id])
    feedback = relationship("Feedback")
    broadcast = relationship("BroadcastLog", backref="notifications")

class SystemSetting(Base):
    __tablename__ = "system_settings"
    key = Column(String, primary_key=True, index=True)
    value = Column(String) # Store as 'true'/'false' or simple strings

class BroadcastLog(Base):
    __tablename__ = "broadcast_logs"
    id = Column(Integer, primary_key=True, index=True)
    subject = Column(String)
    message = Column(String)
    sent_to_count = Column(Integer)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))