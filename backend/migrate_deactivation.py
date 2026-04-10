import psycopg2
import os

# Database connection details
DB_URL = "YOUR_DATABASE_URL"

def migrate():
    try:
        conn = psycopg2.connect(DB_URL)
        cur = conn.cursor()
        
        print("Checking for deactivated_until column in global_user table...")
        
        # Check if deactivated_until exists
        cur.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='global_user' AND column_name='deactivated_until';
        """)
        
        if not cur.fetchone():
            print("Adding deactivated_until column...")
            # Using DATE or TIMESTAMP depending on requirements. 
            # I used date in models.py (Date in sqlalchemy), so DATE here.
            cur.execute("ALTER TABLE global_user ADD COLUMN deactivated_until DATE;")
            conn.commit()
            print("Successfully added deactivated_until column.")
        else:
            print("deactivated_until column already exists.")
            
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error during migration: {e}")

if __name__ == "__main__":
    migrate()
