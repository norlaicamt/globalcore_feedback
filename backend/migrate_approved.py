from sqlalchemy import create_engine, text

DB_URL = 'YOUR_DATABASE_URL'
engine = create_engine(DB_URL)

with engine.connect() as conn:
    # Set all existing feedbacks to approved so they show up in the feed
    result = conn.execute(text("UPDATE feedbacks SET is_approved = TRUE WHERE is_approved IS NULL"))
    conn.commit()
    print(f"Migration successful. {result.rowcount} legacy rows approved.")
