
import sqlite3
import os

db_path = "backend/feedback.db"
if not os.path.exists(db_path):
    print(f"Database {db_path} not found")
else:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT COUNT(*) FROM feedbacks")
        count = cursor.fetchone()[0]
        print(f"Total feedbacks: {count}")
        
        cursor.execute("SELECT id, is_approved, status, created_at FROM feedbacks LIMIT 5")
        rows = cursor.fetchall()
        for row in rows:
            print(f"ID: {row[0]}, Approved: {row[1]}, Status: {row[2]}, Created: {row[3]}")
            
        cursor.execute("SELECT COUNT(*) FROM feedbacks WHERE is_approved = 0")
        unapproved = cursor.fetchone()[0]
        print(f"Unapproved feedbacks: {unapproved}")
        
        cursor.execute("SELECT COUNT(*) FROM feedbacks WHERE is_approved = 1")
        approved = cursor.fetchone()[0]
        print(f"Approved feedbacks: {approved}")
    except sqlite3.OperationalError as e:
        print(f"Error: {e}")
    conn.close()
