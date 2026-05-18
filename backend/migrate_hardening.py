import os
import sys
import json
from dotenv import load_dotenv

# Load env variables
load_dotenv('.env')

# Add parent directory to path to import app modules
sys.path.append(os.getcwd())

from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session
from app.models import User

def run_migration():
    DATABASE_URL = os.getenv("DATABASE_URL")
    if not DATABASE_URL:
        print("Error: DATABASE_URL not found in environment.")
        return
        
    engine = create_engine(DATABASE_URL)
    
    print("--------------------------------------------------")
    print("STEP 1: Backfilling source, role_context, attributes...")
    print("--------------------------------------------------")
    
    with Session(engine) as session:
        users = session.query(User).all()
        print(f"Checking {len(users)} users for backfill...")
        
        updated_count = 0
        for u in users:
            modified = False
            
            # 1. Backfill source
            if not u.source:
                u.source = "local"
                modified = True
                
            # 2. Backfill role_context
            if not u.role_context:
                role = u.role or "user"
                role_lower = role.lower()
                if role_lower in ["superadmin", "globaloverseer"]:
                    u.role_context = "global_admin"
                elif role_lower in ["admin", "service_admin"]:
                    u.role_context = "admin"
                elif role_lower in ["staff", "coordinator"]:
                    u.role_context = "staff"
                else:
                    u.role_context = "citizen"
                modified = True
                
            # 3. Backfill attributes
            if u.attributes is None:
                u.attributes = {}
                modified = True
                
            if modified:
                print(f"Updating User ID {u.id} ({u.display_name or u.email}): source={u.source}, role_context={u.role_context}, attributes={u.attributes}")
                updated_count += 1
                
        if updated_count > 0:
            session.commit()
            print(f"Successfully committed backfill for {updated_count} users.")
        else:
            print("No users needed backfilling.")
            
    print("\n--------------------------------------------------")
    print("STEP 2: Altering columns in PostgreSQL to SET NOT NULL and DEFAULT...")
    print("--------------------------------------------------")
    
    with engine.connect() as conn:
        print("Enforcing NOT NULL and DEFAULT constraint on global_id...")
        conn.execute(text("ALTER TABLE global_user ALTER COLUMN global_id SET NOT NULL;"))
        
        print("Enforcing NOT NULL and DEFAULT constraint on source...")
        conn.execute(text("ALTER TABLE global_user ALTER COLUMN source SET NOT NULL;"))
        conn.execute(text("ALTER TABLE global_user ALTER COLUMN source SET DEFAULT 'local';"))
        
        print("Enforcing NOT NULL and DEFAULT constraint on role_context...")
        conn.execute(text("ALTER TABLE global_user ALTER COLUMN role_context SET NOT NULL;"))
        conn.execute(text("ALTER TABLE global_user ALTER COLUMN role_context SET DEFAULT 'citizen';"))
        
        print("Enforcing NOT NULL and DEFAULT constraint on attributes...")
        conn.execute(text("ALTER TABLE global_user ALTER COLUMN attributes SET NOT NULL;"))
        conn.execute(text("ALTER TABLE global_user ALTER COLUMN attributes SET DEFAULT '{}'::jsonb;"))
        
        conn.commit()
        print("Database schema successfully hardened!")
        
    print("\n--------------------------------------------------")
    print("STEP 3: PostgreSQL Truth Test Query...")
    print("--------------------------------------------------")
    
    with engine.connect() as conn:
        rs = conn.execute(text("""
            SELECT 
                id, 
                display_name, 
                global_id, 
                source, 
                role_context, 
                attributes 
            FROM global_user 
            ORDER BY id;
        """)).fetchall()
        
        print(f"{'ID':<4} | {'Display Name':<20} | {'Global ID':<36} | {'Source':<10} | {'Role Context':<15} | {'Attributes':<10}")
        print("-" * 115)
        for row in rs:
            print(f"{row[0]:<4} | {str(row[1])[:20]:<20} | {str(row[2]):<36} | {str(row[3]):<10} | {str(row[4]):<15} | {json.dumps(row[5]):<10}")
            
    print("\n--------------------------------------------------")
    print("Harden Migration Completed Successfully!")
    print("--------------------------------------------------")

if __name__ == "__main__":
    run_migration()
