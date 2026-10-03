import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/server/auth/guards';
import { CheckoutForm } from '@/components/checkout/CheckoutForm';
import { BRAND } from '@/config/brand';

export const metadata: Metadata = {
  title: `Secure Checkout | ${BRAND.name}`,
  description: 'Complete your watch order with fast, safe nationwide delivery.',
};

export default async function CheckoutPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login?next=/checkout');
  }

  return (
    <div className="min-h-screen bg-[var(--ivory)] py-12 md:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10 md:mb-14">
          <span className="text-xs uppercase tracking-[0.25em] font-semibold text-[var(--gold)]">
            Safe & Secure
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl text-[var(--ink)] mt-2 font-normal">
            Checkout & Delivery
          </h1>
          <p className="text-[var(--muted)] text-sm md:text-base mt-2 max-w-xl">
            Every watch is carefully checked, packaged in a presentation box, and delivered safely to your address.
          </p>
        </div>

        <CheckoutForm user={user} />
      </div>
    </div>
  );
}
