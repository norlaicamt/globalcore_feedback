from sqlalchemy.orm import Session
from app.database import SessionLocal
from app import models
import uuid
from datetime import datetime, timezone

def simulate_admin_login(email, password):
    db = SessionLocal()
    try:
        # TESTING CASE-INSENSITIVITY
        print(f"Testing case-insensitive lookup for: {email}")
        user = db.query(models.User).filter(models.User.email.ilike(email)).first()
        if not user:
            print("User not found")
            return
        
        print(f"User found: {user.email}, Role: {user.role}, Password matched: {user.password == password}")
        
        if user.password == password:
            if user.role in ["admin", "superadmin"]:
                print("SUCCESS: Login logic passed for mixed-case email.")
            else:
                print(f"Access denied: role is {user.role}")
        else:
            print("Invalid password")
    except Exception as e:
        print(f"Error occurred: {type(e).__name__}: {str(e)}")
    finally:
        db.close()

if __name__ == "__main__":
    # Test with mixed case email
    simulate_admin_login("User@Lyka.com", os.getenv("ADMIN_PASSWORD"))
