from sqlalchemy.orm import Session
from app.database import SessionLocal
from app import models, crud
import json

def test_broadcast():
    db = SessionLocal()
    try:
        # Get an admin (Superadmin ID=1)
        admin = db.query(models.User).filter(models.User.id == 1).first()
        if not admin:
            print("Superadmin not found")
            return

        print(f"Testing broadcast from admin: {admin.email}")
        
        # Simulate broadcast parameters
        subject = "Test Broadcast Refined"
        message = "This is a test broadcast to verify bulk insert and scoping."
        broadcast_type = "announcement"
        target_group = "all"
        
        # Get users (simulated logic from admin.py)
        users = db.query(models.User).all()
        print(f"Found {len(users)} users for broadcast.")

        # Create broadcast log
        official_subject = f"[OFFICIAL] SYSTEM - {subject}"
        broadcast_log = crud.create_broadcast_log(
            db, 
            subject=official_subject, 
            message=message, 
            count=len(users),
            entity_id=None
        )
        print(f"Broadcast Log created with ID: {broadcast_log.id}")

        # Prepare Bulk Notifications
        notifications = []
        for user in users:
            notifications.append(models.Notification(
                user_id=user.id,
                actor_id=admin.id,
                type=models.NotificationType.ANNOUNCEMENT,
                feedback_id=None,
                entity_id=None,
                subject=official_subject,
                message=message,
                broadcast_id=broadcast_log.id,
                broadcast_type=broadcast_type
            ))
        
        print("Executing bulk insert...")
        crud.create_notifications_bulk(db, notifications)
        print("Bulk insert completed.")

        # Verify last notification
        last_notif = db.query(models.Notification).order_by(models.Notification.id.desc()).first()
        print(f"Last Notification: ID={last_notif.id}, Actor={last_notif.actor_id}, Type={last_notif.type}, FeedbackID={last_notif.feedback_id}, EntityID={last_notif.entity_id}")
        
        if last_notif.actor_id == admin.id and last_notif.feedback_id is None:
            print("VERIFICATION SUCCESSFUL: Constraints respected and attribution correct.")
        else:
            print("VERIFICATION FAILED: Data mismatch.")

    except Exception as e:
        print(f"Error during test: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    test_broadcast()
