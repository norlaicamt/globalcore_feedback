import sqlite3
import os

db_path = "global_feedback.db"
if os.path.exists(db_path):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    try:
        cursor.execute("ALTER TABLE notifications ADD COLUMN message TEXT;")
        conn.commit()
        print("Successfully added message column to notifications table.")
    except sqlite3.OperationalError as e:
        print(f"Column already exists: {e}")
    finally:
        conn.close()
else:
    print("Database file not found.")
