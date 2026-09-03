from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from app.db import get_db
from app.models.user import User
from app.models.document import Document
from app.services.extractors import detect_file_type, extract_text
from app.config import settings
from app.api.auth import get_current_user

router = APIRouter()

ALLOWED_EXTENSIONS = {".pdf", ".docx", ".doc", ".txt", ".md"}


class DocumentOut(BaseModel):
    id: int
    filename: str
    file_type: str
    file_size: int
    word_count: int

    class Config:
        from_attributes = True


@router.post("/upload", response_model=DocumentOut)
async def upload_document(
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not file.filename or "." not in file.filename:
        raise HTTPException(status_code=400, detail="File must have an extension")

    try:
        file_type = detect_file_type(file.filename)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    file_bytes = await file.read()
    if len(file_bytes) > settings.max_file_size_mb * 1024 * 1024:
        raise HTTPException(status_code=413, detail="File too large")

    try:
        text = extract_text(file_bytes, file_type)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    if not text:
        raise HTTPException(status_code=400, detail="No text could be extracted from this file")

    doc = Document(
        user_id=user.id,
        filename=file.filename,
        file_type=file_type,
        file_size=len(file_bytes),
        extracted_text=text,
        word_count=len(text.split()),
    )
    db.add(doc)
    await db.commit()
    await db.refresh(doc)
    return doc


@router.get("", response_model=list[DocumentOut])
async def list_documents(
    user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
):
    from sqlalchemy import select

    result = await db.execute(
        select(Document).where(Document.user_id == user.id).order_by(Document.created_at.desc())
    )
    return result.scalars().all()
