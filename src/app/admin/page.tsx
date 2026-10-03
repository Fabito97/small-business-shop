import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { ShieldCheck } from 'lucide-react';

import { getCurrentUser } from '@/server/auth/guards';
import { AdminDashboardClient } from '@/components/admin/AdminDashboardClient';
import { BRAND } from '@/config/brand';

export const metadata: Metadata = {
  title: `Store Operations & Administration | ${BRAND.name}`,
  description: 'Operations console for watch orders, fulfillment, and revenue.',
};

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login?next=/admin');
  }

  // Security Gate: non-admin gets 404 to avoid disclosing existence of admin routes
  if (user.role !== 'admin') {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[var(--ivory)] py-10 md:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--sand)] pb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[var(--gold)]/10 border border-[var(--gold)]/30 text-[var(--gold-deep)] text-xs font-semibold uppercase tracking-wider mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Admin Operations Console</span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl text-[var(--ink)] font-normal">
              Store Operations
            </h1>
            <p className="text-xs text-[var(--muted)] mt-1">
              Authenticated Administrator:{' '}
              <span className="font-medium text-[var(--ink)]">{user.name || user.email}</span>{' '}
              <span className="ml-1 uppercase tracking-wider text-[10px] px-1.5 py-0.5 rounded bg-[var(--gold)]/20 text-[var(--gold-deep)] font-bold">
                {user.role}
              </span>
            </p>
          </div>
        </div>

        {/* Interactive Dashboard */}
        <AdminDashboardClient admin={user} />
      </div>
    </div>
  );
}
