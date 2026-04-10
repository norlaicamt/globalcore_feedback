from sqlalchemy import create_engine, text

DATABASE_URL = "YOUR_DATABASE_URL"
engine = create_engine(DATABASE_URL)

with engine.connect() as conn:
    print("Tables and Schemas:")
    rs = conn.execute(text("SELECT table_schema, table_name FROM information_schema.tables WHERE table_name = 'global_user'"))
    for row in rs:
        print(f"Schema: {row.table_schema}, Table: {row.table_name}")
