from sqlalchemy import create_engine, text

DATABASE_URL = "YOUR_DATABASE_URL"
engine = create_engine(DATABASE_URL)

with engine.connect() as conn:
    print("Checking constraints for 'reply_reactions'...")
    res = conn.execute(text("SELECT conname FROM pg_constraint WHERE conrelid = 'reply_reactions'::regclass;"))
    for row in res:
        print(f"Constraint: {row[0]}")
