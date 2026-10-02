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
    accountName: 'Meridian Time Luxury Ltd',
    accountNumber: '1012345678',
    instructions:
      'Please make a direct bank transfer using your Order Number as the payment reference. Once transferred, your order status will be updated by our team upon confirmation.',
  },
  paymentMethods: [
    {
      id: 'pay_on_delivery',
      label: 'Pay on Delivery',
      description: 'Available in supported delivery regions. Cash or card upon arrival.',
    },
    {
      id: 'bank_transfer',
      label: 'Direct Bank Transfer',
      description: 'Transfer directly to our corporate bank account. Details provided on confirmation.',
    },
  ] as const,
  payOnDeliveryStates: PAY_ON_DELIVERY_SUPPORTED_STATES,
  categories: [
    { id: 'dress', label: 'Dress', description: 'Slim profiles, champagne dials, and fine leather.' },
    { id: 'sport', label: 'Sport', description: 'Chronographs and robust divers built for resilience.' },
    { id: 'classic', label: 'Classic', description: 'Timeless Roman numerals and heritage silhouettes.' },
    { id: 'smart', label: 'Smart', description: 'Modern connected watches with enduring aesthetic.' },
  ] as const,
  nigerianStates: [
    'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
    'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT - Abuja', 'Gombe',
    'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara',
    'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau',
    'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara'
  ] as const,
} as const;

