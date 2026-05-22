from app.database import engine
from sqlalchemy import text, inspect

def diagnose():
    inspector = inspect(engine)
    cols = inspector.get_columns('global_user')
    print("COLUMNS:")
    for c in cols:
        print(f"  - {c['name']} ({c['type']})")
    
    with engine.connect() as conn:
        res = conn.execute(text("SELECT * FROM global_user LIMIT 1"))
        row = res.fetchone()
        if row:
            print("\nSAMPLE VALUES:")
            for k, v in zip(res.keys(), row):
                print(f"  {k}: {v}")
        else:
            print("\nNo data in table.")

if __name__ == "__main__":
    diagnose()
