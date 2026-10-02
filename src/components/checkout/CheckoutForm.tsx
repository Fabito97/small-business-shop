'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Lock,
  ShieldCheck,
  Truck,
  Clock,
  ArrowRight,
  AlertCircle,
  Building2,
  Banknote,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';

import { useCartStore, selectCartSubtotal, selectCartShippingFee, selectCartTotal } from '@/store/cart';
import { useIsMounted } from '@/hooks/useIsMounted';
import { formatNaira } from '@/lib/money';
import { SHOP, isPayOnDeliverySupported } from '@/config/shop';
import { BRAND } from '@/config/brand';
import { checkoutFormSchema, type CheckoutFormData } from '@/lib/validators';
import type { User } from '@/server/db/schema';

interface CheckoutFormProps {
  user: User;
}

export function CheckoutForm({ user }: CheckoutFormProps) {
  const router = useRouter();
  const mounted = useIsMounted();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const items = useCartStore((s) => s.items);
  const clearCart = useCartStore((s) => s.clear);
  const subtotal = useCartStore(selectCartSubtotal);
  const shippingFee = useCartStore(selectCartShippingFee);
  const total = useCartStore(selectCartTotal);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: {
      name: user.name || '',
      email: user.email,
      phone: '',
      address: '',
      city: '',
      state: 'Lagos',
      notes: '',
      paymentMethod: 'pay_on_delivery',
    },
  });

  const selectedState = watch('state');
  const selectedPaymentMethod = watch('paymentMethod');
  const podSupported = isPayOnDeliverySupported(selectedState);

  // If user selects a state where POD is not supported, automatically toggle to bank transfer
  useEffect(() => {
    if (!podSupported && selectedPaymentMethod === 'pay_on_delivery') {
      setValue('paymentMethod', 'bank_transfer');
    }
  }, [selectedState, podSupported, selectedPaymentMethod, setValue]);

  const onSubmit = async (data: CheckoutFormData) => {
    if (items.length === 0) {
      toast.error('Your cart is empty');
      router.push('/shop');
      return;
    }

    setIsSubmitting(true);
    setServerError(null);

    try {
      const payload = {
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
        shipping: {
          name: data.name,
          phone: data.phone,
          address: data.address,
          city: data.city,
          state: data.state,
          notes: data.notes || '',
        },
        paymentMethod: data.paymentMethod,
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const responseData = await res.json().catch(() => ({}));

      if (!res.ok) {
        const errorMsg =
          responseData?.error?.message ||
          'Failed to record your requisition. Please review your details and try again.';
        setServerError(errorMsg);
        toast.error(errorMsg);
        return;
      }

      // Order created successfully
      toast.success('Your timepiece order has been placed!');
      clearCart();
      router.push(`/order-confirmation/${responseData.orderNumber}`);
    } catch (err: unknown) {
      console.error('Checkout error:', err);
      const msg = 'A network error occurred while securing your order. Please try again.';
      setServerError(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!mounted) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[var(--gold)] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="py-24 text-center max-w-md mx-auto px-4">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[var(--sand)] flex items-center justify-center text-[var(--gold)]">
          <Clock className="w-8 h-8" />
        </div>
        <h2 className="font-serif text-3xl text-[var(--ink)] mb-3">Your Bag is Empty</h2>
        <p className="text-[var(--muted)] text-sm mb-8 leading-relaxed">
          Please explore our watch collection to select your timepiece before proceeding with checkout.
        </p>
        <Link
          href="/shop"
          className="inline-flex items-center gap-2 px-8 py-3.5 bg-[var(--ink)] text-[var(--ivory)] rounded-md font-medium text-sm hover:bg-[var(--gold-deep)] transition-colors"
        >
          Explore Collection <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-12">
      {serverError && (
        <div className="p-4 bg-[var(--danger)]/10 border border-[var(--danger)]/30 rounded-lg flex items-start gap-3 text-sm text-[var(--danger)]">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-semibold block mb-0.5">Order Submission Notice</span>
            {serverError}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
        {/* LEFT COLUMN: Shipping and Payment */}
        <div className="lg:col-span-7 space-y-10">
          {/* Section 1: Customer & Delivery Details */}
          <div className="space-y-6">
            <div className="border-b border-[var(--sand)] pb-4">
              <span className="text-xs uppercase tracking-[0.2em] font-semibold text-[var(--gold)]">
                Step 01
              </span>
              <h2 className="font-serif text-2xl text-[var(--ink)] mt-1">
                Horological Transit Destination
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Full Name */}
              <div className="sm:col-span-2">
                <label className="block text-xs uppercase tracking-[0.1em] font-medium text-[var(--muted)] mb-2">
                  Full Name <span className="text-[var(--danger)]">*</span>
                </label>
                <input
                  type="text"
                  {...register('name')}
                  placeholder="e.g. Tunde Balogun"
                  className={`w-full px-4 py-3 bg-white border rounded-md text-sm text-[var(--ink)] placeholder:text-[var(--muted)]/50 focus:outline-none focus:ring-1 focus:ring-[var(--gold)] transition-colors ${
                    errors.name ? 'border-[var(--danger)]' : 'border-[var(--sand)]'
                  }`}
                />
                {errors.name && (
                  <p className="text-xs text-[var(--danger)] mt-1.5">{errors.name.message}</p>
                )}
              </div>

              {/* Email (Read-only from Google session) */}
              <div>
                <label className="block text-xs uppercase tracking-[0.1em] font-medium text-[var(--muted)] mb-2">
                  Account Email
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={user.email}
                    readOnly
                    disabled
                    className="w-full pl-4 pr-10 py-3 bg-[var(--sand)]/40 border border-[var(--sand)] rounded-md text-sm text-[var(--ink)] opacity-85 cursor-not-allowed"
                  />
                  <Lock className="w-4 h-4 text-[var(--muted)] absolute right-3.5 top-3.5" />
                </div>
                <p className="text-[11px] text-[var(--muted)] mt-1.5">
                  Verified Google account email for order provenance and notifications.
                </p>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs uppercase tracking-[0.1em] font-medium text-[var(--muted)] mb-2">
                  Contact Phone <span className="text-[var(--danger)]">*</span>
                </label>
                <input
                  type="tel"
                  {...register('phone')}
                  placeholder="e.g. 0803 123 4567"
                  className={`w-full px-4 py-3 bg-white border rounded-md text-sm text-[var(--ink)] placeholder:text-[var(--muted)]/50 focus:outline-none focus:ring-1 focus:ring-[var(--gold)] transition-colors ${
                    errors.phone ? 'border-[var(--danger)]' : 'border-[var(--sand)]'
                  }`}
                />
                {errors.phone && (
                  <p className="text-xs text-[var(--danger)] mt-1.5">{errors.phone.message}</p>
                )}
              </div>

              {/* Street Address */}
              <div className="sm:col-span-2">
                <label className="block text-xs uppercase tracking-[0.1em] font-medium text-[var(--muted)] mb-2">
                  Street Address <span className="text-[var(--danger)]">*</span>
                </label>
                <input
                  type="text"
                  {...register('address')}
                  placeholder="e.g. Suite 4B, 15 Adeola Odeku Street"
                  className={`w-full px-4 py-3 bg-white border rounded-md text-sm text-[var(--ink)] placeholder:text-[var(--muted)]/50 focus:outline-none focus:ring-1 focus:ring-[var(--gold)] transition-colors ${
                    errors.address ? 'border-[var(--danger)]' : 'border-[var(--sand)]'
                  }`}
                />
                {errors.address && (
                  <p className="text-xs text-[var(--danger)] mt-1.5">{errors.address.message}</p>
                )}
              </div>

              {/* City */}
              <div>
                <label className="block text-xs uppercase tracking-[0.1em] font-medium text-[var(--muted)] mb-2">
                  City <span className="text-[var(--danger)]">*</span>
                </label>
                <input
                  type="text"
                  {...register('city')}
                  placeholder="e.g. Victoria Island"
                  className={`w-full px-4 py-3 bg-white border rounded-md text-sm text-[var(--ink)] placeholder:text-[var(--muted)]/50 focus:outline-none focus:ring-1 focus:ring-[var(--gold)] transition-colors ${
                    errors.city ? 'border-[var(--danger)]' : 'border-[var(--sand)]'
                  }`}
                />
                {errors.city && (
                  <p className="text-xs text-[var(--danger)] mt-1.5">{errors.city.message}</p>
                )}
              </div>

              {/* State */}
              <div>
                <label className="block text-xs uppercase tracking-[0.1em] font-medium text-[var(--muted)] mb-2">
                  State <span className="text-[var(--danger)]">*</span>
                </label>
                <select
                  {...register('state')}
                  className={`w-full px-4 py-3 bg-white border rounded-md text-sm text-[var(--ink)] focus:outline-none focus:ring-1 focus:ring-[var(--gold)] transition-colors ${
                    errors.state ? 'border-[var(--danger)]' : 'border-[var(--sand)]'
                  }`}
                >
                  {SHOP.nigerianStates.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
                {errors.state && (
                  <p className="text-xs text-[var(--danger)] mt-1.5">{errors.state.message}</p>
                )}
              </div>

              {/* Delivery Notes */}
              <div className="sm:col-span-2">
                <label className="block text-xs uppercase tracking-[0.1em] font-medium text-[var(--muted)] mb-2">
                  Special Delivery Instructions <span className="text-[var(--muted)]/60">(Optional)</span>
                </label>
                <textarea
                  {...register('notes')}
                  rows={2}
                  placeholder="e.g. Gate security clearance required, call upon arrival"
                  className="w-full px-4 py-3 bg-white border border-[var(--sand)] rounded-md text-sm text-[var(--ink)] placeholder:text-[var(--muted)]/50 focus:outline-none focus:ring-1 focus:ring-[var(--gold)] transition-colors resize-none"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Payment Settlement Method */}
          <div className="space-y-6">
            <div className="border-b border-[var(--sand)] pb-4">
              <span className="text-xs uppercase tracking-[0.2em] font-semibold text-[var(--gold)]">
                Step 02
              </span>
              <h2 className="font-serif text-2xl text-[var(--ink)] mt-1">Payment Method</h2>
            </div>

            <div className="space-y-4">
              {/* Option 1: Pay on Delivery */}
              <label
                className={`relative flex items-start gap-4 p-5 rounded-lg border transition-all cursor-pointer ${
                  !podSupported
                    ? 'bg-stone-50 border-[var(--sand)] opacity-60 cursor-not-allowed'
                    : selectedPaymentMethod === 'pay_on_delivery'
                    ? 'bg-white border-[var(--gold)] shadow-sm'
                    : 'bg-white border-[var(--sand)] hover:border-[var(--muted)]'
                }`}
              >
                <input
                  type="radio"
                  value="pay_on_delivery"
                  disabled={!podSupported}
                  {...register('paymentMethod')}
                  className="mt-1 accent-[var(--gold)]"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Banknote className="w-5 h-5 text-[var(--gold)]" />
                    <span className="font-medium text-sm text-[var(--ink)]">Pay on Delivery</span>
                    {podSupported && (
                      <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded bg-[var(--success)]/10 text-[var(--success)]">
                        Available in {selectedState}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[var(--muted)] mt-1.5 leading-relaxed">
                    Verify the authenticity and packaging of your timepiece first. Settle securely via cash or POS card upon delivery.
                  </p>
                  {!podSupported && (
                    <p className="text-xs text-[var(--warning)] mt-2 font-medium">
                      Pay on Delivery is exclusively available within {SHOP.payOnDeliveryStates.join(', ')}. For {selectedState}, kindly select Direct Bank Transfer.
                    </p>
                  )}
                </div>
              </label>

              {/* Option 2: Direct Bank Transfer */}
              <label
                className={`relative flex items-start gap-4 p-5 rounded-lg border transition-all cursor-pointer ${
                  selectedPaymentMethod === 'bank_transfer'
                    ? 'bg-white border-[var(--gold)] shadow-sm'
                    : 'bg-white border-[var(--sand)] hover:border-[var(--muted)]'
                }`}
              >
                <input
                  type="radio"
                  value="bank_transfer"
                  {...register('paymentMethod')}
                  className="mt-1 accent-[var(--gold)]"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-[var(--gold)]" />
                    <span className="font-medium text-sm text-[var(--ink)]">
                      Direct Corporate Bank Wire
                    </span>
                    <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded bg-[var(--sand)] text-[var(--ink)]">
                      Nationwide
                    </span>
                  </div>
                  <p className="text-xs text-[var(--muted)] mt-1.5 leading-relaxed">
                    Wire directly to {SHOP.bankDetails.bankName}. Dedicated bank account coordinates and order reference will be presented on your receipt.
                  </p>
                </div>
              </label>
            </div>
            {errors.paymentMethod && (
              <p className="text-xs text-[var(--danger)]">{errors.paymentMethod.message}</p>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Order Summary & Place Order */}
        <div className="lg:col-span-5">
          <div className="sticky top-28 bg-white border border-[var(--sand)] rounded-xl p-6 sm:p-8 space-y-6 shadow-sm">
            <div className="border-b border-[var(--sand)] pb-4 flex items-center justify-between">
              <h3 className="font-serif text-xl text-[var(--ink)]">Requisition Summary</h3>
              <span className="text-xs text-[var(--muted)] font-medium">
                {items.length} {items.length === 1 ? 'Piece' : 'Pieces'}
              </span>
            </div>

            {/* Line Items */}
            <div className="max-h-72 overflow-y-auto divide-y divide-[var(--sand)] pr-1 space-y-3">
              {items.map((item) => (
                <div key={item.productId} className="pt-3 first:pt-0 flex items-center gap-4">
                  <div className="relative w-14 h-16 rounded bg-[var(--sand)]/50 overflow-hidden shrink-0">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover"
                      sizes="56px"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-[var(--ink)] truncate font-serif">
                      {item.name}
                    </h4>
                    <p className="text-xs text-[var(--muted)] mt-0.5">
                      Qty: {item.quantity} &times; {formatNaira(item.priceKobo)}
                    </p>
                  </div>
                  <div className="text-sm font-medium text-[var(--ink)] shrink-0">
                    {formatNaira(item.priceKobo * item.quantity)}
                  </div>
                </div>
              ))}
            </div>

            {/* Price Calculations */}
            <div className="border-t border-[var(--sand)] pt-4 space-y-2.5 text-sm">
              <div className="flex justify-between text-[var(--muted)]">
                <span>Subtotal</span>
                <span className="text-[var(--ink)] font-medium">{formatNaira(subtotal)}</span>
              </div>
              <div className="flex justify-between text-[var(--muted)]">
                <span>Insured Courier Transit</span>
                <span
                  className={
                    shippingFee === 0 ? 'text-[var(--success)] font-medium' : 'text-[var(--ink)]'
                  }
                >
                  {shippingFee === 0 ? 'Complimentary' : formatNaira(shippingFee)}
                </span>
              </div>

              <div className="border-t border-[var(--sand)] pt-3 flex justify-between items-baseline">
                <span className="text-base font-serif text-[var(--ink)] font-medium">Total</span>
                <span className="font-serif text-2xl font-bold text-[var(--gold)]">
                  {formatNaira(total)}
                </span>
              </div>
            </div>

            {/* CTA Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 px-6 bg-[var(--ink)] hover:bg-[var(--gold-deep)] text-[var(--ivory)] font-medium text-sm rounded-md transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-[var(--ivory)] border-t-transparent animate-spin" />
                  <span>Securing Order & Inventory...</span>
                </>
              ) : (
                <>
                  <span>Confirm & Place Order</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>

            {/* Trust Assurances */}
            <div className="pt-4 border-t border-[var(--sand)] space-y-3">
              <div className="flex items-center gap-3 text-xs text-[var(--muted)]">
                <ShieldCheck className="w-4 h-4 text-[var(--gold)] shrink-0" />
                <span>100% Authenticity Verified & 12-Month Mechanical Warranty</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-[var(--muted)]">
                <Truck className="w-4 h-4 text-[var(--gold)] shrink-0" />
                <span>Insured, armored transit across all 36 Nigerian States</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-[var(--muted)]">
                <CheckCircle2 className="w-4 h-4 text-[var(--gold)] shrink-0" />
                <span>Dedicated horologist support via {BRAND.whatsapp}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
