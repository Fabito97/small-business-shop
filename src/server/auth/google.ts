import 'server-only';
import { Google } from 'arctic';

const clientId = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
const redirectURI = `${baseUrl}/api/auth/google/callback`;

if (!clientId || !clientSecret) {
  console.warn('[auth] GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET is missing from environment');
}

export const google = new Google(clientId || '', clientSecret || '', redirectURI);
