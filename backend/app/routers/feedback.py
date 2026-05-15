from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Request
from sqlalchemy.orm import Session
from typing import List, Optional
import os
import shutil
import uuid

from app import crud
from app import schemas
from app import models
from app.database import get_db

router = APIRouter(prefix="/feedbacks", tags=["feedbacks"])

import re

def normalize_filename(filename):
    # remove special chars except alphanumeric, dots, underscores and hyphens
    # replace spaces with underscores
    name = os.path.basename(filename)
    base, ext = os.path.splitext(name)
    base = re.sub(r'[^\w\s.-]', '', base)
    base = re.sub(r'[-\s]+', '_', base).strip('_')
    return f"{base}{ext}"

ALLOWED_IMAGE_TYPES = {'image/jpeg', 'image/png', 'image/heic', 'image/webp', 'image/gif'}
FORBIDDEN_EXTENSIONS = {'.exe', '.bat', '.sh', '.py', '.js', '.vbs', '.msi', '.com'}
MAX_FILE_SIZE = 10 * 1024 * 1024 # 10MB

@router.post("/upload")
async def upload_feedback_file(request: Request, file: UploadFile = File(...)):
    # Security: File Extension check
    filename = file.filename.lower()
    ext = os.path.splitext(filename)[1]
    if ext in FORBIDDEN_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Forbidden file type.")
    
    # Security: Mime Type check
    if file.content_type not in ALLOWED_IMAGE_TYPES:
         # Double check extension if content_type is generic
         if ext not in {'.jpg', '.jpeg', '.png', '.webp', '.heic', '.gif'}:
            raise HTTPException(status_code=400, detail="Invalid image format.")

    os.makedirs(os.path.join("uploads", "feedback"), exist_ok=True)
    
    # Filename Hardening
    safe_name = normalize_filename(file.filename)
    unique_name = f"{uuid.uuid4().hex}_{safe_name}"
    file_path = os.path.join("uploads", "feedback", unique_name)
    
    # Security: Size check before read
    # FastAPI reads into memory if < 1MB, or spool to disk if > 1MB.
    # We can check size by seeking if needed, but shutil copy is fine if we trust the OS/Webserver limits.
    # For extra safety, we'll check it after write or during copy.
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    exists_after_write = os.path.exists(file_path)
    bytes_written = os.path.getsize(file_path) if exists_after_write else 0
    
    if bytes_written > MAX_FILE_SIZE:
        if exists_after_write: os.remove(file_path)
        raise HTTPException(status_code=413, detail="File too large.")

    batch_id = request.headers.get("X-Batch-ID", "unknown")
    file_index = request.headers.get("X-File-Index", "0")
    returned_url = f"/uploads/feedback/{unique_name}"
    
    # Production Hardening: Disable audits in prod (check ENV)
    if os.getenv("ENV") == "development":
        # [AUDIT:BATCH_WRITE]
        print(f"[AUDIT:BATCH_WRITE] batch_id={batch_id} file_index={file_index} original_name={file.filename} hardened_name={safe_name} bytes_written={bytes_written} exists_after_write={exists_after_write} returned_url={returned_url}")

    return {"url": returned_url}

@router.post("/", response_model=schemas.Feedback)
def create_feedback(feedback: schemas.FeedbackCreate, db: Session = Depends(get_db)):
    # [AUDIT:PHOTO_PAYLOAD]
    custom_data = feedback.custom_data or {}
    photo_upload = custom_data.get("photo_upload", [])
    persisted_url = photo_upload[0].get("url") if isinstance(photo_upload, list) and len(photo_upload) > 0 else "NONE"
    print(f"[AUDIT:PHOTO_PAYLOAD] feedback_id=NEW module_id=photo_upload persisted_url={persisted_url} starts_with_blob={str(persisted_url).startswith('blob:')} starts_with_http={str(persisted_url).startswith('http')}")

    try:
        db_feedback = crud.create_feedback(db=db, feedback=feedback)
        
        # [AUDIT:BATCH_DB]
        custom_data = db_feedback.custom_data or {}
        stored_media = custom_data.get("photo_upload", [])
        stored_urls = [m.get("url") for m in stored_media] if isinstance(stored_media, list) else []
        print(f"[AUDIT:BATCH_DB] feedback_id={db_feedback.id} expected_media_count={len(photo_upload)} stored_media_count={len(stored_urls)} stored_urls={stored_urls}")

        # [AUDIT:BATCH_FETCH] Verification
        import requests
        for idx, url in enumerate(stored_urls):
            if url and url.startswith("http"):
                try:
                    r = requests.get(url, timeout=2)
                    print(f"[AUDIT:BATCH_FETCH] file_index={idx} url={url} status_code={r.status_code} content_type={r.headers.get('Content-Type')}")
                except Exception as e:
                    print(f"[AUDIT:BATCH_FETCH] file_index={idx} url={url} status=ERROR error={str(e)}")

        return db_feedback
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/", response_model=List[schemas.Feedback])
def read_feedbacks(
    recipient_user_id: Optional[int] = None, 
    sender_id: Optional[int] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 10,
    user_id: Optional[int] = None,
    mentioned_user_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """The primary public newsfeed. Optionally filter by recipient or sender."""
    return crud.get_feedbacks(
        db, 
        skip=skip, 
        limit=limit, 
        sender_id=sender_id, 
        recipient_user_id=recipient_user_id,
        mentioned_user_id=mentioned_user_id,
        current_user_id=user_id,
        status=status,
        search=search
    )

@router.get("/trending", response_model=List[schemas.Feedback])
def read_trending_feedbacks(limit: int = 10, db: Session = Depends(get_db)):
    """Global trending topics sorted by activity."""
    return crud.get_trending_feedbacks(db, limit=limit)


@router.get("/{feedback_id}", response_model=schemas.FeedbackDetail)
def read_feedback(feedback_id: int, db: Session = Depends(get_db)):
    db_feedback = crud.get_feedback(db, feedback_id=feedback_id)
    if db_feedback is None:
        raise HTTPException(status_code=404, detail="Feedback not found")
    return db_feedback

@router.put("/{feedback_id}", response_model=schemas.Feedback)
def update_feedback(feedback_id: int, updates: schemas.FeedbackUpdateFull, db: Session = Depends(get_db)):
    db_feedback = crud.update_feedback(db, feedback_id=feedback_id, updates=updates)
    if db_feedback is None:
        raise HTTPException(status_code=404, detail="Feedback not found")
    return db_feedback

@router.delete("/{feedback_id}", status_code=204)
def delete_feedback(feedback_id: int, db: Session = Depends(get_db)):
    db_feedback = crud.delete_feedback(db, feedback_id=feedback_id)
    if db_feedback is None:
        raise HTTPException(status_code=404, detail="Feedback not found")
    return None

@router.put("/{feedback_id}/status", response_model=schemas.Feedback)
def update_feedback_status(feedback_id: int, status: models.FeedbackStatus, db: Session = Depends(get_db)):
    db_feedback = crud.update_feedback_status(db, feedback_id=feedback_id, status=status)
    if db_feedback is None:
        raise HTTPException(status_code=404, detail="Feedback not found")
    return db_feedback

@router.get("/{feedback_id}/replies", response_model=List[schemas.ReplyWithUser])
def read_feedback_replies(feedback_id: int, user_id: Optional[int] = None, db: Session = Depends(get_db)):
    db_feedback = crud.get_feedback(db, feedback_id=feedback_id)
    if db_feedback is None:
        raise HTTPException(status_code=404, detail="Feedback not found")
    return crud.get_replies_for_feedback(db, feedback_id=feedback_id, current_user_id=user_id)

@router.post("/{feedback_id}/replies", response_model=schemas.Reply)
def create_feedback_reply(feedback_id: int, reply: schemas.ReplyBase, db: Session = Depends(get_db)):
    db_feedback = crud.get_feedback(db, feedback_id=feedback_id)
    if db_feedback is None:
        raise HTTPException(status_code=404, detail="Feedback not found")
    if getattr(db_feedback, "allow_comments", True) is False:
        raise HTTPException(status_code=400, detail="Comments are disabled for this feedback")
    reply_create = schemas.ReplyCreate(
        message=reply.message,
        user_id=reply.user_id,
        feedback_id=feedback_id,
        parent_id=reply.parent_id
    )
    return crud.create_reply(db=db, reply=reply_create)

@router.put("/{feedback_id}/replies/{reply_id}", response_model=schemas.Reply)
def update_feedback_reply(feedback_id: int, reply_id: int, reply: schemas.ReplyBase, db: Session = Depends(get_db)):
    db_reply = crud.update_reply(db, reply_id=reply_id, new_message=reply.message)
    if db_reply is None:
        raise HTTPException(status_code=404, detail="Reply not found")
    return db_reply

@router.delete("/{feedback_id}/replies/{reply_id}", status_code=204)
def delete_feedback_reply(feedback_id: int, reply_id: int, db: Session = Depends(get_db)):
    db_reply = crud.delete_reply(db, reply_id=reply_id)
    if db_reply is None:
        raise HTTPException(status_code=404, detail="Reply not found")

# --- REACTIONS ---
class ReactionRequest(schemas.ReactionCreate):
    pass

@router.post("/{feedback_id}/reactions")
def toggle_reaction(feedback_id: int, body: schemas.ReactionCreate, db: Session = Depends(get_db)):
    """Toggle Like (is_like=true) or Dislike (is_like=false). Returns None on unreact."""
    result = crud.toggle_reaction(db, user_id=body.user_id, feedback_id=feedback_id, is_like=body.is_like)
    return result or {"status": "removed"}

@router.get("/{feedback_id}/reactions")
def get_reactions(feedback_id: int, user_id: Optional[int] = None, db: Session = Depends(get_db)):
    """Get like/dislike counts plus current user's reaction."""
    return crud.get_reactions_summary(db, feedback_id=feedback_id, current_user_id=user_id)

@router.post("/{feedback_id}/replies/{reply_id}/reactions")
def toggle_reply_reaction(feedback_id: int, reply_id: int, body: schemas.ReplyReactionCreate, db: Session = Depends(get_db)):
    """Toggle Like/Dislike on a comment."""
    result = crud.toggle_reply_reaction(db, user_id=body.user_id, reply_id=reply_id, is_like=body.is_like)
    return result or {"status": "removed"}