
import sys
import os
from datetime import datetime, timezone, timedelta

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), "backend"))

from app.database import SessionLocal
from app import models, schemas, crud

def test_duplicate_reply():
    db = SessionLocal()
    try:
        # 1. Setup a test feedback
        user = db.query(models.User).first()
        if not user:
            print("No user found")
            return
            
        feedback = db.query(models.Feedback).first()
        if not feedback:
            print("No feedback found")
            return
            
        reply_data = schemas.ReplyCreate(
            feedback_id=feedback.id,
            user_id=user.id,
            message="Test duplicate reply guard",
            parent_id=None
        )
        
        print(f"Creating first reply for user {user.id} on feedback {feedback.id}...")
        r1 = crud.create_reply(db, reply_data)
        print(f"First reply created: ID={r1.id}")
        
        print("Attempting to create identical reply immediately...")
        r2 = crud.create_reply(db, reply_data)
        
        if r1.id == r2.id:
            print("SUCCESS: Duplicate reply detected and prevented (returned existing).")
        else:
            print("FAILURE: Duplicate reply allowed (different IDs).")
            
    finally:
        db.close()

if __name__ == "__main__":
    test_duplicate_reply()
