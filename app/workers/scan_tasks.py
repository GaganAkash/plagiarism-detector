from datetime import datetime

from sqlalchemy import select, update

from app.db import async_session
from app.models.result import Scan
from app.models.document import Document
from app.services.plagiarism import scan_plagiarism, PlagiarismResult
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

        await db.execute(update(Scan).where(Scan.id == scan.id).values(status="processing"))
        await db.commit()

        try:
            # ponytail: same-user docs as reference corpus; web search optional via BING_API_KEY
            ref_result = await db.execute(
                select(Document.extracted_text).where(
                    Document.user_id == doc.user_id, Document.id != doc.id
                )
            )
            refs = ref_result.scalars().all()

            web_matches = search_web(doc.extracted_text)
            pl_result: PlagiarismResult = scan_plagiarism(doc.extracted_text, refs)
            pl_result.matches.extend(web_matches)

            ai_result = scan_ai(doc.extracted_text)

            await db.execute(
                update(Scan)
                .where(Scan.id == scan.id)
                .values(
                    status="completed",
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
