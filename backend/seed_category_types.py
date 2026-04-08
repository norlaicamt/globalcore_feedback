"""
Idempotent seed for default Category Types (stored in `categories` table).

Run:
  python seed_category_types.py
"""

from app.database import SessionLocal
from app import models


DEFAULT_CATEGORY_TYPES = [
    "4Ps",
    "Child-Care Placement Services",
    "ECD Project",
    "KALAHI-CIDSS",
    "Tara, Basa! Program",
    "Walang Gutom Program",
]


def main() -> None:
    db = SessionLocal()
    try:
        created = 0
        existing = {
            (c.name or "").strip().lower()
            for c in db.query(models.Category).all()
            if c.name
        }

        for name in DEFAULT_CATEGORY_TYPES:
            key = name.strip().lower()
            if not key or key in existing:
                continue
            db.add(models.Category(name=name.strip(), description="", icon="default", fields=[]))
            existing.add(key)
            created += 1

        db.commit()
        print(f"Seed complete. Created {created} category type(s).")
    finally:
        db.close()


if __name__ == "__main__":
    main()

