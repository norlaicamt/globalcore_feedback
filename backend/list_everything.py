from app.database import SessionLocal
from app.models import User, Feedback, Entity, Organization, Department

db = SessionLocal()
try:
    print("--- Users ---")
    users = db.query(User).all()
    for u in users:
        print(f"ID: {u.id}, Name: {u.name}, Email: {u.email}, Role: {u.role}, Entity: {u.entity_id}")

    print("\n--- Feedbacks ---")
    feedbacks = db.query(Feedback).all()
    for f in feedbacks:
        print(f"ID: {f.id}, Title: {f.title}, Sender: {f.sender_id}, Entity: {f.entity_id}")

    print("\n--- Entities ---")
    ents = db.query(Entity).all()
    for e in ents:
        print(f"ID: {e.id}, Name: {e.name}")

finally:
    db.close()
