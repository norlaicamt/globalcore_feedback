
import psycopg2
conn = psycopg2.connect('YOUR_DATABASE_URL')
cur = conn.cursor()
cur.execute("SELECT session_token FROM global_user WHERE role IN ('admin', 'superadmin') AND session_token IS NOT NULL LIMIT 1;")
row = cur.fetchone()
if row:
    print(row[0])
else:
    print("No session token found")
conn.close()
