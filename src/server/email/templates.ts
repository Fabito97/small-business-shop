import 'server-only';
import { BRAND } from '@/config/brand';
import { SHOP } from '@/config/shop';
import { formatNaira } from '@/lib/money';
import type { Order } from '@/server/db/schema';

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export type EmailOrderItem = {
  productName: string;
  quantity: number;
  unitPriceKobo: number;
  imageUrl?: string | null;
};

export type OrderConfirmationEmailData = {
  order: Order;
  items: EmailOrderItem[];
};

export function buildOrderConfirmationEmail({ order, items }: OrderConfirmationEmailData): {
  subject: string;
  html: string;
  text: string;
} {
  const firstName = order.customerName.split(' ')[0] || 'Valued Client';
  const escapedName = escapeHtml(order.customerName);
  const escapedAddress = escapeHtml(order.shippingAddress);
  const escapedCity = escapeHtml(order.city);
  const escapedState = escapeHtml(order.state);
  const escapedNotes = order.notes ? escapeHtml(order.notes) : null;
  const isBankTransfer = order.paymentMethod === 'bank_transfer';

  const subject = `Order Confirmed: ${order.orderNumber} - ${BRAND.name}`;

  const itemRowsHtml = items
    .map((item) => {
      const lineTotal = item.unitPriceKobo * item.quantity;
      return `
        <tr>
          <td style="padding: 16px 0; border-bottom: 1px solid #2A2A30;">
            <div style="font-family: 'Georgia', serif; font-size: 15px; color: #FAF7F2; font-weight: bold;">
              ${escapeHtml(item.productName)}
            </div>
            <div style="font-size: 13px; color: #8E8E93; margin-top: 4px;">
              Qty: ${item.quantity} &times; ${formatNaira(item.unitPriceKobo)}
            </div>
          </td>
          <td style="padding: 16px 0; border-bottom: 1px solid #2A2A30; text-align: right; vertical-align: top;">
            <div style="font-family: 'Georgia', serif; font-size: 15px; color: #B8956A; font-weight: 600;">
              ${formatNaira(lineTotal)}
            </div>
          </td>
        </tr>
      `;
    })
    .join('');

  let paymentNoticeHtml = '';
  if (isBankTransfer) {
    paymentNoticeHtml = `
      <div style="margin-top: 24px; padding: 20px; background-color: #16161A; border: 1px solid #332B20; border-radius: 6px;">
        <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.15em; color: #B8956A; font-weight: 700; margin-bottom: 8px;">
          Direct Bank Wire Instructions
        </div>
        <div style="font-size: 13px; color: #FAF7F2; line-height: 1.6;">
          Please wire the exact total of <strong>${formatNaira(order.totalKobo)}</strong> to our dedicated account:
        </div>
        <table style="width: 100%; margin-top: 12px; font-size: 13px; color: #D1D1D6;" cellpadding="4">
          <tr><td style="width: 110px; color: #8E8E93;">Bank:</td><td><strong>${escapeHtml(SHOP.bankDetails.bankName)}</strong></td></tr>
          <tr><td style="color: #8E8E93;">Account Name:</td><td><strong>${escapeHtml(SHOP.bankDetails.accountName)}</strong></td></tr>
          <tr><td style="color: #8E8E93;">Account Number:</td><td><strong style="color: #B8956A; font-size: 15px; font-family: monospace;">${escapeHtml(SHOP.bankDetails.accountNumber)}</strong></td></tr>
          <tr><td style="color: #8E8E93;">Payment Reference:</td><td><strong style="color: #FAF7F2; font-family: monospace;">${order.orderNumber}</strong></td></tr>
        </table>
        <div style="font-size: 12px; color: #8E8E93; margin-top: 12px; font-style: italic;">
          ${escapeHtml(SHOP.bankDetails.instructions)}
        </div>
      </div>
    `;
  } else if (order.paymentMethod === 'card') {
    paymentNoticeHtml = `
      <div style="margin-top: 24px; padding: 16px; background-color: #121814; border: 1px solid #1E382B; border-radius: 6px;">
        <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.15em; color: #34D399; font-weight: 700; margin-bottom: 6px;">
          Payment Verified Online
        </div>
        <div style="font-size: 13px; color: #D1D1D6; line-height: 1.5;">
          Full settlement of <strong>${formatNaira(order.totalKobo)}</strong> has been verified and authorized. Your order is confirmed and prioritized for transit.
        </div>
      </div>
    `;
  } else {
    paymentNoticeHtml = `
      <div style="margin-top: 24px; padding: 16px; background-color: #16161A; border: 1px solid #2A2A30; border-radius: 6px;">
        <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.15em; color: #B8956A; font-weight: 700; margin-bottom: 6px;">
          Pay on Delivery
        </div>
        <div style="font-size: 13px; color: #D1D1D6; line-height: 1.5;">
          Our courier will collect <strong>${formatNaira(order.totalKobo)}</strong> upon delivery via cash or card POS terminal in ${escapedState}.
        </div>
      </div>
    `;
  }

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0E0E10; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #FAF7F2;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0E0E10; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table width="600" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; width: 100%; background-color: #141417; border: 1px solid #222226; border-radius: 8px; overflow: hidden;">
          
          <!-- Header -->
          <tr>
            <td style="padding: 36px 32px; text-align: center; border-bottom: 1px solid #222226; background: linear-gradient(180deg, #1C1C22 0%, #141417 100%);">
              <div style="font-family: 'Georgia', serif; font-size: 24px; letter-spacing: 0.2em; text-transform: uppercase; color: #FAF7F2; font-weight: bold;">
                ${escapeHtml(BRAND.name)}
              </div>
              <div style="font-size: 12px; color: #B8956A; letter-spacing: 0.15em; text-transform: uppercase; margin-top: 6px;">
                ${escapeHtml(BRAND.tagline)}
              </div>
            </td>
          </tr>

          <!-- Confirmation Title -->
          <tr>
            <td style="padding: 32px 32px 20px 32px;">
              <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.2em; color: #B8956A; font-weight: 700;">
                Order Confirmation
              </div>
              <h1 style="font-family: 'Georgia', serif; font-size: 26px; color: #FAF7F2; margin: 8px 0 16px 0; font-weight: normal;">
                Thank you for your order, ${escapeHtml(firstName)}.
              </h1>
              <p style="font-size: 14px; line-height: 1.6; color: #A0A0A8; margin: 0;">
                Your order has been recorded under order reference 
                <strong style="color: #FAF7F2; font-family: monospace; font-size: 15px;">${order.orderNumber}</strong>. 
                Our team is currently preparing your watch for safe delivery.
              </p>
            </td>
          </tr>

          <!-- Items Table -->
          <tr>
            <td style="padding: 0 32px;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-top: 12px;">
                <thead>
                  <tr>
                    <th align="left" style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.15em; color: #8E8E93; padding-bottom: 8px; border-bottom: 1px solid #2A2A30;">
                      Acquisition
                    </th>
                    <th align="right" style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.15em; color: #8E8E93; padding-bottom: 8px; border-bottom: 1px solid #2A2A30;">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  ${itemRowsHtml}
                </tbody>
              </table>
            </td>
          </tr>

          <!-- Totals Breakdown -->
          <tr>
            <td style="padding: 16px 32px;">
              <table width="100%" border="0" cellspacing="0" cellpadding="4" style="font-size: 14px; color: #A0A0A8;">
                <tr>
                  <td align="left">Subtotal</td>
                  <td align="right" style="color: #FAF7F2;">${formatNaira(order.subtotalKobo)}</td>
                </tr>
                <tr>
                  <td align="left">Insured Courier Shipping</td>
                  <td align="right" style="color: ${order.shippingKobo === 0 ? '#2F7D5B' : '#FAF7F2'};">
                    ${order.shippingKobo === 0 ? 'Complimentary' : formatNaira(order.shippingKobo)}
                  </td>
                </tr>
                <tr>
                  <td align="left" style="padding-top: 12px; font-size: 16px; font-weight: bold; color: #FAF7F2; border-top: 1px solid #2A2A30;">
                    Total
                  </td>
                  <td align="right" style="padding-top: 12px; font-family: 'Georgia', serif; font-size: 18px; font-weight: bold; color: #B8956A; border-top: 1px solid #2A2A30;">
                    ${formatNaira(order.totalKobo)}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Payment Instructions -->
          <tr>
            <td style="padding: 0 32px;">
              ${paymentNoticeHtml}
            </td>
          </tr>

          <!-- Shipping Details -->
          <tr>
            <td style="padding: 24px 32px;">
              <div style="padding: 16px; background-color: #111114; border: 1px solid #222226; border-radius: 6px;">
                <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.15em; color: #8E8E93; font-weight: 700; margin-bottom: 8px;">
                  Dispatch Destination
                </div>
                <div style="font-size: 14px; color: #FAF7F2; font-weight: 500;">${escapedName}</div>
                <div style="font-size: 13px; color: #A0A0A8; margin-top: 4px; line-height: 1.5;">
                  ${escapedAddress}<br>
                  ${escapedCity}, ${escapedState}, Nigeria<br>
                  Contact: ${escapeHtml(order.customerPhone)}
                </div>
                ${
                  escapedNotes
                    ? `<div style="font-size: 12px; color: #B8956A; margin-top: 8px; font-style: italic;">Note: ${escapedNotes}</div>`
                    : ''
                }
              </div>
            </td>
          </tr>

          <!-- Support Footer -->
          <tr>
            <td style="padding: 24px 32px; background-color: #0E0E10; border-top: 1px solid #222226; text-align: center;">
              <div style="font-size: 13px; color: #8E8E93; line-height: 1.6;">
                Have questions regarding your watch or delivery? Reach our support team at 
                <a href="mailto:${BRAND.contactEmail}" style="color: #B8956A; text-decoration: none;">${BRAND.contactEmail}</a> 
                or WhatsApp 
                <a href="${BRAND.whatsappUrl}" style="color: #B8956A; text-decoration: none;">${BRAND.whatsapp}</a>.
              </div>
              <div style="font-size: 11px; color: #5C5C64; margin-top: 16px; text-transform: uppercase; letter-spacing: 0.15em;">
                &copy; ${new Date().getFullYear()} ${escapeHtml(BRAND.legalName)}. All rights reserved.
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  const textLines = [
    `${BRAND.name.toUpperCase()} - ORDER CONFIRMATION`,
    `=================================`,
    `Thank you for your order, ${firstName}!`,
    `Order Reference: ${order.orderNumber}`,
    `Order Date: ${new Date(order.createdAt).toLocaleDateString()}`,
    ``,
    `ITEMS:`,
    ...items.map(
      (item) =>
        `- ${item.productName} (x${item.quantity}): ${formatNaira(item.unitPriceKobo * item.quantity)}`
    ),
    ``,
    `Subtotal: ${formatNaira(order.subtotalKobo)}`,
    `Shipping: ${order.shippingKobo === 0 ? 'Complimentary' : formatNaira(order.shippingKobo)}`,
    `Total: ${formatNaira(order.totalKobo)}`,
    ``,
    `DELIVERY DESTINATION:`,
    `${order.customerName}`,
    `${order.shippingAddress}, ${order.city}, ${order.state}`,
    `Phone: ${order.customerPhone}`,
    order.notes ? `Delivery Note: ${order.notes}` : ``,
    ``,
    isBankTransfer
      ? `BANK TRANSFER DETAILS:\nBank: ${SHOP.bankDetails.bankName}\nAccount Name: ${SHOP.bankDetails.accountName}\nAccount Number: ${SHOP.bankDetails.accountNumber}\nReference: ${order.orderNumber}\n${SHOP.bankDetails.instructions}`
      : `PAYMENT METHOD: Pay on Delivery in ${order.state}`,
    ``,
    `Need assistance? Contact support at ${BRAND.contactEmail} or WhatsApp ${BRAND.whatsapp}.`,
  ];

  return {
    subject,
    html,
    text: textLines.filter(Boolean).join('\n'),
  };
}

export function buildOwnerNotificationEmail({ order, items }: OrderConfirmationEmailData): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = `[NEW ORDER] ${order.orderNumber} - ${formatNaira(order.totalKobo)} (${order.customerName})`;
  const isBankTransfer = order.paymentMethod === 'bank_transfer';

  const html = `
    <div style="font-family: sans-serif; color: #111; max-width: 600px; padding: 20px;">
      <h2>New Customer Order Placed</h2>
      <p><strong>Order Number:</strong> ${escapeHtml(order.orderNumber)}</p>
      <p><strong>Customer:</strong> ${escapeHtml(order.customerName)} (${escapeHtml(order.customerEmail)})</p>
      <p><strong>Phone:</strong> ${escapeHtml(order.customerPhone)}</p>
      <p><strong>Destination:</strong> ${escapeHtml(order.shippingAddress)}, ${escapeHtml(order.city)}, ${escapeHtml(order.state)}</p>
      <p><strong>Payment Method:</strong> ${isBankTransfer ? 'Direct Bank Transfer' : 'Pay on Delivery'}</p>
      <p><strong>Total Amount:</strong> ${formatNaira(order.totalKobo)}</p>
      <hr/>
      <h3>Order Items:</h3>
      <ul>
        ${items.map((i) => `<li>${escapeHtml(i.productName)} &times; ${i.quantity} - ${formatNaira(i.unitPriceKobo * i.quantity)}</li>`).join('')}
      </ul>
      ${order.notes ? `<p><strong>Notes:</strong> ${escapeHtml(order.notes)}</p>` : ''}
    </div>
  `;

  const text = `New Order Placed: ${order.orderNumber}\nCustomer: ${order.customerName} (${order.customerEmail})\nTotal: ${formatNaira(order.totalKobo)}\nPayment Method: ${order.paymentMethod}\nDestination: ${order.shippingAddress}, ${order.city}, ${order.state}`;

  return { subject, html, text };
}
