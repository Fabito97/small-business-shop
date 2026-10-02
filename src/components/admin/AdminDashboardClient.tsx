'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Package,
  Clock,
  DollarSign,
  Search,
  ExternalLink,
  ChevronDown,
  X,
  MapPin,
  Building2,
  Banknote,
  AlertTriangle,
  RotateCw,
} from 'lucide-react';

import { useAdminOrders, useUpdateOrderStatus, type AdminOrderWithItems } from '@/hooks/useAdminOrders';
import { formatNaira } from '@/lib/money';
import { StatusBadge, type OrderStatus } from '@/components/ui/StatusBadge';
import type { User } from '@/server/db/schema';

interface AdminDashboardClientProps {
  admin: User;
}

const STATUS_FILTERS: Array<{ id: string; label: string }> = [
  { id: 'all', label: 'All Orders' },
  { id: 'pending', label: 'Pending' },
  { id: 'confirmed', label: 'Confirmed' },
  { id: 'shipped', label: 'In Transit' },
  { id: 'delivered', label: 'Delivered' },
  { id: 'cancelled', label: 'Cancelled' },
];

export function AdminDashboardClient({ admin }: AdminDashboardClientProps) {
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeOrder, setActiveOrder] = useState<AdminOrderWithItems | null>(null);

  const { data, isLoading, isError, error, refetch, isFetching } = useAdminOrders(selectedStatus);
  const updateStatusMutation = useUpdateOrderStatus();

  const orders = data?.orders || [];
  const stats = data?.stats || { totalOrders: 0, pendingOrders: 0, totalRevenueKobo: 0 };

  // Filter orders by local search query (orderNumber, customerName, customerEmail)
  const filteredOrders = orders.filter((o) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      o.orderNumber.toLowerCase().includes(q) ||
      o.customerName.toLowerCase().includes(q) ||
      o.customerEmail.toLowerCase().includes(q) ||
      o.city.toLowerCase().includes(q) ||
      o.state.toLowerCase().includes(q)
    );
  });

  const handleStatusChange = (orderId: string, newStatus: OrderStatus) => {
    updateStatusMutation.mutate({ orderId, status: newStatus });
  };

  return (
    <div className="space-y-10">
      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {/* Total Revenue */}
        <div className="p-6 rounded-xl bg-white border border-[var(--sand)] shadow-sm space-y-3">
          <div className="flex items-center justify-between text-[var(--muted)]">
            <span className="text-xs uppercase tracking-wider font-semibold">Total Revenue</span>
            <div className="p-2 rounded-lg bg-[var(--gold)]/10 text-[var(--gold)]">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="font-serif text-3xl font-bold text-[var(--ink)]">
            {formatNaira(stats.totalRevenueKobo)}
          </div>
          <p className="text-xs text-[var(--muted)]">Settled & in-transit requisitions</p>
        </div>

        {/* Total Orders */}
        <div className="p-6 rounded-xl bg-white border border-[var(--sand)] shadow-sm space-y-3">
          <div className="flex items-center justify-between text-[var(--muted)]">
            <span className="text-xs uppercase tracking-wider font-semibold">Total Orders</span>
            <div className="p-2 rounded-lg bg-[var(--ink)]/5 text-[var(--ink)]">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="font-serif text-3xl font-bold text-[var(--ink)]">
            {stats.totalOrders}
          </div>
          <p className="text-xs text-[var(--muted)]">Across all Nigerian regions</p>
        </div>

        {/* Pending Orders */}
        <div className="p-6 rounded-xl bg-white border border-[var(--sand)] shadow-sm space-y-3">
          <div className="flex items-center justify-between text-[var(--muted)]">
            <span className="text-xs uppercase tracking-wider font-semibold">Pending Action</span>
            <div className="p-2 rounded-lg bg-[var(--warning)]/10 text-[var(--warning)]">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-serif text-3xl font-bold text-[var(--warning)]">
              {stats.pendingOrders}
            </span>
            {stats.pendingOrders > 0 && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[var(--warning)]/15 text-[var(--warning)]">
                Awaiting Wire/Dispatch
              </span>
            )}
          </div>
          <p className="text-xs text-[var(--muted)]">Requires review or confirmation</p>
        </div>
      </div>

      {/* Filter Tabs & Search Controls */}
      <div className="bg-white border border-[var(--sand)] rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between text-xs text-[var(--muted)] border-b border-[var(--sand)]/60 pb-2.5">
          <span>Active Operations Queue</span>
          <span>Logged in as: <strong className="text-[var(--ink)] font-medium">{admin.email}</strong></span>
        </div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Status Filter Pills */}
          <div className="flex flex-wrap gap-2">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setSelectedStatus(f.id)}
                className={`px-3.5 py-1.5 rounded-md text-xs font-medium tracking-wide uppercase transition-colors cursor-pointer ${
                  selectedStatus === f.id
                    ? 'bg-[var(--ink)] text-[var(--ivory)]'
                    : 'bg-[var(--sand)]/40 hover:bg-[var(--sand)] text-[var(--muted)]'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Search Input & Refresh Button */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-72">
              <Search className="w-4 h-4 text-[var(--muted)] absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search orders, client, city..."
                className="w-full pl-9 pr-4 py-2 bg-stone-50 border border-[var(--sand)] rounded-md text-xs text-[var(--ink)] placeholder:text-[var(--muted)]/60 focus:outline-none focus:ring-1 focus:ring-[var(--gold)]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2.5 text-[var(--muted)] hover:text-[var(--ink)]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => refetch()}
              disabled={isFetching}
              title="Refresh orders list"
              className="p-2 border border-[var(--sand)] rounded-md hover:bg-stone-50 text-[var(--muted)] hover:text-[var(--ink)] transition-colors cursor-pointer"
            >
              <RotateCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white border border-[var(--sand)] rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-16 text-center">
            <div className="w-8 h-8 rounded-full border-2 border-[var(--gold)] border-t-transparent animate-spin mx-auto mb-3" />
            <p className="text-xs text-[var(--muted)]">Loading order logs...</p>
          </div>
        ) : isError ? (
          <div className="p-12 text-center text-[var(--danger)] space-y-2">
            <p className="font-semibold text-sm">Failed to retrieve admin records</p>
            <p className="text-xs">{error?.message || 'Unknown network error'}</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-[var(--sand)]/40 flex items-center justify-center text-[var(--muted)] mx-auto">
              <Package className="w-6 h-6" />
            </div>
            <p className="font-serif text-xl text-[var(--ink)]">No matching requisitions found</p>
            <p className="text-xs text-[var(--muted)] max-w-sm mx-auto">
              No orders found for status &quot;{selectedStatus}&quot;{searchQuery ? ` matching "${searchQuery}"` : ''}.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-[var(--sand)]/20 border-b border-[var(--sand)] text-xs uppercase tracking-[0.1em] text-[var(--muted)]">
                  <th className="py-3.5 px-6 font-medium">Order Number</th>
                  <th className="py-3.5 px-6 font-medium">Customer</th>
                  <th className="py-3.5 px-6 font-medium">Date</th>
                  <th className="py-3.5 px-6 font-medium">Method</th>
                  <th className="py-3.5 px-6 font-medium">Total</th>
                  <th className="py-3.5 px-6 font-medium">Status</th>
                  <th className="py-3.5 px-6 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--sand)]">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-[var(--sand)]/10 transition-colors">
                    {/* Order Reference */}
                    <td className="py-4 px-6">
                      <button
                        type="button"
                        onClick={() => setActiveOrder(order)}
                        className="font-mono font-bold text-sm text-[var(--ink)] hover:text-[var(--gold)] transition-colors text-left cursor-pointer"
                      >
                        {order.orderNumber}
                      </button>
                      <span className="block text-[11px] text-[var(--muted)] mt-0.5">
                        {order.items.length} {order.items.length === 1 ? 'piece' : 'pieces'}
                      </span>
                    </td>

                    {/* Customer */}
                    <td className="py-4 px-6">
                      <div className="font-medium text-sm text-[var(--ink)]">
                        {order.customerName}
                      </div>
                      <div className="text-xs text-[var(--muted)]">{order.customerEmail}</div>
                      <div className="text-xs text-[var(--muted)]">{order.customerPhone}</div>
                    </td>

                    {/* Date */}
                    <td className="py-4 px-6 text-xs text-[var(--muted)]">
                      {new Date(order.createdAt).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>

                    {/* Payment Method */}
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
                      <div className="text-[11px] text-[var(--muted)]/70 mt-0.5">
                        {order.state}
                      </div>
                    </td>

                    {/* Total */}
                    <td className="py-4 px-6 font-serif font-semibold text-[var(--ink)]">
                      {formatNaira(order.totalKobo)}
                    </td>

                    {/* Interactive Status Selector */}
                    <td className="py-4 px-6">
                      <div className="relative inline-block">
                        <select
                          value={order.status}
                          disabled={updateStatusMutation.isPending}
                          onChange={(e) =>
                            handleStatusChange(order.id, e.target.value as OrderStatus)
                          }
                          className="appearance-none text-xs font-semibold uppercase tracking-wider py-1.5 pl-3 pr-7 rounded-full bg-stone-50 border border-[var(--sand)] text-[var(--ink)] focus:outline-none focus:ring-1 focus:ring-[var(--gold)] cursor-pointer disabled:opacity-50"
                        >
                          <option value="pending">Pending</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="shipped">In Transit</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled (Restock)</option>
                        </select>
                        <ChevronDown className="w-3 h-3 text-[var(--muted)] absolute right-2.5 top-2.5 pointer-events-none" />
                      </div>
                    </td>

                    {/* Action */}
                    <td className="py-4 px-6 text-right">
                      <button
                        type="button"
                        onClick={() => setActiveOrder(order)}
                        className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-xs font-medium text-[var(--ink)] rounded transition-colors cursor-pointer"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Slide-Over Order Detail Modal */}
      {activeOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-xl h-full bg-white shadow-2xl p-6 sm:p-8 overflow-y-auto space-y-6 flex flex-col justify-between animate-in slide-in-from-right duration-300">
            {/* Top Bar */}
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-[var(--sand)] pb-4">
                <div>
                  <span className="text-xs uppercase tracking-wider text-[var(--muted)] font-medium block">
                    Requisition Record
                  </span>
                  <h3 className="font-mono text-xl font-bold text-[var(--ink)]">
                    {activeOrder.orderNumber}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveOrder(null)}
                  className="p-2 text-[var(--muted)] hover:text-[var(--ink)] rounded-full hover:bg-stone-100 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Status Update Card */}
              <div className="p-4 rounded-lg bg-stone-50 border border-[var(--sand)] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wider text-[var(--muted)] font-semibold">
                    Current Fulfillment Status
                  </span>
                  <StatusBadge status={activeOrder.status} />
                </div>

                <div className="flex items-center gap-3">
                  <select
                    value={activeOrder.status}
                    disabled={updateStatusMutation.isPending}
                    onChange={(e) => {
                      const newStat = e.target.value as OrderStatus;
                      handleStatusChange(activeOrder.id, newStat);
                      setActiveOrder({ ...activeOrder, status: newStat });
                    }}
                    className="flex-1 py-2 px-3 bg-white border border-[var(--sand)] rounded-md text-xs font-medium text-[var(--ink)] focus:outline-none focus:ring-1 focus:ring-[var(--gold)] cursor-pointer"
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="shipped">In Transit (Shipped)</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled (Restock Timepieces)</option>
                  </select>
                </div>

                {activeOrder.status === 'cancelled' && (
                  <div className="flex items-start gap-2 text-xs text-[var(--danger)] pt-1">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>
                      This order is cancelled. Quantities have been returned to active catalog inventory.
                    </span>
                  </div>
                )}
              </div>

              {/* Customer & Shipping Information */}
              <div className="space-y-3">
                <h4 className="text-xs uppercase tracking-wider text-[var(--muted)] font-semibold border-b border-[var(--sand)] pb-1.5">
                  Client & Courier Destination
                </h4>
                <div className="text-xs space-y-1.5 text-[var(--muted)]">
                  <div className="font-semibold text-sm text-[var(--ink)]">
                    {activeOrder.customerName}
                  </div>
                  <div>Email: {activeOrder.customerEmail}</div>
                  <div>Phone: {activeOrder.customerPhone}</div>
                  <div className="flex items-start gap-1 pt-1">
                    <MapPin className="w-3.5 h-3.5 text-[var(--gold)] shrink-0 mt-0.5" />
                    <span>
                      {activeOrder.shippingAddress}, {activeOrder.city}, {activeOrder.state}, Nigeria
                    </span>
                  </div>
                  {activeOrder.notes && (
                    <div className="pt-2 text-xs italic text-[var(--gold-deep)]">
                      Notes: {activeOrder.notes}
                    </div>
                  )}
                </div>
              </div>

              {/* Items Acquired */}
              <div className="space-y-3">
                <h4 className="text-xs uppercase tracking-wider text-[var(--muted)] font-semibold border-b border-[var(--sand)] pb-1.5">
                  Timepieces In Requisition ({activeOrder.items.length})
                </h4>

                <div className="divide-y divide-[var(--sand)] space-y-3">
                  {activeOrder.items.map((item) => (
                    <div key={item.id} className="pt-3 first:pt-0 flex items-center gap-3">
                      <div className="relative w-12 h-14 rounded bg-[var(--sand)]/40 overflow-hidden shrink-0">
                        {item.imageUrl ? (
                          <Image
                            src={item.imageUrl}
                            alt={item.productName}
                            fill
                            className="object-cover"
                            sizes="48px"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[var(--muted)]">
                            <Package className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-serif text-sm font-medium text-[var(--ink)] truncate">
                          {item.productName}
                        </div>
                        <div className="text-xs text-[var(--muted)]">
                          Qty: {item.quantity} &times; {formatNaira(item.unitPriceKobo)}
                        </div>
                      </div>
                      <div className="text-xs font-semibold text-[var(--ink)]">
                        {formatNaira(item.unitPriceKobo * item.quantity)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Financial Totals */}
              <div className="p-4 bg-stone-50 rounded-lg space-y-2 text-xs border border-[var(--sand)]">
                <div className="flex justify-between text-[var(--muted)]">
                  <span>Subtotal</span>
                  <span className="font-medium text-[var(--ink)]">
                    {formatNaira(activeOrder.subtotalKobo)}
                  </span>
                </div>
                <div className="flex justify-between text-[var(--muted)]">
                  <span>Courier Transit</span>
                  <span className="font-medium text-[var(--ink)]">
                    {activeOrder.shippingKobo === 0
                      ? 'Complimentary'
                      : formatNaira(activeOrder.shippingKobo)}
                  </span>
                </div>
                <div className="border-t border-[var(--sand)] pt-2 flex justify-between items-baseline">
                  <span className="font-serif text-sm font-bold text-[var(--ink)]">Total</span>
                  <span className="font-serif text-xl font-bold text-[var(--gold)]">
                    {formatNaira(activeOrder.totalKobo)}
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-[var(--sand)] flex items-center justify-between gap-4">
              <Link
                href={`/order-confirmation/${activeOrder.orderNumber}`}
                target="_blank"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--gold-deep)] hover:text-[var(--gold)] transition-colors"
              >
                <span>Open Public Receipt</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>

              <button
                type="button"
                onClick={() => setActiveOrder(null)}
                className="px-6 py-2.5 bg-[var(--ink)] hover:bg-[var(--gold-deep)] text-[var(--ivory)] rounded-md text-xs font-medium transition-colors cursor-pointer"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
