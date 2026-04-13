"""
Verify that a KALAHI admin (admin@kalahi.com) can now retrieve their scoped feedback.
"""
from app.database import SessionLocal
from app import models
from app.routers.admin import apply_data_scope, has_global_admin_access
from sqlalchemy import func

db = SessionLocal()

try:
    # Simulate the KALAHI admin user
    admin = db.query(models.User).filter(models.User.email.ilike("admin@kalahi.com")).first()
    print(f"Admin: {admin.email}, Role: {admin.role}, Program ID: {admin.program_id}")
    print(f"Has global access: {has_global_admin_access(admin)}")

    # Reproduce the query from admin_get_feedbacks with the fix applied
    q = db.query(
        models.Feedback.id, models.Feedback.title,
        models.Category.name.label("category_name"),
        func.count(models.Reply.id).label("comments_count")
    ).outerjoin(models.User, models.Feedback.sender_id == models.User.id)\
     .outerjoin(models.Category, models.Feedback.category_id == models.Category.id)\
     .outerjoin(models.Department, models.Feedback.recipient_dept_id == models.Department.id)\
     .outerjoin(models.Reply, models.Reply.feedback_id == models.Feedback.id)\
     .group_by(models.Feedback.id, models.User.name, models.Category.name, models.Department.name)

    # Apply the new scoping fix
    q = apply_data_scope(q, models.Feedback, admin)

    rows = q.all()
    print(f"\nFeedbacks visible to KALAHI admin: {len(rows)}")
    for r in rows:
        print(f"  ID: {r.id}, Title: {r.title}, Category: {r.category_name}")

    if len(rows) == 0:
        print("\n⚠️  Still no results. Check program_id on the admin account.")
    else:
        print("\n✅ Fix confirmed! Feedbacks are now visible.")

except Exception as e:
    print(f"Error: {type(e).__name__}: {e}")
finally:
    db.close()
