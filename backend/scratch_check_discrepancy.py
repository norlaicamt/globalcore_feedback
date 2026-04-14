from app.database import SessionLocal
from app import models
import json

def check_discrepancy():
    db = SessionLocal()
    try:
        blogs = db.query(models.BroadcastLog).all()
        print(f"Total BroadcastLogs: {len(blogs)}")
        for b in blogs:
            print(f"- ID: {b.id}, Subject: {b.subject}")

        alogs = db.query(models.AuditLog).filter(models.AuditLog.action_type == 'broadcast_created').all()
        print(f"\nTotal AuditLogs (broadcast_created): {len(alogs)}")
        for a in alogs:
            # Audit log details is a dict
            subject = a.details.get('subject') if a.details else "N/A"
            print(f"- TargetIDRef: {a.target_id}, DetailsSubject: {subject}")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    check_discrepancy()
