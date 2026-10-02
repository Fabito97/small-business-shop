import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Package, ArrowRight, Calendar, Building2, Banknote, ExternalLink } from 'lucide-react';

import { requireUser } from '@/server/auth/guards';
import { getUserOrders } from '@/server/orders';
import { formatNaira } from '@/lib/money';
import { BRAND } from '@/config/brand';
import { StatusBadge } from '@/components/ui/StatusBadge';

export const metadata: Metadata = {
  title: `My Orders | ${BRAND.name}`,
  description: 'Review your past timepiece acquisitions, invoices, and dispatch statuses.',
};

export const dynamic = 'force-dynamic';

export default async function MyOrdersPage() {
  const user = await requireUser();
  const orders = await getUserOrders(user.id);

  return (
    <div className="min-h-screen bg-[var(--ivory)] py-12 md:py-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Header */}
        <div className="border-b border-[var(--sand)] pb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <span className="text-xs uppercase tracking-[0.25em] font-semibold text-[var(--gold)]">
              Client Portfolio
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl text-[var(--ink)] mt-1 font-normal">
              My Acquisitions & Orders
            </h1>
            <p className="text-xs text-[var(--muted)] mt-1">
              Registered client: <span className="font-medium text-[var(--ink)]">{user.name || user.email}</span>
            </p>
          </div>

          <Link
            href="/shop"
            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--gold-deep)] hover:text-[var(--gold)] transition-colors self-start sm:self-auto"
          >
            <span>Explore New Arrivals</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Empty State */}
        {orders.length === 0 ? (
          <div className="bg-white border border-[var(--sand)] rounded-2xl p-12 md:p-16 text-center max-w-md mx-auto shadow-sm space-y-5">
            <div className="w-16 h-16 rounded-full bg-[var(--sand)]/50 border border-[var(--sand)] flex items-center justify-center text-[var(--gold)] mx-auto">
              <Package className="w-8 h-8" />
            </div>
            <h2 className="font-serif text-2xl text-[var(--ink)]">No Active Orders Yet</h2>
            <p className="text-xs sm:text-sm text-[var(--muted)] leading-relaxed">
              When you acquire a timepiece, your provenance receipt, courier tracking, and fulfillment updates will appear here.
            </p>
            <div className="pt-2">
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 bg-[var(--ink)] hover:bg-[var(--gold-deep)] text-[var(--ivory)] px-6 py-3.5 rounded-md text-xs uppercase tracking-wider font-semibold transition-colors"
              >
                <span>Browse Horological Collection</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Desktop Table View */}
            <div className="hidden md:block bg-white border border-[var(--sand)] rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-[var(--sand)]/30 border-b border-[var(--sand)] text-xs uppercase tracking-[0.1em] text-[var(--muted)]">
                    <th className="py-4 px-6 font-medium">Order Reference</th>
                    <th className="py-4 px-6 font-medium">Placement Date</th>
                    <th className="py-4 px-6 font-medium">Acquisitions</th>
                    <th className="py-4 px-6 font-medium">Payment</th>
                    <th className="py-4 px-6 font-medium">Total</th>
                    <th className="py-4 px-6 font-medium">Status</th>
                    <th className="py-4 px-6 font-medium text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--sand)]">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-[var(--sand)]/10 transition-colors">
                      <td className="py-4 px-6">
                        <Link
                          href={`/order-confirmation/${order.orderNumber}`}
                          className="font-mono font-bold text-[var(--ink)] hover:text-[var(--gold)] transition-colors"
                        >
                          {order.orderNumber}
                        </Link>
                      </td>
                      <td className="py-4 px-6 text-[var(--muted)] text-xs">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-[var(--gold)]" />
                          <span>
                            {new Date(order.createdAt).toLocaleDateString('en-GB', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <div className="flex -space-x-2 overflow-hidden">
                            {order.items.slice(0, 3).map((item, idx) => (
                              <div
                                key={idx}
                                className="relative w-8 h-8 rounded-full border border-white bg-[var(--sand)] overflow-hidden shrink-0"
                              >
                                {item.imageUrl ? (
                                  <Image
                                    src={item.imageUrl}
                                    alt={item.productName}
                                    fill
                                    className="object-cover"
                                    sizes="32px"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-[10px] text-[var(--muted)]">
                                    •
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                          <span className="text-xs text-[var(--muted)] ml-1">
                            {order.items.length} {order.items.length === 1 ? 'piece' : 'pieces'}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-xs text-[var(--muted)]">
                        <div className="flex items-center gap-1.5">
                          {order.paymentMethod === 'bank_transfer' ? (
                            <>
                              <Building2 className="w-3.5 h-3.5 text-[var(--gold)]" />
                              <span>Bank Wire</span>
                            </>
                          ) : (
                            <>
                              <Banknote className="w-3.5 h-3.5 text-[var(--gold)]" />
                              <span>Pay on Delivery</span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6 font-serif font-semibold text-[var(--ink)] text-base">
                        {formatNaira(order.totalKobo)}
                      </td>
                      <td className="py-4 px-6">
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="py-4 px-6 text-right">
                        <Link
                          href={`/order-confirmation/${order.orderNumber}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--gold)] hover:text-[var(--gold-deep)] transition-colors"
                        >
                          <span>Receipt</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="md:hidden space-y-4">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white border border-[var(--sand)] rounded-xl p-5 space-y-4 shadow-sm"
                >
                  <div className="flex items-center justify-between border-b border-[var(--sand)] pb-3">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-[var(--muted)] block">
                        Order Ref
                      </span>
                      <Link
                        href={`/order-confirmation/${order.orderNumber}`}
                        className="font-mono font-bold text-sm text-[var(--ink)] hover:text-[var(--gold)]"
                      >
                        {order.orderNumber}
                      </Link>
                    </div>
                    <StatusBadge status={order.status} />
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs text-[var(--muted)]">
                    <div>
                      <span className="block text-[10px] uppercase text-[var(--muted)]/80">Date</span>
                      <span className="text-[var(--ink)] font-medium">
                        {new Date(order.createdAt).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] uppercase text-[var(--muted)]/80">Payment</span>
                      <span className="text-[var(--ink)] font-medium">
                        {order.paymentMethod === 'bank_transfer' ? 'Bank Wire' : 'Pay on Delivery'}
                      </span>
                    </div>
                  </div>

                  {/* Items miniature */}
                  <div className="flex items-center gap-3 pt-1">
                    <div className="flex -space-x-2 overflow-hidden">
                      {order.items.slice(0, 3).map((item, idx) => (
                        <div
                          key={idx}
                          className="relative w-8 h-8 rounded-full border border-white bg-[var(--sand)] overflow-hidden shrink-0"
                        >
                          {item.imageUrl && (
                            <Image
                              src={item.imageUrl}
                              alt={item.productName}
                              fill
                              className="object-cover"
                              sizes="32px"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                    <span className="text-xs text-[var(--muted)]">
                      {order.items.length} {order.items.length === 1 ? 'piece' : 'pieces'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-[var(--sand)]">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-[var(--muted)] block">
                        Total
                      </span>
                      <span className="font-serif font-bold text-lg text-[var(--gold)]">
                        {formatNaira(order.totalKobo)}
                      </span>
                    </div>
                    <Link
                      href={`/order-confirmation/${order.orderNumber}`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-[var(--ink)] text-[var(--ivory)] rounded-md text-xs font-medium hover:bg-[var(--gold-deep)] transition-colors"
                    >
                      <span>View Receipt</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
