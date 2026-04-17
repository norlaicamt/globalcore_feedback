from pydantic import BaseModel, ConfigDict, Field
from typing import List, Optional
from datetime import datetime
from app.models import FeedbackStatus, NotificationType

# --- USER SCHEMAS ---
class UserBase(BaseModel):
    name: str
    email: str
    entity_id: Optional[int] = None
    organization_id: Optional[int] = None
    session_token: Optional[str] = None
    is_active: Optional[bool] = True
    is_global_user: Optional[bool] = False
    username: Optional[str] = None
    phone: Optional[str] = None
    first_name: Optional[str] = None
    middle_name: Optional[str] = None
    last_name: Optional[str] = None
    department: Optional[str] = None
    program: Optional[str] = None
    role_identity: Optional[str] = None
    school: Optional[str] = None
    company_name: Optional[str] = None
    position_title: Optional[str] = None
    region: Optional[str] = None
    province: Optional[str] = None
    city: Optional[str] = None
    barangay: Optional[str] = None
    exact_address: Optional[str] = None
    birthdate: Optional[str] = None
    birthplace: Optional[str] = None
    citizenship: Optional[str] = None
    marital_status: Optional[str] = None
    unit_name: Optional[str] = None
    profile_completed: Optional[bool] = False
    completed_at: Optional[datetime] = None
    last_login: Optional[datetime] = None
    onboarding_completed: Optional[bool] = False
    two_factor_enabled: Optional[bool] = False
    role: Optional[str] = "user"
    show_activity_status: Optional[bool] = True
    push_notifications: Optional[bool] = True
    email_notifications: Optional[bool] = False
    notify_replies: Optional[bool] = True
    notify_comments: Optional[bool] = True
    notify_mentions: Optional[bool] = True
    notify_likes: Optional[bool] = True
    notify_announcements: Optional[bool] = True
    weekly_digest: Optional[bool] = False
    daily_summary: Optional[bool] = False
    notify_new_feedback: Optional[bool] = True
    notify_assigned: Optional[bool] = True
    notify_high_activity: Optional[bool] = False
    notify_system_announcements: Optional[bool] = True
    biometrics_enabled: Optional[bool] = True
    avatar_url: Optional[str] = None
    id_photo_url: Optional[str] = None
    deactivated_until: Optional[datetime] = None

class UserCreate(UserBase):
    username: str # Required for new signups
    password: str

class UserUpdate(BaseModel):
    name: Optional[str] = None
    username: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    first_name: Optional[str] = None
    middle_name: Optional[str] = None
    last_name: Optional[str] = None
    department: Optional[str] = None
    program: Optional[str] = None
    role_identity: Optional[str] = None
    school: Optional[str] = None
    company_name: Optional[str] = None
    position_title: Optional[str] = None
    region: Optional[str] = None
    province: Optional[str] = None
    city: Optional[str] = None
    barangay: Optional[str] = None
    exact_address: Optional[str] = None
    birthdate: Optional[str] = None
    birthplace: Optional[str] = None
    citizenship: Optional[str] = None
    marital_status: Optional[str] = None
    unit_name: Optional[str] = None
    profile_completed: Optional[bool] = None
    completed_at: Optional[datetime] = None
    last_login: Optional[datetime] = None
    onboarding_completed: Optional[bool] = None
    password: Optional[str] = None
    two_factor_enabled: Optional[bool] = None
    role: Optional[str] = None
    show_activity_status: Optional[bool] = None
    is_global_user: Optional[bool] = None
    push_notifications: Optional[bool] = None
    email_notifications: Optional[bool] = None
    notify_replies: Optional[bool] = None
    notify_comments: Optional[bool] = None
    notify_mentions: Optional[bool] = None
    notify_likes: Optional[bool] = None
    notify_announcements: Optional[bool] = None
    weekly_digest: Optional[bool] = None
    daily_summary: Optional[bool] = None
    notify_new_feedback: Optional[bool] = None
    notify_assigned: Optional[bool] = None
    notify_high_activity: Optional[bool] = None
    notify_system_announcements: Optional[bool] = None
    biometrics_enabled: Optional[bool] = True
    avatar_url: Optional[str] = None
    id_photo_url: Optional[str] = None
    deactivated_until: Optional[datetime] = None

class UserPasswordUpdate(BaseModel):
    old_password: str
    new_password: str

class ForgotPasswordRequest(BaseModel):
    email: str

class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str

class User(UserBase):
    id: int
    impact_points: float = 0.0
    likes_received: int = 0
    posts_count: int = 0
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class UserSearchEntry(BaseModel):
    id: int
    name: str
    username: Optional[str] = None
    department: Optional[str] = None
    role_identity: Optional[str] = None
    avatar_url: Optional[str] = None
    role: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

class UserProfile(BaseModel):
    id: int
    name: str
    department: Optional[str] = None
    program: Optional[str] = None
    entity_id: Optional[int] = None
    organization_id: Optional[int] = None
    role_identity: Optional[str] = None
    avatar_url: Optional[str] = None
    show_activity_status: Optional[bool] = True
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

# --- ORGANIZATION SCHEMAS ---
class OrganizationBase(BaseModel):
    name: str
    logo_url: Optional[str] = None

class OrganizationCreate(OrganizationBase):
    pass

class OrganizationUpdate(BaseModel):
    name: Optional[str] = None
    logo_url: Optional[str] = None

class Organization(OrganizationBase):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

# --- DEPARTMENT SCHEMAS ---
class DepartmentBase(BaseModel):
    name: str

class DepartmentCreate(DepartmentBase):
    entity_id: Optional[int] = None

class Department(DepartmentBase):
    id: int
    entity_id: Optional[int] = None
    model_config = ConfigDict(from_attributes=True)

# --- ENTITY SCHEMAS ---
class EntityBase(BaseModel):
    name: str
    description: Optional[str] = None
    icon: Optional[str] = None
    fields: Optional[dict] = None # Stores the new FormConfig JSON
    organization_id: Optional[int] = None

class EntityCreate(EntityBase):
    pass

class Entity(EntityBase):
    id: int
    created_at: datetime
    updated_at: datetime
    created_by: Optional[UserSearchEntry] = None
    model_config = ConfigDict(from_attributes=True)

# --- BRANCH SCHEMAS ---
class BranchBase(BaseModel):
    name: str
    entity_id: int
    region: Optional[str] = None
    province: Optional[str] = None
    city: Optional[str] = None
    barangay: Optional[str] = None
    is_active: Optional[bool] = True

class BranchCreate(BranchBase):
    pass

class BranchUpdate(BaseModel):
    name: Optional[str] = None
    entity_id: Optional[int] = None
    region: Optional[str] = None
    province: Optional[str] = None
    city: Optional[str] = None
    barangay: Optional[str] = None
    is_active: Optional[bool] = None

class Branch(BranchBase):
    id: int
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)

# --- REPLY SCHEMAS ---
class ReplyBase(BaseModel):
    message: str
    user_id: int
    parent_id: Optional[int] = None

class ReplyCreate(ReplyBase):
    feedback_id: int
    parent_id: Optional[int] = None

class Reply(ReplyBase):
    id: int
    feedback_id: int
    parent_id: Optional[int] = None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class ReplyWithUser(Reply):
    user: Optional[User] = None
    likes_count: Optional[int] = 0
    dislikes_count: Optional[int] = 0
    user_reaction: Optional[bool] = None

# --- REACTION SCHEMAS ---
class ReplyReactionBase(BaseModel):
    is_like: bool

class ReplyReactionCreate(ReplyReactionBase):
    user_id: int

class ReplyReaction(ReplyReactionBase):
    id: int
    user_id: int
    reply_id: int
    model_config = ConfigDict(from_attributes=True)

class ReactionBase(BaseModel):
    is_like: bool

class ReactionCreate(ReactionBase):
    user_id: int

class Reaction(ReactionBase):
    id: int
    user_id: int
    feedback_id: int
    model_config = ConfigDict(from_attributes=True)

# --- MENTION SCHEMAS ---
class MentionBase(BaseModel):
    employee_name: str
    employee_prefix: Optional[str] = None
    user_id: Optional[int] = None

class MentionCreate(MentionBase):
    pass

class Mention(MentionBase):
    id: int
    feedback_id: int
    model_config = ConfigDict(from_attributes=True)

# --- FEEDBACK SCHEMAS ---
class FeedbackBase(BaseModel):
    title: str
    description: str
    entity_id: int
    recipient_dept_id: Optional[int] = None
    recipient_user_id: Optional[int] = None
    mentions: List[MentionCreate] = []
    allow_comments: Optional[bool] = True
    is_anonymous: Optional[bool] = False
    is_approved: Optional[bool] = True # New moderation flag
    rating: Optional[int] = None # 1-5 stars
    address: Optional[str] = None
    region: Optional[str] = None
    city: Optional[str] = None
    barangay: Optional[str] = None
    employee_name: Optional[str] = None
    product_name: Optional[str] = None
    attachments: Optional[str] = None
    custom_data: Optional[dict] = None # Stores key-value pairs of dynamic fields
    branch_id: Optional[int] = None
    branch_name_snapshot: Optional[str] = None
    manual_location_text: Optional[str] = None
    feedback_type: Optional[str] = None # Complaint, Suggestion, Appreciation, Inquiry

class FeedbackCreate(FeedbackBase):
    sender_id: int

class FeedbackUpdate(BaseModel):
    status: Optional[FeedbackStatus] = None

class FeedbackUpdateFull(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None

class Feedback(FeedbackBase):
    id: int
    sender_id: int
    status: FeedbackStatus
    mentions: List[Mention] = []
    is_approved: bool # Moderation status
    created_at: datetime
    updated_at: Optional[datetime] = None
    address: Optional[str] = None
    city: Optional[str] = None
    barangay: Optional[str] = None
    employee_name: Optional[str] = None
    product_name: Optional[str] = None
    attachments: Optional[str] = None
    custom_data: Optional[dict] = None
    
    # UI Helper fields populated via Joins
    user_name: Optional[str] = None 
    sender_avatar_url: Optional[str] = None
    sender_show_status: Optional[bool] = True
    recipient_dept_name: Optional[str] = None
    recipient_user_name: Optional[str] = None
    entity_name: Optional[str] = None
    branch_name: Optional[str] = None
    likes_count: Optional[int] = 0
    dislikes_count: Optional[int] = 0
    replies_count: Optional[int] = 0
    user_reaction: Optional[bool] = None

class NotificationBase(BaseModel):
    user_id: int
    actor_id: Optional[int] = None
    type: NotificationType
    feedback_id: Optional[int] = None  # Now Optional
    entity_id: Optional[int] = None    # New
    reply_id: Optional[int] = None
    broadcast_id: Optional[int] = None
    broadcast_type: Optional[str] = "announcement"
    priority: Optional[str] = "normal"
    meta: Optional[dict] = None
    is_read: bool = False
    is_acknowledged: bool = False
    require_ack: bool = False

class NotificationCreate(NotificationBase):
    pass

class Notification(NotificationBase):
    id: int
    created_at: datetime
    actor_name: Optional[str] = None
    feedback_title: Optional[str] = None
    reply_message: Optional[str] = None
    message: Optional[str] = None
    subject: Optional[str] = None
    broadcast_type: Optional[str] = "announcement"
    priority: Optional[str] = "normal"

    model_config = ConfigDict(from_attributes=True)

class FeedbackDetail(Feedback):
    sender: Optional[User] = None
    recipient_user: Optional[User] = None
    recipient_dept: Optional[Department] = None
    entity: Optional[Entity] = None
    replies: List[ReplyWithUser] = []
    reactions: List[Reaction] = []

class ActivityEntry(BaseModel):
    id: str
    type: str
    feedback_id: int
    title: Optional[str] = None
    message: Optional[str] = None
    created_at: datetime
    mentions: List[Mention] = []
    rating: Optional[int] = None
    branch_name: Optional[str] = None
    region: Optional[str] = None
    city: Optional[str] = None
    province: Optional[str] = None
    barangay: Optional[str] = None
    entity_name: Optional[str] = None # Added for consistency
    model_config = ConfigDict(from_attributes=True)

class SystemSettingBase(BaseModel):
    key: str
    value: str

class SystemSetting(SystemSettingBase):
    model_config = ConfigDict(from_attributes=True)

class SystemLabelBase(BaseModel):
    key: str
    value: str
    organization_id: Optional[int] = None

class SystemLabelCreate(SystemLabelBase):
    pass

class SystemLabel(SystemLabelBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

class BroadcastLogBase(BaseModel):
    subject: str
    message: str
    broadcast_type: Optional[str] = "announcement"
    priority: Optional[str] = "normal"
    status: Optional[str] = "sent"
    require_ack: Optional[bool] = False
    sent_to_count: int
    read_count: int = 0
    ack_count: int = 0
    scheduled_at: Optional[datetime] = None

class BroadcastLog(BroadcastLogBase):
    id: int
    entity_id: Optional[int] = None
    created_at: datetime
    read_count: Optional[int] = 0
    model_config = ConfigDict(from_attributes=True)
class BroadcastTemplateBase(BaseModel):
    name: str
    title: str
    message: str

class BroadcastTemplateCreate(BroadcastTemplateBase):
    entity_id: Optional[int] = None
    created_by_id: Optional[int] = None

class BroadcastTemplate(BroadcastTemplateBase):
    id: int
    entity_id: Optional[int] = None
    created_by_id: Optional[int] = None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class AuditLogBase(BaseModel):
    action_type: str
    performed_by_id: int
    target_id: Optional[str] = None
    details: Optional[dict] = None

class AuditLog(AuditLogBase):
    id: int
    timestamp: datetime
    performed_by: Optional[UserBase] = None
    model_config = ConfigDict(from_attributes=True)

class FormFieldBase(BaseModel):
    label: str
    field_key: str
    field_type: str  # text|dropdown|number|date|rating|file
    is_required: bool = False
    placeholder: Optional[str] = None
    options: Optional[List[str]] = None
    order: int = 0
    is_active: bool = True
    section_id: Optional[int] = None

class FormFieldCreate(FormFieldBase):
    pass

class FormFieldUpdate(FormFieldBase):
    id: Optional[int] = None

class FormField(FormFieldBase):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class FormSectionBase(BaseModel):
    name: str
    order: int = 0
    is_active: bool = True

class FormSectionCreate(FormSectionBase):
    pass

class FormSectionUpdate(FormSectionBase):
    id: Optional[int] = None
    fields: Optional[List[FormFieldUpdate]] = None

class FormSection(FormSectionBase):
    id: int
    created_at: datetime
    fields: List[FormField] = []
    model_config = ConfigDict(from_attributes=True)
class FormFieldDesigner(BaseModel):
    id: str
    label: str
    type: str
    required: bool = False
    placeholder: Optional[str] = None
    options: Optional[List[str]] = None
    visible_if: Optional[dict] = None # {field: str, equals: str}

class FormSectionDesigner(BaseModel):
    id: Optional[str] = None # Added for linking to steps
    title: str
    fields: List[FormFieldDesigner] = []

class FormItemDesigner(BaseModel):
    type: str # "module", "section"
    key: Optional[str] = None # module key
    section_id: Optional[str] = None

class FormStepDesigner(BaseModel):
    id: str
    label: str
    enabled: bool = True
    order: int = 0
    items: List[FormItemDesigner] = Field(default_factory=list)

class FormTogglesDesigner(BaseModel):
    enabled: bool = True
    label: str

class FormTerminologyDesigner(BaseModel):
    entity_label: Optional[str] = "Program"
    location_label: Optional[str] = "Office"

class FormConfig(BaseModel):
    version: int = 1
    steps: List[FormStepDesigner] = []
    toggles: dict[str, FormTogglesDesigner] = {}
    sections: List[FormSectionDesigner] = []
    terminology: FormTerminologyDesigner = FormTerminologyDesigner()
