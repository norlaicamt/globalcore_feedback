
import sqlite3
import json

try:
    conn = sqlite3.connect('backend/app.db')
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = cursor.fetchall()
    print("Tables:", tables)
    
    cursor.execute("SELECT * FROM workflow_templates")
    rows = cursor.fetchall()
    colnames = [description[0] for description in cursor.description]
    print("Columns:", colnames)
    for row in rows:
        print(row)
    conn.close()
except Exception as e:
    print(f"Error: {e}")
