import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  CheckCircle2,
  Package,
  Calendar,
  CreditCard,
  MapPin,
  Building2,
  Banknote,
  ArrowRight,
  Clock,
  MessageCircle,
} from 'lucide-react';

import { getCurrentUser } from '@/server/auth/guards';
import { getOrder } from '@/server/orders';
import { formatNaira } from '@/lib/money';
import { BRAND } from '@/config/brand';
import { SHOP } from '@/config/shop';

export const metadata: Metadata = {
  title: `Order Confirmation | ${BRAND.name}`,
  description: 'Your timepiece acquisition receipt and transit status.',
};

export default async function OrderConfirmationPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const user = await getCurrentUser();
  const { orderNumber } = await params;

  if (!user) {
    redirect(`/login?next=/order-confirmation/${orderNumber}`);
  }

  const result = await getOrder(orderNumber, user.id, user.role === 'admin');

  if (!result) {
    notFound();
  }

  const { order, items } = result;
  const firstName = order.customerName.split(' ')[0] || 'Valued Client';
  const isBankTransfer = order.paymentMethod === 'bank_transfer';

  return (
    <div className="min-h-screen bg-[var(--ivory)] py-12 md:py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Success Banner */}
        <div className="text-center space-y-4 mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[var(--gold)]/10 text-[var(--gold)] border border-[var(--gold)]/30 mx-auto shadow-sm">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <span className="text-xs uppercase tracking-[0.25em] font-semibold text-[var(--gold)] block">
            Requisition Confirmed
          </span>
          <h1 className="font-serif text-3xl sm:text-5xl text-[var(--ink)] font-normal">
            Thank you, {firstName}!
          </h1>
          <p className="text-[var(--muted)] text-sm sm:text-base max-w-lg mx-auto leading-relaxed">
            Your timepiece order has been recorded. A confirmation receipt has been dispatched to{' '}
            <strong className="text-[var(--ink)] font-medium">{order.customerEmail}</strong>.
          </p>
        </div>

        {/* Order Meta Bar */}
        <div className="bg-white border border-[var(--sand)] rounded-xl p-5 sm:p-6 mb-8 flex flex-wrap items-center justify-between gap-4 shadow-sm">
          <div>
            <span className="text-xs uppercase tracking-[0.1em] text-[var(--muted)] font-medium block">
              Order Reference
            </span>
            <span className="font-mono text-lg font-bold text-[var(--ink)] tracking-wider">
              {order.orderNumber}
            </span>
          </div>

          <div>
            <span className="text-xs uppercase tracking-[0.1em] text-[var(--muted)] font-medium block">
              Placement Date
            </span>
            <div className="flex items-center gap-1.5 text-sm text-[var(--ink)] mt-0.5">
              <Calendar className="w-4 h-4 text-[var(--gold)]" />
              <span>
                {new Date(order.createdAt).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
            </div>
          </div>

          <div>
            <span className="text-xs uppercase tracking-[0.1em] text-[var(--muted)] font-medium block">
              Fulfillment Status
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-[var(--warning)]/10 text-[var(--warning)] mt-1">
              <Clock className="w-3.5 h-3.5" />
              {order.status}
            </span>
          </div>

          <div>
            <span className="text-xs uppercase tracking-[0.1em] text-[var(--muted)] font-medium block">
              Settlement Method
            </span>
            <div className="flex items-center gap-1.5 text-sm font-medium text-[var(--ink)] mt-0.5">
              {isBankTransfer ? (
                <>
                  <Building2 className="w-4 h-4 text-[var(--gold)]" />
                  <span>Bank Wire</span>
                </>
              ) : (
                <>
                  <Banknote className="w-4 h-4 text-[var(--gold)]" />
                  <span>Pay on Delivery</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Wire Transfer Details Card (if applicable) */}
        {isBankTransfer && (
          <div className="bg-[#141418] text-[var(--ivory)] border border-[var(--gold)]/30 rounded-xl p-6 sm:p-8 mb-8 shadow-md">
            <div className="flex items-center gap-3 border-b border-white/10 pb-4 mb-5">
              <div className="p-2 rounded bg-[var(--gold)]/20 text-[var(--gold)]">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif text-xl text-[var(--ivory)]">
                  Direct Bank Wire Coordinates
                </h3>
                <p className="text-xs text-[var(--muted)]">
                  Please initiate transfer of {formatNaira(order.totalKobo)} using reference {order.orderNumber}.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-sm">
              <div className="p-3.5 rounded bg-white/5 border border-white/5">
                <span className="text-[11px] uppercase tracking-wider text-[var(--muted)] block mb-1">
                  Bank Name
                </span>
                <span className="font-medium text-[var(--ivory)]">{SHOP.bankDetails.bankName}</span>
              </div>
              <div className="p-3.5 rounded bg-white/5 border border-white/5">
                <span className="text-[11px] uppercase tracking-wider text-[var(--muted)] block mb-1">
                  Account Name
                </span>
                <span className="font-medium text-[var(--ivory)]">{SHOP.bankDetails.accountName}</span>
              </div>
              <div className="p-3.5 rounded bg-white/5 border border-white/5">
                <span className="text-[11px] uppercase tracking-wider text-[var(--muted)] block mb-1">
                  Account Number
                </span>
                <span className="font-mono text-base font-bold text-[var(--gold)] tracking-wider">
                  {SHOP.bankDetails.accountNumber}
                </span>
              </div>
              <div className="p-3.5 rounded bg-white/5 border border-white/5">
                <span className="text-[11px] uppercase tracking-wider text-[var(--muted)] block mb-1">
                  Reference To Quote
                </span>
                <span className="font-mono text-base font-bold text-[var(--ivory)] tracking-wider">
                  {order.orderNumber}
                </span>
              </div>
            </div>

            <p className="text-xs text-stone-400 mt-5 leading-relaxed italic">
              {SHOP.bankDetails.instructions}
            </p>
          </div>
        )}

        {/* Order Details & Summary Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-10">
          {/* Items Purchased */}
          <div className="md:col-span-7 bg-white border border-[var(--sand)] rounded-xl p-6 shadow-sm space-y-5">
            <h3 className="font-serif text-xl text-[var(--ink)] border-b border-[var(--sand)] pb-3">
              Timepieces Acquired ({items.length})
            </h3>

            <div className="divide-y divide-[var(--sand)] space-y-4">
              {items.map((item) => (
                <div key={item.id} className="pt-4 first:pt-0 flex items-center gap-4">
                  <div className="relative w-16 h-20 rounded bg-[var(--sand)]/40 overflow-hidden shrink-0">
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.productName}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[var(--muted)]">
                        <Package className="w-6 h-6" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-serif text-base font-medium text-[var(--ink)] truncate">
                      {item.productName}
                    </h4>
                    <p className="text-xs text-[var(--muted)] mt-1">
                      Quantity: {item.quantity} &times; {formatNaira(item.unitPriceKobo)}
                    </p>
                  </div>
                  <div className="text-sm font-semibold text-[var(--ink)] shrink-0">
                    {formatNaira(item.unitPriceKobo * item.quantity)}
                  </div>
                </div>
              ))}
            </div>

            {/* Financial Breakdown */}
            <div className="border-t border-[var(--sand)] pt-4 space-y-2.5 text-sm">
              <div className="flex justify-between text-[var(--muted)]">
                <span>Subtotal</span>
                <span className="text-[var(--ink)] font-medium">
                  {formatNaira(order.subtotalKobo)}
                </span>
              </div>
              <div className="flex justify-between text-[var(--muted)]">
                <span>Insured Courier Transit</span>
                <span
                  className={
                    order.shippingKobo === 0
                      ? 'text-[var(--success)] font-medium'
                      : 'text-[var(--ink)]'
                  }
                >
                  {order.shippingKobo === 0 ? 'Complimentary' : formatNaira(order.shippingKobo)}
                </span>
              </div>
              <div className="border-t border-[var(--sand)] pt-3 flex justify-between items-baseline">
                <span className="font-serif text-lg font-medium text-[var(--ink)]">Grand Total</span>
                <span className="font-serif text-2xl font-bold text-[var(--gold)]">
                  {formatNaira(order.totalKobo)}
                </span>
              </div>
            </div>
          </div>

          {/* Destination Details */}
          <div className="md:col-span-5 space-y-6">
            <div className="bg-white border border-[var(--sand)] rounded-xl p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-[var(--sand)] pb-3">
                <MapPin className="w-4 h-4 text-[var(--gold)]" />
                <h3 className="font-serif text-lg text-[var(--ink)]">Courier Destination</h3>
              </div>

              <div className="text-sm space-y-1.5 text-[var(--muted)] leading-relaxed">
                <p className="font-medium text-[var(--ink)]">{order.customerName}</p>
                <p>{order.shippingAddress}</p>
                <p>
                  {order.city}, {order.state}, Nigeria
                </p>
                <p className="pt-1 text-xs">Contact: {order.customerPhone}</p>
                {order.notes && (
                  <p className="pt-2 text-xs italic text-[var(--gold-deep)] border-t border-[var(--sand)] mt-2">
                    Note: {order.notes}
                  </p>
                )}
              </div>
            </div>

            {/* Concierge Assistance */}
            <div className="bg-white border border-[var(--sand)] rounded-xl p-6 shadow-sm space-y-3">
              <h4 className="font-serif text-base text-[var(--ink)]">Concierge Assistance</h4>
              <p className="text-xs text-[var(--muted)] leading-relaxed">
                Our customer relationship team is at your disposal for questions regarding your transit or horological maintenance.
              </p>
              <a
                href={BRAND.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--gold)] hover:text-[var(--gold-deep)] transition-colors pt-1"
              >
                <MessageCircle className="w-4 h-4" />
                Connect on WhatsApp ({BRAND.whatsapp})
              </a>
            </div>
          </div>
        </div>

        {/* Action CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6 border-t border-[var(--sand)]">
          <Link
            href="/shop"
            className="w-full sm:w-auto px-8 py-3.5 bg-[var(--ink)] hover:bg-[var(--gold-deep)] text-[var(--ivory)] text-sm font-medium rounded-md transition-colors text-center shadow-sm"
          >
            Continue Horological Journey
          </Link>
          <Link
            href="/orders"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-white border border-[var(--sand)] hover:border-[var(--muted)] text-[var(--ink)] text-sm font-medium rounded-md transition-colors text-center"
          >
            <span>View All Requisitions</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
