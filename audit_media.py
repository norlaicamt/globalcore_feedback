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
        users = db.query(models.User).filter(models.User.avatar_url != None).limit(5).all()
        for user in users:
            print(f"User ID: {user.id}")
            print(f"Legacy Avatar: {user._legacy_avatar_url}")
            print(f"Normalized Avatar: {user.profile.avatar_url if user.profile else 'No Profile'}")
            print(f"Effective Avatar: {user.avatar_url}")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    audit_media()
