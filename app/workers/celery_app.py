from celery import Celery
from app.config import settings

celery_app = Celery(
    "plagiarism_detector",
    broker=settings.redis_url,
    backend=settings.redis_url,
)

celery_app.conf.update(
    task_acks_late=True,
    task_reject_on_worker_lost=True,
    result_expires=3600,
)
