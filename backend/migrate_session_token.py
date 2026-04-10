import psycopg2
from psycopg2 import sql

def migrate():
    try:
        # Connection parameters
        conn = psycopg2.connect(
            dbname="global_core_db",
            user="postgres",
            password="123456",
            host="localhost",
            port="5432"
        )
        conn.autocommit = True
        cur = conn.cursor()

        print("Checking for session_token column in global_user table...")
        
        # Check if column exists
        cur.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'global_user' AND column_name = 'session_token'
        """)
        
        if not cur.fetchone():
            print("Adding session_token column...")
            cur.execute("ALTER TABLE global_user ADD COLUMN session_token VARCHAR")
            print("Creating index for session_token...")
            cur.execute("CREATE INDEX ix_global_user_session_token ON global_user (session_token)")
            print("Migration successful: session_token column added.")
        else:
            print("session_token column already exists.")

        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error during migration: {e}")

if __name__ == "__main__":
    migrate()
