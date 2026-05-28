from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import SessionLocal
from app import models

def test_verification_v2():
    db: Session = SessionLocal()
    try:
        print("Testing FIXED (v2) analytics_top_users style query with email fix...")
        # This is the FIXED part of the query in analytics_top_users
        query = db.query(
            models.User.id,
            models.User.display_name.label("name"),
            models.UserProfile.email,
            func.coalesce(
                models.UserModuleContext.unit_name, 
                models.UserModuleContext.program, 
                models.UserModuleContext.department
            ).label("department")
        ).join(
            models.UserModuleContext, 
            models.User.id == models.UserModuleContext.user_id
        ).outerjoin(
            models.UserProfile,
            models.User.id == models.UserProfile.user_id
        ).filter(models.User.role.notin_(["admin", "superadmin"]))
        
        result = query.limit(1).all()
        print("Query successful! Result count:", len(result))
        if result:
            print("Sample result:", result[0])

    except Exception as e:
        print(f"\nCaught exception: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    test_verification_v2()
