from sqlalchemy import create_engine, inspect

DATABASE_URL = "YOUR_DATABASE_URL"
engine = create_engine(DATABASE_URL)
inspector = inspect(engine)

for table in ["global_user", "feedbacks"]:
    columns = inspector.get_columns(table)
    for col in columns:
        if col["name"] in ["avatar_url", "attachments"]:
            print(f"{table}.{col['name']}: {col['type']}")
