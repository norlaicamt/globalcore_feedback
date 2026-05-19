from app.database import engine
from sqlalchemy import text
import sys

def run_migration():
    try:
        with engine.connect() as conn:
            print("Adding columns to user_profiles table...")
            conn.execute(text('ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS pending_email VARCHAR'))
            conn.execute(text('ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS pending_phone VARCHAR'))
            conn.execute(text('ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS email_verification_token VARCHAR'))
            conn.execute(text('ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS phone_verification_code VARCHAR'))
            conn.execute(text('ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS verification_expires_at TIMESTAMP'))
            conn.commit()
            print("Migration successful! Verification columns added to user_profiles.")
    except Exception as e:
        print(f"Error during migration: {e}")
        sys.exit(1)

if __name__ == "__main__":
    run_migration()
