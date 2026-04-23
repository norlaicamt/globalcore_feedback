import psycopg2
from psycopg2.extras import RealDictCursor
import os
from dotenv import load_dotenv
load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

def check_global_flag():
    conn = psycopg2.connect(DATABASE_URL)
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    cursor.execute("SELECT id, name, email, role, is_global_user, entity_id FROM global_user")
    users = cursor.fetchall()
    for u in users:
        print(u)
    conn.close()

if __name__ == "__main__":
    check_global_flag()
