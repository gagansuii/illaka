"""
PDF ticket generation using ReportLab + qrcode.
Replaces @react-pdf/renderer from the Next.js backend.
"""
import io
from dataclasses import dataclass

import qrcode
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    HRFlowable,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)
from reportlab.platypus.flowables import Image as RLImage


@dataclass
class TicketData:
    ticket_id: str
    rsvp_id: str
    event_title: str
    event_start: str
    event_end: str
    event_location: str
    attendee_name: str
    attendee_email: str
    is_paid: bool
    amount: int | None = None
    payment_status: str | None = None
    payment_qr_url: str | None = None
    badge_icon: str | None = None
    is_online: bool = False
    online_link: str | None = None


def _make_qr_image(data: str, size_px: int = 150) -> RLImage:
    qr = qrcode.QRCode(box_size=4, border=2)
    qr.add_data(data)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    return RLImage(buf, width=size_px, height=size_px)


def generate_ticket_pdf(data: TicketData) -> bytes:
    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf,
        pagesize=A4,
        rightMargin=20 * mm,
        leftMargin=20 * mm,
        topMargin=20 * mm,
        bottomMargin=20 * mm,
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        "title",
        parent=styles["Heading1"],
        fontSize=22,
        textColor=colors.HexColor("#6d28d9"),
        spaceAfter=4,
    )
    sub_style = ParagraphStyle(
        "sub",
        parent=styles["Normal"],
        fontSize=11,
        textColor=colors.HexColor("#6b7280"),
        spaceAfter=12,
    )
    label_style = ParagraphStyle(
        "label",
        parent=styles["Normal"],
        fontSize=9,
        textColor=colors.HexColor("#9ca3af"),
        spaceAfter=2,
    )
    value_style = ParagraphStyle(
        "value",
        parent=styles["Normal"],
        fontSize=11,
        textColor=colors.HexColor("#111827"),
        spaceAfter=8,
    )

    story = []

    # Header
    story.append(Paragraph(data.event_title, title_style))
    story.append(Paragraph(f"Ticket #{data.ticket_id[:8].upper()}", sub_style))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#e5e7eb")))
    story.append(Spacer(1, 8 * mm))

    # Details table
    details = [
        ["Attendee", data.attendee_name],
        ["Email", data.attendee_email],
        ["Date", data.event_start],
        ["Ends", data.event_end],
        ["Location", data.event_location if not data.is_online else "Online Event"],
    ]
    if data.is_online and data.online_link:
        details.append(["Link", data.online_link])
    if data.is_paid:
        amount_str = (
            f"₹{data.amount / 100:.2f}" if data.amount else "Paid"
        )
        details.append(["Amount", amount_str])
        if data.payment_status:
            details.append(["Payment", data.payment_status.capitalize()])

    tbl = Table(
        [[Paragraph(k, label_style), Paragraph(v, value_style)] for k, v in details],
        colWidths=[45 * mm, None],
    )
    tbl.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
                ("ROWBACKGROUNDS", (0, 0), (-1, -1), [colors.white, colors.HexColor("#f9fafb")]),
                ("GRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#e5e7eb")),
                ("ROUNDEDCORNERS", [4]),
            ]
        )
    )
    story.append(tbl)
    story.append(Spacer(1, 10 * mm))

    # Entry QR code
    story.append(Paragraph("Entry QR Code", sub_style))
    entry_qr = _make_qr_image(data.rsvp_id, size_px=140)
    story.append(entry_qr)
    story.append(Spacer(1, 4 * mm))

    # Footer
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#e5e7eb")))
    story.append(Spacer(1, 4 * mm))
    story.append(
        Paragraph(
            "Present this QR code at the venue. This ticket is non-transferable.",
            ParagraphStyle(
                "footer",
                parent=styles["Normal"],
                fontSize=8,
                textColor=colors.HexColor("#9ca3af"),
            ),
        )
    )

    doc.build(story)
    return buf.getvalue()
