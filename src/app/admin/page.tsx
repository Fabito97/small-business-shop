import { requireAdmin } from '@/server/auth/guards';
import { ShieldCheck, Package, Users, DollarSign } from 'lucide-react';

export default async function AdminDashboardPage() {
  const admin = await requireAdmin();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--sand)]/10 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[var(--gold)]/10 border border-[var(--gold)]/30 text-[var(--gold)] text-xs font-semibold uppercase tracking-wider mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Admin Console</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl text-[var(--ivory)] font-light">
            Store Operations
          </h1>
          <p className="text-xs text-[var(--muted)] mt-1">
            Logged in as {admin.name || admin.email} ({admin.role})
          </p>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="p-6 rounded-xl bg-[var(--charcoal)] border border-[var(--gold)]/20">
          <div className="flex items-center justify-between text-[var(--gold)]">
            <span className="text-xs uppercase tracking-wider font-semibold">Orders</span>
            <Package className="w-5 h-5" />
          </div>
          <p className="font-serif text-3xl text-[var(--ivory)] font-light mt-3">0</p>
          <p className="text-xs text-[var(--muted)] mt-1">Pending fulfillment</p>
        </div>

        <div className="p-6 rounded-xl bg-[var(--charcoal)] border border-[var(--gold)]/20">
          <div className="flex items-center justify-between text-[var(--gold)]">
            <span className="text-xs uppercase tracking-wider font-semibold">Clients</span>
            <Users className="w-5 h-5" />
          </div>
          <p className="font-serif text-3xl text-[var(--ivory)] font-light mt-3">Active</p>
          <p className="text-xs text-[var(--muted)] mt-1">Registered Google profiles</p>
        </div>

        <div className="p-6 rounded-xl bg-[var(--charcoal)] border border-[var(--gold)]/20">
          <div className="flex items-center justify-between text-[var(--gold)]">
            <span className="text-xs uppercase tracking-wider font-semibold">Settlement</span>
            <DollarSign className="w-5 h-5" />
          </div>
          <p className="font-serif text-3xl text-[var(--ivory)] font-light mt-3">NGN</p>
          <p className="text-xs text-[var(--muted)] mt-1">Direct Bank Wire & Delivery</p>
        </div>
      </div>
    </div>
  );
}
