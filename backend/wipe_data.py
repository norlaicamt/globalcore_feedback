"""
wipe_data.py — Drop and recreate all tables for a 100% clean start.
NO seeded users, feedbacks, categories, or departments.
"""
from app.database import engine, Base
from app import models
from sqlalchemy.orm import Session

print("🧹 Wiping database...")
Base.metadata.drop_all(bind=engine)

print("🏗️ Re-creating schema...")
Base.metadata.create_all(bind=engine)

print("\n✨ Database is now 100% clean (zero records in all tables).")
