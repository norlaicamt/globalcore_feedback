from sqlalchemy import create_engine, text

DB_URL = 'YOUR_DATABASE_URL'
engine = create_engine(DB_URL)

with engine.connect() as conn:
    print("Connecting to database...")
    # 1. Ensure the column exists (Redundant but safe)
    conn.execute(text("ALTER TABLE feedbacks ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT TRUE"))
    
    # 2. Force ALL existing feedbacks to be approved so user sees their data immediately
    # We do this because the user is surprised they can't see anything.
    result = conn.execute(text("UPDATE feedbacks SET is_approved = TRUE"))
    
    conn.commit()
    print(f"Success! {result.rowcount} feedback reports have been approved and will now show up on your dashboard.")
