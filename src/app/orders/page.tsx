import { requireUser } from '@/server/auth/guards';
import Link from 'next/link';
import { Package, ArrowRight } from 'lucide-react';

export default async function MyOrdersPage() {
  const user = await requireUser();

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-8">
      <div className="border-b border-[var(--sand)]/10 pb-6">
        <h1 className="font-serif text-3xl sm:text-4xl text-[var(--ivory)] font-light">
          My Acquisitions & Orders
        </h1>
        <p className="text-xs text-[var(--muted)] mt-1">
          Registered client: {user.name || user.email}
        </p>
      </div>

      <div className="bg-[var(--charcoal)] border border-[var(--gold)]/15 rounded-xl p-12 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-[var(--ink)] border border-[var(--gold)]/30 flex items-center justify-center text-[var(--gold)] mx-auto">
          <Package className="w-6 h-6" />
        </div>
        <h2 className="font-serif text-2xl text-[var(--ivory)]">No Active Orders Yet</h2>
        <p className="text-xs text-[var(--muted)] max-w-sm mx-auto">
          When you purchase a timepiece, your order confirmation and dispatch updates will appear here.
        </p>
        <div className="pt-2">
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 bg-[var(--gold)] hover:bg-[var(--gold-deep)] text-[var(--ink)] px-6 py-3 rounded-lg text-xs uppercase tracking-wider font-semibold transition-colors"
          >
            <span>Explore The Collection</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
