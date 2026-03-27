# reset_and_seed_db.py
from sqlalchemy import text
from sqlalchemy.orm import Session
from app.database import engine, SessionLocal, Base
from app import models
from app.models import User, Department, Category, Feedback, Reply, FeedbackStatus
from datetime import datetime, timezone

# Step 1: Drop all tables with CASCADE
from sqlalchemy import text
with engine.connect() as conn:
    for table in ["replies", "feedbacks", "categories", "departments", "global_user"]:
        conn.execute(text(f"DROP TABLE IF EXISTS {table} CASCADE"))
    conn.commit()
print("All tables dropped.")

print("All tables dropped.")

# Step 2: Create all tables
Base.metadata.create_all(bind=engine)
print("All tables created.")

# Step 3: Seed test data
db: Session = SessionLocal()
try:
    # Users
    user1 = User(name="Test User", email="testuser@example.com")
    user2 = User(name="Recipient User", email="recipient@example.com")
    db.add_all([user1, user2])
    db.commit()
    db.refresh(user1)
    db.refresh(user2)
    print(f"Inserted users: {user1.name}, {user2.name}")

    # Department
    dept = Department(name="IT")
    db.add(dept)
    db.commit()
    db.refresh(dept)
    print(f"Inserted department: {dept.name}")

    # Category
    cat = Category(name="Bug Report", description="Report a bug in the system")
    db.add(cat)
    db.commit()
    db.refresh(cat)
    print(f"Inserted category: {cat.name}")

    # Feedback
    feedback = Feedback(
        title="Sample Feedback",
        description="This is a sample feedback",
        sender_id=user1.id,
        recipient_user_id=user2.id,
        recipient_dept_id=dept.id,
        category_id=cat.id,
        status=FeedbackStatus.OPEN
    )
    db.add(feedback)
    db.commit()
    db.refresh(feedback)
    print(f"Inserted feedback: {feedback.title}")

    # Reply
    reply = Reply(
        feedback_id=feedback.id,
        user_id=user2.id,
        message="This is a sample reply",
        created_at=datetime.now(timezone.utc)
    )
    db.add(reply)
    db.commit()
    db.refresh(reply)
    print(f"Inserted reply by {user2.name}")

finally:
    db.close()
    print("Database seeding complete.")