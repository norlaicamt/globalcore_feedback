from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv

load_dotenv()

# Use the environment variable or fallback to the known development URL
DATABASE_URL = os.getenv("DATABASE_URL", "YOUR_DATABASE_URL")

engine = create_engine(DATABASE_URL)

def run_migration():
    print(f"Connecting to database at {DATABASE_URL}...")
    with engine.connect() as conn:
        try:
            print("Verifying 'fields' column in 'categories' table...")
            conn.execute(text("ALTER TABLE categories ADD COLUMN IF NOT EXISTS fields JSONB;"))
            
            print("Verifying 'custom_data' column in 'feedbacks' table...")
            conn.execute(text("ALTER TABLE feedbacks ADD COLUMN IF NOT EXISTS custom_data JSONB;"))
            
            print("Verifying 'impact_points' column in 'global_user' table...")
            conn.execute(text("ALTER TABLE global_user ADD COLUMN IF NOT EXISTS impact_points INTEGER DEFAULT 0;"))
            
            conn.commit()
            print("✅ Migration successful! Columns 'fields', 'custom_data', and 'impact_points' verified.")
        except Exception as e:
            print(f"❌ Error during migration: {e}")

if __name__ == "__main__":
    run_migration()
