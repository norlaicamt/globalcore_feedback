from sqlalchemy import create_engine, text

DATABASE_URL = "YOUR_DATABASE_URL"
engine = create_engine(DATABASE_URL)

with engine.connect() as conn:
    rs = conn.execute(text("SELECT email, password, role FROM global_user WHERE email = 'user@lyka.com'"))
    for row in rs:
        print(f"Email: {row.email}, Password: '{row.password}', Role: {row.role}")
