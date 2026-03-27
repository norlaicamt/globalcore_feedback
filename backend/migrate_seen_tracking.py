import psycopg2
import os

# Hardcoded DB URL from database.py
DB_URL = "YOUR_DATABASE_URL"

def migrate():
    conn = None
    try:
        print(f"Connecting to database...")
        conn = psycopg2.connect(DB_URL)
        cur = conn.cursor()
        
        # Add column broadcast_id to notifications table
        print("Adding broadcast_id column to notifications table...")
        cur.execute("ALTER TABLE notifications ADD COLUMN IF NOT EXISTS broadcast_id INTEGER;")
        
        # Optional: Add index for performance in read counts
        print("Creating index on broadcast_id...")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_notifications_broadcast_id ON notifications(broadcast_id);")
        
        conn.commit()
        print("✅ Database migration successful.")
    except Exception as e:
        if conn:
            conn.rollback()
        print(f"❌ Migration error: {e}")
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    migrate()
