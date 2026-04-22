import nodemailer from 'nodemailer';

import { getEnvOptional } from './config';

// Lazily created transporter — only valid when SMTP env vars are present.
let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  if (transporter) return transporter;

  const host = getEnvOptional('SMTP_HOST');
  const portStr = getEnvOptional('SMTP_PORT');
  const user = getEnvOptional('SMTP_USER');
  const pass = getEnvOptional('SMTP_PASS');

  if (!host || !user || !pass) {
    return null;
  }

  const port = portStr ? parseInt(portStr, 10) : 587;

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  return transporter;
}

/**
 * Send a reminder email.
 * Gracefully skips (with a console warning) when SMTP is not configured.
 */
export async function sendReminderEmail(
  to: string,
  subject: string,
  html: string,
): Promise<void> {
  const transport = getTransporter();

  if (!transport) {
    console.warn(
      `[mailer] SMTP not configured — skipping reminder email to ${to} (subject: "${subject}")`,
    );
    return;
  }

  const from =
    getEnvOptional('SMTP_FROM') ??
    getEnvOptional('SMTP_USER') ??
    'no-reply@ilaka.app';

  await transport.sendMail({ from, to, subject, html });
}
