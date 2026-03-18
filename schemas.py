from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from datetime import datetime
from models import FeedbackStatus

# User Schemas
class UserBase(BaseModel):
    name: str
    email: str
    is_active: Optional[bool] = True

class UserCreate(UserBase):
    pass

class User(UserBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

# Department Schemas
class DepartmentBase(BaseModel):
    name: str

class DepartmentCreate(DepartmentBase):
    pass

class Department(DepartmentBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

# Category Schemas
class CategoryBase(BaseModel):
    name: str
    description: Optional[str] = None

class CategoryCreate(CategoryBase):
    pass

class Category(CategoryBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

# Reply Schemas
class ReplyBase(BaseModel):
    message: str
    user_id: int

class ReplyCreate(ReplyBase):
    feedback_id: int

class Reply(ReplyBase):
    id: int
    feedback_id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class ReplyWithUser(Reply):
    user: Optional[User] = None

# Feedback Schemas
class FeedbackBase(BaseModel):
    title: str
    description: str
    category_id: int
    sender_id: int
    status: Optional[FeedbackStatus] = FeedbackStatus.OPEN

class FeedbackCreate(FeedbackBase):
    recipient_user_id: Optional[int] = None
    recipient_dept_id: Optional[int] = None

class FeedbackUpdate(BaseModel):
    status: Optional[FeedbackStatus] = None

class Feedback(FeedbackBase):
    id: int
    recipient_user_id: Optional[int] = None
    recipient_dept_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)

class FeedbackDetail(Feedback):
    sender: Optional[User] = None
    recipient_user: Optional[User] = None
    recipient_dept: Optional[Department] = None
    category: Optional[Category] = None
    replies: List[ReplyWithUser] = []