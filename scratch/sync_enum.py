import psycopg2
try:
    conn = psycopg2.connect('YOUR_DATABASE_URL')
    conn.autocommit = True
    cursor = conn.cursor()
    
    # Check current values
    cursor.execute("SELECT enumlabel FROM pg_enum JOIN pg_type ON pg_enum.enumtypid = pg_type.oid WHERE typname = 'notificationtype'")
    current = [r[0] for r in cursor.fetchall()]
    print(f"Current enum values: {current}")
    
    for val in ['NEW_FEEDBACK', 'ASSIGNED', 'new_feedback', 'assigned']:
        if val not in current:
            print(f"Adding {val}...")
            cursor.execute(f"ALTER TYPE notificationtype ADD VALUE '{val}'")
            
    conn.close()
    print("Enum sync complete.")
except Exception as e:
    print(f"Error: {e}")
