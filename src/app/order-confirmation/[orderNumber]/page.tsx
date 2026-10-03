import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';

import { getCurrentUser } from '@/server/auth/guards';
import { OrderService } from '@/server/services';
import { BRAND } from '@/config/brand';
import { OrderConfirmationTracker } from '@/components/orders/OrderConfirmationTracker';

export const metadata: Metadata = {
  title: `Order Confirmation | ${BRAND.name}`,
  description: 'Your watch order receipt, payment details, and delivery status.',
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

  const result = await OrderService.getOrder(orderNumber, user.id, user.role === 'admin');

  if (!result) {
    notFound();
  }

  const { order, items } = result;

  return (
    <div className="min-h-screen bg-[var(--ivory)] py-12 md:py-20">
      <OrderConfirmationTracker initialOrder={order} initialItems={items} />
    </div>
  );
}
