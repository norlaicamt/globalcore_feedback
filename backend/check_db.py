import os
from dotenv import load_dotenv
load_dotenv('.env')

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models import Feedback

DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)
db = SessionLocal()

feedbacks = db.query(Feedback).order_by(Feedback.id.desc()).limit(5).all()

for fb in feedbacks:
    print(f"Feedback ID: {fb.id}")
    print(f"Custom Data: {fb.custom_data}")
    print("---")
