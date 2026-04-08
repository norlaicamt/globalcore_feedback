import json
from app.database import engine
from sqlalchemy import text

def check():
    with engine.connect() as conn:
        # Check Bobby Cruz
        res = conn.execute(text("SELECT name, department, program, unit_name FROM global_user WHERE name LIKE 'Bobby%'"))
        users = [dict(zip(['name', 'department', 'program', 'unit_name'], r)) for r in res]
        print("Users:", json.dumps(users, indent=2))

        # Check Categories
        res = conn.execute(text("SELECT id, name FROM categories"))
        cats = [dict(zip(['id', 'name'], r)) for r in res]
        print("Categories:", json.dumps(cats, indent=2))

        # Check Departments
        res = conn.execute(text("SELECT id, name FROM departments"))
        depts = [dict(zip(['id', 'name'], r)) for r in res]
        print("Departments:", json.dumps(depts, indent=2))

if __name__ == "__main__":
    check()
