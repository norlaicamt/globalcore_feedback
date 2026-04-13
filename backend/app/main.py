from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordBearer
from fastapi.responses import StreamingResponse
import asyncio
from typing import Dict

from app.database import engine, get_db
from app import models, crud, schemas
from app.routers import users, departments, categories, entities, feedback, analytics, admin
from dotenv import load_dotenv
import os

load_dotenv()

# SSE Manager for Real-Time Notifications
class NotificationStreamManager:
    def __init__(self):
        self.queues: Dict[int, asyncio.Queue] = {}

    async def subscribe(self, user_id: int):
        if user_id not in self.queues:
            self.queues[user_id] = asyncio.Queue()
        return self.queues[user_id]

    async def notify(self, user_id: int):
        if user_id in self.queues:
            await self.queues[user_id].put("ping")

sse_manager = NotificationStreamManager()

# Init Security
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login", auto_error=False)
token_blacklist = set()

# Create database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Global Core - Feedback Module")

@app.get("/")
def home():
    return {"status": "online", "message": "Global Core Backend is Running Successfully"}

@app.get("/api/system/info")
def get_system_info(db: Session = Depends(get_db)):
    """Public endpoint to get system branding and configuration information."""
    org_name = db.query(models.SystemSetting).filter(models.SystemSetting.key == "primary_organization_name").first()
    primary_color = db.query(models.SystemSetting).filter(models.SystemSetting.key == "primary_color").first()

    return {
        "organization_name": org_name.value if org_name else "GlobalCore Feedback System",
        "primary_color": primary_color.value if primary_color else "#1f2a56",
        "version": "1.0.0",
        "environment": os.getenv("ENV", "production")
    }

# Middleware
frontend_origins_env = os.getenv("FRONTEND_ORIGINS", "")
default_origins = ["http://localhost:3000", "http://127.0.0.1:3000"]
allow_origins = [o.strip() for o in frontend_origins_env.split(",") if o.strip()] or default_origins

app.add_middleware(
    CORSMiddleware,
    # This app doesn't rely on cookie-based auth in the browser.
    # Disabling credentials allows wildcard/varied origins (useful for dev ports like 3000/3002).
    allow_origins=allow_origins if frontend_origins_env else ["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

async def check_blacklist(token: str = Depends(oauth2_scheme)):
    if token and token in token_blacklist:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired. Please log in again."
        )
    return token

# --- AUTH ---
@app.post("/login", response_model=schemas.User)
def login(email: str, password: str, db: Session = Depends(get_db)):
    user = crud.get_user_by_login_id(db, login_id=email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found in Global Core system")
    
    if user.password != password:
        raise HTTPException(status_code=401, detail="Incorrect password")
    
    # Restrict administrative accounts from using the regular user login
    if user.role in ["admin", "superadmin"]:
        raise HTTPException(
            status_code=403, 
            detail="Administrative accounts must log in through the Administrator Portal (/admin)."
        )
    
    # Auto-reactivation: Logging in automatically reactivates the account
    if not user.is_active or user.deactivated_until:
        user.is_active = True
        user.deactivated_until = None
        db.commit()
        db.refresh(user)
        
    return user

@app.post("/api/logout")
async def logout(token: str = Depends(oauth2_scheme)):
    if token:
        token_blacklist.add(token)
    return {"message": "Successfully logged out"}

# --- REAL-TIME SSE ---
@app.get("/api/notifications/stream/{user_id}")
async def notification_stream(user_id: int):
    queue = await sse_manager.subscribe(user_id)
    async def event_generator():
        try:
            # Send initial ping to confirm connection
            yield "data: connected\n\n"
            while True:
                await queue.get()
                yield "data: new_notification\n\n"
        except asyncio.CancelledError:
            pass
    return StreamingResponse(event_generator(), media_type="text/event-stream")

# --- ROUTERS ---
app.include_router(users.router)
app.include_router(departments.router)
app.include_router(categories.router)
app.include_router(entities.router)
app.include_router(feedback.router)
app.include_router(analytics.router)
app.include_router(admin.router)