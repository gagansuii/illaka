import { NextResponse } from 'next/server';
import { ipFallbackLocation } from '@/lib/geo';
import { rateLimit } from '@/lib/rate-limit';

export async function GET(req: Request) {
  try {
    const forwarded = req.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : null;
    if (!ip) {
      return NextResponse.json({ error: 'Cannot determine client IP' }, { status: 400 });
    }

    // 10 lookups per IP per minute — prevents using this endpoint as a free
    // geolocation proxy or for enumeration of third-party IP data.
    const allowed = await rateLimit(`geo:${ip}`, 10);
    if (!allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const location = await ipFallbackLocation(ip);
    if (!location) return NextResponse.json({ error: 'Unable to locate' }, { status: 404 });
    return NextResponse.json(location);
  } catch (err) {
    console.error('Geo IP lookup error:', err);
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
  }
}
