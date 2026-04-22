import { NextRequest, NextResponse } from 'next/server';

import { getEnvOptional } from '@/lib/config';
import { sendReminderEmail } from '@/lib/mailer';
import { prisma } from '@/lib/prisma';

// ── helpers ────────────────────────────────────────────────────────────────────

function formatDate(date: Date): string {
  return date.toLocaleString('en-IN', {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: 'Asia/Kolkata',
  });
}

function physicalEmailHtml(params: {
  userName: string;
  eventTitle: string;
  startTime: Date;
  location: string;
  reminderLabel: string;
}): string {
  const { userName, eventTitle, startTime, location, reminderLabel } = params;
  return `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
      <h2>Hi ${userName},</h2>
      <p>This is a reminder that <strong>${eventTitle}</strong> starts in <strong>${reminderLabel}</strong>.</p>
      <table style="border-collapse:collapse;width:100%;">
        <tr><td style="padding:8px;font-weight:bold;">When</td><td style="padding:8px;">${formatDate(startTime)}</td></tr>
        <tr><td style="padding:8px;font-weight:bold;">Where</td><td style="padding:8px;">${location}</td></tr>
      </table>
      <p>See you there!</p>
      <hr/>
      <small style="color:#888;">You received this because you RSVPed to this event on Ilaka.</small>
    </div>
  `;
}

function onlineEmailHtml(params: {
  userName: string;
  eventTitle: string;
  startTime: Date;
  onlineLink: string;
  reminderLabel: string;
}): string {
  const { userName, eventTitle, startTime, onlineLink, reminderLabel } = params;
  return `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
      <h2>Hi ${userName},</h2>
      <p>This is a reminder that <strong>${eventTitle}</strong> starts in <strong>${reminderLabel}</strong>.</p>
      <table style="border-collapse:collapse;width:100%;">
        <tr><td style="padding:8px;font-weight:bold;">When</td><td style="padding:8px;">${formatDate(startTime)}</td></tr>
        <tr><td style="padding:8px;font-weight:bold;">Meeting link</td><td style="padding:8px;"><a href="${onlineLink}">${onlineLink}</a></td></tr>
      </table>
      <p>See you online!</p>
      <hr/>
      <small style="color:#888;">You received this because you RSVPed to this event on Ilaka.</small>
    </div>
  `;
}

// ── types ──────────────────────────────────────────────────────────────────────

type ReminderType = '6h' | '1h' | '1d';

interface ReminderWindow {
  type: ReminderType;
  label: string;
  /** Lower bound: now + lowerOffsetMs */
  lowerOffsetMs: number;
  /** Upper bound: now + upperOffsetMs */
  upperOffsetMs: number;
  /** Which event types to include */
  eventTypes: ('PHYSICAL' | 'ONLINE')[];
}

// ── cron handler ───────────────────────────────────────────────────────────────

export async function GET(req: NextRequest): Promise<NextResponse> {
  // ----- auth ----------------------------------------------------------------
  const cronSecret = getEnvOptional('CRON_SECRET');
  if (cronSecret) {
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const now = new Date();

  // 5-minute buffer so that an event at exactly T+Xh is caught even if the
  // cron fires a few minutes late.
  const BUFFER_MS = 5 * 60 * 1000;

  const windows: ReminderWindow[] = [
    {
      type: '6h',
      label: '6 hours',
      lowerOffsetMs: 6 * 60 * 60 * 1000 - BUFFER_MS,
      upperOffsetMs: 6 * 60 * 60 * 1000 + BUFFER_MS,
      eventTypes: ['PHYSICAL'],
    },
    {
      type: '1h',
      label: '1 hour',
      lowerOffsetMs: 60 * 60 * 1000 - BUFFER_MS,
      upperOffsetMs: 60 * 60 * 1000 + BUFFER_MS,
      eventTypes: ['PHYSICAL', 'ONLINE'],
    },
    {
      type: '1d',
      label: '1 day',
      lowerOffsetMs: 24 * 60 * 60 * 1000 - BUFFER_MS,
      upperOffsetMs: 24 * 60 * 60 * 1000 + BUFFER_MS,
      eventTypes: ['ONLINE'],
    },
  ];

  const results: Record<ReminderType, { sent: number; skipped: number; errors: number }> = {
    '6h': { sent: 0, skipped: 0, errors: 0 },
    '1h': { sent: 0, skipped: 0, errors: 0 },
    '1d': { sent: 0, skipped: 0, errors: 0 },
  };

  for (const window of windows) {
    const lowerBound = new Date(now.getTime() + window.lowerOffsetMs);
    const upperBound = new Date(now.getTime() + window.upperOffsetMs);

    // Fetch events in the time window matching allowed event types.
    const events = await prisma.event.findMany({
      where: {
        startTime: { gte: lowerBound, lte: upperBound },
        eventType: { in: window.eventTypes },
      },
      include: {
        rsvps: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    for (const event of events) {
      for (const rsvp of event.rsvps) {
        const { user } = rsvp;

        // Skip if reminder already sent for this event/user/type combo.
        const alreadySent = await prisma.reminderLog.findUnique({
          where: {
            eventId_userId_type: {
              eventId: event.id,
              userId: user.id,
              type: window.type,
            },
          },
        });

        if (alreadySent) {
          results[window.type].skipped++;
          continue;
        }

        // Build email content.
        const subject = `Reminder: "${event.title}" starts in ${window.label}`;
        let html: string;

        if (event.eventType === 'ONLINE') {
          html = onlineEmailHtml({
            userName: user.name,
            eventTitle: event.title,
            startTime: event.startTime,
            onlineLink: event.onlineLink ?? '(link not available)',
            reminderLabel: window.label,
          });
        } else {
          // For PHYSICAL events use lat/lng as fallback location text.
          const locationText = `${event.latitude}, ${event.longitude}`;
          html = physicalEmailHtml({
            userName: user.name,
            eventTitle: event.title,
            startTime: event.startTime,
            location: locationText,
            reminderLabel: window.label,
          });
        }

        try {
          await sendReminderEmail(user.email, subject, html);

          // Record that this reminder was sent.
          await prisma.reminderLog.create({
            data: {
              eventId: event.id,
              userId: user.id,
              type: window.type,
            },
          });

          results[window.type].sent++;
        } catch (err) {
          console.error(
            `[cron/reminders] Failed to send ${window.type} reminder for event ${event.id} to user ${user.id}:`,
            err,
          );
          results[window.type].errors++;
        }
      }
    }
  }

  return NextResponse.json({ ok: true, timestamp: now.toISOString(), results });
}
