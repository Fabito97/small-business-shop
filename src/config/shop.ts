export const PAY_ON_DELIVERY_SUPPORTED_STATES = ['Lagos'] as const;
export type PayOnDeliverySupportedState = (typeof PAY_ON_DELIVERY_SUPPORTED_STATES)[number];

export function isPayOnDeliverySupported(state?: string | null): boolean {
  if (!state) return false;
  return (PAY_ON_DELIVERY_SUPPORTED_STATES as readonly string[]).includes(state);
}

export const SHOP = {
  currencyCode: 'NGN',
  currencySymbol: '₦',
  shippingFeeKobo: 500_000, // ₦5,000
  freeShippingThresholdKobo: 100_000_000, // ₦1,000,000
  bankDetails: {
    bankName: 'Zenith Bank',
    accountName: 'Dave Store',
    accountNumber: '1012345678',
    instructions:
      'Please make a direct bank transfer using your Order Number as the payment reference or narration. Your order will be confirmed automatically or by our team upon receiving the alert.',
  },
  paymentMethods: [
    {
      id: 'pay_on_delivery',
      label: 'Pay on Delivery',
      description: 'Available in Lagos. Inspect your watch and pay cash or card to the rider.',
    },
    {
      id: 'bank_transfer',
      label: 'Direct Bank Transfer',
      description: 'Transfer directly to our Zenith Bank account. Details shown after placing order.',
    },
  ] as const,
  payOnDeliveryStates: PAY_ON_DELIVERY_SUPPORTED_STATES,
  categories: [
    { id: 'dress', label: 'Dress', description: 'Clean gold, silver dials, and leather straps for formal events.' },
    { id: 'sport', label: 'Sport', description: 'Water-resistant sports and chronograph watches built to last.' },
    { id: 'classic', label: 'Classic', description: 'Timeless Roman numerals and classic watch designs.' },
    { id: 'smart', label: 'Smart', description: 'Modern smartwatches for fitness, calls, and daily productivity.' },
  ] as const,
  nigerianStates: [
    'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
    'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT - Abuja', 'Gombe',
    'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara',
    'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau',
    'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara'
  ] as const,
} as const;

