from sqlalchemy import create_engine, text

DATABASE_URL = "YOUR_DATABASE_URL"
engine = create_engine(DATABASE_URL)

with engine.connect() as conn:
    print("Feedbacks in DB:")
    rs = conn.execute(text("SELECT id, title, department, category_id, is_approved FROM feedbacks LIMIT 20"))
    for row in rs:
        print(f"ID: {row.id}, Title: {row.title}, Dept: {row.department}, CatID: {row.category_id}, Approved: {row.is_approved}")
