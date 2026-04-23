import os

# --- 1. Fix models.py ---
models_path = os.path.join("app", "models.py")
with open(models_path, "r") as f:
    lines = f.readlines()

# Remove duplicate SystemSetting at the end if it exists
new_lines = []
skip = False
for line in lines:
    if line.startswith("class SystemSetting(Base):"):
        if any("class SystemSetting(Base):" in l for l in new_lines):
            skip = True
            continue
    if skip and line.startswith("class "):
        skip = False
    if not skip:
        new_lines.append(line)

# Add BroadcastLog if missing
content = "".join(new_lines)
if "class BroadcastLog(Base):" not in content:
    content += """
class BroadcastLog(Base):
    __tablename__ = "broadcast_logs"
    id = Column(Integer, primary_key=True, index=True)
    subject = Column(String)
    message = Column(String)
    sent_to_count = Column(Integer)
    created_at = Column(DateTime, default=lambda: datetime.now(os.getenv("TZ", "UTC")))
"""
    # Note: Using os.getenv or just datetime.now(timezone.utc) is fine.
    # Actually, the original used datetime.now(timezone.utc)
    content = content.replace('os.getenv("TZ", "UTC")', 'timezone.utc')

with open(models_path, "w") as f:
    f.write(content.strip() + "\\n")

# --- 2. Fix schemas.py ---
schemas_path = os.path.join("app", "schemas.py")
with open(schemas_path, "r") as f:
    content = f.read()

if "class BroadcastLog(BaseModel):" not in content and "class BroadcastLogBase(BaseModel):" not in content:
    content += """
class BroadcastLogBase(BaseModel):
    subject: str
    message: str
    sent_to_count: int

class BroadcastLog(BroadcastLogBase):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)
"""
with open(schemas_path, "w") as f:
    f.write(content.strip() + "\\n")

# --- 3. Fix crud.py ---
crud_path = os.path.join("app", "crud.py")
with open(crud_path, "r") as f:
    content = f.read()

if "def create_broadcast_log" not in content:
    content += """
# Broadcast History
def create_broadcast_log(db: Session, subject: str, message: str, count: int):
    log = models.BroadcastLog(subject=subject, message=message, sent_to_count=count)
    db.add(log)
    db.commit()
    db.refresh(log)
    return log

def get_broadcast_logs(db: Session):
    return db.query(models.BroadcastLog).order_by(models.BroadcastLog.created_at.desc()).all()
"""
with open(crud_path, "w") as f:
    f.write(content.strip() + "\\n")

# --- 4. Fix admin.py ---
admin_path = os.path.join("app", "routers", "admin.py")
with open(admin_path, "r") as f:
    content = f.read()

if "crud.create_broadcast_log(db, subject=subject, message=message, count=len(users))" not in content:
    # Update POST route
    old_post = 'db.commit()\\n    return {"sent_to": len(users), "subject": subject, "message": message}'
    new_post = '    crud.create_broadcast_log(db, subject=subject, message=message, count=len(users))\\n    db.commit()\\n    return {"sent_to": len(users), "subject": subject, "message": message}'
    content = content.replace(old_post.replace("\\\\n", "\\n"), new_post.replace("\\\\n", "\\n"))

    # Add GET route
    if "admin_broadcasts" not in content:
        content += """
@router.get("/broadcasts", response_model=List[schemas.BroadcastLog])
def get_broadcast_history(db: Session = Depends(get_db)):
    \"\"\"Fetch history of announcements.\"\"\"
    return crud.get_broadcast_logs(db)
"""

with open(admin_path, "w") as f:
    f.write(content.strip() + "\\n")

# --- 5. Run DB Migration ---
from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv
load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)
with engine.connect() as conn:
    try:
        conn.execute(text("CREATE TABLE IF NOT EXISTS broadcast_logs (id SERIAL PRIMARY KEY, subject TEXT, message TEXT, sent_to_count INTEGER, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);"))
        conn.commit()
    except Exception as e:
        print(f"Error creating table: {e}")

print("Backend updated successfully.")
