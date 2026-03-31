from sqlalchemy import create_engine, text

DB_URL = 'YOUR_DATABASE_URL'
engine = create_engine(DB_URL)

with engine.connect() as conn:
    print("Connecting to database...")
    # 1. Add the column if it doesn't exist
    conn.execute(text("ALTER TABLE feedbacks ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT TRUE"))
    
    # 2. Update existing NULLs to TRUE so they show up in the feed
    result = conn.execute(text("UPDATE feedbacks SET is_approved = TRUE WHERE is_approved IS NULL"))
    
    conn.commit()
    print(f"Migration successful. Column added and {result.rowcount} legacy rows approved.")
