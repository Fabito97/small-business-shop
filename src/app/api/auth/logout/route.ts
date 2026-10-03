import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { AuthService, SESSION_COOKIE_NAME } from '@/server/services/auth.service';

export async function POST(request: Request): Promise<Response> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (token) {
    try {
      await AuthService.logout(token);
    } catch (error) {
      console.error('[auth] Error deleting session:', error);
    }
  }

  cookieStore.delete(SESSION_COOKIE_NAME);

  // If request is from an HTML form or expects redirect
  const contentType = request.headers.get('content-type') || '';
  const accept = request.headers.get('accept') || '';

  if (contentType.includes('application/x-www-form-urlencoded') || accept.includes('text/html')) {
    const destination = new URL('/', request.url);
    const response = NextResponse.redirect(destination.toString(), 303);
    response.cookies.delete(SESSION_COOKIE_NAME);
    return response;
  }

  return new Response(null, { status: 204 });
}

export async function GET(request: Request): Promise<Response> {
  // Support standard GET logout redirect for convenience
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (token) {
    try {
      await AuthService.logout(token);
    } catch (error) {
      console.error('[auth] Error deleting session on GET:', error);
    }
  }

  cookieStore.delete(SESSION_COOKIE_NAME);
  const destination = new URL('/', request.url);
  const response = NextResponse.redirect(destination.toString(), 302);
  response.cookies.delete(SESSION_COOKIE_NAME);
  return response;
}
