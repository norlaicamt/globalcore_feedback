from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordBearer
from fastapi.responses import StreamingResponse
from fastapi.staticfiles import StaticFiles
from datetime import datetime, timezone
import asyncio
from typing import Dict

from app.database import engine, get_db
from app import models, crud, schemas
from app.routers import users, departments, categories, entities, branches, feedback, analytics, admin, drafts, products
from dotenv import load_dotenv
import os

load_dotenv()

from app.sse import sse_manager


# Init Security
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login", auto_error=False)
token_blacklist = set()

# Create database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Global Core - Feedback Module")

# Mount static files for media uploads
import os
os.makedirs("uploads", exist_ok=True)

# Custom Middleware for Static File Caching
@app.middleware("http")
async def add_cache_control_header(request: Request, call_next):
    response = await call_next(request)
    if request.url.path.startswith("/uploads"):
        # Cache for 1 year (immutable as filenames are unique UUIDs)
        response.headers["Cache-Control"] = "public, max-age=31536000, immutable"
    return response

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

@app.get("/")
def home():
    return {"status": "online", "message": "Global Core Backend is Running Successfully"}

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    import json
    print("VALIDATION ERROR:", exc.errors())
    print("BODY:", exc.body)
    from fastapi.responses import JSONResponse
    return JSONResponse(status_code=422, content={"detail": exc.errors()})


@app.get("/api/system/info")
def get_system_info(db: Session = Depends(get_db)):
    """Public endpoint to get system branding and configuration information."""
    org_name = db.query(models.SystemSetting).filter(models.SystemSetting.key == "primary_organization_name").first()
    org_logo = db.query(models.SystemSetting).filter(models.SystemSetting.key == "primary_organization_logo").first()
    primary_color = db.query(models.SystemSetting).filter(models.SystemSetting.key == "primary_color").first()
    font_family = db.query(models.SystemSetting).filter(models.SystemSetting.key == "font_family").first()
    system_mode = db.query(models.SystemSetting).filter(models.SystemSetting.key == "system_mode").first()

    return {
        "organization_name": org_name.value if org_name else "GlobalCore Feedback System",
        "organization_logo": org_logo.value if org_logo else None,
        "primary_color": primary_color.value if primary_color else "#1f2a56",
        "font_family": font_family.value if font_family else "'Outfit', sans-serif",
        "system_mode": system_mode.value if system_mode else "GOVERNMENT",
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
    
    # Update tracking fields
    user.last_login = datetime.now(timezone.utc)
    user.last_seen = datetime.now(timezone.utc)
    
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
app.include_router(branches.router)
app.include_router(feedback.router)
app.include_router(analytics.router)
app.include_router(admin.router)
app.include_router(drafts.router)
app.include_router(products.router)

# trigger manual refresh