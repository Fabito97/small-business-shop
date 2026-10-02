import Link from 'next/link';
import { Compass, ArrowRight, Home } from 'lucide-react';
import { BRAND } from '@/config/brand';

export default function NotFound() {
  return (
    <div className="min-h-[75vh] flex items-center justify-center bg-[var(--ink)] text-[var(--ivory)] px-4 py-20">
      <div className="max-w-lg mx-auto text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-[var(--charcoal)] border border-[var(--gold)]/30 flex items-center justify-center text-[var(--gold)] mx-auto shadow-lg">
          <Compass className="w-8 h-8" />
        </div>

        <span className="text-xs uppercase tracking-[0.25em] font-semibold text-[var(--gold)] block">
          Error 404
        </span>

        <h1 className="font-serif text-3xl sm:text-5xl font-light text-[var(--ivory)]">
          Caliber Not Found
        </h1>

        <p className="text-sm text-[var(--muted)] leading-relaxed max-w-md mx-auto">
          The horological record, timepiece, or requisition page you are seeking does not exist or has been relocated within the {BRAND.name} atelier.
        </p>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/shop"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-[var(--gold)] hover:bg-[var(--gold-deep)] text-[var(--ink)] text-xs uppercase tracking-[0.2em] font-semibold rounded-md transition-colors shadow-sm"
          >
            <span>Browse Timepieces</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-[var(--charcoal)] border border-[var(--sand)]/20 hover:border-[var(--gold)]/40 text-[var(--sand)] text-xs uppercase tracking-[0.2em] font-medium rounded-md transition-colors"
          >
            <Home className="w-4 h-4" />
            <span>Atelier Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
