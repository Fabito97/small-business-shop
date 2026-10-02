import { cookies } from 'next/headers';
import { deleteSession, SESSION_COOKIE_NAME } from '@/server/auth/session';

export async function POST(request: Request): Promise<Response> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (token) {
    try {
      await deleteSession(token);
    } catch (error) {
      console.error('[auth] Error deleting session:', error);
    }
  }

  cookieStore.delete(SESSION_COOKIE_NAME);

  // If request is from an HTML form or expects redirect
  const contentType = request.headers.get('content-type') || '';
  const accept = request.headers.get('accept') || '';

  if (contentType.includes('application/x-www-form-urlencoded') || accept.includes('text/html')) {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    return Response.redirect(new URL('/', baseUrl).toString(), 303);
  }

  return new Response(null, { status: 204 });
}

export async function GET(): Promise<Response> {
  // Support standard GET logout redirect for convenience
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (token) {
    try {
      await deleteSession(token);
    } catch (error) {
      console.error('[auth] Error deleting session on GET:', error);
    }
  }

  cookieStore.delete(SESSION_COOKIE_NAME);
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  return Response.redirect(new URL('/', baseUrl).toString(), 302);
}
