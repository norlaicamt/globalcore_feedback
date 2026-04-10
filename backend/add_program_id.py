import psycopg2
from app.database import DATABASE_URL

def migrate():
    print("Connecting to database...")
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()
    
    try:
        # 1. Add program_id column if it doesn't exist
        print("Adding program_id column to global_user...")
        cur.execute("""
            ALTER TABLE global_user 
            ADD COLUMN IF NOT EXISTS program_id INTEGER REFERENCES categories(id)
        """)
        
        # 2. Fetch categories to map names to IDs
        print("Fetching categories...")
        cur.execute("SELECT id, name FROM categories")
        categories = cur.fetchall()
        cat_map = {name.strip().lower(): cat_id for cat_id, name in categories}
        
        # 3. Migrate existing assignments
        print("Migrating existing assignments...")
        cur.execute("SELECT id, department, program FROM global_user WHERE department IS NOT NULL OR program IS NOT NULL")
        users = cur.fetchall()
        
        migrated_count = 0
        for user_id, dept, prog in users:
            target_name = prog or dept
            if target_name:
                normalized_name = target_name.strip().lower()
                if normalized_name in cat_map:
                    cat_id = cat_map[normalized_name]
                    cur.execute(
                        "UPDATE global_user SET program_id = %s WHERE id = %s",
                        (cat_id, user_id)
                    )
                    migrated_count += 1
        
        conn.commit()
        print(f"Migration complete. Added program_id to {migrated_count} users.")
        
    except Exception as e:
        conn.rollback()
        print(f"Error during migration: {e}")
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    migrate()
