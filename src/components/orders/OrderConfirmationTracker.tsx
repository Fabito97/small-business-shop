'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  CheckCircle2,
  Clock,
  Building2,
  Banknote,
  CreditCard,
  Copy,
  Check,
  RotateCw,
  ArrowRight,
  ShieldCheck,
  Calendar,
  Package,
} from 'lucide-react';
import { toast } from 'sonner';

import { formatNaira } from '@/lib/money';
import { SHOP } from '@/config/shop';
import type { Order, OrderItem } from '@/server/db/schema';

interface OrderConfirmationTrackerProps {
  initialOrder: Order;
  initialItems: OrderItem[];
}

const BURST_WINDOW_MS = 60000; // 60-second high-frequency verification window

export function OrderConfirmationTracker({
  initialOrder,
  initialItems,
}: OrderConfirmationTrackerProps) {
  const [copiedAccount, setCopiedAccount] = useState(false);
  const [copiedRef, setCopiedRef] = useState(false);
  const startTimeRef = useRef<number | null>(null);
  const prevStatusRef = useRef<string>(initialOrder.status);

  useEffect(() => {
    if (startTimeRef.current === null) {
      startTimeRef.current = Date.now();
    }
  }, []);

  // TanStack React Query with Smart Tiered Backoff Polling
  const { data, refetch, isFetching } = useQuery<{ order: Order; items: OrderItem[] }>({
    queryKey: ['order', initialOrder.orderNumber],
    queryFn: async () => {
      const res = await fetch(`/api/orders/${initialOrder.orderNumber}`);
      if (!res.ok) {
        throw new Error('Failed to retrieve updated order status');
      }
      return res.json();
    },
    initialData: { order: initialOrder, items: initialItems },
    refetchOnWindowFocus: true,
    refetchInterval: (query) => {
      const currentStatus = query.state.data?.order.status;

      // Terminal or non-pending states: stop polling completely
      if (
        currentStatus === 'confirmed' ||
        currentStatus === 'shipped' ||
        currentStatus === 'delivered' ||
        currentStatus === 'cancelled'
      ) {
        return false;
      }

      const startTime = startTimeRef.current ?? Date.now();
      const elapsed = Date.now() - startTime;

      // Burst window: poll with gentle exponential backoff (4s -> 7s -> 12s)
      if (elapsed < BURST_WINDOW_MS) {
        const secondsPassed = Math.floor(elapsed / 1000);
        if (secondsPassed < 15) return 4000;
        if (secondsPassed < 35) return 7000;
        return 12000;
      }

      // After 60-second cutoff: drop to steady background heartbeat (35s)
      return 35000;
    },
  });

  const order = data?.order ?? initialOrder;
  const items = data?.items ?? initialItems;

  const isBankTransfer = order.paymentMethod === 'bank_transfer';
  const isCard = order.paymentMethod === 'card';
  const isConfirmed = order.status === 'confirmed' || order.status === 'shipped' || order.status === 'delivered';
  const firstName = order.customerName.split(' ')[0] || 'Valued Client';

  // Detect live status transition from pending -> confirmed
  useEffect(() => {
    if (prevStatusRef.current === 'pending' && order.status === 'confirmed') {
      toast.success('Payment verified! Your order is now officially confirmed.');
    }
    prevStatusRef.current = order.status;
  }, [order.status]);

  const handleCopy = (text: string, type: 'account' | 'ref') => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      if (type === 'account') {
        setCopiedAccount(true);
        setTimeout(() => setCopiedAccount(false), 2500);
      } else {
        setCopiedRef(true);
        setTimeout(() => setCopiedRef(false), 2500);
      }
      toast.success(`${type === 'account' ? 'Account number' : 'Order reference'} copied to clipboard`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
      {/* Success Header */}
      <div className="text-center space-y-4">
        <div
          className={`inline-flex items-center justify-center w-20 h-20 rounded-full mx-auto shadow-sm transition-all duration-500 ${
            isConfirmed
              ? 'bg-[var(--success)]/10 text-[var(--success)] border border-[var(--success)]/30'
              : 'bg-[var(--gold)]/10 text-[var(--gold)] border border-[var(--gold)]/30'
          }`}
        >
          {isConfirmed ? (
            <ShieldCheck className="w-10 h-10 animate-in zoom-in-75 duration-300" />
          ) : (
            <CheckCircle2 className="w-10 h-10" />
          )}
        </div>

        <span className="text-xs uppercase tracking-[0.25em] font-semibold text-[var(--gold)] block">
          {isConfirmed ? 'Order Verified & Secured' : 'Order Placed'}
        </span>

        <h1 className="font-serif text-3xl sm:text-5xl text-[var(--ink)] font-normal">
          Thank you, {firstName}!
        </h1>

        <p className="text-[var(--muted)] text-sm sm:text-base max-w-lg mx-auto leading-relaxed">
          Your watch order has been recorded. An official receipt has been sent to{' '}
          <strong className="text-[var(--ink)] font-medium">{order.customerEmail}</strong>.
        </p>
      </div>

      {/* Order Meta Bar */}
      <div className="bg-white border border-[var(--sand)] rounded-xl p-5 sm:p-6 flex flex-wrap items-center justify-between gap-4 shadow-sm">
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
          <div className="flex items-center gap-2 mt-1">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider transition-all duration-300 ${
                order.status === 'confirmed'
                  ? 'bg-[var(--success)]/10 text-[var(--success)] border border-[var(--success)]/20'
                  : order.status === 'shipped' || order.status === 'delivered'
                  ? 'bg-[var(--gold)]/10 text-[var(--gold-deep)] border border-[var(--gold)]/20'
                  : 'bg-[var(--warning)]/10 text-[var(--warning)] border border-[var(--warning)]/20'
              }`}
            >
              {order.status === 'pending' ? (
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--warning)] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--warning)]" />
                </span>
              ) : (
                <Clock className="w-3.5 h-3.5" />
              )}
              {order.status}
            </span>
          </div>
        </div>

        <div>
          <span className="text-xs uppercase tracking-[0.1em] text-[var(--muted)] font-medium block">
            Payment Mode
          </span>
          <div className="flex items-center gap-1.5 text-sm font-medium text-[var(--ink)] mt-0.5">
            {isBankTransfer ? (
              <>
                <Building2 className="w-4 h-4 text-[var(--gold)]" />
                <span>Bank Wire</span>
              </>
            ) : isCard ? (
              <>
                <CreditCard className="w-4 h-4 text-[var(--gold)]" />
                <span>Card (Online Verified)</span>
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

      {/* Dynamic Settlement Card */}
      {isConfirmed ? (
        /* Confirmed State: Green/Gold Verified Settlement Banner */
        <div className="bg-[var(--ink)]/90 border border-emerald-500/30 rounded-xl p-6 sm:p-8 text-[var(--ivory)] shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="p-2.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-serif text-xl text-white">Payment Authorized & Verified</h3>
                <p className="text-xs text-stone-300 mt-0.5">
                  Full payment of <strong className="text-emerald-400">{formatNaira(order.totalKobo)}</strong> was received. Your watch is being prepared for delivery.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="text-[11px] font-mono uppercase tracking-wider px-3 py-1.5 rounded bg-[var(--gold)]/80 text-[var(--ink)]">
                Receipt #{order.orderNumber}
              </span>
            </div>
          </div>
        </div>
      ) : isBankTransfer ? (
        /* Pending Bank Transfer State with Coordinates & Live Polling Status */
        <div className="bg-[#141418] text-[var(--ivory)] border border-[var(--gold)]/30 rounded-xl p-6 sm:p-8 shadow-md space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded bg-[var(--gold)]/20 text-[var(--gold)]">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif text-xl text-[var(--ivory)]">
                  Direct Bank Wire Coordinates
                </h3>
                <p className="text-xs text-[var(--muted)]">
                  Please wire {formatNaira(order.totalKobo)} to the account below. We automatically monitor for incoming credit.
                </p>
              </div>
            </div>

            {/* Live Polling Status & Manual Check Trigger */}
            <div className="flex items-center gap-2.5 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => refetch()}
                disabled={isFetching}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-white/10 hover:bg-white/15 text-xs text-stone-200 transition-colors disabled:opacity-50"
                title="Refresh order status"
              >
                <RotateCw className={`w-3.5 h-3.5 text-[var(--gold)] ${isFetching ? 'animate-spin' : ''}`} />
                <span>{isFetching ? 'Verifying...' : 'Check Status Now'}</span>
              </button>
            </div>
          </div>

          {/* Coordinates Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
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

            <div className="p-3.5 rounded bg-white/5 border border-white/5 relative group">
              <span className="text-[11px] uppercase tracking-wider text-[var(--muted)] block mb-1">
                Account Number
              </span>
              <div className="flex items-center justify-between">
                <span className="font-mono text-base font-bold text-[var(--gold)] tracking-wider">
                  {SHOP.bankDetails.accountNumber}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(SHOP.bankDetails.accountNumber, 'account')}
                  className="p-1 text-[var(--muted)] hover:text-white transition-colors"
                  title="Copy account number"
                >
                  {copiedAccount ? <Check className="w-3.5 h-3.5 text-[var(--success)]" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="p-3.5 rounded bg-white/5 border border-white/5 relative group">
              <span className="text-[11px] uppercase tracking-wider text-[var(--muted)] block mb-1">
                Reference To Quote
              </span>
              <div className="flex items-center justify-between">
                <span className="font-mono text-base font-bold text-[var(--ivory)] tracking-wider">
                  {order.orderNumber}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(order.orderNumber, 'ref')}
                  className="p-1 text-[var(--muted)] hover:text-white transition-colors"
                  title="Copy order reference"
                >
                  {copiedRef ? <Check className="w-3.5 h-3.5 text-[var(--success)]" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-stone-400 italic">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--gold)] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--gold)]" />
            </span>
            <span>
              {isFetching
                ? 'Connecting with settlement ledger...'
                : 'Listening for incoming credit. Status updates automatically once verified.'}
            </span>
          </div>
        </div>
      ) : (
        /* Pay on Delivery State */
        <div className="bg-amber-950/20 border border-amber-500/30 rounded-xl p-6 text-[var(--ink)] shadow-sm">
          <div className="flex items-center gap-3">
            <Banknote className="w-5 h-5 text-amber-600" />
            <div>
              <h3 className="font-serif text-lg font-medium text-[var(--ink)]">
                Pay on Delivery Reserved
              </h3>
              <p className="text-xs text-[var(--muted)] mt-0.5">
                Our delivery rider will present your watch for inspection. You can pay {formatNaira(order.totalKobo)} using cash or card POS.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Order Details & Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Items Purchased */}
        <div className="md:col-span-7 bg-white border border-[var(--sand)] rounded-xl p-6 shadow-sm space-y-5">
          <h3 className="font-serif text-xl text-[var(--ink)] border-b border-[var(--sand)] pb-3">
            Watches in This Order ({items.length})
          </h3>

          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="p-3 flex items-center gap-4 border border-[var(--sand)] rounded-lg bg-[var(--sand)]/5">
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
                  <h4 className="font-serif text-sm font-semibold text-[var(--ink)] truncate">
                    {item.productName}
                  </h4>
                  <p className="text-xs text-[var(--muted)] mt-0.5">
                    Qty: {item.quantity} &times; {formatNaira(item.unitPriceKobo)}
                  </p>
                </div>

                <div className="text-right">
                  <span className="font-serif text-sm font-bold text-[var(--ink)]">
                    {formatNaira(item.unitPriceKobo * item.quantity)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Shipping & Financial Breakdown */}
        <div className="md:col-span-5 space-y-6">
          {/* Financial Breakdown */}
          <div className="bg-white border border-[var(--sand)] rounded-xl p-6 shadow-sm space-y-4">
            <h3 className="font-serif text-xl text-[var(--ink)] border-b border-[var(--sand)] pb-3">
              Payment Summary
            </h3>

            <div className="space-y-2.5 text-sm">
              <div className="flex items-center justify-between text-[var(--muted)]">
                <span>Subtotal</span>
                <span className="font-serif text-[var(--ink)] font-medium">
                  {formatNaira(order.subtotalKobo)}
                </span>
              </div>

              <div className="flex items-center justify-between text-[var(--muted)]">
                <span>Insured Courier Delivery</span>
                <span className="font-serif text-[var(--ink)] font-medium">
                  {order.shippingKobo === 0 ? (
                    <span className="text-[var(--success)] font-sans text-xs uppercase tracking-wider font-semibold">
                      Complimentary
                    </span>
                  ) : (
                    formatNaira(order.shippingKobo)
                  )}
                </span>
              </div>

              <div className="border-t border-[var(--sand)] pt-3 flex items-center justify-between font-serif">
                <span className="text-base text-[var(--ink)] font-bold">Total Consideration</span>
                <span className="text-xl font-bold text-[var(--gold-deep)]">
                  {formatNaira(order.totalKobo)}
                </span>
              </div>
            </div>
          </div>

          {/* Delivery Coordinates */}
          <div className="bg-white border border-[var(--sand)] rounded-xl p-6 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-[var(--sand)] pb-3">
              <h3 className="font-serif text-base text-[var(--ink)] font-semibold">
                Dispatch Destination
              </h3>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-[var(--sand)] text-[var(--ink)]">
                Insured
              </span>
            </div>

            <div className="text-sm space-y-1 text-[var(--muted)]">
              <p className="font-medium text-[var(--ink)]">{order.customerName}</p>
              <p>{order.shippingAddress}</p>
              <p>
                {order.city}, {order.state}, Nigeria
              </p>
              <p className="text-xs text-[var(--ink)] pt-1 font-mono">{order.customerPhone}</p>
              {order.notes && (
                <p className="text-xs italic text-[var(--gold-deep)] pt-2 border-t border-[var(--sand)] mt-2">
                  Special Note: {order.notes}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 pb-12">
        <Link
          href="/orders"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-[var(--ink)] text-[var(--ivory)] rounded-md font-medium text-sm hover:bg-[var(--gold-deep)] transition-colors shadow-sm"
        >
          <span>View My Orders</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
        <Link
          href="/shop"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-white border border-[var(--sand)] text-[var(--ink)] rounded-md font-medium text-sm hover:bg-[var(--sand)]/40 transition-colors"
        >
          <span>Continue Shopping</span>
        </Link>
      </div>
    </div>
  );
}
