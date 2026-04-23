import psycopg2

import os
from dotenv import load_dotenv
load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

def migrate():
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()
        
        # Check if column exists
        cur.execute("SELECT column_name FROM information_schema.columns WHERE table_name='notifications' AND column_name='reply_id'")
        if cur.fetchone():
            print("Column reply_id already exists in notifications table.")
        else:
            cur.execute("ALTER TABLE notifications ADD COLUMN reply_id INTEGER REFERENCES replies(id)")
            conn.commit()
            print("Successfully added reply_id to notifications table.")
        
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error during migration: {e}")

if __name__ == "__main__":
    migrate()
