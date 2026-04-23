import sys
import os

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

def check():
    db = SessionLocal()
    try:
        user = db.query(User).first()
        print(f"SUCCESS: Database query functional. Found first user: {user.email}")
    except Exception as e:
        print(f"FAILURE: Database query still failing: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    check()
