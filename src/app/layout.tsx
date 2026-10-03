import type { Metadata } from 'next';
import { Cormorant_Garamond, Inter } from 'next/font/google';
import { BRAND } from '@/config/brand';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Providers } from '@/components/providers';
import './globals.css';

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-cormorant',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${BRAND.name} — ${BRAND.tagline}`,
    template: `%s | ${BRAND.name}`,
  },
  description: BRAND.description,
  keywords: [
    'Dave Store',
    'wristwatches in Nigeria',
    'buy watches Lagos',
    'original wristwatches Nigeria',
    'men watches Nigeria',
    'women watches Nigeria',
    'affordable luxury watches Nigeria',
  ],
  authors: [{ name: BRAND.name }],
  creator: BRAND.legalName,
  openGraph: {
    type: 'website',
    locale: 'en_NG',
    url: siteUrl,
    title: `${BRAND.name} — ${BRAND.tagline}`,
    description: BRAND.shortDescription,
    siteName: BRAND.name,
  },
  twitter: {
    card: 'summary_large_image',
    title: `${BRAND.name} — ${BRAND.tagline}`,
    description: BRAND.shortDescription,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${cormorant.variable} ${inter.variable}`}>
      <body className="min-h-screen flex flex-col bg-[var(--ivory)] text-[var(--ink)] font-sans antialiased selection:bg-[var(--gold)]/20 selection:text-[var(--ink)]">
        <Providers>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}

