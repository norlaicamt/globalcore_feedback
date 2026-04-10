from sqlalchemy import create_engine, text

DATABASE_URL = "YOUR_DATABASE_URL"
engine = create_engine(DATABASE_URL)

with engine.connect() as conn:
    rs = conn.execute(text("SELECT email, role, is_active FROM global_user"))
    for row in rs:
        print(f"Email: {row.email}, Role: {row.role}, IsActive: {row.is_active}")
