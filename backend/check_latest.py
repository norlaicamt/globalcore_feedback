import os
import json
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models import Feedback

import sys
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from app.database import SessionLocal, engine
from app import models

def run_check():
    db = SessionLocal()
    # Get the latest feedback
    fb = db.query(models.Feedback).order_by(models.Feedback.id.desc()).first()
    if not fb:
        print("No feedbacks found")
        return
        
    print(f"Latest Feedback ID: {fb.id}")
    print(f"Custom Data: {json.dumps(fb.custom_data, indent=2)}")

if __name__ == "__main__":
    run_check()
