from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel

from app.db import get_db
from app.models.user import User
from app.models.result import Scan
from app.models.document import Document
from app.api.auth import get_current_user
from app.workers.scan_tasks import process_scan

router = APIRouter()


class ScanOut(BaseModel):
    id: int
    document_id: int
    status: str
    plagiarism_score: float | None = None
    ai_score: float | None = None
    plagiarism_details: dict | None = None
    ai_details: dict | None = None
    error: str | None = None

    class Config:
        from_attributes = True


@router.post("/{document_id}", response_model=ScanOut)
async def create_scan(
    document_id: int, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Document).where(Document.id == document_id, Document.user_id == user.id)
    )
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    scan = Scan(document_id=doc.id, status="pending")
    db.add(scan)
    await db.commit()
    await db.refresh(scan)

    await process_scan(scan.id)
    await db.refresh(scan)
    return scan


@router.get("/{scan_id}", response_model=ScanOut)
async def get_scan(
    scan_id: int, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Scan)
        .join(Document, Scan.document_id == Document.id)
        .where(Scan.id == scan_id, Document.user_id == user.id)
    )
    scan = result.scalar_one_or_none()
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")
    return scan


@router.get("", response_model=list[ScanOut])
async def list_scans(
    user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Scan)
        .join(Document, Scan.document_id == Document.id)
        .where(Document.user_id == user.id)
        .order_by(Scan.created_at.desc())
    )
    return result.scalars().all()
