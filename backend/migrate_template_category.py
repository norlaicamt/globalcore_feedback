from sqlalchemy import create_engine, text
import os

import os
from dotenv import load_dotenv
load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)

def run_migration():
    with engine.connect() as conn:
        print("Starting Broadcast Template Category Migration...")
        
        try:
            conn.execute(text("ALTER TABLE broadcast_templates ADD COLUMN category VARCHAR DEFAULT 'advisory'"))
            conn.commit()
            print("Successfully added category column to broadcast_templates.")
        except Exception as e:
            if "already exists" in str(e):
                print("category column already exists in broadcast_templates.")
            else:
                print(f"Error adding category: {e}")

        print("\nMigration Complete.")

if __name__ == "__main__":
    run_migration()
