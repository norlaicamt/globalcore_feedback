# app/test_db.py
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database import engine, SessionLocal, Base # Added app. prefix
from app import models
from app.models import User, Department, Category, Feedback, Reply, FeedbackStatus # Added app. prefix
from datetime import datetime, timezone

# Step 1: Test DB connection
try:
    with engine.connect() as conn:
        result = conn.execute(text("SELECT 1"))
        print("Database connection successful! Result:", result.scalar())
except Exception as e:
    print("Error connecting to database:", e)
    exit(1)

# Step 2: Create tables
Base.metadata.create_all(bind=engine)
print("Tables are ready.")

# Step 3: Insert test data
db: Session = SessionLocal()

try:
    # Add test users
    if not db.query(User).filter(User.email == "testuser@example.com").first():
        user1 = User(name="Test User", email="testuser@example.com")
        user2 = User(name="Recipient User", email="recipient@example.com")
        db.add_all([user1, user2])
        db.commit()
        db.refresh(user1)
        db.refresh(user2)
        print(f"Inserted users: {user1.name}, {user2.name}")

    # Add test department
    if not db.query(Department).filter(Department.name == "IT").first():
        dept = Department(name="IT")
        db.add(dept)
        db.commit()
        db.refresh(dept)
        print(f"Inserted department: {dept.name}")

    # Add test category
    if not db.query(Category).filter(Category.name == "Bug Report").first():
        cat = Category(name="Bug Report", description="Report a bug in the system")
        db.add(cat)
        db.commit()
        db.refresh(cat)
        print(f"Inserted category: {cat.name}")

    # Refresh local variables from DB
    user1 = db.query(User).filter(User.email == "testuser@example.com").first()
    user2 = db.query(User).filter(User.email == "recipient@example.com").first()
    dept = db.query(Department).filter(Department.name == "IT").first()
    cat = db.query(Category).filter(Category.name == "Bug Report").first()

    # Add test feedback only if all dependencies exist
    if all([user1, user2, dept, cat]) and not db.query(Feedback).first():
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

        # Add a reply
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