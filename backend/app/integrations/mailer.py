"""
Async email system via Gmail SMTP.
Silently skips if EMAIL_USER / EMAIL_APP_PASSWORD are not configured.
"""
import logging
import smtplib
from dataclasses import dataclass
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

import aiosmtplib

from app.core.config import settings

logger = logging.getLogger(__name__)


@dataclass
class TicketEmailData:
    to: str
    ticket_id: str
    rsvp_id: str
    event_title: str
    event_start: str
    event_location: str
    amount: int | None
    ticket_url: str


async def _send(to: str, subject: str, html: str) -> bool:
    if not settings.email_configured:
        logger.debug("Email not configured, skipping send to %s", to)
        return False

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"{settings.EMAIL_FROM_NAME} <{settings.EMAIL_USER}>"
    msg["To"] = to
    msg.attach(MIMEText(html, "html"))

    try:
        await aiosmtplib.send(
            msg,
            hostname=settings.SMTP_HOST,
            port=settings.SMTP_PORT,
            start_tls=True,
            username=settings.EMAIL_USER,
            password=settings.EMAIL_APP_PASSWORD,
        )
        logger.info("Email sent to %s: %s", to, subject)
        return True
    except Exception as exc:
        logger.error("Failed to send email to %s: %s", to, exc)
        return False


async def send_ticket_email(data: TicketEmailData) -> bool:
    price_str = (
        f"₹{data.amount / 100:.2f}" if data.amount else "Free"
    )
    html = f"""
    <div style="font-family:sans-serif;max-width:600px;margin:auto">
      <h2 style="color:#6d28d9">You're in! 🎉</h2>
      <p>Here's your ticket for <strong>{data.event_title}</strong></p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0">
        <tr><td style="padding:8px;font-weight:bold">Ticket #</td>
            <td style="padding:8px">{data.ticket_id}</td></tr>
        <tr style="background:#f5f3ff">
            <td style="padding:8px;font-weight:bold">Date</td>
            <td style="padding:8px">{data.event_start}</td></tr>
        <tr><td style="padding:8px;font-weight:bold">Location</td>
            <td style="padding:8px">{data.event_location}</td></tr>
        <tr style="background:#f5f3ff">
            <td style="padding:8px;font-weight:bold">Amount</td>
            <td style="padding:8px">{price_str}</td></tr>
      </table>
      <a href="{data.ticket_url}"
         style="display:inline-block;padding:12px 24px;background:#6d28d9;
                color:white;text-decoration:none;border-radius:6px">
        View &amp; Download Ticket
      </a>
      <p style="color:#888;font-size:12px;margin-top:24px">
        This is an automated message from Illaka. Please do not reply.
      </p>
    </div>
    """
    return await _send(data.to, f"Your ticket for {data.event_title}", html)


async def send_reminder_email(
    to: str,
    subject: str,
    event_title: str,
    event_start: str,
    is_online: bool,
    online_link: str | None = None,
) -> bool:
    location_block = (
        f'<p>Join online: <a href="{online_link}">{online_link}</a></p>'
        if is_online and online_link
        else "<p>See the event page for location details.</p>"
    )
    html = f"""
    <div style="font-family:sans-serif;max-width:600px;margin:auto">
      <h2 style="color:#6d28d9">Reminder: {event_title}</h2>
      <p>Your event starts on <strong>{event_start}</strong></p>
      {location_block}
      <p style="color:#888;font-size:12px;margin-top:24px">
        You received this because you RSVPed on Illaka.
      </p>
    </div>
    """
    return await _send(to, subject, html)


def send_reminder_email_sync(
    to: str,
    user_name: str,
    event_title: str,
    event_date: str,
    event_type: str,
    online_link: str | None = None,
) -> None:
    """Synchronous reminder email for Celery workers (uses smtplib, not aiosmtplib)."""
    if not settings.email_configured:
        return

    location_block = (
        f'<p>Join online: <a href="{online_link}">{online_link}</a></p>'
        if event_type == "ONLINE" and online_link
        else "<p>See the event page for location details.</p>"
    )
    html = f"""
    <div style="font-family:sans-serif;max-width:600px;margin:auto">
      <h2 style="color:#6d28d9">Reminder: {event_title}</h2>
      <p>Hi {user_name}, your event starts on <strong>{event_date}</strong></p>
      {location_block}
      <p style="color:#888;font-size:12px;margin-top:24px">
        You received this because you RSVPed on Illaka.
      </p>
    </div>
    """
    msg = MIMEMultipart("alternative")
    msg["Subject"] = f"Reminder: {event_title}"
    msg["From"] = f"{settings.EMAIL_FROM_NAME} <{settings.EMAIL_USER}>"
    msg["To"] = to
    msg.attach(MIMEText(html, "html"))

    with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as conn:
        conn.ehlo()
        conn.starttls()
        conn.login(settings.EMAIL_USER, settings.EMAIL_APP_PASSWORD)
        conn.sendmail(settings.EMAIL_USER, to, msg.as_string())


async def send_password_reset_email(to: str, reset_url: str) -> bool:
    html = f"""
    <div style="font-family:sans-serif;max-width:600px;margin:auto">
      <h2 style="color:#6d28d9">Reset your password</h2>
      <p>Click the button below to set a new password. This link expires in 1 hour.</p>
      <a href="{reset_url}"
         style="display:inline-block;padding:12px 24px;background:#6d28d9;
                color:white;text-decoration:none;border-radius:6px">
        Set new password
      </a>
      <p style="color:#888;font-size:12px;margin-top:24px">
        If you did not request this, ignore this email.
      </p>
    </div>
    """
    return await _send(to, "Reset your Illaka password", html)
