import sqlite3
import os
import psycopg2
from psycopg2.extras import RealDictCursor

# Since we found it's PostgreSQL in database.py
import os
from dotenv import load_dotenv
load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

def check_users():
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        cursor.execute("SELECT id, name, email, role, department, entity_id, is_active FROM global_user")
        users = cursor.fetchall()
        print(f"Total Users Found: {len(users)}")
        for u in users:
            print(u)
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_users()
