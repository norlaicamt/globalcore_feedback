from app.database import SessionLocal
from app.models import User, Feedback
from sqlalchemy import func

db = SessionLocal()
try:
    user_count = db.query(User).count()
    feedback_count = db.query(Feedback).count()
    
    print(f"Total Users: {user_count}")
    print(f"Total Feedbacks: {feedback_count}")
    
    print("\nUsers with missing entities:")
    orphaned_users = db.query(User).filter(User.entity_id == None, User.role == "user").all()
    for u in orphaned_users:
        print(f"ID: {u.id}, Name: {u.name}, Email: {u.email}")
        
    print("\nFeedbacks with missing senders:")
    orphaned_feedbacks = db.query(Feedback).filter(~Feedback.sender_id.in_(db.query(User.id))).all()
    for f in orphaned_feedbacks:
        print(f"ID: {f.id}, Title: {f.title}, Sender ID: {f.sender_id}")

    print("\nFeedbacks with missing entities:")
    no_ent_feedbacks = db.query(Feedback).filter(Feedback.entity_id == None).all()
    for f in no_ent_feedbacks:
        print(f"ID: {f.id}, Title: {f.title}")

finally:
    db.close()
