from app.database import SessionLocal
from app import models
import os
from dotenv import load_dotenv

load_dotenv()

def seed_admin():
    db = SessionLocal()
    email = os.getenv("ADMIN_EMAIL", "admin@globalcore.com")
    password = os.getenv("ADMIN_PASSWORD")
    
    # Check if admin exists
    admin = db.query(models.User).filter(models.User.email == email).first()
    
    if not admin:
        print(f"Creating Global Admin: {email}")
        admin = models.User(
            name="GlobalCore Admin",
            email=email,
            password=password,
            role="superadmin",
            is_active=True,
            onboarding_completed=True
        )
        db.add(admin)
    else:
        print(f"Admin {email} already exists. Ensuring superadmin role and active status.")
        admin.role = "superadmin"
        admin.is_active = True
        admin.password = password # Reset to default if changed
        
    db.commit()
    db.close()
    print("Admin seeding complete.")

if __name__ == "__main__":
    seed_admin()
