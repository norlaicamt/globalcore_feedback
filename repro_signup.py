
import os
import sys

# Add current directory to path
sys.path.append(os.getcwd())

from app.database import SessionLocal, Base, engine
from app import models, schemas
import uuid
from sqlalchemy.orm import Session

def repro():
    # 1. Create a dummy UserCreate schema
    user_data = {
        "name": "Test User",
        "email": f"test_{uuid.uuid4().hex[:6]}@example.com",
        "username": f"user_{uuid.uuid4().hex[:6]}",
        "password": "password123",
        "display_name": "Test User (Display)"  # Both name and display_name
    }
    user_create = schemas.UserCreate(**user_data)
    data = user_create.model_dump()
    
    print(f"Data fields: {list(data.keys())}")
    
    db = SessionLocal()
    try:
        print("Attempting models.User(**data)...")
        db_user = models.User(**data)
        db.add(db_user)
        db.commit()
        print("Success!")
    except Exception as e:
        print(f"Caught expected error: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    repro()
