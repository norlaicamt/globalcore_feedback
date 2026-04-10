from sqlalchemy.orm import Session
from app.database import SessionLocal
from app import models
import uuid
from datetime import datetime, timezone

def simulate_admin_login(email, password):
    db = SessionLocal()
    try:
        user = db.query(models.User).filter(models.User.email == email).first()
        if not user:
            print("User not found")
            return
        
        print(f"User found: {user.email}, Role: {user.role}, Password: {user.password}")
        
        if user.password == password:
            if user.role in ["admin", "superadmin"]:
                print("Role check passed")
                token = str(uuid.uuid4())
                print(f"Setting session_token to {token}...")
                user.session_token = token
                user.last_login = datetime.now(timezone.utc)
                db.commit()
                print("Commit successful!")
                print(f"Token in DB: {user.session_token}")
            else:
                print(f"Access denied: role is {user.role}")
        else:
            print("Invalid password")
    except Exception as e:
        print(f"Error occurred: {type(e).__name__}: {str(e)}")
    finally:
        db.close()

if __name__ == "__main__":
    simulate_admin_login("user@lyka.com", "YOUR_ADMIN_PASSWORD")
