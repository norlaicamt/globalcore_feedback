import sqlite3
import os

db_path = "backend/app/sql_app.db"
if not os.path.exists(db_path):
    print(f"DB not found at {db_path}")
    exit(1)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()
cursor.execute("SELECT count(*) FROM global_user")
count = cursor.fetchone()[0]
print(f"Total Users: {count}")

cursor.execute("SELECT id, name, email, role, department FROM global_user LIMIT 10")
users = cursor.fetchall()
print("\nFirst 10 Users:")
for u in users:
    print(u)

conn.close()
