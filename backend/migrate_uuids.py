import os
import sys
import uuid
from dotenv import load_dotenv

# Load env variables
load_dotenv('.env')

# Add parent directory to path to import app modules
sys.path.append(os.getcwd())

from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session
from app.models import User

def run_migration():
    DATABASE_URL = os.getenv("DATABASE_URL")
    if not DATABASE_URL:
        print("Error: DATABASE_URL not found in environment.")
        return
        
    engine = create_engine(DATABASE_URL)
    
    print("--------------------------------------------------")
    print("STEP 1: Backfilling NULL global_ids for existing users...")
    print("--------------------------------------------------")
    
    with Session(engine) as session:
        # Fetch users with NULL global_id
        users_to_backfill = session.query(User).filter(User.global_id.is_(None)).all()
        print(f"Found {len(users_to_backfill)} users with NULL global_id.")
        
        updated_count = 0
        for user in users_to_backfill:
            new_uuid = uuid.uuid4()
            user.global_id = new_uuid
            print(f"Generated UUID {new_uuid} for User ID {user.id} ({user.display_name or user.email})")
            updated_count += 1
            
        if updated_count > 0:
            session.commit()
            print(f"Successfully committed {updated_count} user updates.")
        else:
            print("No users needed backfilling.")

    print("\n--------------------------------------------------")
    print("STEP 2: Upgrading global_id index to UNIQUE...")
    print("--------------------------------------------------")
    
    with engine.connect() as conn:
        # Check if there are any duplicate global_ids (should be 0 now)
        dup_check = conn.execute(text("""
            SELECT global_id, COUNT(*) 
            FROM global_user 
            WHERE global_id IS NOT NULL 
            GROUP BY global_id 
            HAVING COUNT(*) > 1;
        """)).fetchall()
        
        if dup_check:
            print("Error: Duplicate global_ids detected! Cannot create unique index.")
            for row in dup_check:
                print(f"Duplicate UUID: {row[0]} (Count: {row[1]})")
            return
            
        print("No duplicate global_ids found. Proceeding to update database index.")
        
        # Drop the old index if it exists
        print("Dropping old non-unique index 'ix_global_user_global_id'...")
        conn.execute(text("DROP INDEX IF EXISTS ix_global_user_global_id;"))
        
        # Create a new unique index
        print("Creating new UNIQUE index 'ix_global_user_global_id' on global_user(global_id)...")
        conn.execute(text("CREATE UNIQUE INDEX ix_global_user_global_id ON global_user(global_id);"))
        
        conn.commit()
        print("Database index successfully updated to UNIQUE.")
        
    print("\n--------------------------------------------------")
    print("Migration Completed Successfully!")
    print("--------------------------------------------------")

if __name__ == "__main__":
    run_migration()
