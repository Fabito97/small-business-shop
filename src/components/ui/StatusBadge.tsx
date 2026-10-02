import React from 'react';
import { Clock, CheckCircle2, Truck, PackageCheck, XCircle } from 'lucide-react';

export type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';

interface StatusBadgeProps {
  status: OrderStatus | string;
  className?: string;
}

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  switch (status) {
    case 'pending':
      return (
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-[var(--warning)]/10 text-[var(--warning)] border border-[var(--warning)]/20 ${className}`}
        >
          <Clock className="w-3 h-3" />
          <span>Pending</span>
        </span>
      );
    case 'confirmed':
      return (
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-[var(--gold)]/15 text-[var(--gold-deep)] border border-[var(--gold)]/30 ${className}`}
        >
          <CheckCircle2 className="w-3 h-3" />
          <span>Confirmed</span>
        </span>
      );
    case 'shipped':
      return (
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-[var(--ink)]/10 text-[var(--ink)] border border-[var(--ink)]/20 ${className}`}
        >
          <Truck className="w-3 h-3" />
          <span>In Transit</span>
        </span>
      );
    case 'delivered':
      return (
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-[var(--success)]/10 text-[var(--success)] border border-[var(--success)]/20 ${className}`}
        >
          <PackageCheck className="w-3 h-3" />
          <span>Delivered</span>
        </span>
      );
    case 'cancelled':
      return (
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-[var(--danger)]/10 text-[var(--danger)] border border-[var(--danger)]/20 ${className}`}
        >
          <XCircle className="w-3 h-3" />
          <span>Cancelled</span>
        </span>
      );
    default:
      return (
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-stone-100 text-stone-600 border border-stone-200 ${className}`}
        >
          <span>{status}</span>
        </span>
      );
  }
}
