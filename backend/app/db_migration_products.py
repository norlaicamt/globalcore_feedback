from sqlalchemy import create_engine, text

engine = create_engine("postgresql://postgres:123456@localhost:5432/global_core_db")

with engine.connect() as con:
    con.execute(text("ALTER TABLE products ALTER COLUMN entity_id DROP NOT NULL;"))
    con.commit()

print("Successfully dropped NOT NULL constraint on products.entity_id")
