import sys
import os
from sqlalchemy.orm import Session
from datetime import datetime, timezone

# Add backend to path to import models and database
sys.path.append(os.getcwd())

from app.database import SessionLocal
from app.models import Category, Department, Feedback

def migrate():
    db: Session = SessionLocal()
    try:
        print("Starting hierarchy refactoring...")
        
        # 1. Create the generic "Program" category if it doesn't exist
        program_cat = db.query(Category).filter(Category.name == "Program").first()
        if not program_cat:
            print("Creating 'Program' category...")
            program_cat = Category(
                name="Program",
                description="General governmental and social programs.",
                icon="📋"
            )
            db.add(program_cat)
            db.commit()
            db.refresh(program_cat)
        else:
            print(f"'Program' category already exists (ID: {program_cat.id})")

        # 2. Identify old categories to migrate
        old_cat_names = ["Tara, Basa! Program", "Walang Gutom Program"]
        old_cats = db.query(Category).filter(Category.name.in_(old_cat_names)).all()
        
        for old_cat in old_cats:
            print(f"Migrating category '{old_cat.name}' to Department...")
            
            # Clean name for entity (remove ' Program' suffix if present)
            entity_name = old_cat.name.replace(" Program", "").strip()
            
            # Check if department already exists
            dept = db.query(Department).filter(Department.name == entity_name, Department.category_id == program_cat.id).first()
            if not dept:
                print(f"Creating department '{entity_name}' under 'Program'...")
                dept = Department(
                    name=entity_name,
                    category_id=program_cat.id
                )
                db.add(dept)
                db.commit()
                db.refresh(dept)
            else:
                print(f"Department '{entity_name}' already exists (ID: {dept.id})")

            # 3. Update Feedbacks linked to this old category
            feedbacks = db.query(Feedback).filter(Feedback.category_id == old_cat.id).all()
            print(f"Found {len(feedbacks)} feedbacks to re-link for '{old_cat.name}'")
            
            for fb in feedbacks:
                fb.category_id = program_cat.id
                fb.recipient_dept_id = dept.id
                print(f"  Updated Feedback ID {fb.id}: Set Category={program_cat.id}, Dept={dept.id}")
            
            db.commit()
            
            # 4. Delete the old category now that it's redundant
            print(f"Deleting redundant category '{old_cat.name}'...")
            db.delete(old_cat)
            db.commit()

        print("Refactoring complete!")

    except Exception as e:
        db.rollback()
        print(f"Error during migration: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    migrate()
