from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from typing import List

from app import crud
from app import schemas
from app.database import get_db

router = APIRouter(prefix="/users", tags=["users"])

@router.post("/", response_model=schemas.User)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    return crud.create_user(db=db, user=user)

@router.get("/", response_model=List[schemas.User])
def read_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    users = crud.get_users(db, skip=skip, limit=limit)
    return users

@router.get("/profiles", response_model=List[schemas.UserProfile])
def read_user_profiles(db: Session = Depends(get_db)):
    return crud.get_user_profiles(db)

@router.get("/search", response_model=List[schemas.UserSearchEntry])
def search_users(
    q: str = None, 
    roles: str = None, 
    limit: int = 10, 
    db: Session = Depends(get_db)
):
    role_list = roles.split(",") if roles else None
    return crud.search_users(db, query=q, roles=role_list, limit=limit)

@router.get("/{user_id}", response_model=schemas.User)
def read_user(user_id: int, db: Session = Depends(get_db)):
    db_user = crud.get_user(db, user_id=user_id)
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Calculate impact stats
    stats = crud.get_user_impact_stats(db, user_id)
    
    # Convert to schema-compatible model
    user_data = schemas.User.model_validate(db_user)
    user_data.impact_points = stats["impact_points"]
    user_data.likes_received = stats["likes_received"]
    user_data.posts_count = stats["posts_count"]
    
    return user_data

@router.put("/{user_id}", response_model=schemas.User)
def update_user(user_id: int, user_update: schemas.UserUpdate, db: Session = Depends(get_db)):
    db_user = crud.get_user(db, user_id=user_id)
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return crud.update_user(db=db, user_id=user_id, updates=user_update)

@router.get("/{user_id}/notifications", response_model=List[schemas.Notification])
def get_user_notifications(user_id: int, db: Session = Depends(get_db)):
    return crud.get_notifications(db, user_id=user_id)

@router.post("/{user_id}/notifications/read", status_code=204)
def mark_user_notifications_as_read(user_id: int, db: Session = Depends(get_db)):
    crud.mark_notifications_as_read(db, user_id=user_id)
    return None

@router.post("/notifications/{notification_id}/read", status_code=204)
def mark_notification_as_read(notification_id: int, db: Session = Depends(get_db)):
    crud.mark_single_notification_as_read(db, notification_id=notification_id)
    return None

@router.post("/{user_id}/notifications/broadcast/{broadcast_id}/view", status_code=204)
def view_broadcast(user_id: int, broadcast_id: int, db: Session = Depends(get_db)):
    crud.mark_broadcast_as_viewed(db, broadcast_id=broadcast_id, user_id=user_id)
    return None

@router.post("/{user_id}/notifications/broadcast/{broadcast_id}/acknowledge", status_code=204)
def acknowledge_broadcast(user_id: int, broadcast_id: int, db: Session = Depends(get_db)):
    success = crud.acknowledge_broadcast(db, broadcast_id=broadcast_id, user_id=user_id)
    if not success:
        # We return 204 anyway to be idempotent, but we could 404 if not found
        pass
    return None

@router.delete("/{user_id}", status_code=204)
def delete_user(user_id: int, db: Session = Depends(get_db)):
    db_user = crud.delete_user(db, user_id=user_id)
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")

    return db_user

@router.post("/{user_id}/deactivate", response_model=schemas.User)
def deactivate_user(user_id: int, days: int, db: Session = Depends(get_db)):
    db_user = crud.deactivate_user(db, user_id=user_id, days=days)
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user

@router.post("/{user_id}/reactivate", response_model=schemas.User)
def reactivate_user(user_id: int, db: Session = Depends(get_db)):
    db_user = crud.reactivate_user(db, user_id=user_id)
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user

@router.post("/{user_id}/change-password")
def change_password(user_id: int, passwords: schemas.UserPasswordUpdate, db: Session = Depends(get_db)):
    result = crud.update_user_password(
        db, 
        user_id=user_id, 
        old_password=passwords.old_password, 
        new_password=passwords.new_password
    )
    if result is None:
        raise HTTPException(status_code=404, detail="User not found")
    if result is False:
        raise HTTPException(status_code=400, detail="Incorrect old password")
    return {"message": "Password updated successfully"}

@router.get("/{user_id}/activity", response_model=List[schemas.ActivityEntry])
def get_user_activity(user_id: int, db: Session = Depends(get_db)):
    return crud.get_user_activity(db, user_id=user_id)

@router.post("/auth/forgot-password")
def forgot_password(request: schemas.ForgotPasswordRequest, db: Session = Depends(get_db)):
    """Generates a reset link and 'sends' it (via server console log)."""
    token = crud.create_reset_token(db, email=request.email)
    if not token:
        # Success message regardless to prevent enumeration
        return {"message": "If this email is registered, a reset link has been sent."}
    
    # Simulation: Log the reset link for manual testing/development
    reset_link = f"http://localhost:3000/reset-password?token={token}"
    print(f"\n[SECURITY] Password Reset Link for {request.email}: {reset_link}\n")
    
    return {"message": "Reset link sent successfully (Simulated)"}

@router.post("/auth/reset-password")
def reset_password(request: schemas.PasswordResetConfirm, db: Session = Depends(get_db)):
    """Verifies the reset token and updates the user's password."""
    success = crud.reset_password_with_token(db, token=request.token, new_password=request.new_password)
    return {"message": "Password reset successfully. You can now log in with your new credentials."}
    
@router.post("/{user_id}/presence")
def update_user_presence(
    user_id: int, 
    current_module: str = Body(..., embed=True),
    db: Session = Depends(get_db)
):
    db_user = crud.get_user(db, user_id=user_id)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    from datetime import datetime, timezone
    db_user.last_seen = datetime.now(timezone.utc)
    db_user.current_module = current_module
    db.commit()
    return {"status": "success"}