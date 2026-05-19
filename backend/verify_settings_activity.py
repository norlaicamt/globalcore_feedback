import os
import sys
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app import models, crud

def run_test():
    db = SessionLocal()
    try:
        print("Starting settings activity verification...")
        
        # 1. Retrieve the regular/scoped admin
        regular_admin = db.query(models.User).filter(models.User.email.ilike("haina@user.com")).first()
        if not regular_admin:
            print("ERROR: Regular admin haina@user.com not found!")
            return
        print(f"Found regular admin: {regular_admin.name} (Role: {regular_admin.role}, Dept: {regular_admin.department})")

        # 2. Retrieve the Global Admin
        global_admin = db.query(models.User).filter(models.User.email.ilike("admin@globalcore.com")).first()
        if not global_admin:
            print("ERROR: Global admin admin@globalcore.com not found!")
            return
        print(f"Found global admin: {global_admin.name} (Role: {global_admin.role})")

        # 3. Create a simulated settings activity log for the regular admin
        print("Inserting simulated settings activity for regular admin...")
        log_entry = crud.create_audit_log(
            db,
            action_type="update_admin_profile",
            performed_by_id=regular_admin.id,
            target_id=str(regular_admin.id),
            details={"updated_fields": ["position_title", "phone"]}
        )
        db.commit()
        print(f"Simulated log inserted with ID: {log_entry.id}")

        # 4. Run the /profile/activity aggregation query for the Global Admin
        print("\nRunning get_admin_profile_activity query for Global Admin...")
        
        # Fetch the logs exactly like get_admin_profile_activity endpoint
        rows = db.query(models.AuditLog)\
            .outerjoin(models.User, models.AuditLog.performed_by_id == models.User.id)\
            .filter(
                (models.AuditLog.performed_by_id == global_admin.id) |
                (
                    (models.User.role.in_(["admin", "superadmin", "staff"])) & 
                    ((models.User.entity_id != None) | (models.User.organization_id != None) | (models.User.department != None))
                )
            )\
            .order_by(models.AuditLog.timestamp.desc())\
            .limit(10).all()

        print(f"Retrieved {len(rows)} recent actions.")
        
        # 5. Verify the retrieved logs
        found_target_log = False
        for row in rows:
            performer = row.performed_by
            performer_name = performer.name if performer else "System"
            print(f" - [{row.timestamp}] Action: {row.action_type}, Performer: {performer_name} ({row.performed_by_id}), Details: {row.details}")
            
            if row.id == log_entry.id:
                found_target_log = True
                assert performer_name == "Haina T. Miraato", f"Expected performer 'Haina T. Miraato', got '{performer_name}'"
                assert performer.email == "haina@user.com", f"Expected performer email 'haina@user.com', got '{performer.email}'"

        if found_target_log:
            print("\nSUCCESS: Regular admin settings activity was successfully recorded, retrieved by Global Admin query, and contains the correct performer details ('Haina T. Miraato')!")
        else:
            print("\nFAILURE: Simulated log was not returned by the Global Admin's query.")

    except Exception as e:
        print(f"TEST FAILED with error: {type(e).__name__}: {str(e)}")
    finally:
        db.close()

if __name__ == "__main__":
    run_test()
