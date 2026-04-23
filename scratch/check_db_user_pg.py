import sys
import os

# Add the backend directory to sys.path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models import User

import os
from dotenv import load_dotenv
load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)

def check_user(email):
    db = SessionLocal()
    user = db.query(User).filter(User.email == email).first()
    if user:
        print(f"DEBUG: User found: ID={user.id}, Email={user.email}, Username={user.username}, Role={user.role}, OnboardingCompleted={user.onboarding_completed}")
    else:
        print(f"DEBUG: User {email} NOT found.")
    
    # Also list all users for context
    all_users = db.query(User).all()
    print(f"\nDEBUG: Total users in DB: {len(all_users)}")
    for u in all_users:
        print(f"- {u.email} ({u.username})")
    
    db.close()

if __name__ == "__main__":
    check_user('pama@user.com')
