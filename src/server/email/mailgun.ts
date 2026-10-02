import 'server-only';

export type SendEmailOptions = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

/**
 * Sends transactional email via Mailgun HTTP API using native fetch.
 * Returns boolean indicating whether email was successfully dispatched.
 */
export async function sendEmail({ to, subject, html, text }: SendEmailOptions): Promise<boolean> {
  const apiKey = process.env.MAILGUN_API_KEY;
  const domain = process.env.MAILGUN_DOMAIN;
  const from = process.env.MAILGUN_FROM || 'Meridian Time <orders@meridiantime.com>';
  const baseUrl = (process.env.MAILGUN_BASE_URL || 'https://api.mailgun.net').replace(/\/+$/, '');

  if (!apiKey || !domain) {
    console.warn(
      '[Mailgun] MAILGUN_API_KEY or MAILGUN_DOMAIN is not configured. Email delivery simulated.'
    );
    return false;
  }

  const formData = new FormData();
  formData.append('from', from);
  formData.append('to', to);
  formData.append('subject', subject);
  formData.append('html', html);
  formData.append('text', text);

  const authHeader = 'Basic ' + Buffer.from(`api:${apiKey}`).toString('base64');

  const endpoint = `${baseUrl}/v3/${domain}/messages`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: authHeader,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => 'Unknown Mailgun response');
    throw new Error(`Mailgun API error (${response.status}): ${errorBody}`);
  }

  return true;
}
