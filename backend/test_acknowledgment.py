from sqlalchemy.orm import Session
from app.database import SessionLocal
from app import models, crud
import json

def test_acknowledgment():
    db = SessionLocal()
    try:
        # 1. Create a dummy broadcast and notification for test
        user_id = 1 # Admin or User
        
        # Check if broadcast exists
        broadcast = db.query(models.BroadcastLog).first()
        if not broadcast:
            # Create one if not exists
            broadcast = models.BroadcastLog(
                subject="Initial Test",
                message="Test Message",
                sent_to_count=1,
                read_count=0
            )
            db.add(broadcast)
            db.commit()
            db.refresh(broadcast)
        
        broadcast_id = broadcast.id
        print(f"Testing for Broadcast ID: {broadcast_id}, Initial Read Count: {broadcast.read_count}")

        # Check for notification
        notif = db.query(models.Notification).filter(
            models.Notification.user_id == user_id,
            models.Notification.broadcast_id == broadcast_id
        ).first()
        
        if not notif:
            # Create one
            notif = models.Notification(
                user_id=user_id,
                actor_id=user_id,
                type=models.NotificationType.ANNOUNCEMENT,
                broadcast_id=broadcast_id,
                is_acknowledged=False
            )
            db.add(notif)
            db.commit()
            db.refresh(notif)
        else:
            # Ensure it's not acknowledged for test
            notif.is_acknowledged = False
            db.commit()

        # 2. Call acknowledgement logic
        print(f"Calling acknowledge_broadcast for user {user_id}...")
        crud.acknowledge_broadcast(db, broadcast_id=broadcast_id, user_id=user_id)
        
        # 3. Verify results
        db.refresh(broadcast)
        db.refresh(notif)
        
        print(f"Final Read Count: {broadcast.read_count}")
        print(f"Notification is_acknowledged: {notif.is_acknowledged}")
        
        if notif.is_acknowledged == True and broadcast.read_count > 0:
            print("\nVERIFICATION SUCCESSFUL: Acknowledge count updated!")
        else:
            print("\nVERIFICATION FAILED: logic error.")

        # 4. Try again (should not increment)
        prev_count = broadcast.read_count
        crud.acknowledge_broadcast(db, broadcast_id=broadcast_id, user_id=user_id)
        db.refresh(broadcast)
        if broadcast.read_count == prev_count:
            print("IDEMPOTENCY SUCCESSFUL: Duplicate clicks ignored.")
        else:
            print("IDEMPOTENCY FAILED: Double counting occurred.")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    test_acknowledgment()
