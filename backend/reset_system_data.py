import sys
import os
from sqlalchemy.orm import Session

# Add the current directory to sys.path to import app modules
sys.path.append(os.getcwd())

from backend.app.database import SessionLocal, engine
from backend.app import models

def reset_data():
    db: Session = SessionLocal()
    print("Starting System Data Reset...")
    
    try:
        # 1. Clear Feedback-related tables
        print("Clearing Feedback, Reactions, and Replies...")
        db.query(models.ReplyReaction).delete()
        db.query(models.Reply).delete()
        db.query(models.Reaction).delete()
        db.query(models.FeedbackMention).delete()
        db.query(models.Notification).delete()
        db.query(models.Feedback).delete()
        
        # 2. Clear Broadcats and Logs
        print("Clearing Broadcasts and Audit Logs...")
        db.query(models.BroadcastLog).delete()
        db.query(models.AuditLog).delete()
        
        # 3. Clear Entities (Departments/Programs)
        print("Resetting Programs/Entities...")
        db.query(models.Department).delete()
        
        # 4. Clear Users (EXCEPT Master Admin)
        print("Removing User Accounts (preserving admin@globalcore.com)...")
        # Keep the global admin
        admin_email = os.getenv("ADMIN_EMAIL", "admin@globalcore.com")
        db.query(models.User).filter(models.User.email != admin_email).delete()
        
        # 5. Reset Admin Stats
        admin = db.query(models.User).filter(models.User.email == admin_email).first()
        if admin:
            print(f"Resetting stats for Master Admin: {admin.name}")
            admin.impact_points = 0
            admin.total_posts = 0 
            admin.department = None
            admin.program = None
        
        db.commit()
        print("SYSTEM RESET COMPLETE. Clean slate achieved.")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error during reset: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    confirm = input("Are you ABSOLUTELY sure you want to delete all data? (y/n): ") if sys.stdin.isatty() else "y"
    if confirm.lower() == 'y':
        reset_data()
    else:
        print("Reset cancelled.")
