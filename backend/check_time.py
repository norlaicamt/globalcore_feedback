import os
import sys
from sqlalchemy.orm import sessionmaker

sys.path.append(os.path.join(os.getcwd(), 'backend'))

from app.database import SessionLocal, engine
from app import models

def run_check():
    db = SessionLocal()
    fb = db.query(models.Feedback).filter(models.Feedback.id == 38).first()
    if fb:
        print(f"Created At: {fb.created_at}")
    else:
        print("Not found")

if __name__ == "__main__":
    run_check()
