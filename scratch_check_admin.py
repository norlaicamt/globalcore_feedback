from app.database import SessionLocal
from app import models

db = SessionLocal()
admin = db.query(models.User).filter(models.User.email == "admin@globalcore.com").first()
if admin:
    print(f"Admin Found: {admin.email}")
    print(f"Password: {admin.password}")
    print(f"Role: {admin.role}")
else:
    print("Admin not found in DB")
db.close()
