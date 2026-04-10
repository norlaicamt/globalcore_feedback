import psycopg2

DB_URL = "YOUR_DATABASE_URL"

def check():
    try:
        conn = psycopg2.connect(DB_URL)
        cur = conn.cursor()
        cur.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='global_user' AND column_name='deactivated_until';
        """)
        exists = cur.fetchone()
        if exists:
            print("COLUMN_EXISTS")
        else:
            print("COLUMN_MISSING")
        cur.close()
        conn.close()
    except Exception as e:
        print(f"ERROR: {e}")

if __name__ == "__main__":
    check()
