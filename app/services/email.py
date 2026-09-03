"""Send email via SMTP using the stdlib (no external dependency).

Gmail app password: Google account -> Security -> 2-Step Verification ->
App passwords. Use that 16-char password as EMAIL_PASSWORD, not your normal login.
"""

import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from app.config import settings


def _smtp():
    return smtplib.SMTP(settings.email_host, settings.email_port, timeout=10)


def send_email(to: str, subject: str, text: str) -> None:
    if not settings.email_enabled:
        raise RuntimeError("EMAIL_ENABLED is false; email not sent")
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = settings.email_from
    msg["To"] = to
    msg.attach(MIMEText(text, "plain"))
    with _smtp() as server:
        server.ehlo()
        server.starttls()
        server.ehlo()
        server.login(settings.email_username, settings.email_password)
        server.sendmail(settings.email_from, to, msg.as_string())
