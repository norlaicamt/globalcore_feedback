import sys
import os
from datetime import datetime, timezone
from sqlalchemy.orm import Session

# Add the current directory to sys.path to import app modules
sys.path.append(os.getcwd())

from backend.app.database import SessionLocal, engine
from backend.app import models

def seed_demo_data():
    db: Session = SessionLocal()
    print("🚀 Starting Demo Data Restoration...")

    try:
        # 1. Ensure Organization exists
        org = db.query(models.Organization).filter(models.Organization.name == "GlobalCore").first()
        if not org:
            print("Creating GlobalCore Organization...")
            org = models.Organization(name="GlobalCore")
            db.add(org)
            db.flush()

        # 2. Create Entities (Programs)
        entities_data = [
            {"name": "4Ps", "description": "Pantawid Pamilyang Pilipino Program", "icon": "Building"},
            {"name": "KALAHI-CIDSS", "description": "Community empowerment program", "icon": "Resort"},
            {"name": "Walang Gutom Program", "description": "Food stamp program", "icon": "Food"},
            {"name": "Tara, Basa! Program", "description": "Literacy and education support", "icon": "Inbox"},
        ]
        
        seeded_entities = {}
        for ent_info in entities_data:
            ent = db.query(models.Entity).filter(models.Entity.name == ent_info["name"]).first()
            if not ent:
                print(f"Creating Entity: {ent_info['name']}")
                ent = models.Entity(
                    name=ent_info["name"],
                    description=ent_info["description"],
                    icon=ent_info["icon"],
                    organization_id=org.id,
                    fields=[]
                )
                db.add(ent)
                db.flush()
            seeded_entities[ent_info["name"]] = ent

        # 3. Create Departments
        depts_data = [
            {"name": "Social Services", "entity": "4Ps"},
            {"name": "Finance", "entity": "4Ps"},
            {"name": "Community Support", "entity": "KALAHI-CIDSS"},
        ]
        
        seeded_depts = {}
        for dept_info in depts_data:
            entity = seeded_entities[dept_info["entity"]]
            dept = db.query(models.Department).filter(
                models.Department.name == dept_info["name"],
                models.Department.entity_id == entity.id
            ).first()
            if not dept:
                print(f"Creating Department: {dept_info['name']} under {dept_info['entity']}")
                dept = models.Department(name=dept_info["name"], entity_id=entity.id)
                db.add(dept)
                db.flush()
            seeded_depts[f"{dept_info['name']}_{dept_info['entity']}"] = dept

        # 4. Create Demo Users
        users_data = [
            {
                "email": "testuser@example.com",
                "name": "Juan Dela Cruz",
                "role": "user",
                "password": "password123",
                "department": "Social Services",
                "program": "4Ps",
                "entity_id": seeded_entities["4Ps"].id,
                "onboarding_completed": True
            },
            {
                "email": "admin@4ps.com",
                "name": "Maria Admin",
                "role": "admin",
                "password": "password123",
                "department": "Social Services",
                "program": "4Ps",
                "entity_id": seeded_entities["4Ps"].id,
                "onboarding_completed": True
            }
        ]
        
        for user_info in users_data:
            user = db.query(models.User).filter(models.User.email == user_info["email"]).first()
            if not user:
                print(f"Creating User: {user_info['name']} ({user_info['email']})")
                user = models.User(
                    email=user_info["email"],
                    name=user_info["name"],
                    role=user_info["role"],
                    password=user_info["password"], # In production, hash this
                    department=user_info["department"],
                    program=user_info["program"],
                    entity_id=user_info["entity_id"],
                    organization_id=org.id,
                    onboarding_completed=user_info["onboarding_completed"],
                    is_active=True
                )
                db.add(user)
                db.flush()

        # 5. Seed initial Feedback (to make the dashboard alive)
        tester = db.query(models.User).filter(models.User.email == "testuser@example.com").first()
        if tester:
            feedback_count = db.query(models.Feedback).filter(models.Feedback.sender_id == tester.id).count()
            if feedback_count == 0:
                print("Seeding sample feedback...")
                sample_feedback = models.Feedback(
                    title="Great Service at 4Ps Office",
                    description="The staff was very helpful with my application today. Smooth process!",
                    sender_id=tester.id,
                    entity_id=seeded_entities["4Ps"].id,
                    recipient_dept_id=seeded_depts["Social Services_4Ps"].id,
                    status=models.FeedbackStatus.OPEN,
                    is_approved=True,
                    rating=5,
                    city="Manila",
                    region="NCR",
                    created_at=datetime.now(timezone.utc)
                )
                db.add(sample_feedback)

        db.commit()
        print("✅ Demo Data Restored Successfully!")

    except Exception as e:
        db.rollback()
        print(f"❌ Error during seeding: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    seed_demo_data()
