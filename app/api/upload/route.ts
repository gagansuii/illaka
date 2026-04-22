import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';

const ALLOWED_FOLDERS = new Set(['ilaka/banners', 'ilaka/badges', 'ilaka/payment-qr']);

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

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

  const ext = (file.name.split('.').pop() ?? 'jpg').toLowerCase();
  const filename = `${randomUUID()}.${ext}`;
  const uploadDir = join(process.cwd(), 'public', 'uploads', folder);

  try {
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(join(uploadDir, filename), buffer);
  } catch (err) {
    console.error('File write failed:', err);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }

  return NextResponse.json({ url: `/uploads/${folder}/${filename}` });
}
