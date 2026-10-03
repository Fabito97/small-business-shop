import 'server-only';
import { eq } from 'drizzle-orm';
import { db } from '@/server/db';
import { orders, type Order } from '@/server/db/schema';
import { sendEmail } from '@/server/email/mailgun';
import {
  buildOrderConfirmationEmail,
  buildOwnerNotificationEmail,
  type EmailOrderItem,
} from '@/server/email/templates';

export class EmailService {
  /**
   * Dispatches order confirmation receipt to the customer and optionally notifies the store owner.
   * Updates `emailSentAt` in the database upon successful delivery.
   * Never throws errors to caller — gracefully catches and logs failures.
   */
  static async sendOrderConfirmation(
    order: Order,
    items: EmailOrderItem[]
  ): Promise<boolean> {
    try {
      const confirmationPayload = buildOrderConfirmationEmail({ order, items });
      const delivered = await sendEmail({
        to: order.customerEmail,
        subject: confirmationPayload.subject,
        html: confirmationPayload.html,
        text: confirmationPayload.text,
      });

      if (delivered) {
        await db
          .update(orders)
          .set({ emailSentAt: new Date() })
          .where(eq(orders.id, order.id))
          .catch((dbErr) => {
            console.error('[EmailService] Failed to record emailSentAt timestamp:', dbErr);
          });
      }

      // Optional notification to business owner
      const ownerEmail = process.env.OWNER_NOTIFY_EMAIL;
      if (ownerEmail) {
        const ownerPayload = buildOwnerNotificationEmail({ order, items });
        await sendEmail({
          to: ownerEmail,
          subject: ownerPayload.subject,
          html: ownerPayload.html,
          text: ownerPayload.text,
        }).catch((err) => {
          console.error('[EmailService] Store owner dispatch notification failed:', err);
        });
      }

      return delivered;
    } catch (error) {
      console.error('[EmailService] Unexpected failure during order notification dispatch:', error);
      return false;
    }
  }
}
