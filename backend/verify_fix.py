from app.database import SessionLocal
from app import crud
import json

def verify():
    db = SessionLocal()
    try:
        # Get last 5 feedbacks
        feedbacks = crud.get_feedbacks(db, limit=5)
        print(f"Found {len(feedbacks)} feedbacks")
        for fb in feedbacks:
            print(f"ID: {fb.id}, Title: {fb.title}, Category Name: {fb.category_name}")
            # Verify if category_name is present
            if hasattr(fb, 'category_name'):
                print(f"  [SUCCESS] category_name exists: {fb.category_name}")
            else:
                print(f"  [FAILURE] category_name missing")
    finally:
        db.close()

if __name__ == "__main__":
    verify()
