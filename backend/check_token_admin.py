from sqlalchemy import create_engine, text

DATABASE_URL = "YOUR_DATABASE_URL"
engine = create_engine(DATABASE_URL)

with engine.connect() as conn:
    rs = conn.execute(text("SELECT email, session_token, last_login FROM global_user WHERE email = 'admin@globalcore.com'"))
    for row in rs:
        print(f"Email: {row.email}, Token: {row.session_token}, LastLogin: {row.last_login}")
