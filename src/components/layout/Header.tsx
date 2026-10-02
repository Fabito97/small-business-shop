import Link from 'next/link';
import { ShoppingBag, Watch } from 'lucide-react';
import { getCurrentUser } from '@/server/auth/guards';
import { BRAND } from '@/config/brand';
import { AccountMenu } from './AccountMenu';

export async function Header() {
  const user = await getCurrentUser();

  return (
    <header className="sticky top-0 z-40 w-full bg-[var(--ink)]/90 backdrop-blur-md border-b border-[var(--gold)]/15">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Navigation links (left on desktop) */}
        <nav className="hidden md:flex items-center gap-8">
          <Link
            href="/shop"
            className="text-xs uppercase tracking-[0.2em] text-[var(--sand)]/80 hover:text-[var(--gold)] transition-colors font-medium"
          >
            Collection
          </Link>
          <Link
            href="/#craftsmanship"
            className="text-xs uppercase tracking-[0.2em] text-[var(--sand)]/80 hover:text-[var(--gold)] transition-colors font-medium"
          >
            Maison
          </Link>
          <Link
            href="/#heritage"
            className="text-xs uppercase tracking-[0.2em] text-[var(--sand)]/80 hover:text-[var(--gold)] transition-colors font-medium"
          >
            Heritage
          </Link>
        </nav>

        {/* Center Brand Identity */}
        <Link href="/" className="flex flex-col items-center group">
          <div className="flex items-center gap-2 text-[var(--gold)] group-hover:text-[var(--gold-deep)] transition-colors">
            <Watch className="w-5 h-5" />
            <span className="font-serif text-2xl sm:text-3xl tracking-tight text-[var(--ivory)] font-light">
              {BRAND.name}
            </span>
          </div>
          <span className="text-[9px] uppercase tracking-[0.35em] text-[var(--gold)] font-medium -mt-1 opacity-90">
            {BRAND.tagline}
          </span>
        </Link>

        {/* Right Actions: AccountMenu + Cart */}
        <div className="flex items-center gap-4 sm:gap-6">
          <AccountMenu user={user} />

          <Link
            href="/cart"
            className="relative p-2 text-[var(--sand)] hover:text-[var(--gold)] transition-colors"
            aria-label="View shopping bag"
          >
            <ShoppingBag className="w-5 h-5" />
            <span className="sr-only">Cart</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
