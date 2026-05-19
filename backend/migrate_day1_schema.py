import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from app.database import Base
from app import models

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)

def migrate():
    # 1. Create the new tables defined in models
    print("Creating new extension tables...")
    Base.metadata.create_all(engine)
    print("Tables created.")

    # 2. Migrate data safely using raw SQL
    with engine.connect() as conn:
        print("Migrating User Profiles...")
        conn.execute(text("""
            INSERT INTO user_profiles (
                user_id, email, phone, first_name, middle_name, last_name, 
                avatar_url, id_photo_url, citizenship, marital_status, 
                company_name, position_title, exact_address, region, province, 
                city, barangay, birthdate, birthplace, profile_completed,
                created_at, updated_at
            )
            SELECT 
                id, email, phone, first_name, middle_name, last_name,
                avatar_url, id_photo_url, citizenship, marital_status,
                company_name, position_title, exact_address, region, province,
                city, barangay, birthdate, birthplace, COALESCE(profile_completed, false),
                COALESCE(created_at, NOW()), NOW()
            FROM global_user
            ON CONFLICT (user_id) DO NOTHING;
        """))

        print("Migrating User Settings...")
        conn.execute(text("""
            INSERT INTO user_settings (
                user_id, notify_replies, notify_comments, notify_mentions, notify_likes, 
                notify_announcements, push_notifications, email_notifications, 
                weekly_digest, daily_summary, notify_new_feedback, notify_assigned, 
                notify_high_activity, notify_system_announcements, two_factor_enabled, 
                show_activity_status, biometrics_enabled, created_at, updated_at
            )
            SELECT 
                id, COALESCE(notify_replies, true), COALESCE(notify_comments, true), 
                COALESCE(notify_mentions, true), COALESCE(notify_likes, true),
                COALESCE(notify_announcements, true), COALESCE(push_notifications, true), 
                COALESCE(email_notifications, false), COALESCE(weekly_digest, false), 
                COALESCE(daily_summary, false), COALESCE(notify_new_feedback, true), 
                COALESCE(notify_assigned, true), COALESCE(notify_high_activity, false), 
                COALESCE(notify_system_announcements, true), COALESCE(two_factor_enabled, false),
                COALESCE(show_activity_status, true), COALESCE(biometrics_enabled, true),
                COALESCE(created_at, NOW()), NOW()
            FROM global_user
            ON CONFLICT (user_id) DO NOTHING;
        """))

        print("Migrating User Sessions...")
        conn.execute(text("""
            INSERT INTO user_sessions (
                user_id, session_token, last_login, last_seen, deactivated_until, 
                created_at, updated_at
            )
            SELECT 
                id, session_token, last_login, last_seen, deactivated_until,
                COALESCE(created_at, NOW()), NOW()
            FROM global_user
            ON CONFLICT (user_id) DO NOTHING;
        """))

        print("Migrating User Module Context...")
        conn.execute(text("""
            INSERT INTO user_module_context (
                user_id, is_active, username, password, role, role_identity, 
                is_global_user, onboarding_completed, current_module, unit_name, 
                school, department, program, entity_id, organization_id, 
                impact_points, completed_at, created_at, updated_at
            )
            SELECT 
                id, COALESCE(is_active, true), username, password, role, role_identity,
                COALESCE(is_global_user, false), COALESCE(onboarding_completed, false), current_module, unit_name,
                school, department, program, entity_id, organization_id,
                COALESCE(impact_points, 0), completed_at, COALESCE(created_at, NOW()), NOW()
            FROM global_user
            ON CONFLICT (user_id) DO NOTHING;
        """))
        
        conn.commit()
    print("Migration complete.")

if __name__ == "__main__":
    migrate()
