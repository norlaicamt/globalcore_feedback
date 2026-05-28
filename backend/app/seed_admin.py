import os
import sys

# Add the current directory and parent directory to sys.path to handle module imports
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

from sqlalchemy.orm import Session
from app.database import engine, Base
from app.models import User, UserProfile, UserModuleContext, UserSetting, UserSession

def seed_admin():
    print("Checking Database Schema...")
    # This ensure all tables exist before we try to query
    Base.metadata.create_all(bind=engine)
    
    db = Session(engine)
    try:
        # Check if admin already exists by looking at UserProfile email
        existing_profile = db.query(UserProfile).filter(UserProfile.email == "admin@globalcore.com").first()
        if existing_profile:
            print("Admin user (admin@globalcore.com) already exists. Skipping.")
            return

        print("Creating Superadmin user...")
        
        # 1. Base User Record
        admin = User(display_name="System Admin")
        db.add(admin)
        db.flush() # Get the admin.id
        
        # 2. Add Profile (Email)
        admin.profile = UserProfile(
            user_id=admin.id,
            email="admin@globalcore.com",
            first_name="System",
            last_name="Admin"
        )
        
        # 3. Add Module Context (Auth & Role)
        admin.module_context = UserModuleContext(
            user_id=admin.id,
            username="admin",
            password="admin123", # Plain text as per current system design
            role="superadmin",
            is_active=True
        )
        
        # 4. Add Settings & Session
        admin.settings = UserSetting(user_id=admin.id)
        admin.session = UserSession(user_id=admin.id)
        
        db.commit()
        print("Success: Admin user created (admin@globalcore.com / admin123)")
    except Exception as e:
        print(f"Error seeding admin: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_admin()
