# Setup Checklist (for the human, not the agent)

Do these early, in this order. Collect the values, then paste into `.env.local` and Vercel.

## A. Neon (5 min)
1. neon.tech → create project (pick the region closest to your Vercel region).
2. Dashboard → **Connect** → copy the **pooled** connection string → `DATABASE_URL`.
3. After the agent adds the schema: `npx drizzle-kit push`, then `npm run db:seed`.

## B. Google OAuth (10 min)
1. console.cloud.google.com → create a project.
2. **APIs & Services → OAuth consent screen:** External; app name + support email. While in *Testing* mode add yourself and any reviewers as **Test users** (publish the app when ready so anyone can sign in).
3. **Credentials → Create credentials → OAuth client ID → Web application**
   - Authorized JavaScript origins: `http://localhost:3000` and your Vercel URL
   - **Authorized redirect URIs:** `http://localhost:3000/api/auth/google/callback` and `https://<your-app>.vercel.app/api/auth/google/callback`
4. Copy Client ID + Secret → `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`.
5. Set `ADMIN_EMAILS` to your Google email (and your brother's).

> The redirect URI must match **exactly** (scheme, host, path, no trailing slash). Mismatch = `redirect_uri_mismatch`.

## C. Mailgun (10 min)
1. mailgun.com → sign up → use the **sandbox domain** (Sending → Domains).
2. ⚠️ **Sandbox only delivers to Authorized Recipients.** Add every email you will test with (yours and your reviewers') and have each person click the verification email. Unverified recipients silently fail.
3. Settings → API keys → copy the sending key. Note region (US `api.mailgun.net` / EU `api.eu.mailgun.net`).
4. `MAILGUN_FROM="Meridian Time <postmaster@sandboxXXXX.mailgun.org>"`.
5. For the real business later: add a custom domain (SPF + DKIM DNS records).

## D. Vercel deploy
1. Push to GitHub → import into Vercel.
2. Add all env vars; set `NEXT_PUBLIC_SITE_URL` to the live URL (no trailing slash).
3. Add the live URL's origin + redirect URI in Google credentials. Redeploy.
4. Production test: login → order → email → admin dashboard.

## E. Before you submit
- [ ] README: setup, features, screenshots, how the owner edits products/brand
- [ ] Live URL works on a phone
- [ ] Test order on production; email received
- [ ] `.env.local` gitignored, no secrets in repo
- [ ] Short demo video/GIF (optional, impressive)
