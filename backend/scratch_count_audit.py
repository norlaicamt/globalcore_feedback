from app.database import SessionLocal
from app import models

db = SessionLocal()
count = db.query(models.AuditLog).count()
print(f"Total Audit Logs: {count}")
if count > 0:
    first_few = db.query(models.AuditLog).limit(5).all()
    for log in first_few:
        print(f"Log ID: {log.id}, Action: {log.action_type}, Performed By: {log.performed_by_id}, Details: {log.details}")
db.close()
