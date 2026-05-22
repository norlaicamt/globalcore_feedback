import sys
import os
from sqlalchemy.orm import Session
from sqlalchemy import text, inspect
from app.database import engine
from app import models, schemas

def run_audit():
    try:
        inspector = inspect(engine)
        global_user_cols = [c['name'] for c in inspector.get_columns('global_user')]
        
        duplicated_candidates = [
            'email', 'phone', 'first_name', 'last_name', 'middle_name', 'avatar_url',
            'region', 'province', 'city', 'barangay', 'birthdate', 'birthplace'
        ]
        
        present_in_db = [f for f in duplicated_candidates if f in global_user_cols]
        
        print("# Normalization Audit Report")
        print(f"Total Columns in global_user: {len(global_user_cols)}")
        print(f"Identified Duplicated Columns: {present_in_db}")
        
        mismatches = []
        with Session(engine) as db:
            users = db.query(models.User).all()
            print(f"Total Records Tested: {len(users)}")
            
            for u in users:
                if not u.profile:
                    mismatches.append(f"User {u.id}: [CRITICAL] Missing UserProfile")
                    continue
                
                for field in present_in_db:
                    try:
                        raw_val = db.execute(text(f"SELECT {field} FROM global_user WHERE id = :id"), {"id": u.id}).scalar()
                        profile_val = getattr(u.profile, field)
                        
                        if str(raw_val) != str(profile_val):
                            mismatches.append(f"User {u.id} | Field: {field:12} | Raw: {str(raw_val)[:15]}... | Profile: {str(profile_val)[:15]}...")
                    except Exception as e:
                        mismatches.append(f"User {u.id} | Field: {field} | Error: {e}")
            
            print(f"\n## Data Synchronization Issues Found: {len(mismatches)}")
            if mismatches:
                for m in mismatches[:50]:
                    print(f"- {m}")
                if len(mismatches) > 50:
                    print(f"- ... and {len(mismatches)-50} more")
            else:
                print("- [SUCCESS] All synchronized records match perfectly.")
                
        print("\n## Normalization Readiness Summary")
        if not mismatches:
            print("Status: READY. Backend logic can safely transition to relationship-based access.")
        else:
            print("Status: ACTION REQUIRED. Some records are out of sync. A cleanup script should be run before finalized transition.")

    except Exception as e:
        print(f"Audit failed: {e}")

if __name__ == "__main__":
    run_audit()
