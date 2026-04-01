import psycopg2

# Database connection details
DB_URL = "YOUR_DATABASE_URL"

def migrate():
    try:
        conn = psycopg2.connect(DB_URL)
        cur = conn.cursor()
        
        print("Checking for mentioned_user_id column in feedbacks table...")
        
        # Check if mentioned_user_id exists
        cur.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='feedbacks' AND column_name='mentioned_user_id';
        """)
        
        if not cur.fetchone():
            print("Adding mentioned_user_id column...")
            cur.execute("ALTER TABLE feedbacks ADD COLUMN mentioned_user_id INTEGER REFERENCES global_user(id);")
            conn.commit()
            print("Successfully added mentioned_user_id column.")
        else:
            print("mentioned_user_id column already exists.")
            
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error during migration: {e}")

if __name__ == "__main__":
    migrate()
