import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { v2 as cloudinary } from 'cloudinary';
import { randomUUID } from 'crypto';
import { rateLimit } from '@/lib/rate-limit';

const ALLOWED_FOLDERS = new Set(['ilaka/banners', 'ilaka/badges', 'ilaka/payment-qr']);
const ORGANIZER_ONLY_FOLDERS = new Set(['ilaka/payment-qr']);
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MIN_FILE_SIZE = 100;
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

const MAGIC_BYTES: Array<{ mime: string; bytes: number[]; offset?: number }> = [
  { mime: 'image/jpeg', bytes: [0xff, 0xd8, 0xff] },
  { mime: 'image/png',  bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
  { mime: 'image/webp', bytes: [0x52, 0x49, 0x46, 0x46], offset: 0 },
  { mime: 'image/gif',  bytes: [0x47, 0x49, 0x46, 0x38] },
];

function detectMimeFromBytes(buf: Buffer): string | null {
  for (const sig of MAGIC_BYTES) {
    const start = sig.offset ?? 0;
    const slice = buf.slice(start, start + sig.bytes.length);
    if (sig.bytes.every((b, i) => slice[i] === b)) {
      if (sig.mime === 'image/webp') {
        const webp = buf.slice(8, 12).toString('ascii');
        if (webp !== 'WEBP') continue;
      }
      return sig.mime;
    }
  }
  return null;
}

function isCloudinaryConfigured() {
  return !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!isCloudinaryConfigured()) {
    return NextResponse.json(
      { error: 'Image uploads are not configured. Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET to your environment variables.' },
      { status: 503 }
    );
  }

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  const rateLimitKey = `upload:${session.user.id}`;
  if (!(await rateLimit(rateLimitKey, 10))) {
    return NextResponse.json({ error: 'Too many uploads. Please wait before trying again.' }, { status: 429 });
  }


  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const file = formData.get('file');
  const folder = formData.get('folder');

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }
  if (typeof folder !== 'string' || !ALLOWED_FOLDERS.has(folder)) {
    return NextResponse.json({ error: 'Invalid folder' }, { status: 400 });
  }

  // Only ORGANIZER and ADMIN may upload payment QR codes.
  if (ORGANIZER_ONLY_FOLDERS.has(folder)) {
    const role = (session.user as { id: string; role?: string }).role ?? '';
    if (role !== 'ORGANIZER' && role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  if (file.size < MIN_FILE_SIZE) {
    return NextResponse.json({ error: 'File is too small or empty.' }, { status: 400 });
  }
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: 'File too large. Maximum size is 5 MB.' }, { status: 413 });
  }
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return NextResponse.json({ error: 'Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.' }, { status: 415 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  // Validate actual file content against magic bytes — browsers can lie about MIME type.
  const detectedMime = detectMimeFromBytes(buffer);
  if (!detectedMime || !ALLOWED_MIME_TYPES.has(detectedMime)) {
    return NextResponse.json({ error: 'File content does not match an allowed image type.' }, { status: 415 });
  }

  try {
    const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { folder, public_id: randomUUID(), resource_type: 'image', overwrite: false },
        (error, res) => {
          if (error || !res) reject(error ?? new Error('Upload failed'));
          else resolve(res as { secure_url: string });
        }
      ).end(buffer);
    });

    return NextResponse.json({ url: result.secure_url });
  } catch (err) {
    console.error('Cloudinary upload failed:', err);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
