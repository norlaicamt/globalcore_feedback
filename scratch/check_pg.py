
import psycopg2
from psycopg2.extras import RealDictCursor

try:
    conn = psycopg2.connect("YOUR_DATABASE_URL")
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    cur.execute("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';")
    tables = cur.fetchall()
    print("Tables:", [t['table_name'] for t in tables])
    
    if 'workflow_templates' in [t['table_name'] for t in tables]:
        cur.execute("SELECT * FROM workflow_templates;")
        rows = cur.fetchall()
        print(f"Found {len(rows)} templates.")
        for row in rows:
            print(row)
    else:
        print("Table workflow_templates NOT found!")
        
    conn.close()
except Exception as e:
    print(f"Error: {e}")
