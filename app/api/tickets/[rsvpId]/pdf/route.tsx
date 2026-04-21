import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { renderToBuffer, Document, Page, View, Text, Image, StyleSheet, Font } from '@react-pdf/renderer';
import QRCode from 'qrcode';

type RouteContext = { params: Promise<{ rsvpId: string }> };

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
    padding: 32,
  },
  // Header
  header: {
    borderRadius: 14,
    padding: 24,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    backgroundColor: '#0f766e',
  },
  headerLeft: { flex: 1 },
  headerRight: { alignItems: 'flex-end' },
  headerLabel: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 6,
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: 'Helvetica-Bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  headerSub: { fontSize: 11, color: 'rgba(255,255,255,0.8)' },
  ticketNo: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 4,
  },
  badge: {
    borderRadius: 999,
    paddingVertical: 3,
    paddingHorizontal: 10,
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    color: '#ffffff',
  },
  badgeFree: { backgroundColor: 'rgba(255,255,255,0.25)' },
  badgePaid: { backgroundColor: 'rgba(251,191,36,0.5)' },
  badgeConfirmed: { backgroundColor: 'rgba(74,222,128,0.4)' },
  // Body grid
  body: {
    flexDirection: 'row',
    gap: 14,
  },
  fieldsCol: { flex: 1 },
  qrCol: { width: 170, alignItems: 'center', gap: 10 },
  // Fields
  field: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    padding: 11,
    marginBottom: 10,
    backgroundColor: '#f9fafb',
  },
  fieldGreen: { borderColor: '#86efac', backgroundColor: '#f0fdf4' },
  fieldAmber: { borderColor: '#fcd34d', backgroundColor: '#fffbeb' },
  fieldLabel: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: '#6b7280',
    marginBottom: 4,
  },
  fieldLabelGreen: { color: '#15803d' },
  fieldLabelAmber: { color: '#b45309' },
  fieldValue: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    color: '#111827',
  },
  fieldSub: { fontSize: 10, color: '#6b7280', marginTop: 2 },
  metaRow: { flexDirection: 'row', gap: 8 },
  metaField: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    padding: 11,
    backgroundColor: '#f9fafb',
  },
  // QR boxes
  qrBox: {
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    padding: 10,
    backgroundColor: '#ffffff',
    alignItems: 'center',
  },
  qrLabel: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 4,
  },
  payQrBox: {
    borderWidth: 2,
    borderColor: '#fcd34d',
    borderRadius: 10,
    padding: 10,
    backgroundColor: '#fffbeb',
    alignItems: 'center',
    width: '100%',
  },
  payQrLabel: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: '#b45309',
    textAlign: 'center',
    marginBottom: 4,
  },
  paidBox: {
    borderWidth: 2,
    borderColor: '#86efac',
    borderRadius: 10,
    padding: 10,
    backgroundColor: '#f0fdf4',
    alignItems: 'center',
    width: '100%',
  },
  paidText: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: '#15803d',
  },
  paidAmount: { fontSize: 13, fontFamily: 'Helvetica-Bold', color: '#166534', marginTop: 4 },
  // Footer
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    borderStyle: 'dashed',
    marginTop: 16,
    paddingTop: 10,
    alignItems: 'center',
  },
  footerText: { fontSize: 8, color: '#9ca3af', textAlign: 'center' },
});

function fmt(amount: number, currency = 'INR') {
  return `${currency} ${(amount / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}
function fmtDate(iso: string) {
  return new Intl.DateTimeFormat('en-IN', {
    weekday: 'short', day: 'numeric', month: 'long',
    year: 'numeric', hour: '2-digit', minute: '2-digit',
  }).format(new Date(iso));
}
function fmtShort(iso: string) {
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  }).format(new Date(iso));
}

async function toBase64(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const buf = await res.arrayBuffer();
    const mime = res.headers.get('content-type') ?? 'image/png';
    return `data:${mime};base64,${Buffer.from(buf).toString('base64')}`;
  } catch {
    return null;
  }
}

export async function GET(_: Request, { params }: RouteContext) {
  const { rsvpId } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Fetch ticket data
  let rsvp: any = null;
  try {
    rsvp = await prisma.rSVP.findUnique({
      where: { id: rsvpId },
      include: {
        user: { select: { name: true, email: true } },
        event: {
          select: {
            id: true, title: true, startTime: true, endTime: true,
            latitude: true, longitude: true,
            isPaid: true, ticketPrice: true, paymentQrUrl: true,
            organizer: { select: { name: true } },
          },
        },
      },
    });
  } catch {
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }

  if (!rsvp) return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });

  const userId = (session.user as any).id;
  const role = (session.user as any).role;
  if (rsvp.userId !== userId && role !== 'ADMIN') {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  // Payment record
  let payment: { amount: number; currency: string } | null = null;
  try {
    payment = await prisma.payment.findFirst({
      where: { userId: rsvp.userId, eventId: rsvp.eventId, status: 'PAID' },
      select: { amount: true, currency: true },
    });
  } catch { /* non-critical */ }

  const ticketId = rsvp.ticketId ?? rsvp.id;
  const shortId = ticketId.slice(0, 8).toUpperCase();

  // Generate entry QR as data URL
  const entryQrDataUrl = await QRCode.toDataURL(
    JSON.stringify({ ticketId, rsvpId, eventId: rsvp.eventId }),
    { width: 200, margin: 1, color: { dark: '#0f766e', light: '#ffffff' } }
  );

  // Fetch payment QR image (convert to base64 so PDF can embed it cross-origin)
  let paymentQrBase64: string | null = null;
  if (rsvp.event.isPaid && rsvp.event.paymentQrUrl && !payment) {
    paymentQrBase64 = await toBase64(rsvp.event.paymentQrUrl);
  }

  const amountDisplay = payment
    ? fmt(payment.amount, payment.currency)
    : rsvp.event.ticketPrice
      ? fmt(rsvp.event.ticketPrice, 'INR')
      : rsvp.event.isPaid ? 'Paid event' : 'Free';

  const badgeStyle = payment ? styles.badgeConfirmed
    : rsvp.event.isPaid ? styles.badgePaid
    : styles.badgeFree;
  const badgeText = payment ? 'Paid'
    : rsvp.event.isPaid ? 'Pending payment'
    : 'Free entry';

  const doc = (
    <Document title={`ILLAKA Ticket · #${shortId}`} author="ILLAKA">
      <Page size="A4" style={styles.page}>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerLabel}>ILLAKA · Event Ticket</Text>
            <Text style={styles.headerTitle}>{rsvp.event.title}</Text>
            <Text style={styles.headerSub}>Hosted by {rsvp.event.organizer?.name ?? 'Organizer'}</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.headerLabel}>Ticket No.</Text>
            <Text style={styles.ticketNo}>#{shortId}</Text>
            <View style={[styles.badge, badgeStyle]}>
              <Text>{badgeText}</Text>
            </View>
          </View>
        </View>

        {/* Body */}
        <View style={styles.body}>
          {/* Fields column */}
          <View style={styles.fieldsCol}>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Attendee</Text>
              <Text style={styles.fieldValue}>{rsvp.user.name}</Text>
              <Text style={styles.fieldSub}>{rsvp.user.email}</Text>
            </View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Date &amp; Time</Text>
              <Text style={styles.fieldValue}>{fmtDate(rsvp.event.startTime.toISOString())}</Text>
              <Text style={styles.fieldSub}>Until {fmtDate(rsvp.event.endTime.toISOString())}</Text>
            </View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Location</Text>
              <Text style={styles.fieldValue}>
                {rsvp.event.latitude.toFixed(4)}, {rsvp.event.longitude.toFixed(4)}
              </Text>
            </View>

            <View style={[
              styles.field,
              payment ? styles.fieldGreen : rsvp.event.isPaid ? styles.fieldAmber : {}
            ]}>
              <Text style={[
                styles.fieldLabel,
                payment ? styles.fieldLabelGreen : rsvp.event.isPaid ? styles.fieldLabelAmber : {}
              ]}>Payment</Text>
              <Text style={styles.fieldValue}>{amountDisplay}</Text>
              {payment && (
                <Text style={styles.fieldSub}>Confirmed · {fmtShort(rsvp.createdAt.toISOString())}</Text>
              )}
            </View>

            <View style={styles.metaRow}>
              <View style={styles.metaField}>
                <Text style={styles.fieldLabel}>Issued</Text>
                <Text style={[styles.fieldValue, { fontSize: 11 }]}>{fmtShort(rsvp.createdAt.toISOString())}</Text>
              </View>
              <View style={styles.metaField}>
                <Text style={styles.fieldLabel}>RSVP ID</Text>
                <Text style={[styles.fieldValue, { fontSize: 11, fontFamily: 'Courier-Bold' }]}>{rsvpId.slice(0, 8)}</Text>
              </View>
            </View>
          </View>

          {/* QR column */}
          <View style={styles.qrCol}>
            <View style={styles.qrBox}>
              <Image src={entryQrDataUrl} style={{ width: 140, height: 140 }} />
            </View>
            <Text style={styles.qrLabel}>Scan to verify entry</Text>
            <Text style={[styles.qrLabel, { fontFamily: 'Courier-Bold', marginTop: 0 }]}>#{shortId}</Text>

            {paymentQrBase64 && (
              <View style={styles.payQrBox}>
                <Text style={styles.payQrLabel}>Pay organizer</Text>
                <Image src={paymentQrBase64} style={{ width: 130, height: 130 }} />
                <Text style={[styles.payQrLabel, { marginTop: 4 }]}>Scan to pay</Text>
              </View>
            )}

            {payment && (
              <View style={styles.paidBox}>
                <Text style={styles.paidText}>✓ Payment confirmed</Text>
                <Text style={styles.paidAmount}>{fmt(payment.amount, payment.currency)}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            This ticket is non-transferable · Present QR code at entry · ILLAKA © {new Date().getFullYear()}
          </Text>
        </View>

      </Page>
    </Document>
  );

  const buffer = await renderToBuffer(doc);
  const uint8 = new Uint8Array(buffer);

  return new Response(uint8, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="ILLAKA-Ticket-${shortId}.pdf"`,
      'Cache-Control': 'private, no-store',
    },
  });
}
