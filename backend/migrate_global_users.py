import os
from sqlalchemy import create_engine, select, update
from sqlalchemy.orm import Session
import sys

# Add parent directory to path to import app modules if needed
sys.path.append(os.getcwd())

from app.database import DATABASE_URL
from app.models import User

def migrate_global_users():
    engine = create_engine(DATABASE_URL)
    with Session(engine) as session:
        print("Starting migration of global users...")
        
        # Define beneficiary roles
        beneficiary_roles = ["Student", "Parent", "Visitor", "Others", "Citizen", "Others/Non-Employee", "Maker", "maker", "Beneficiary"]
        
        # Update existing users
        stmt = (
            update(User)
            .where(User.role_identity.in_(beneficiary_roles))
            .values(is_global_user=True)
        )
        
        result = session.execute(stmt)
        session.commit()
        
        print(f"Migration complete. Updated {result.rowcount} users.")

if __name__ == "__main__":
    migrate_global_users()
