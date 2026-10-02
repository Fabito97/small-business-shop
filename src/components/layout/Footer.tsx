import Link from 'next/link';
import { ShieldCheck, Truck, Clock, MessageSquare, Watch } from 'lucide-react';
import { BRAND } from '@/config/brand';
import { SHOP } from '@/config/shop';
import { formatNaira } from '@/lib/money';

export function Footer() {
  return (
    <footer className="bg-[var(--charcoal)] border-t border-[var(--gold)]/15 text-[var(--sand)]">
      {/* Value Proposition / Trust Strip */}
      <div className="border-b border-[var(--sand)]/10 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-[var(--ink)] border border-[var(--gold)]/30 flex items-center justify-center text-[var(--gold)] shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-medium text-[var(--ivory)] uppercase tracking-wider">
                100% Authenticity
              </h4>
              <p className="text-xs text-[var(--muted)] mt-1 leading-relaxed">
                Every timepiece undergoes rigorous multi-point movement and chronometer verification.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-[var(--ink)] border border-[var(--gold)]/30 flex items-center justify-center text-[var(--gold)] shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-medium text-[var(--ivory)] uppercase tracking-wider">
                12-Month Warranty
              </h4>
              <p className="text-xs text-[var(--muted)] mt-1 leading-relaxed">
                Comprehensive mechanical protection and complimentary movement calibration.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-[var(--ink)] border border-[var(--gold)]/30 flex items-center justify-center text-[var(--gold)] shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-medium text-[var(--ivory)] uppercase tracking-wider">
                Nationwide Delivery
              </h4>
              <p className="text-xs text-[var(--muted)] mt-1 leading-relaxed">
                Insured transit across all 36 Nigerian states. Free on orders over{' '}
                {formatNaira(SHOP.freeShippingThresholdKobo)}.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-[var(--ink)] border border-[var(--gold)]/30 flex items-center justify-center text-[var(--gold)] shrink-0">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-medium text-[var(--ivory)] uppercase tracking-wider">
                Concierge Support
              </h4>
              <p className="text-xs text-[var(--muted)] mt-1 leading-relaxed">
                Direct WhatsApp access to our horology advisors for personalized selection.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 grid grid-cols-1 md:grid-cols-12 gap-12">
        {/* Brand Column */}
        <div className="md:col-span-5 space-y-4">
          <div className="flex items-center gap-2 text-[var(--gold)]">
            <Watch className="w-6 h-6" />
            <span className="font-serif text-2xl tracking-tight text-[var(--ivory)] font-light">
              {BRAND.name}
            </span>
          </div>
          <p className="text-sm text-[var(--muted)] leading-relaxed max-w-sm">
            {BRAND.description}
          </p>
          <div className="pt-2 text-xs text-[var(--sand)]/80 space-y-1">
            <p className="font-medium text-[var(--ivory)]">{BRAND.location}</p>
            <p>Direct: {BRAND.phone}</p>
            <p>Client Inquiries: {BRAND.email}</p>
          </div>
        </div>

        {/* Collections */}
        <div className="md:col-span-3 space-y-3">
          <h5 className="text-xs uppercase tracking-[0.25em] text-[var(--gold)] font-medium">
            Timepiece Collections
          </h5>
          <ul className="space-y-2 text-xs text-[var(--sand)]/80">
            {SHOP.categories.map((cat) => (
              <li key={cat.id}>
                <Link
                  href={`/shop?category=${cat.id}`}
                  className="hover:text-[var(--gold)] transition-colors"
                >
                  {cat.label} Watches
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Private Client & Security */}
        <div className="md:col-span-4 space-y-3">
          <h5 className="text-xs uppercase tracking-[0.25em] text-[var(--gold)] font-medium">
            Client Services & Assurance
          </h5>
          <p className="text-xs text-[var(--muted)] leading-relaxed">
            Payment transactions are accepted via Direct Bank Wire into our verified corporate account
            at {SHOP.bankDetails.bankName}, or Pay on Delivery in supported regions.
          </p>
          <div className="pt-2">
            <a
              href={`https://wa.me/${BRAND.whatsapp.replace(/[^0-9]/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-[var(--gold)] hover:text-[var(--ivory)] transition-colors"
            >
              <span>Connect on WhatsApp Concierge &rarr;</span>
            </a>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="border-t border-[var(--sand)]/10 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[var(--muted)]">
          <p>&copy; {new Date().getFullYear()} {BRAND.legalName}. All rights reserved.</p>
          <p className="text-[11px] tracking-wide">
            Designed for horology enthusiasts and discerning collectors.
          </p>
        </div>
      </div>
    </footer>
  );
}
