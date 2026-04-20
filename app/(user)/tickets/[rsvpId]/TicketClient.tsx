'use client';

import { useEffect, useState } from 'react';
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
    paymentQrUrl: string | null;
    organizer: { name: string | null };
  };
  payment: { amount: number; currency: string; status: string } | null;
};

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(iso));
}

function formatShortDate(iso: string) {
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(new Date(iso));
}

function formatAmount(amount: number, currency: string) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency || 'INR',
    maximumFractionDigits: 0
  }).format(amount / 100);
}

export function TicketClient({ ticket }: { ticket: TicketData }) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  useEffect(() => {
    const qrPayload = JSON.stringify({
      ticketId: ticket.ticketId,
      rsvpId: ticket.rsvpId,
      eventId: ticket.eventId
    });
    import('qrcode').then((QRCode) => {
      QRCode.toDataURL(qrPayload, {
        width: 200,
        margin: 1,
        color: { dark: '#0f766e', light: '#ffffff' }
      }).then(setQrDataUrl).catch(console.error);
    }).catch(console.error);
  }, [ticket]);

  const amountDisplay = ticket.payment
    ? formatAmount(ticket.payment.amount, ticket.payment.currency)
    : ticket.event.isPaid
    ? 'Pay at door'
    : 'Free';

  const paymentStatusBadge = ticket.payment
    ? 'Paid'
    : ticket.event.isPaid
    ? 'Pending payment'
    : 'Free entry';

  return (
    <>
      {/* Print-hidden toolbar */}
      <div className="no-print mx-auto max-w-2xl px-4 py-6 flex items-center justify-between gap-4">
        <Button asChild variant="outline" size="sm">
          <Link href={`/events/${ticket.eventId}`}>
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Back to event
          </Link>
        </Button>
        <div className="flex gap-2">
          <Button onClick={() => window.print()} variant="outline" size="sm">
            <Printer className="h-4 w-4 mr-1.5" />
            Print
          </Button>
          <Button onClick={() => window.print()} size="sm" className="bg-[var(--accent)] hover:bg-[var(--accent-strong)] text-white border-0">
            <Download className="h-4 w-4 mr-1.5" />
            Save as PDF
          </Button>
        </div>
      </div>

      {/* Ticket */}
      <div className="ticket-sheet mx-auto max-w-2xl px-4 pb-12">
        <div className="overflow-hidden rounded-[2rem] border-2 border-[var(--line)] bg-[var(--surface-strong)] shadow-[0_28px_90px_rgba(17,24,39,0.18)]">

          {/* Header */}
          <div className="bg-[linear-gradient(135deg,#0f766e_0%,#c8663f_100%)] px-8 py-6 text-white">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-white/72">
                  ILLAKA · Event Ticket
                </p>
                <h1 className="mt-3 text-3xl font-bold leading-tight">{ticket.event.title}</h1>
                <p className="mt-1 text-sm text-white/80">
                  Hosted by {ticket.event.organizer.name ?? 'Organizer'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-widest text-white/60">Ticket No.</p>
                <p className="mt-1 font-mono text-sm font-bold text-white/90">
                  #{ticket.ticketId.slice(0, 8).toUpperCase()}
                </p>
                <span className={`mt-2 inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                  ticket.payment
                    ? 'bg-green-400/30 text-white'
                    : ticket.event.isPaid
                    ? 'bg-amber-400/30 text-white'
                    : 'bg-white/20 text-white'
                }`}>
                  {paymentStatusBadge}
                </span>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="grid gap-6 p-6 sm:grid-cols-[1fr_auto]">
            <div className="space-y-4">

              {/* Attendee */}
              <div className="rounded-[1.4rem] border border-[var(--line)] bg-[rgba(255,255,255,0.5)] p-4 dark:bg-[rgba(15,23,42,0.22)]">
                <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-[var(--secondary)]">
                  <User className="h-3.5 w-3.5" />
                  Attendee
                </div>
                <p className="mt-2 text-lg font-semibold">{ticket.user.name}</p>
                <p className="text-sm text-muted">{ticket.user.email}</p>
              </div>

              {/* Date & Time */}
              <div className="rounded-[1.4rem] border border-[var(--line)] bg-[rgba(255,255,255,0.5)] p-4 dark:bg-[rgba(15,23,42,0.22)]">
                <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-[var(--secondary)]">
                  <Calendar className="h-3.5 w-3.5" />
                  Date & Time
                </div>
                <p className="mt-2 font-semibold">{formatDate(ticket.event.startTime)}</p>
                <p className="text-sm text-muted">Until {formatDate(ticket.event.endTime)}</p>
              </div>

              {/* Location */}
              <div className="rounded-[1.4rem] border border-[var(--line)] bg-[rgba(255,255,255,0.5)] p-4 dark:bg-[rgba(15,23,42,0.22)]">
                <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-[var(--secondary)]">
                  <MapPin className="h-3.5 w-3.5" />
                  Location
                </div>
                <p className="mt-2 font-semibold">
                  {ticket.event.latitude.toFixed(4)}, {ticket.event.longitude.toFixed(4)}
                </p>
                <a
                  href={`https://maps.google.com/?q=${ticket.event.latitude},${ticket.event.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 text-sm text-[var(--accent)] hover:underline no-print"
                >
                  Open in Google Maps ↗
                </a>
              </div>

              {/* Payment */}
              <div className={`rounded-[1.4rem] border p-4 ${
                ticket.payment
                  ? 'border-green-300 bg-green-50 dark:bg-green-900/20'
                  : ticket.event.isPaid
                  ? 'border-amber-300 bg-amber-50 dark:bg-amber-900/20'
                  : 'border-[var(--line)] bg-[rgba(255,255,255,0.5)] dark:bg-[rgba(15,23,42,0.22)]'
              }`}>
                <div className={`flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest ${
                  ticket.payment ? 'text-green-700 dark:text-green-400'
                    : ticket.event.isPaid ? 'text-amber-700 dark:text-amber-400'
                    : 'text-[var(--secondary)]'
                }`}>
                  <CreditCard className="h-3.5 w-3.5" />
                  Payment
                </div>
                <p className="mt-2 text-xl font-bold">{amountDisplay}</p>
                {ticket.payment && (
                  <p className="text-sm text-muted mt-1">Payment confirmed · {formatShortDate(ticket.createdAt)}</p>
                )}
                {!ticket.payment && ticket.event.isPaid && (
                  <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                    Please scan the payment QR below to pay the organizer
                  </p>
                )}
              </div>

              {/* Ticket meta */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-[1.2rem] border border-[var(--line)] bg-[rgba(255,255,255,0.5)] p-3 dark:bg-[rgba(15,23,42,0.22)]">
                  <p className="text-[10px] uppercase tracking-widest text-muted">Issued</p>
                  <p className="mt-1.5 text-sm font-semibold">{formatShortDate(ticket.createdAt)}</p>
                </div>
                <div className="rounded-[1.2rem] border border-[var(--line)] bg-[rgba(255,255,255,0.5)] p-3 dark:bg-[rgba(15,23,42,0.22)]">
                  <p className="text-[10px] uppercase tracking-widest text-muted">RSVP ID</p>
                  <p className="mt-1.5 font-mono text-sm font-semibold">{ticket.rsvpId.slice(0, 8)}</p>
                </div>
              </div>
            </div>

            {/* QR Code panel */}
            <div className="flex flex-col items-center gap-4">
              {/* Entry QR */}
              {qrDataUrl ? (
                <div className="rounded-[1.5rem] border-2 border-[var(--line)] bg-white p-4">
                  <img src={qrDataUrl} alt="Ticket QR code" width={160} height={160} className="block" />
                </div>
              ) : (
                <div className="h-[192px] w-[192px] animate-pulse rounded-[1.5rem] bg-[var(--surface)]" />
              )}
              <div className="text-center">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted">Scan to verify entry</p>
                <p className="mt-1 font-mono text-xs text-muted">#{ticket.ticketId.slice(0, 8).toUpperCase()}</p>
              </div>

              {/* Organizer payment QR */}
              {ticket.event.isPaid && ticket.event.paymentQrUrl && !ticket.payment && (
                <div className="mt-2 rounded-[1.4rem] border-2 border-amber-300 bg-amber-50 dark:bg-amber-900/20 p-3 text-center w-full">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-amber-700 dark:text-amber-400 mb-2">
                    Pay organizer
                  </p>
                  <img
                    src={ticket.event.paymentQrUrl}
                    alt="Payment QR"
                    width={140}
                    height={140}
                    className="mx-auto block rounded-xl"
                  />
                  <p className="mt-2 text-[10px] text-amber-700 dark:text-amber-400">
                    Scan to pay at the door
                  </p>
                </div>
              )}

              {ticket.payment && (
                <div className="rounded-[1.4rem] border-2 border-green-300 bg-green-50 dark:bg-green-900/20 p-3 text-center w-full">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-green-700 dark:text-green-400">
                    ✓ Payment confirmed
                  </p>
                  <p className="mt-1 text-sm font-bold text-green-800 dark:text-green-300">
                    {formatAmount(ticket.payment.amount, ticket.payment.currency)}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-dashed border-[var(--line)] px-8 py-4">
            <p className="text-center text-xs text-muted">
              This ticket is non-transferable · Present QR code at entry · ILLAKA © {new Date().getFullYear()}
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          .ticket-sheet { max-width: 100% !important; padding: 0 !important; }
          body { background: white !important; }
        }
      `}</style>
    </>
  );
}
