import psycopg2
import os

def migrate():
    # Database connection parameters from app/database.py
    conn = psycopg2.connect(
        dbname="global_core_db",
        user="postgres",
        password="123456",
        host="localhost"
    )
    cur = conn.cursor()

    try:
        # 1. Add parent_id column to replies table
        cur.execute("SELECT 1 FROM information_schema.columns WHERE table_name='replies' AND column_name='parent_id';")
        if not cur.fetchone():
            print("Adding parent_id column to replies table...")
            cur.execute("ALTER TABLE replies ADD COLUMN parent_id INTEGER REFERENCES replies(id);")
            print("Successfully added parent_id to replies table.")
        else:
            print("parent_id column already exists in replies table.")

        conn.commit()
    except Exception as e:
        print(f"Error during migration: {e}")
        conn.rollback()
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    migrate()
