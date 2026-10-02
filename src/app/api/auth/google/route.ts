import { cookies } from 'next/headers';
import { generateState, generateCodeVerifier } from 'arctic';
import { google } from '@/server/auth/google';

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const nextParam = url.searchParams.get('next');

  // Sanitize next redirect parameter (must begin with a single '/' and not '//')
  let nextUrl = '/';
  if (nextParam && nextParam.startsWith('/') && !nextParam.startsWith('//')) {
    nextUrl = nextParam;
  }

  const state = generateState();
  const codeVerifier = generateCodeVerifier();

  const authUrl = google.createAuthorizationURL(state, codeVerifier, [
    'openid',
    'profile',
    'email',
  ]);

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

  return Response.redirect(authUrl.toString(), 302);
}
