import psycopg2
from datetime import datetime, timezone

# Database connection details
DB_URL = "YOUR_DATABASE_URL"

def migrate():
    try:
        conn = psycopg2.connect(DB_URL)
        cur = conn.cursor()
        
        print("Checking for created_at column in global_user table...")
        
        # Check if created_at exists
        cur.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='global_user' AND column_name='created_at';
        """)
        
        if not cur.fetchone():
            print("Adding created_at column...")
            cur.execute("ALTER TABLE global_user ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;")
            conn.commit()
            print("Successfully added created_at column.")
        else:
            print("created_at column already exists.")
            
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error during migration: {e}")

if __name__ == "__main__":
    migrate()
