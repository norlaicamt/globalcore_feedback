from sqlalchemy import create_engine, text

DATABASE_URL = "YOUR_DATABASE_URL"
engine = create_engine(DATABASE_URL)

with engine.connect() as conn:
    print("Migrating Postgres DB (Part 2)...")
    try:
        conn.execute(text("ALTER TABLE feedbacks ADD COLUMN city VARCHAR;"))
        print("Added 'city' column.")
    except Exception as e:
        print(f"'city' column error: {e}")
        
    try:
        conn.execute(text("ALTER TABLE feedbacks ADD COLUMN barangay VARCHAR;"))
        print("Added 'barangay' column.")
    except Exception as e:
        print(f"'barangay' column error: {e}")
        
    conn.commit()
    print("Migration finished.")
