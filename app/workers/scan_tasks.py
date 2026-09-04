from datetime import datetime

from sqlalchemy import select, update

from app.db import async_session
from app.models.result import Scan
from app.models.document import Document
from app.services.plagiarism import aggregate_score, scan_plagiarism, PlagiarismResult
from app.services.ai_detection import scan_ai
from app.services.web_search import search_web


async def process_scan(scan_id: int):
    async with async_session() as db:
        result = await db.execute(
            select(Scan, Document)
            .join(Document, Scan.document_id == Document.id)
            .where(Scan.id == scan_id)
        )
        row = result.first()
        if not row:
            return
        scan, doc = row

        async def set_progress(pct: int):
            await db.execute(
                update(Scan).where(Scan.id == scan.id).values(status="processing", progress=pct)
            )
            await db.commit()

        await set_progress(5)

        try:
            # ponytail: same-user docs as reference corpus; web search optional via BING_API_KEY
            await set_progress(10)
            ref_result = await db.execute(
                select(Document.extracted_text).where(
                    Document.user_id == doc.user_id, Document.id != doc.id
                )
            )
            refs = ref_result.scalars().all()

            await set_progress(30)
            web_matches = search_web(doc.extracted_text)
            await set_progress(60)
            pl_result: PlagiarismResult = scan_plagiarism(doc.extracted_text, refs)
            pl_result.matches.extend(web_matches)
            # Score reflects ALL evidence (reference + web); web matches must count.
            pl_result.score = aggregate_score(pl_result.matches)
            await set_progress(85)

            ai_result = scan_ai(doc.extracted_text)
            await set_progress(95)

            await db.execute(
                update(Scan)
                .where(Scan.id == scan.id)
                .values(
                    status="completed",
                    progress=100,
                    plagiarism_score=pl_result.score,
                    ai_score=ai_result.score,
                    plagiarism_details={
                        "matches": [m.__dict__ for m in pl_result.matches]
                    },
                    ai_details={
                        "classification": ai_result.classification,
                        "signals": [s.__dict__ for s in ai_result.signals],
                        "flagged_segments": ai_result.flagged_segments,
                    },
                    completed_at=datetime.utcnow(),
                )
            )
        except Exception as e:
            await db.execute(
                update(Scan)
                .where(Scan.id == scan.id)
                .values(status="failed", error=str(e))
            )
        await db.commit()
