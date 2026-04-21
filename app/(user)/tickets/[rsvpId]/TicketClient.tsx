'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Printer, Download, ArrowLeft, MapPin, Calendar, User, CreditCard } from 'lucide-react';
import Link from 'next/link';

type TicketData = {
  ticketId: string;
  rsvpId: string;
  eventId: string;
  createdAt: string;
  user: { name: string; email: string };
  event: {
    title: string;
    description: string;
    startTime: string;
    endTime: string;
    latitude: number;
    longitude: number;
    isPaid: boolean;
    ticketPrice: number | null;
    paymentQrUrl: string | null;
    organizer: { name: string | null };
  };
  payment: { amount: number; currency: string; status: string } | null;
};

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('en-IN', {
    weekday: 'short', day: 'numeric', month: 'long',
    year: 'numeric', hour: '2-digit', minute: '2-digit'
  }).format(new Date(iso));
}
function formatShortDate(iso: string) {
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric'
  }).format(new Date(iso));
}
function formatAmount(amount: number, currency: string) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: currency || 'INR', maximumFractionDigits: 0
  }).format(amount / 100);
}

export function TicketClient({ ticket }: { ticket: TicketData }) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    import('qrcode').then((QRCode) => {
      QRCode.toDataURL(
        JSON.stringify({ ticketId: ticket.ticketId, rsvpId: ticket.rsvpId, eventId: ticket.eventId }),
        { width: 200, margin: 1, color: { dark: '#0f766e', light: '#ffffff' } }
      ).then(setQrDataUrl).catch(console.error);
    }).catch(console.error);
  }, [ticket]);

  // Triggers a real file download from the server-side PDF route.
  async function handleDownload() {
    if (downloading) return;
    setDownloading(true);
    try {
      const res = await fetch(`/api/tickets/${ticket.rsvpId}/pdf`);
      if (!res.ok) throw new Error('PDF generation failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ILLAKA-Ticket-${ticket.ticketId.slice(0, 8).toUpperCase()}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed:', err);
      alert('Could not generate PDF. Please try again.');
    } finally {
      setDownloading(false);
    }
  }

  // Print — opens a clean isolated window, no popup-blocker risk because
  // it is called directly inside a click handler.
  function handlePrint() {
    const shortId = ticket.ticketId.slice(0, 8).toUpperCase();
    const amountLine = ticket.payment
      ? formatAmount(ticket.payment.amount, ticket.payment.currency)
      : ticket.event.ticketPrice
        ? formatAmount(ticket.event.ticketPrice, 'INR')
        : ticket.event.isPaid ? 'Paid event' : 'Free';

    const win = window.open('', '_blank', 'width=900,height=700');
    if (!win) { window.print(); return; }

    win.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>ILLAKA Ticket · #${shortId}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    body { margin: 0; padding: 32px; font-family: system-ui, sans-serif;
           background: #fff; color: #111; -webkit-print-color-adjust: exact;
           print-color-adjust: exact; }
    @page { size: A4 portrait; margin: 14mm; }

    .wrap { max-width: 680px; margin: 0 auto; }

    .header {
      background: linear-gradient(135deg,#0f766e 0%,#c8663f 100%);
      padding: 24px 28px; color: white; border-radius: 16px 16px 0 0;
      display: flex; justify-content: space-between; align-items: flex-start;
    }
    .header h1 { margin: 6px 0 4px; font-size: 22px; font-weight: 700; }
    .header p  { margin: 0; font-size: 12px; opacity: .82; }
    .eyebrow   { font-size: 9px; font-weight: 700; letter-spacing: .28em;
                 text-transform: uppercase; opacity: .72; }
    .mono      { font-family: monospace; font-size: 13px; font-weight: 700;
                 opacity: .92; margin-top: 4px; }
    .badge { display: inline-block; margin-top: 8px; padding: 3px 10px;
      border-radius: 999px; font-size: 9px; font-weight: 700;
      text-transform: uppercase; letter-spacing: .15em; color: #fff; }
    .badge-free     { background: rgba(255,255,255,.22); }
    .badge-pending  { background: rgba(251,191,36,.5); }
    .badge-paid     { background: rgba(74,222,128,.4); }

    .body { border: 2px solid #e5e7eb; border-top: none;
      border-radius: 0 0 16px 16px; padding: 20px;
      display: grid; grid-template-columns: 1fr 190px; gap: 16px; }

    .fields { display: flex; flex-direction: column; gap: 10px; }
    .field { border: 1px solid #e5e7eb; border-radius: 12px;
      padding: 12px 14px; background: #f9fafb; }
    .field.green { border-color: #86efac; background: #f0fdf4; }
    .field.amber { border-color: #fcd34d; background: #fffbeb; }
    .fl { font-size: 9px; font-weight: 700; letter-spacing: .2em;
      text-transform: uppercase; color: #6b7280; margin-bottom: 4px; }
    .field.green .fl { color: #15803d; }
    .field.amber .fl { color: #b45309; }
    .fv { font-size: 14px; font-weight: 600; color: #111; }
    .fs { font-size: 11px; color: #6b7280; margin-top: 2px; }
    .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }

    .qr-col { display: flex; flex-direction: column; align-items: center; gap: 10px; }
    .qr-box { border: 2px solid #e5e7eb; border-radius: 12px; padding: 10px;
      background: #fff; }
    .qr-box img { display: block; width: 150px; height: 150px; }
    .ql { font-size: 8px; font-weight: 700; letter-spacing: .2em;
      text-transform: uppercase; color: #6b7280; text-align: center; }
    .pay-box { border: 2px solid #fcd34d; border-radius: 12px; padding: 10px;
      background: #fffbeb; text-align: center; width: 100%; }
    .pay-box img { display: block; width: 140px; height: 140px; margin: 6px auto; }
    .pl { font-size: 8px; font-weight: 700; letter-spacing: .2em;
      text-transform: uppercase; color: #b45309; }
    .paid-box { border: 2px solid #86efac; border-radius: 12px; padding: 10px;
      background: #f0fdf4; text-align: center; width: 100%; }

    .footer { border-top: 1px dashed #e5e7eb; margin-top: 14px;
      padding-top: 10px; text-align: center; font-size: 9px; color: #9ca3af; }
  </style>
</head>
<body>
<div class="wrap">
  <div class="header">
    <div>
      <div class="eyebrow">ILLAKA · Event Ticket</div>
      <h1>${ticket.event.title}</h1>
      <p>Hosted by ${ticket.event.organizer.name ?? 'Organizer'}</p>
    </div>
    <div style="text-align:right">
      <div class="eyebrow">Ticket No.</div>
      <div class="mono">#${shortId}</div>
      <span class="badge ${ticket.payment ? 'badge-paid' : ticket.event.isPaid ? 'badge-pending' : 'badge-free'}">
        ${ticket.payment ? 'Paid' : ticket.event.isPaid ? 'Pending payment' : 'Free entry'}
      </span>
    </div>
  </div>

  <div class="body">
    <div class="fields">
      <div class="field">
        <div class="fl">Attendee</div>
        <div class="fv">${ticket.user.name}</div>
        <div class="fs">${ticket.user.email}</div>
      </div>
      <div class="field">
        <div class="fl">Date &amp; Time</div>
        <div class="fv">${formatDate(ticket.event.startTime)}</div>
        <div class="fs">Until ${formatDate(ticket.event.endTime)}</div>
      </div>
      <div class="field">
        <div class="fl">Location</div>
        <div class="fv">${ticket.event.latitude.toFixed(4)}, ${ticket.event.longitude.toFixed(4)}</div>
      </div>
      <div class="field ${ticket.payment ? 'green' : ticket.event.isPaid ? 'amber' : ''}">
        <div class="fl">Payment</div>
        <div class="fv">${amountLine}</div>
        ${ticket.payment ? `<div class="fs">Confirmed · ${formatShortDate(ticket.createdAt)}</div>` : ''}
      </div>
      <div class="meta">
        <div class="field">
          <div class="fl">Issued</div>
          <div class="fv" style="font-size:12px">${formatShortDate(ticket.createdAt)}</div>
        </div>
        <div class="field">
          <div class="fl">RSVP ID</div>
          <div class="fv" style="font-size:12px;font-family:monospace">${ticket.rsvpId.slice(0, 8)}</div>
        </div>
      </div>
    </div>

    <div class="qr-col">
      ${qrDataUrl ? `
        <div class="qr-box">
          <img src="${qrDataUrl}" alt="Entry QR" crossorigin="anonymous"/>
        </div>
        <div class="ql">Scan to verify entry</div>
        <div class="ql" style="font-family:monospace">#${shortId}</div>
      ` : '<div style="width:150px;height:150px;background:#f3f4f6;border-radius:12px"></div>'}

      ${ticket.event.isPaid && ticket.event.paymentQrUrl && !ticket.payment ? `
        <div class="pay-box">
          <div class="pl">Pay organizer</div>
          <img src="${ticket.event.paymentQrUrl}" alt="Payment QR" crossorigin="anonymous"/>
          <div class="pl">Scan to pay</div>
        </div>
      ` : ''}

      ${ticket.payment ? `
        <div class="paid-box">
          <div style="font-size:9px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:#15803d">✓ Confirmed</div>
          <div style="font-size:15px;font-weight:700;color:#166534;margin-top:5px">${formatAmount(ticket.payment.amount, ticket.payment.currency)}</div>
        </div>
      ` : ''}
    </div>
  </div>

  <div class="footer">
    Non-transferable · Present QR at entry · ILLAKA © ${new Date().getFullYear()}
  </div>
</div>
<script>window.onload = function() { setTimeout(function() { window.print(); }, 350); };</script>
</body>
</html>`);
    win.document.close();
  }

  const amountDisplay = ticket.payment
    ? formatAmount(ticket.payment.amount, ticket.payment.currency)
    : ticket.event.ticketPrice
      ? formatAmount(ticket.event.ticketPrice, 'INR')
      : ticket.event.isPaid ? 'Paid event' : 'Free';

  const paymentStatusBadge = ticket.payment ? 'Paid'
    : ticket.event.isPaid ? 'Pending payment' : 'Free entry';

  return (
    <div className="min-h-screen bg-[var(--bg)] pb-12">
      {/* Toolbar */}
      <div className="mx-auto max-w-2xl px-4 py-6 flex items-center justify-between gap-4">
        <Button asChild variant="outline" size="sm">
          <Link href={`/events/${ticket.eventId}`}>
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Back to event
          </Link>
        </Button>
        <div className="flex gap-2">
          <Button onClick={handlePrint} variant="outline" size="sm">
            <Printer className="h-4 w-4 mr-1.5" />
            Print
          </Button>
          <Button
            onClick={handleDownload}
            disabled={downloading}
            size="sm"
            className="bg-[var(--accent)] hover:bg-[var(--accent-strong)] text-white border-0"
          >
            <Download className="h-4 w-4 mr-1.5" />
            {downloading ? 'Generating…' : 'Download PDF'}
          </Button>
        </div>
      </div>

      {/* Ticket preview (on-screen) */}
      <div className="mx-auto max-w-2xl px-4">
        <div className="overflow-hidden rounded-[2rem] border-2 border-[var(--line)] bg-[var(--surface-strong)] shadow-[0_28px_90px_rgba(17,24,39,0.18)]">

          {/* Header */}
          <div className="bg-[linear-gradient(135deg,#0f766e_0%,#c8663f_100%)] px-8 py-6 text-white">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-white/72">ILLAKA · Event Ticket</p>
                <h1 className="mt-3 text-3xl font-bold leading-tight">{ticket.event.title}</h1>
                <p className="mt-1 text-sm text-white/80">Hosted by {ticket.event.organizer.name ?? 'Organizer'}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[10px] uppercase tracking-widest text-white/60">Ticket No.</p>
                <p className="mt-1 font-mono text-sm font-bold text-white/90">#{ticket.ticketId.slice(0, 8).toUpperCase()}</p>
                <span className={`mt-2 inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                  ticket.payment ? 'bg-green-400/30' : ticket.event.isPaid ? 'bg-amber-400/30' : 'bg-white/20'
                }`}>
                  {paymentStatusBadge}
                </span>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="grid gap-5 p-6 sm:grid-cols-[1fr_180px]">
            <div className="space-y-3">

              <div className="rounded-[1.2rem] border border-[var(--line)] bg-[rgba(255,255,255,0.5)] p-4 dark:bg-[rgba(15,23,42,0.22)]">
                <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-[var(--secondary)] mb-1">
                  <User className="h-3 w-3" /> Attendee
                </p>
                <p className="text-base font-semibold">{ticket.user.name}</p>
                <p className="text-sm text-muted">{ticket.user.email}</p>
              </div>

              <div className="rounded-[1.2rem] border border-[var(--line)] bg-[rgba(255,255,255,0.5)] p-4 dark:bg-[rgba(15,23,42,0.22)]">
                <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-[var(--secondary)] mb-1">
                  <Calendar className="h-3 w-3" /> Date &amp; Time
                </p>
                <p className="text-sm font-semibold">{formatDate(ticket.event.startTime)}</p>
                <p className="text-xs text-muted">Until {formatDate(ticket.event.endTime)}</p>
              </div>

              <div className="rounded-[1.2rem] border border-[var(--line)] bg-[rgba(255,255,255,0.5)] p-4 dark:bg-[rgba(15,23,42,0.22)]">
                <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-[var(--secondary)] mb-1">
                  <MapPin className="h-3 w-3" /> Location
                </p>
                <p className="text-sm font-semibold">{ticket.event.latitude.toFixed(4)}, {ticket.event.longitude.toFixed(4)}</p>
                <a
                  href={`https://maps.google.com/?q=${ticket.event.latitude},${ticket.event.longitude}`}
                  target="_blank" rel="noopener noreferrer"
                  className="text-xs text-[var(--accent)] hover:underline"
                >
                  Open in Google Maps ↗
                </a>
              </div>

              <div className={`rounded-[1.2rem] border p-4 ${
                ticket.payment ? 'border-green-300 bg-green-50 dark:bg-green-900/20'
                  : ticket.event.isPaid ? 'border-amber-300 bg-amber-50 dark:bg-amber-900/20'
                  : 'border-[var(--line)] bg-[rgba(255,255,255,0.5)] dark:bg-[rgba(15,23,42,0.22)]'
              }`}>
                <p className={`flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest mb-1 ${
                  ticket.payment ? 'text-green-700 dark:text-green-400'
                    : ticket.event.isPaid ? 'text-amber-700 dark:text-amber-400'
                    : 'text-[var(--secondary)]'
                }`}>
                  <CreditCard className="h-3 w-3" /> Payment
                </p>
                <p className="text-lg font-bold">{amountDisplay}</p>
                {ticket.payment && (
                  <p className="text-xs text-muted mt-0.5">Confirmed · {formatShortDate(ticket.createdAt)}</p>
                )}
                {!ticket.payment && ticket.event.isPaid && (
                  <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">Scan payment QR to complete payment</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-[1rem] border border-[var(--line)] bg-[rgba(255,255,255,0.5)] p-3 dark:bg-[rgba(15,23,42,0.22)]">
                  <p className="text-[9px] uppercase tracking-widest text-muted">Issued</p>
                  <p className="text-sm font-semibold mt-1">{formatShortDate(ticket.createdAt)}</p>
                </div>
                <div className="rounded-[1rem] border border-[var(--line)] bg-[rgba(255,255,255,0.5)] p-3 dark:bg-[rgba(15,23,42,0.22)]">
                  <p className="text-[9px] uppercase tracking-widest text-muted">RSVP ID</p>
                  <p className="font-mono text-sm font-semibold mt-1">{ticket.rsvpId.slice(0, 8)}</p>
                </div>
              </div>
            </div>

            {/* QR panel */}
            <div className="flex flex-col items-center gap-3">
              {qrDataUrl ? (
                <>
                  <div className="rounded-[1.2rem] border-2 border-[var(--line)] bg-white p-3">
                    <img src={qrDataUrl} alt="Ticket QR" width={148} height={148} className="block" />
                  </div>
                  <p className="text-[9px] font-semibold uppercase tracking-widest text-muted text-center">Scan to verify entry</p>
                  <p className="font-mono text-[10px] text-muted">#{ticket.ticketId.slice(0, 8).toUpperCase()}</p>
                </>
              ) : (
                <div className="h-44 w-44 animate-pulse rounded-[1.2rem] bg-[var(--surface)]" />
              )}

              {ticket.event.isPaid && ticket.event.paymentQrUrl && !ticket.payment && (
                <div className="w-full rounded-[1.2rem] border-2 border-amber-300 bg-amber-50 dark:bg-amber-900/20 p-3 text-center">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-amber-700 dark:text-amber-400 mb-1">Pay organizer</p>
                  <img src={ticket.event.paymentQrUrl} alt="Payment QR" width={136} height={136} className="mx-auto block rounded-xl" />
                  <p className="mt-1 text-[9px] text-amber-700 dark:text-amber-400">Scan to pay at door</p>
                </div>
              )}

              {ticket.payment && (
                <div className="w-full rounded-[1.2rem] border-2 border-green-300 bg-green-50 dark:bg-green-900/20 p-3 text-center">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-green-700 dark:text-green-400">✓ Paid</p>
                  <p className="text-sm font-bold text-green-800 dark:text-green-300 mt-1">
                    {formatAmount(ticket.payment.amount, ticket.payment.currency)}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-dashed border-[var(--line)] px-8 py-4">
            <p className="text-center text-xs text-muted">
              Non-transferable · Present QR at entry · ILLAKA © {new Date().getFullYear()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
