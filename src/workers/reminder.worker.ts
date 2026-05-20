import { prisma } from '@/lib/prisma';
import { sendReminderEmail } from '@/lib/mailer';
import { logger } from '@/src/core/logger';

type ReminderType = '6h' | '1h' | '1d';
type EventType = 'PHYSICAL' | 'ONLINE';

interface ReminderWindow {
  type: ReminderType;
  label: string;
  lowerOffsetMs: number;
  upperOffsetMs: number;
  eventTypes: EventType[];
}

export type ReminderResult = Record<ReminderType, { sent: number; skipped: number; errors: number }>;

const BUFFER_MS = 5 * 60 * 1000; // 5-minute buffer for late cron fires

const WINDOWS: ReminderWindow[] = [
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

function formatDate(date: Date): string {
  return date.toLocaleString('en-IN', {
    dateStyle: 'full', timeStyle: 'short', timeZone: 'Asia/Kolkata',
  });
}

function buildPhysicalHtml(params: { userName: string; eventTitle: string; startTime: Date; reminderLabel: string }): string {
  const { userName, eventTitle, startTime, reminderLabel } = params;
  return `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
      <h2>Hi ${userName},</h2>
      <p>This is a reminder that <strong>${eventTitle}</strong> starts in <strong>${reminderLabel}</strong>.</p>
      <table style="border-collapse:collapse;width:100%;">
        <tr><td style="padding:8px;font-weight:bold;">When</td><td style="padding:8px;">${formatDate(startTime)}</td></tr>
        <tr><td style="padding:8px;font-weight:bold;">Where</td><td style="padding:8px;">See the event page for full location details.</td></tr>
      </table>
      <p>See you there!</p>
      <hr/>
      <small style="color:#888;">You received this because you RSVPed to this event on Ilaka.</small>
    </div>
  `;
}

function buildOnlineHtml(params: { userName: string; eventTitle: string; startTime: Date; onlineLink: string; reminderLabel: string }): string {
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

export async function processReminders(now = new Date()): Promise<{ timestamp: string; results: ReminderResult }> {
  const results: ReminderResult = {
    '6h': { sent: 0, skipped: 0, errors: 0 },
    '1h': { sent: 0, skipped: 0, errors: 0 },
    '1d': { sent: 0, skipped: 0, errors: 0 },
  };

  for (const window of WINDOWS) {
    const lowerBound = new Date(now.getTime() + window.lowerOffsetMs);
    const upperBound = new Date(now.getTime() + window.upperOffsetMs);

    const events = await prisma.event.findMany({
      where: {
        startTime: { gte: lowerBound, lte: upperBound },
        eventType: { in: window.eventTypes },
      },
      include: {
        rsvps: { include: { user: { select: { id: true, name: true, email: true } } } },
      },
    });

    for (const event of events) {
      for (const rsvp of event.rsvps) {
        const { user } = rsvp;

        // Idempotency check — skip if this reminder was already sent
        const alreadySent = await prisma.reminderLog.findUnique({
          where: { eventId_userId_type: { eventId: event.id, userId: user.id, type: window.type } },
        });
        if (alreadySent) { results[window.type].skipped++; continue; }

        const subject = `Reminder: "${event.title}" starts in ${window.label}`;
        const html = event.eventType === 'ONLINE'
          ? buildOnlineHtml({ userName: user.name, eventTitle: event.title, startTime: event.startTime, onlineLink: event.onlineLink ?? '(link not available)', reminderLabel: window.label })
          : buildPhysicalHtml({ userName: user.name, eventTitle: event.title, startTime: event.startTime, reminderLabel: window.label });

        try {
          await sendReminderEmail(user.email, subject, html);
          await prisma.reminderLog.create({ data: { eventId: event.id, userId: user.id, type: window.type } });
          results[window.type].sent++;
        } catch (err) {
          logger.error('Reminder send failed', { type: window.type, eventId: event.id, userId: user.id, error: String(err) });
          results[window.type].errors++;
        }
      }
    }
  }

  return { timestamp: now.toISOString(), results };
}
