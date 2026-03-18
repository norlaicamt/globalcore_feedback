from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, Boolean, Enum
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from database import Base
import enum

class FeedbackStatus(str, enum.Enum):
    OPEN = "OPEN"
    IN_PROGRESS = "IN_PROGRESS"
    RESOLVED = "RESOLVED"
    CLOSED = "CLOSED"

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    is_active = Column(Boolean, default=True)

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
    
    sender_id = Column(Integer, ForeignKey("users.id"))
    recipient_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    recipient_dept_id = Column(Integer, ForeignKey("departments.id"), nullable=True)
    category_id = Column(Integer, ForeignKey("categories.id"))
    
    status = Column(Enum(FeedbackStatus), default=FeedbackStatus.OPEN)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    sender = relationship("User", foreign_keys=[sender_id])
    recipient_user = relationship("User", foreign_keys=[recipient_user_id])
    recipient_dept = relationship("Department")
    category = relationship("Category")
    replies = relationship("Reply", back_populates="feedback")

class Reply(Base):
    __tablename__ = "replies"
    id = Column(Integer, primary_key=True, index=True)
    feedback_id = Column(Integer, ForeignKey("feedbacks.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    message = Column(Text)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    feedback = relationship("Feedback", back_populates="replies")
    user = relationship("User")