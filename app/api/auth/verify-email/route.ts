import { NextResponse } from 'next/server';
import { authService } from '@/src/modules/auth/auth.service';
import { handleError } from '@/src/core/response';

const BASE_URL = process.env.NEXTAUTH_URL ?? 'http://localhost:3000';

export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get('token');
  if (!token) {
    return NextResponse.redirect(`${BASE_URL}/login?error=missing-token`);
  }

  try {
    await authService.verifyEmail(token);
    return NextResponse.redirect(`${BASE_URL}/login?verified=1`);
  } catch (err) {
    return NextResponse.redirect(`${BASE_URL}/login?error=invalid-token`);
  }
}
