import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { AuthService } from '@/server/services/auth.service';

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const nextParam = url.searchParams.get('next');

  const { url: authUrl, state, codeVerifier, nextUrl } = AuthService.initiateGoogleAuth(nextParam);

  const cookieStore = await cookies();
  const isProd = process.env.NODE_ENV === 'production';
  const cookieOptions = {
    path: '/',
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax' as const,
    maxAge: 60 * 10, // 10 minutes
  };

  cookieStore.set('g_state', state, cookieOptions);
  cookieStore.set('g_code_verifier', codeVerifier, cookieOptions);
  cookieStore.set('g_next', nextUrl, cookieOptions);

  const response = NextResponse.redirect(authUrl.toString(), 302);
  response.cookies.set('g_state', state, cookieOptions);
  response.cookies.set('g_code_verifier', codeVerifier, cookieOptions);
  response.cookies.set('g_next', nextUrl, cookieOptions);

  return response;
}
