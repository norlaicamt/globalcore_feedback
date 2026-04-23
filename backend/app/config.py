import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Config:
    DATABASE_URL = os.getenv("DATABASE_URL")
    ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "admin@globalcore.com")
    ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD")
    SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-this")

if not Config.DATABASE_URL:
    # Fallback for local development if .env is missing, 
    # but we should avoid hardcoding secrets here.
    # In production, this MUST be set.
    pass
