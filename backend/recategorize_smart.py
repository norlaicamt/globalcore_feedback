from app.database import SessionLocal
from app import models

def smart_migrate():
    db = SessionLocal()
    try:
        # Define Keyword Map
        # 6: Dept/Agency (Catch-all)
        # 7: Food, 8: Cosmetics, 9: Furniture, 10: Car, 11: Resort, 12: Hotel
        keyword_map = {
            12: ["hotel", "lodging", "stay", "room", "accommodation", "check-in", "reception"],
            11: ["resort", "pool", "swimming", "beach", "vacation"],
            7: ["food", "restaurant", "eat", "dining", "meal", "coffee", "cafe", "waiter", "menu"],
            10: ["car", "transport", "vehicle", "taxi", "ride", "driver", "lrt", "mrt"],
            9: ["furniture", "home", "sofa", "table", "chair", "interior"],
            8: ["cosmetic", "makeup", "beauty", "skin", "store", "skincare"]
        }
        
        # 3. Scan all feedbacks currently in "Department / Agency" (id 6)
        feedbacks = db.query(models.Feedback).filter(models.Feedback.category_id == 6).all()
        
        count = 0
        for fb in feedbacks:
            text = (f"{fb.title} {fb.description}").lower()
            
            new_id = None
            for cat_id, keywords in keyword_map.items():
                if any(kw in text for kw in keywords):
                    new_id = cat_id
                    break
            
            if new_id:
                fb.category_id = new_id
                count += 1
                
        db.commit()
        print(f"Smart-Migrated {count} feedbacks out of 'Department / Agency'")
        
    except Exception as e:
        db.rollback()
        print(f"Error during migration: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    smart_migrate()
