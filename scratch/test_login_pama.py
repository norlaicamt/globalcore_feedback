import sys
import os
import bcrypt

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

def test_login(email, password):
    db = SessionLocal()
    user = db.query(User).filter(User.email == email).first()
    if not user:
        print(f"DEBUG: User {email} not found.")
        return
    
    # Check password
    # Assuming password is hashed using bcrypt
    try:
        if bcrypt.checkpw(password.encode('utf-8'), user.password.encode('utf-8')):
            print(f"DEBUG: Login SUCCESS for {email}")
        else:
            print(f"DEBUG: Login FAILED (Invalid Password) for {email}")
    except Exception as e:
        print(f"DEBUG: Error checking password: {e}")
    
    db.close()

if __name__ == "__main__":
    # The user didn't give a password, but I can check if standard one works or just inform them the system is back up.
    # Actually, if they are getting "Invalid email or password", it means the backend DID reply.
    # If the backend crashed, it would probably return 500.
    test_login('pama@user.com', os.getenv("PAMA_PASSWORD")) # Guessing password might be same as username if they just created it
