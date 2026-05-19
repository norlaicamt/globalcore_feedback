import re
import os

filepath = 'app/models.py'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Add association_proxy import
if 'association_proxy' not in content:
    content = content.replace(
        'from sqlalchemy.orm import relationship, synonym',
        'from sqlalchemy.orm import relationship, synonym\nfrom sqlalchemy.ext.associationproxy import association_proxy'
    )

# The new classes to append before UserContext
new_classes = """

class UserProfile(Base):
    __tablename__ = "user_profiles"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("global_user.id"), unique=True)
    email = Column(String, unique=True, index=True)
    phone = Column(String, index=True, nullable=True)
    first_name = Column(String, nullable=True)
    middle_name = Column(String, nullable=True)
    last_name = Column(String, nullable=True)
    avatar_url = Column(Text, nullable=True)
    id_photo_url = Column(Text, nullable=True)
    citizenship = Column(String, nullable=True)
    marital_status = Column(String, nullable=True)
    company_name = Column(String, nullable=True)
    position_title = Column(String, nullable=True)
    exact_address = Column(String, nullable=True)
    region = Column(String, nullable=True)
    province = Column(String, nullable=True)
    city = Column(String, nullable=True)
    barangay = Column(String, nullable=True)
    birthdate = Column(String, nullable=True)
    birthplace = Column(String, nullable=True)
    profile_completed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    user = relationship("User", back_populates="profile")

class UserSetting(Base):
    __tablename__ = "user_settings"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("global_user.id"), unique=True)
    notify_replies = Column(Boolean, default=True)
    notify_comments = Column(Boolean, default=True)
    notify_mentions = Column(Boolean, default=True)
    notify_likes = Column(Boolean, default=True)
    notify_announcements = Column(Boolean, default=True)
    push_notifications = Column(Boolean, default=True)
    email_notifications = Column(Boolean, default=False)
    weekly_digest = Column(Boolean, default=False)
    daily_summary = Column(Boolean, default=False)
    notify_new_feedback = Column(Boolean, default=True)
    notify_assigned = Column(Boolean, default=True)
    notify_high_activity = Column(Boolean, default=False)
    notify_system_announcements = Column(Boolean, default=True)
    two_factor_enabled = Column(Boolean, default=False)
    biometrics_enabled = Column(Boolean, default=True)
    show_activity_status = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    user = relationship("User", back_populates="settings")

class UserSession(Base):
    __tablename__ = "user_sessions"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("global_user.id"), unique=True)
    session_token = Column(String, nullable=True, index=True)
    last_login = Column(DateTime, nullable=True)
    last_seen = Column(DateTime, nullable=True)
    deactivated_until = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    user = relationship("User", back_populates="session")

class UserModuleContext(Base):
    __tablename__ = "user_module_context"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("global_user.id"), unique=True)
    is_active = Column(Boolean, default=True)
    username = Column(String, unique=True, index=True, nullable=True)
    password = Column(String, nullable=True)
    role = Column(String, default="user")
    role_identity = Column(String, nullable=True)
    is_global_user = Column(Boolean, default=False)
    onboarding_completed = Column(Boolean, default=False)
    current_module = Column(String, nullable=True)
    unit_name = Column(String, nullable=True)
    school = Column(String, nullable=True)
    department = Column(String, nullable=True)
    program = Column(String, nullable=True)
    entity_id = Column(Integer, ForeignKey("entities.id"), nullable=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=True)
    impact_points = Column(Integer, default=0)
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    user = relationship("User", back_populates="module_context")
    organization = relationship("Organization", back_populates="user_contexts")
    entity = relationship("Entity", foreign_keys=[entity_id])
"""

new_user_class = """class User(Base):
    __tablename__ = "global_user"
    id = Column(Integer, primary_key=True, index=True)
    display_name = Column(String, index=True)
    name = synonym("display_name")
    global_id = Column(UUID(as_uuid=True), index=True, unique=True, nullable=False, default=uuid.uuid4)
    external_id = Column(String, index=True, nullable=True)
    source = Column(String, nullable=False, default="local")
    role_context = Column(String, nullable=False, default="citizen")
    attributes = Column(JSONB, nullable=False, default=dict)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # One-to-One Extension Relationships
    profile = relationship("UserProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    settings = relationship("UserSetting", back_populates="user", uselist=False, cascade="all, delete-orphan")
    session = relationship("UserSession", back_populates="user", uselist=False, cascade="all, delete-orphan")
    module_context = relationship("UserModuleContext", back_populates="user", uselist=False, cascade="all, delete-orphan")

    # Proxy properties for UserProfile
    email = association_proxy("profile", "email")
    phone = association_proxy("profile", "phone")
    first_name = association_proxy("profile", "first_name")
    middle_name = association_proxy("profile", "middle_name")
    last_name = association_proxy("profile", "last_name")
    avatar_url = association_proxy("profile", "avatar_url")
    id_photo_url = association_proxy("profile", "id_photo_url")
    citizenship = association_proxy("profile", "citizenship")
    marital_status = association_proxy("profile", "marital_status")
    company_name = association_proxy("profile", "company_name")
    position_title = association_proxy("profile", "position_title")
    exact_address = association_proxy("profile", "exact_address")
    region = association_proxy("profile", "region")
    province = association_proxy("profile", "province")
    city = association_proxy("profile", "city")
    barangay = association_proxy("profile", "barangay")
    birthdate = association_proxy("profile", "birthdate")
    birthplace = association_proxy("profile", "birthplace")
    profile_completed = association_proxy("profile", "profile_completed")

    # Proxy properties for UserSetting
    notify_replies = association_proxy("settings", "notify_replies")
    notify_comments = association_proxy("settings", "notify_comments")
    notify_mentions = association_proxy("settings", "notify_mentions")
    notify_likes = association_proxy("settings", "notify_likes")
    notify_announcements = association_proxy("settings", "notify_announcements")
    push_notifications = association_proxy("settings", "push_notifications")
    email_notifications = association_proxy("settings", "email_notifications")
    weekly_digest = association_proxy("settings", "weekly_digest")
    daily_summary = association_proxy("settings", "daily_summary")
    notify_new_feedback = association_proxy("settings", "notify_new_feedback")
    notify_assigned = association_proxy("settings", "notify_assigned")
    notify_high_activity = association_proxy("settings", "notify_high_activity")
    notify_system_announcements = association_proxy("settings", "notify_system_announcements")
    two_factor_enabled = association_proxy("settings", "two_factor_enabled")
    show_activity_status = association_proxy("settings", "show_activity_status")
    biometrics_enabled = association_proxy("settings", "biometrics_enabled")

    # Proxy properties for UserSession
    session_token = association_proxy("session", "session_token")
    last_login = association_proxy("session", "last_login")
    last_seen = association_proxy("session", "last_seen")
    deactivated_until = association_proxy("session", "deactivated_until")

    # Proxy properties for UserModuleContext
    is_active = association_proxy("module_context", "is_active")
    username = association_proxy("module_context", "username")
    password = association_proxy("module_context", "password")
    role = association_proxy("module_context", "role")
    role_identity = association_proxy("module_context", "role_identity")
    is_global_user = association_proxy("module_context", "is_global_user")
    onboarding_completed = association_proxy("module_context", "onboarding_completed")
    current_module = association_proxy("module_context", "current_module")
    unit_name = association_proxy("module_context", "unit_name")
    school = association_proxy("module_context", "school")
    department = association_proxy("module_context", "department")
    program = association_proxy("module_context", "program")
    entity_id = association_proxy("module_context", "entity_id")
    organization_id = association_proxy("module_context", "organization_id")
    impact_points = association_proxy("module_context", "impact_points")
    completed_at = association_proxy("module_context", "completed_at")
    
    organization = association_proxy("module_context", "organization")
    entity = association_proxy("module_context", "entity")

    # Relationships
    contexts = relationship("UserContext", back_populates="user", cascade="all, delete-orphan")
    feedbacks_sent = relationship("Feedback", foreign_keys="[Feedback.sender_id]", back_populates="sender")
    admin_requests = relationship("AdminRequest", foreign_keys="[AdminRequest.user_id]", back_populates="user", cascade="all, delete-orphan")
"""

# Extract the old User class
start_idx = content.find('class User(Base):')
end_idx = content.find('class AdminRequest(Base):')

old_user_class = content[start_idx:end_idx]

content = content.replace(old_user_class, new_user_class + "\n" + new_classes + "\n")

# Replace Organization.users with user_contexts
content = content.replace(
    'users = relationship("User", back_populates="organization")',
    'user_contexts = relationship("UserModuleContext", back_populates="organization")'
)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated models.py successfully.")
