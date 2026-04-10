from sqlalchemy import create_engine, text

DATABASE_URL = "YOUR_DATABASE_URL"
engine = create_engine(DATABASE_URL)

with engine.connect() as conn:
    print("Checking columns of global_user:")
    rs = conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name = 'global_user'"))
    for row in rs:
        print(row.column_name)
