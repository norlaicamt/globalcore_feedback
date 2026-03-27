from sqlalchemy import create_engine, text

DATABASE_URL = "YOUR_DATABASE_URL"
engine = create_engine(DATABASE_URL)

with engine.connect() as conn:
    print("Migrating global_user table...")
    columns = [
        ("push_notifications", "BOOLEAN DEFAULT TRUE"),
        ("email_notifications", "BOOLEAN DEFAULT FALSE"),
        ("status_updates", "BOOLEAN DEFAULT TRUE"),
        ("reply_notifications", "BOOLEAN DEFAULT TRUE"),
        ("weekly_digest", "BOOLEAN DEFAULT FALSE"),
        ("biometrics_enabled", "BOOLEAN DEFAULT TRUE")
    ]
    for col_name, col_type in columns:
        try:
            conn.execute(text(f"ALTER TABLE global_user ADD COLUMN IF NOT EXISTS {col_name} {col_type};"))
            print(f"Column '{col_name}' added/verified.")
        except Exception as e:
            print(f"Error adding {col_name}: {e}")
    conn.commit()
    print("Migration finished.")
