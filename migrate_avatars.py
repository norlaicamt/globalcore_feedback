import sys
import os
import base64
import uuid
import re
sys.path.append(os.path.join(os.getcwd(), "backend"))

from sqlalchemy.orm import Session
from app.database import SessionLocal
from app import models

# Config
UPLOADS_DIR = "backend/uploads/avatars"
os.makedirs(UPLOADS_DIR, exist_ok=True)

def migrate_avatars():
    db: Session = SessionLocal()
    try:
        print("Scanning for Base64 avatars...")
        # Check UserProfile
        profiles = db.query(models.UserProfile).filter(models.UserProfile.avatar_url.like("data:image/%")).all()
        print(f"Found {len(profiles)} profiles with Base64 avatars.")
        
        for p in profiles:
            try:
                # Extract data from data:image/xxx;base64,yyyy
                header, data = p.avatar_url.split(',', 1)
                match = re.search(r"image/([a-zA-Z]+)", header)
                ext = match.group(1) if match else "png"
                if ext.lower() in ['jpeg', 'jpg']: ext = 'jpg'
                else: ext = ext.lower()
                
                filename = f"user_{p.user_id}_{uuid.uuid4().hex[:8]}.{ext}"
                file_path = os.path.join(UPLOADS_DIR, filename)
                
                # Decode and save
                image_data = base64.b64decode(data)
                with open(file_path, "wb") as f:
                    f.write(image_data)
                
                # Update DB
                p.avatar_url = f"/uploads/avatars/{filename}"
                print(f"Migrated User {p.user_id} -> {filename} (Size: {len(image_data)} bytes)")
                
            except Exception as e:
                print(f"Error migrating User {p.user_id}: {e}")
        
        # Check global_user table (legacy columns)
        users = db.query(models.User).filter(models.User._legacy_avatar_url.like("data:image/%")).all()
        print(f"Found {len(users)} users with legacy Base64 avatars.")
        for u in users:
            try:
                header, data = u._legacy_avatar_url.split(',', 1)
                ext = header.split('/')[1].split(';')[0]
                if ext == 'jpeg': ext = 'jpg'
                
                filename = f"user_{u.id}_legacy_{uuid.uuid4().hex[:8]}.{ext}"
                file_path = os.path.join(UPLOADS_DIR, filename)
                
                image_data = base64.b64decode(data)
                with open(file_path, "wb") as f:
                    f.write(image_data)
                
                u._legacy_avatar_url = f"/uploads/avatars/{filename}"
                print(f"Migrated Legacy User {u.id} -> {filename}")
            except Exception as e:
                print(f"Error migrating Legacy User {u.id}: {e}")

        db.commit()
        print("Migration complete and committed.")
        
    except Exception as e:
        print(f"Migration failed: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    migrate_avatars()
