import sys
import os
sys.path.append(os.getcwd())

from app.database import SessionLocal
from app import models

db = SessionLocal()
try:
    users = db.query(models.User).all()
    print(f"Total Users: {len(users)}")
    for user in users:
        print(f"User: {user.name} ({user.email})")
except Exception as e:
    print(f"Error connecting to database: {e}")
finally:
    db.close()
