import { BRAND } from '@/config/brand';
import { SHOP } from '@/config/shop';
import { formatNaira } from '@/lib/money';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col justify-between px-6 py-12 max-w-5xl mx-auto">
      <header className="border-b border-sand pb-6 flex items-center justify-between">
        <div>
          <span className="font-serif text-2xl md:text-3xl font-semibold tracking-tight text-ink">
            {BRAND.name}
          </span>
          <p className="text-xs uppercase tracking-[0.2em] text-gold font-medium mt-1">
            {BRAND.tagline}
          </p>
        </div>
        <div className="text-xs uppercase tracking-widest text-muted">
          M0 Scaffold Active
        </div>
      </header>

      <main className="my-16 space-y-12">
        <section className="space-y-4">
          <p className="text-xs uppercase tracking-[0.2em] text-gold font-semibold">
            Boutique Horology
          </p>
          <h1 className="font-serif text-5xl md:text-7xl font-medium tracking-tight text-ink leading-[1.05]">
            Crafted to keep time.
            <br />
            <span className="italic font-normal text-muted">Chosen to be remembered.</span>
          </h1>
          <p className="text-muted text-base md:text-lg max-w-xl leading-relaxed pt-2">
            {BRAND.aboutStory}
          </p>
        </section>

        {/* Design System & Token Test Bench */}
        <section className="p-8 rounded-lg border border-sand bg-ivory/60 space-y-6">
          <div className="flex items-center justify-between border-b border-sand pb-4">
            <h2 className="font-serif text-xl font-semibold text-ink">
              Design System & Configuration Verification
            </h2>
            <span className="inline-flex items-center rounded-full bg-success/10 px-3 py-1 text-xs font-medium text-success">
              Tokens Applied
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
            <div className="p-3 rounded border border-sand bg-ink text-ivory">
              <div className="font-bold">--ink</div>
              <div className="text-sand/70">#0E0E10</div>
            </div>
            <div className="p-3 rounded border border-sand bg-charcoal text-ivory">
              <div className="font-bold">--charcoal</div>
              <div className="text-sand/70">#1C1C20</div>
            </div>
            <div className="p-3 rounded border border-sand bg-gold text-ink font-bold">
              <div>--gold</div>
              <div>#B8956A</div>
            </div>
            <div className="p-3 rounded border border-sand bg-sand text-ink">
              <div className="font-bold">--sand</div>
              <div>#EDE6DA</div>
            </div>
          </div>

          <div className="pt-2 text-sm space-y-2 text-muted">
            <p>
              <strong className="text-ink">Currency Formatting:</strong> Example price{' '}
              <span className="text-gold-deep font-semibold">{formatNaira(45_000_000)}</span> (45,000,000 kobo).
            </p>
            <p>
              <strong className="text-ink">Free Delivery Threshold:</strong>{' '}
              {formatNaira(SHOP.freeShippingThresholdKobo)} (Flat fee: {formatNaira(SHOP.shippingFeeKobo)})
            </p>
            <p>
              <strong className="text-ink">Active Categories:</strong>{' '}
              {SHOP.categories.map((c) => c.label).join(', ')}
            </p>
          </div>
        </section>
      </main>

      <footer className="border-t border-sand pt-6 text-xs text-muted flex flex-col sm:flex-row justify-between gap-4">
        <span>© {new Date().getFullYear()} {BRAND.name}. All rights reserved.</span>
        <span>{BRAND.location}</span>
      </footer>
    </div>
  );
}
