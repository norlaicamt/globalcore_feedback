import sys
import os
sys.path.append(os.path.join(os.getcwd(), "backend"))

from sqlalchemy.orm import Session
from app.database import SessionLocal
from app import models
import json

def audit_media():
    db: Session = SessionLocal()
    try:
        print("Auditing Feedback Media...")
        feedbacks = db.query(models.Feedback).filter(models.Feedback.custom_data.has_key('photo_upload')).limit(5).all()
        for fb in feedbacks:
            print(f"Feedback ID: {fb.id}")
            print(f"Custom Data: {json.dumps(fb.custom_data, indent=2)}")
            
        print("\nAuditing User Avatars...")
        users = db.query(models.User).filter(models.User.avatar_url != None).all()
        for user in users:
            url = user.avatar_url
            is_malformed = url.endswith('.jpgg') or '.jpg' not in url and '.png' not in url and 'data:image' not in url
            if is_malformed or 'data:image' in url:
                print(f"User ID: {user.id}")
                print(f"URL: {url}")
                if is_malformed:
                    print("Status: MALFORMED EXTENSION OR PATH")
                if 'data:image' in url:
                    print("Status: BASE64 DETECTED")
                print("-" * 20)

    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    audit_media()
