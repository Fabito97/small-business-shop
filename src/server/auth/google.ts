import 'server-only';
import { Google } from 'arctic';

const clientId = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/+$/, '');
  }
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL.replace(/\/+$/, '')}`;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.replace(/\/+$/, '')}`;
  }
  return 'http://localhost:3000';
}

const baseUrl = getBaseUrl();
const redirectURI = `${baseUrl}/api/auth/google/callback`;

if (!clientId || !clientSecret) {
  console.warn('[auth] GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET is missing from environment');
}

export const google = new Google(clientId || '', clientSecret || '', redirectURI);
