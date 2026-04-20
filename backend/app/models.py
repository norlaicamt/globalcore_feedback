from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, Boolean, Enum, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.database import Base
import enum

class FeedbackStatus(str, enum.Enum):
    OPEN = "OPEN"
    IN_PROGRESS = "IN_PROGRESS"
    RESOLVED = "RESOLVED"
    CLOSED = "CLOSED"

class NotificationType(str, enum.Enum):
    REPLY = "reply"
    COMMENT = "comment"
    MENTION = "mention"
    LIKE = "like"
    ANNOUNCEMENT = "announcement"
    NEW_FEEDBACK = "new_feedback"
    ASSIGNED = "assigned"

class User(Base):
    __tablename__ = "global_user"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    is_active = Column(Boolean, default=True)
    username = Column(String, unique=True, index=True, nullable=True)
    phone = Column(String, nullable=True)
    first_name = Column(String, nullable=True)
    middle_name = Column(String, nullable=True)
    last_name = Column(String, nullable=True)
    department = Column(String, nullable=True)
    program = Column(String, nullable=True)
    entity_id = Column(Integer, ForeignKey("entities.id"), nullable=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=True)
    password = Column(String, nullable=True)
    two_factor_enabled = Column(Boolean, default=False)
    role = Column(String, default="user")
    role_identity = Column(String, nullable=True)  # Student/Visitor/Employee/Parent/Staff/Others
    school = Column(String, nullable=True)
    company_name = Column(String, nullable=True)
    position_title = Column(String, nullable=True)
    region = Column(String, nullable=True)
    province = Column(String, nullable=True)
    city = Column(String, nullable=True)
    barangay = Column(String, nullable=True)
    exact_address = Column(String, nullable=True)
    birthdate = Column(String, nullable=True)
    birthplace = Column(String, nullable=True)
    onboarding_completed = Column(Boolean, default=False)
    show_activity_status = Column(Boolean, default=True)
    is_global_user = Column(Boolean, default=False)
    avatar_url = Column(Text, nullable=True)  # base64 data URI or URL
    id_photo_url = Column(Text, nullable=True)
    citizenship = Column(String, nullable=True)
    marital_status = Column(String, nullable=True)
    
    # Interaction Preference Fields (Interaction-First Architecture)
    notify_replies = Column(Boolean, default=True)      # Replaces reply_notifications
    notify_comments = Column(Boolean, default=True)     # New
    notify_mentions = Column(Boolean, default=True)     # New
    notify_likes = Column(Boolean, default=True)        # New
    notify_announcements = Column(Boolean, default=True) # Replaces status_updates
    
    # Notification Delivery Channels
    push_notifications = Column(Boolean, default=True)
    email_notifications = Column(Boolean, default=False)
    weekly_digest = Column(Boolean, default=False)
    daily_summary = Column(Boolean, default=False) # New
    
    # Granular Settings
    notify_new_feedback = Column(Boolean, default=True) # Admin Only
    notify_assigned = Column(Boolean, default=True)     # Admin Only
    notify_high_activity = Column(Boolean, default=False) 
    notify_system_announcements = Column(Boolean, default=True)
    
    biometrics_enabled = Column(Boolean, default=True)
    avatar_url = Column(Text, nullable=True)
    session_token = Column(String, nullable=True, index=True)
    impact_points = Column(Integer, default=0)
    
    # Tracking fields
    unit_name = Column(String, nullable=True) # Neutral internal name for Program/College/Dept
    profile_completed = Column(Boolean, default=False)
    completed_at = Column(DateTime, nullable=True)
    last_login = Column(DateTime, nullable=True)
    last_seen = Column(DateTime, nullable=True)
    current_module = Column(String, nullable=True)
    
    deactivated_until = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    # Relationships
    organization = relationship("Organization", back_populates="users")
    entity = relationship("Entity", foreign_keys=[entity_id])

class Department(Base):
    __tablename__ = "departments"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    entity_id = Column(Integer, ForeignKey("entities.id"), nullable=True)
    
    entity = relationship("Entity", back_populates="departments")
    
    __table_args__ = (UniqueConstraint('name', 'entity_id', name='_dept_name_entity_uc'),)

class Organization(Base):
    __tablename__ = "organizations"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    logo_url = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    entities = relationship("Entity", back_populates="organization", cascade="all, delete-orphan")
    users = relationship("User", back_populates="organization")

class Entity(Base):
    __tablename__ = "entities"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    description = Column(String, nullable=True)
    icon = Column(String, nullable=True) # stores icon identifier (emoji or svg key)
    fields = Column(JSONB, nullable=True) # stores List[dict] of field definitions
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=True)
    created_by_id = Column(Integer, ForeignKey("global_user.id"), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    organization = relationship("Organization", back_populates="entities")
    created_by = relationship("User", foreign_keys=[created_by_id])
    departments = relationship("Department", back_populates="entity", cascade="all, delete-orphan")
    feedbacks = relationship("Feedback", back_populates="entity")
    branches = relationship("Branch", back_populates="entity", cascade="all, delete-orphan")

class Branch(Base):
    __tablename__ = "branches"
    id = Column(Integer, primary_key=True, index=True)
    entity_id = Column(Integer, ForeignKey("entities.id"))
    name = Column(String, index=True)
    region = Column(String, nullable=True)
    province = Column(String, nullable=True)
    city = Column(String, nullable=True)
    barangay = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    entity = relationship("Entity", back_populates="branches")
    feedbacks = relationship("Feedback", back_populates="branch")

class Feedback(Base):
    __tablename__ = "feedbacks"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    description = Column(Text)
    
    sender_id = Column(Integer, ForeignKey("global_user.id"))
    recipient_user_id = Column(Integer, ForeignKey("global_user.id"), nullable=True)
    recipient_dept_id = Column(Integer, ForeignKey("departments.id"), nullable=True)
    entity_id = Column(Integer, ForeignKey("entities.id"))
    rating = Column(Integer, nullable=True) # 1-5 stars
    address = Column(String, nullable=True)
    region = Column(String, nullable=True)
    city = Column(String, nullable=True)
    barangay = Column(String, nullable=True)
    employee_name = Column(String, nullable=True)
    product_name = Column(String, nullable=True)
    attachments = Column(Text, nullable=True) # JSON-encoded list of Base64 strings or URLs
    custom_data = Column(JSONB, nullable=True) # stores dict of field values
    
    branch_id = Column(Integer, ForeignKey("branches.id"), nullable=True)
    branch_name_snapshot = Column(String, nullable=True)
    manual_location_text = Column(String, nullable=True)
    feedback_type = Column(String, nullable=True) # Complaint, Suggestion, Appreciation, Inquiry
    
    status = Column(Enum(FeedbackStatus), default=FeedbackStatus.OPEN)
    allow_comments = Column(Boolean, default=True)
    is_anonymous = Column(Boolean, default=False)
    is_approved = Column(Boolean, default=True) # New moderation field
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    sender = relationship("User", foreign_keys=[sender_id])
    recipient_user = relationship("User", foreign_keys=[recipient_user_id])
    recipient_dept = relationship("Department")
    entity = relationship("Entity", back_populates="feedbacks")
    branch = relationship("Branch", back_populates="feedbacks")
    replies = relationship("Reply", back_populates="feedback")
    reactions = relationship("Reaction", back_populates="feedback", cascade="all, delete-orphan")
    mentions = relationship("FeedbackMention", back_populates="feedback", cascade="all, delete-orphan")

class FeedbackMention(Base):
    __tablename__ = "feedback_mentions"
    
    id = Column(Integer, primary_key=True, index=True)
    feedback_id = Column(Integer, ForeignKey("feedbacks.id"))
    user_id = Column(Integer, ForeignKey("global_user.id"), nullable=True) # Linked User
    employee_name = Column(String) # For display / typing-only fallback
    employee_prefix = Column(String, nullable=True)
    
    feedback = relationship("Feedback", back_populates="mentions")
    user = relationship("User")

class Reaction(Base):
    __tablename__ = "reactions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("global_user.id"))
    feedback_id = Column(Integer, ForeignKey("feedbacks.id"))
    is_like = Column(Boolean) # True = Like, False = Dislike
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
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
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    __table_args__ = (UniqueConstraint('user_id', 'reply_id', name='_user_reply_uc'),)
    
    user = relationship("User")
    reply = relationship("Reply", back_populates="reactions")

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("global_user.id"))  # Recipient
    actor_id = Column(Integer, ForeignKey("global_user.id")) # Who did it (REQUIRED)
    type = Column(Enum(NotificationType)) # Interaction type
    feedback_id = Column(Integer, ForeignKey("feedbacks.id"), nullable=True) # Now Nullable
    entity_id = Column(Integer, ForeignKey("entities.id"), nullable=True) # New: for scoping
    reply_id = Column(Integer, ForeignKey("replies.id"), nullable=True)
    message = Column(String, nullable=True)  # Legacy/Custom message
    subject = Column(String, nullable=True)  # Legacy/Custom subject
    broadcast_id = Column(Integer, ForeignKey("broadcast_logs.id"), nullable=True)
    broadcast_type = Column(String, default="announcement")
    priority = Column(String, default="normal") # normal, high, low
    require_ack = Column(Boolean, default=False)
    meta = Column(JSONB, nullable=True)
    is_read = Column(Boolean, default=False)
    is_acknowledged = Column(Boolean, default=False) # New: track broadcast engagement
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", foreign_keys=[user_id])
    actor = relationship("User", foreign_keys=[actor_id])
    feedback = relationship("Feedback")
    entity = relationship("Entity") # Relationship for entity
    broadcast = relationship("BroadcastLog", backref="notifications")

class SystemSetting(Base):
    __tablename__ = "system_settings"
    key = Column(String, primary_key=True, index=True)
    value = Column(String) # Store as 'true'/'false' or simple strings

class SystemLabel(Base):
    __tablename__ = "system_labels"
    id = Column(Integer, primary_key=True, index=True)
    key = Column(String, unique=True, index=True)
    value = Column(String)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=True) # Future-proofing

class BroadcastLog(Base):
    __tablename__ = "broadcast_logs"
    id = Column(Integer, primary_key=True, index=True)
    subject = Column(String)
    message = Column(String)
    broadcast_type = Column(String, default="announcement")
    priority = Column(String, default="normal") # normal, high, low
    status = Column(String, default="sent") # draft, scheduled, sent, archived
    require_ack = Column(Boolean, default=False)
    sent_to_count = Column(Integer)
    read_count = Column(Integer, default=0)
    ack_count = Column(Integer, default=0)
    entity_id = Column(Integer, ForeignKey("entities.id"), nullable=True)
    scheduled_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    entity = relationship("Entity")

class BroadcastTemplate(Base):
    __tablename__ = "broadcast_templates"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String) # Internal Template Name
    title = Column(String) # Announcement Title
    message = Column(String) # Detailed Message
    entity_id = Column(Integer, ForeignKey("entities.id"), nullable=True) # Scoped templates
    created_by_id = Column(Integer, ForeignKey("global_user.id"), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    entity = relationship("Entity")
    creator = relationship("User")

class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("global_user.id"))
    token = Column(String, unique=True, index=True)
    expires_at = Column(DateTime)
    is_used = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User")

class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(Integer, primary_key=True, index=True)
    action_type = Column(String, index=True)
    performed_by_id = Column(Integer, ForeignKey("global_user.id"))
    target_id = Column(String, nullable=True)
    details = Column(JSONB, nullable=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    performed_by = relationship("User")


class FormSection(Base):
    __tablename__ = "form_sections"
    id         = Column(Integer, primary_key=True, index=True)
    name       = Column(String, nullable=False)
    order      = Column(Integer, default=0)
    is_active  = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    fields = relationship(
        "FormField", back_populates="section",
        order_by="FormField.order",
        cascade="all, delete-orphan"
    )


class FormField(Base):
    __tablename__ = "form_fields"
    id          = Column(Integer, primary_key=True, index=True)
    section_id  = Column(Integer, ForeignKey("form_sections.id"), nullable=True)
    field_key   = Column(String, unique=True, index=True, nullable=False)  # e.g. branch_name
    label       = Column(String, nullable=False)
    field_type  = Column(String, nullable=False)  # text|dropdown|number|date|rating|file
    is_required = Column(Boolean, default=False)
    placeholder = Column(String, nullable=True)
    options     = Column(JSONB, nullable=True)     # for dropdown: list of strings
    order       = Column(Integer, default=0)
    is_active   = Column(Boolean, default=True)
    created_at  = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    section = relationship("FormSection", back_populates="fields")
