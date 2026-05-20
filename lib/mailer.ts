import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD,
  },
});

export async function sendReminderEmail(to: string, subject: string, html: string): Promise<void> {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) {
    console.warn(`[mailer] Email not configured — skipping reminder to ${to}`);
    return;
  }
  await transporter.sendMail({ from: `"ILAKA" <${process.env.EMAIL_USER}>`, to, subject, html });
}

export interface TicketEmailData {
  to: string;
  userName: string;
  eventTitle: string;
  eventDate: string;
  ticketId: string;
  rsvpId: string;
  ticketPrice: number | null;
  organizerName: string;
}

function formatINR(paise: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 0,
  }).format(paise / 100);
}

export async function sendTicketEmail(data: TicketEmailData) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) {
    console.warn('[mailer] EMAIL_USER or EMAIL_APP_PASSWORD not set — skipping email');
    return;
  }

  const ticketUrl = `${process.env.NEXTAUTH_URL ?? 'http://localhost:3000'}/tickets/${data.rsvpId}`;
  const shortId = data.ticketId.slice(0, 8).toUpperCase();
  const amountLine = data.ticketPrice
    ? `<p style="margin:4px 0 0;font-size:13px;color:#b45309;">Amount: <strong>${formatINR(data.ticketPrice)}</strong></p>`
    : '<p style="margin:4px 0 0;font-size:13px;color:#15803d;">Free Entry</p>';

  const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><title>Your ILAKA Ticket</title></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10);">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#0f766e 0%,#c8663f 100%);padding:32px 36px;">
            <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:0.3em;text-transform:uppercase;color:rgba(255,255,255,0.7);">ILAKA · Event Ticket</p>
            <h1 style="margin:12px 0 6px;font-size:26px;font-weight:700;color:#fff;line-height:1.2;">${data.eventTitle}</h1>
            <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.8);">Hosted by ${data.organizerName}</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:28px 36px;">

            <p style="margin:0 0 20px;font-size:15px;color:#374151;">Hi <strong>${data.userName}</strong>, your spot is confirmed!</p>

            <!-- Ticket details card -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:14px;margin-bottom:20px;">
              <tr>
                <td style="padding:20px 24px;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="padding-bottom:14px;border-bottom:1px solid #e5e7eb;">
                        <p style="margin:0;font-size:10px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:#6b7280;">Ticket No.</p>
                        <p style="margin:4px 0 0;font-size:16px;font-weight:700;font-family:monospace;color:#111;">#${shortId}</p>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:14px 0;border-bottom:1px solid #e5e7eb;">
                        <p style="margin:0;font-size:10px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:#6b7280;">Attendee</p>
                        <p style="margin:4px 0 0;font-size:15px;font-weight:600;color:#111;">${data.userName}</p>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:14px 0;border-bottom:1px solid #e5e7eb;">
                        <p style="margin:0;font-size:10px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:#6b7280;">Event</p>
                        <p style="margin:4px 0 0;font-size:15px;font-weight:600;color:#111;">${data.eventTitle}</p>
                        <p style="margin:4px 0 0;font-size:13px;color:#6b7280;">${data.eventDate}</p>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:14px 0 0;">
                        <p style="margin:0;font-size:10px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:#6b7280;">Payment</p>
                        ${amountLine}
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <!-- CTA button -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
              <tr>
                <td align="center">
                  <a href="${ticketUrl}" style="display:inline-block;background:linear-gradient(135deg,#0f766e,#c8663f);color:#fff;font-size:14px;font-weight:700;text-decoration:none;padding:14px 32px;border-radius:999px;">View &amp; Download Ticket</a>
                </td>
              </tr>
            </table>

            <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">Present your entry QR code at the event entrance.<br/>This ticket is non-transferable.</p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:16px 36px;text-align:center;">
            <p style="margin:0;font-size:11px;color:#9ca3af;">ILAKA · Community Events Platform · © ${new Date().getFullYear()}</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  await transporter.sendMail({
    from: `"ILAKA Events" <${process.env.EMAIL_USER}>`,
    to: data.to,
    subject: `Your ticket for "${data.eventTitle}" — #${shortId}`,
    html,
  });
}

export async function sendVerificationEmail(to: string, verifyUrl: string): Promise<void> {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) {
    console.log(`[mailer] No email credentials — verify link for ${to}: ${verifyUrl}`);
    return;
  }

  const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><title>Verify your ILAKA email</title></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 16px;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10);">
        <tr>
          <td style="background:linear-gradient(135deg,#0f766e 0%,#c8663f 100%);padding:32px 36px;">
            <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:0.3em;text-transform:uppercase;color:rgba(255,255,255,0.7);">ILAKA · Email Verification</p>
            <h1 style="margin:12px 0 0;font-size:24px;font-weight:700;color:#fff;">Verify your email</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:32px 36px;">
            <p style="margin:0 0 20px;font-size:15px;color:#374151;">Welcome to ILAKA! Click the button below to verify your email — the link expires in <strong>24 hours</strong>.</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
              <tr>
                <td align="center">
                  <a href="${verifyUrl}" style="display:inline-block;background:linear-gradient(135deg,#0f766e,#c8663f);color:#fff;font-size:14px;font-weight:700;text-decoration:none;padding:14px 32px;border-radius:999px;">Verify my email</a>
                </td>
              </tr>
            </table>
            <p style="margin:0;font-size:13px;color:#6b7280;">If you didn't create an account, you can safely ignore this email.</p>
          </td>
        </tr>
        <tr>
          <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:16px 36px;text-align:center;">
            <p style="margin:0;font-size:11px;color:#9ca3af;">ILAKA · Community Events Platform · © ${new Date().getFullYear()}</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  await transporter.sendMail({
    from: `"ILAKA" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Verify your ILAKA email address',
    html,
  });
}

export async function sendApiKeyEmail(to: string, keyPrefix: string): Promise<void> {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) {
    console.warn(`[mailer] Email not configured — skipping API key email to ${to}`);
    return;
  }

  const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><title>Your new ILAKA API key</title></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 16px;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10);">
        <tr>
          <td style="background:linear-gradient(135deg,#0f766e 0%,#c8663f 100%);padding:32px 36px;">
            <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:0.3em;text-transform:uppercase;color:rgba(255,255,255,0.7);">ILAKA · API Access</p>
            <h1 style="margin:12px 0 0;font-size:24px;font-weight:700;color:#fff;">New API key created</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:32px 36px;">
            <p style="margin:0 0 16px;font-size:15px;color:#374151;">A new API key starting with <code style="background:#f3f4f6;padding:2px 6px;border-radius:4px;font-family:monospace;">${keyPrefix}…</code> was just created for your account.</p>
            <p style="margin:0 0 20px;font-size:14px;color:#6b7280;">The full key was shown once in your browser and is not stored by ILAKA. If you did not create this key, revoke it immediately from your account settings.</p>
            <p style="margin:0;font-size:13px;color:#9ca3af;">Keep your API key secret — treat it like a password.</p>
          </td>
        </tr>
        <tr>
          <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:16px 36px;text-align:center;">
            <p style="margin:0;font-size:11px;color:#9ca3af;">ILAKA · Community Events Platform · © ${new Date().getFullYear()}</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  await transporter.sendMail({
    from: `"ILAKA" <${process.env.EMAIL_USER}>`,
    to,
    subject: `New API key created — ${keyPrefix}…`,
    html,
  });
}

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) {
    console.log(`[mailer] No email credentials — reset link for ${to}: ${resetUrl}`);
    return;
  }

  const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><title>Reset your ILAKA password</title></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 16px;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10);">
        <tr>
          <td style="background:linear-gradient(135deg,#0f766e 0%,#c8663f 100%);padding:32px 36px;">
            <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:0.3em;text-transform:uppercase;color:rgba(255,255,255,0.7);">ILAKA · Account Recovery</p>
            <h1 style="margin:12px 0 0;font-size:24px;font-weight:700;color:#fff;">Reset your password</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:32px 36px;">
            <p style="margin:0 0 20px;font-size:15px;color:#374151;">We received a request to reset your ILAKA password. Click the button below — the link expires in <strong>1 hour</strong>.</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
              <tr>
                <td align="center">
                  <a href="${resetUrl}" style="display:inline-block;background:linear-gradient(135deg,#0f766e,#c8663f);color:#fff;font-size:14px;font-weight:700;text-decoration:none;padding:14px 32px;border-radius:999px;">Set new password</a>
                </td>
              </tr>
            </table>
            <p style="margin:0;font-size:13px;color:#6b7280;">If you didn't request this, you can safely ignore this email — your password won't change.</p>
          </td>
        </tr>
        <tr>
          <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:16px 36px;text-align:center;">
            <p style="margin:0;font-size:11px;color:#9ca3af;">ILAKA · Community Events Platform · © ${new Date().getFullYear()}</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  await transporter.sendMail({
    from: `"ILAKA" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Reset your ILAKA password',
    html,
  });
}
