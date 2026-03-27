from sqlalchemy import create_engine, text

DATABASE_URL = "YOUR_DATABASE_URL"
engine = create_engine(DATABASE_URL)

with engine.connect() as conn:
    print("Migrating Postgres DB (Part 4)...")
    try:
        conn.execute(text("ALTER TABLE feedbacks ADD COLUMN region VARCHAR;"))
        print("Added 'region' column.")
    except Exception as e:
        print(f"'region' column error: {e}")
        
    conn.commit()
    print("Migration finished.")
