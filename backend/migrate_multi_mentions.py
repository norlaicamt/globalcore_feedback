import psycopg2

# Database connection details
DB_URL = "YOUR_DATABASE_URL"

def migrate():
    try:
        conn = psycopg2.connect(DB_URL)
        cur = conn.cursor()
        
        print("Migrating to multi-mention system...")
        
        # 1. Create feedback_mentions table
        cur.execute("""
            CREATE TABLE IF NOT EXISTS feedback_mentions (
                id SERIAL PRIMARY KEY,
                feedback_id INTEGER REFERENCES feedbacks(id) ON DELETE CASCADE,
                user_id INTEGER REFERENCES global_user(id) ON DELETE SET NULL,
                employee_name TEXT NOT NULL,
                employee_prefix TEXT
            );
        """)
        
        # 2. Check if mentioned_user_id exists in feedbacks (cleanup)
        cur.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='feedbacks' AND column_name='mentioned_user_id';
        """)
        if cur.fetchone():
            print("Removing legacy mentioned_user_id column...")
            cur.execute("ALTER TABLE feedbacks DROP COLUMN mentioned_user_id;")
            
        conn.commit()
        print("Successfully migrated to multi-mention system.")
            
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error during migration: {e}")

if __name__ == "__main__":
    migrate()
