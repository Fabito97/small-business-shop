import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { AuthService, AuthServiceError, SESSION_COOKIE_NAME } from '@/server/services/auth.service';

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');

  const cookieStore = await cookies();
  const storedState = cookieStore.get('g_state')?.value;
  const storedVerifier = cookieStore.get('g_code_verifier')?.value;
  const storedNext = cookieStore.get('g_next')?.value;

  try {
    const { token, expiresAt, nextUrl } = await AuthService.handleGoogleCallback({
      code,
      state,
      storedState,
      storedVerifier,
      storedNext,
    });

    // Set persistent session cookie
    const isProd = process.env.NODE_ENV === 'production';
    const sessionCookieOptions = {
      path: '/',
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax' as const,
      expires: expiresAt,
    };

    cookieStore.set(SESSION_COOKIE_NAME, token, sessionCookieOptions);
    cookieStore.delete('g_state');
    cookieStore.delete('g_code_verifier');
    cookieStore.delete('g_next');

    // Redirect to requested next page on current domain
    const destination = new URL(nextUrl, request.url);
    const response = NextResponse.redirect(destination.toString(), 302);

    response.cookies.set(SESSION_COOKIE_NAME, token, sessionCookieOptions);
    response.cookies.delete('g_state');
    response.cookies.delete('g_code_verifier');
    response.cookies.delete('g_next');

    return response;
  } catch (error: unknown) {
    if (error instanceof AuthServiceError) {
      return new Response(
        JSON.stringify({
          error: {
            code: error.code,
            message: error.message,
          },
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    console.error('[auth/callback] Unexpected OAuth error:', error);
    return new Response(
      JSON.stringify({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected authentication error occurred.',
        },
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
