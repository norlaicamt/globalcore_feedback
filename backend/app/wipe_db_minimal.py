# wipe_db_minimal.py
from sqlalchemy import text
from sqlalchemy.orm import Session
from app.database import engine, SessionLocal, Base
from app import models
from app.models import User
import uuid
from datetime import datetime, timezone

def wipe_and_minimal_seed():
    print("Starting Truly Blank Reset...")
    
    # 1. Drop all tables with CASCADE
    with engine.connect() as conn:
        tables = [
            "replies", "notifications", "reactions", "reply_reactions", "feedback_mentions", 
            "audit_logs", "broadcast_logs", "system_labels", "system_settings", 
            "form_fields", "form_sections", "feedbacks", "departments", 
            "entities", "global_user", "organizations"
        ]
        for table in tables:
            conn.execute(text(f"DROP TABLE IF EXISTS {table} CASCADE"))
        conn.commit()
    print("All tables dropped.")

    # 2. Create all tables
    Base.metadata.create_all(bind=engine)
    print("All tables created.")

    # 3. Seed ONLY the superadmin
    db: Session = SessionLocal()
    try:
        superadmin = User(
            name="Global Admin",
            email="admin@globalcore.com",
            password="YOUR_ADMIN_PASSWORD", # Plain text as per current system design for this demo/dev environment
            role="superadmin",
            is_active=True,
            onboarding_completed=True
        )
        db.add(superadmin)
        db.commit()
        db.refresh(superadmin)
        print(f"Minimal seed complete: Created {superadmin.name} ({superadmin.email})")
        
        # Initialize default system labels (empty values or generic)
        defaults = [
            ("category_label", "Entity / Service"),
            ("entity_label", "Entity"),
            ("category_label_plural", "Entities / Services"),
            ("entity_label_plural", "Entities"),
            ("dept_label", "Department"),
            ("dept_label_plural", "Departments"),
            ("feedback_label", "Feedback"),
            ("feedback_label_plural", "Feedbacks")
        ]
        for k, v in defaults:
            db.add(models.SystemLabel(key=k, value=v))
        db.commit()
        print("Standard system terminology initialized.")

    except Exception as e:
        db.rollback()
        print(f"Error during minimal seed: {e}")
    finally:
        db.close()
    
    print("--- RESET COMPLETE ---")
    print("System is now blank and ready for fresh data.")

if __name__ == "__main__":
    wipe_and_minimal_seed()
