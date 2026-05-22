import sys
import os
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database import engine
from app import models, crud, schemas

def test_normalization():
    with Session(engine) as db:
        # 1. Find a test user
        user = db.query(models.User).filter(models.User.email != None).first()
        if not user:
            print("No test user found.")
            return

        print(f"Testing User: {user.id} ({user.display_name})")
        old_phone = user.phone
        new_phone = "555-TEST-" + str(user.id)
        
        print(f"  Existing Phone: {old_phone}")
        print(f"  Setting New Phone: {new_phone}")
        
        # 2. Update via CRUD (which uses setattr on the model)
        user.phone = new_phone
        db.commit()
        db.refresh(user)
        
        # 3. Verify via Relationships
        print(f"  Verified Phone (Relationship): {user.profile.phone}")
        
        # 4. Verify via Legacy Column (Raw SQL)
        raw_phone = db.execute(text("SELECT phone FROM global_user WHERE id = :id"), {"id": user.id}).scalar()
        print(f"  Verified Phone (Legacy Column): {raw_phone}")
        
        if user.profile.phone == new_phone and raw_phone == new_phone:
            print("[SUCCESS] Data synchronization verified!")
        else:
            print("[FAILURE] Data mismatch detected!")

        # 5. Cleanup (Restore)
        user.phone = old_phone
        db.commit()
        print("  Cleaned up test data.")

if __name__ == "__main__":
    test_normalization()
