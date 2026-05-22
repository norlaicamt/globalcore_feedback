import sys
import os
from sqlalchemy.orm import Session
from sqlalchemy import text, inspect
from app.database import engine
from app import models, schemas

def run_audit():
    inspector = inspect(engine)
    global_user_cols = [c['name'] for c in inspector.get_columns('global_user')]
    
    # Fields hypothesized to be duplicated
    duplicated_candidates = [
        'email', 'phone', 'first_name', 'last_name', 'middle_name', 'avatar_url',
        'region', 'province', 'city', 'barangay', 'birthdate', 'birthplace'
    ]
    
    present_in_db = [f for f in duplicated_candidates if f in global_user_cols]
    
    print("# Normalization Audit Report")
    print(f"Total Columns in global_user: {len(global_user_cols)}")
    print(f"Identified Duplicated Columns: {present_in_db}")
    print("\n## Data Synchronization Check (Samples)")
    
    with Session(engine) as db:
        # Check a few records for synchronization
        users = db.query(models.User).limit(10).all()
        for u in users:
            print(f"\nUser ID: {u.id} ({u.display_name})")
            if u.profile:
                for field in present_in_db:
                    # We need to get the raw value from the table, not the proxy!
                    # SQLAlchemy proxies might mask the difference
                    raw_val = db.execute(text(f"SELECT {field} FROM global_user WHERE id = :id"), {"id": u.id}).scalar()
                    profile_val = getattr(u.profile, field)
                    status = "MATCH" if str(raw_val) == str(profile_val) else "MISMATCH"
                    print(f"  - {field:15}: Raw={raw_val}, Profile={profile_val} [{status}]")
            else:
                print("  - [WARNING] No UserProfile found!")

if __name__ == "__main__":
    run_audit()
