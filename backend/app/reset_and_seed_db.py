# reset_and_seed_db.py
from sqlalchemy import text
from sqlalchemy.orm import Session
from app.database import engine, SessionLocal, Base
from app import models
from app.models import User, Department, Organization, Entity, Feedback, Reply, FeedbackStatus
from datetime import datetime, timezone

# Step 1: Drop all tables with CASCADE
with engine.connect() as conn:
    for table in ["replies", "notifications", "reactions", "reply_reactions", "feedback_mentions", 
                  "audit_logs", "broadcast_logs", "system_labels", "system_settings", 
                  "form_fields", "form_sections", "feedbacks", "departments", 
                  "entities", "global_user", "organizations"]:
        conn.execute(text(f"DROP TABLE IF EXISTS {table} CASCADE"))
    conn.commit()
print("All tables dropped.")

# Step 2: Create all tables
Base.metadata.create_all(bind=engine)
print("All tables created.")

# Step 3: Seed test data
db: Session = SessionLocal()
try:
    # 1. Organization
    org = Organization(name="DSWD", logo_url="https://example.com/dswd-logo.png")
    db.add(org)
    db.commit()
    db.refresh(org)
    print(f"Inserted organization: {org.name}")

    # 2. Entity
    ent = Entity(
        name="4Ps", 
        description="Pantawid Pamilyang Pilipino Program", 
        icon="📋",
        organization_id=org.id
    )
    db.add(ent)
    db.commit()
    db.refresh(ent)
    print(f"Inserted entity: {ent.name}")

    # 3. Users
    user1 = User(
        name="Test User", 
        email="testuser@example.com", 
        password="password123",
        role="user",
        organization_id=org.id,
        entity_id=ent.id
    )
    user2 = User(
        name="4Ps Admin", 
        email="admin@4ps.com", 
        password="YOUR_ADMIN_PASSWORD",
        role="admin",
        organization_id=org.id,
        entity_id=ent.id
    )
    # Superadmin
    superadmin = User(
        name="Global Admin",
        email="admin@globalcore.com",
        password="YOUR_ADMIN_PASSWORD",
        role="superadmin"
    )
    
    db.add_all([user1, user2, superadmin])
    db.commit()
    db.refresh(user1)
    db.refresh(user2)
    print(f"Inserted users: {user1.name}, {user2.name}, {superadmin.name}")

    # 4. Department
    dept = Department(name="Monitoring & Evaluation", entity_id=ent.id)
    db.add(dept)
    db.commit()
    db.refresh(dept)
    print(f"Inserted department: {dept.name}")

    # 5. Feedback
    feedback = Feedback(
        title="4Ps: Sample Feedback",
        description="This is a sample feedback for the 4Ps program",
        sender_id=user1.id,
        recipient_user_id=user2.id,
        recipient_dept_id=dept.id,
        entity_id=ent.id,
        status=FeedbackStatus.OPEN
    )
    db.add(feedback)
    db.commit()
    db.refresh(feedback)
    print(f"Inserted feedback: {feedback.title}")

    # 6. Reply
    reply = Reply(
        feedback_id=feedback.id,
        user_id=user2.id,
        message="This is a sample reply from the admin",
        created_at=datetime.now(timezone.utc)
    )
    db.add(reply)
    db.commit()
    db.refresh(reply)
    print(f"Inserted reply by {user2.name}")

finally:
    db.close()
    print("Database seeding complete.")