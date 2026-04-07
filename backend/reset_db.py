"""
reset_db.py — Drop all tables and re-create them, then seed test data.
Run from the backend directory with the venv active:
  python reset_db.py
"""
from app.database import engine, Base
from app import models  # ensure all models are imported so metadata is populated

print("Dropping all tables...")
Base.metadata.drop_all(bind=engine)

print("Re-creating all tables with updated schema...")
Base.metadata.create_all(bind=engine)

# --- SEED ---
from sqlalchemy.orm import Session
db = Session(bind=engine)

# Departments
depts = ["Information Technology", "Human Resources", "Finance", "Operations", "Marketing"]
for d in depts:
    db.add(models.Department(name=d))
db.commit()

# Categories
cats = [
    ("Departmental", "Feedback for a department"),
    ("Individual", "Feedback for a colleague"),
    ("General", "Open suggestions"),
]
for name, desc in cats:
    db.add(models.Category(name=name, description=desc))
db.commit()

# Users (with new fields)
users = [
    models.User(name="Alice Reyes", email="alice@company.com", username="alice_r", phone="+63 917 111 0001", department="IT", password="pass123", role="user"),
    models.User(name="Bob Santos", email="bob@company.com", username="bob_s", phone="+63 917 111 0002", department="HR", password="pass123", role="user"),
    models.User(name="Carla Mendoza", email="carla@company.com", username="carla_m", phone="+63 917 111 0003", department="Finance", password="pass123", role="user"),
]
for u in users:
    db.add(u)
db.commit()

it_dept = db.query(models.Department).filter_by(name="Information Technology").first()
dept_cat = db.query(models.Category).filter_by(name="Departmental").first()
gen_cat  = db.query(models.Category).filter_by(name="General").first()
alice    = db.query(models.User).filter_by(email="alice@company.com").first()
bob      = db.query(models.User).filter_by(email="bob@company.com").first()

# Sample Feedbacks
fb1 = models.Feedback(
    title="IT Support Response Time",
    description="The IT helpdesk has been significantly faster this quarter. Great work from the whole team!",
    sender_id=alice.id,
    recipient_dept_id=it_dept.id,
    category_id=dept_cat.id,
    allow_comments=True,
    is_anonymous=False,
)
fb2 = models.Feedback(
    title="Suggestion: Flexible Break Times",
    description="Team morale would benefit from flexible 15-minute break windows throughout the day.",
    sender_id=bob.id,
    recipient_dept_id=it_dept.id,
    category_id=gen_cat.id,
    allow_comments=True,
    is_anonymous=False,
)
db.add(fb1)
db.add(fb2)
db.commit()

print("\nDatabase reset and seeded successfully!")
print(f"Users:  {[u.name for u in db.query(models.User).all()]}")
print(f"Feedbacks: {db.query(models.Feedback).count()}")
db.close()
