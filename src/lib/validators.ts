import { z } from 'zod';
import { SHOP, isPayOnDeliverySupported } from '@/config/shop';

export const orderItemSchema = z.object({
  productId: z.string().uuid({ message: 'Invalid product identifier' }),
  quantity: z
    .number()
    .int({ message: 'Quantity must be an integer' })
    .min(1, { message: 'Quantity must be at least 1' })
    .max(10, { message: 'Maximum 10 units per order line' }),
});

export const shippingAddressSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, { message: 'Full name must be at least 2 characters' })
    .max(100, { message: 'Full name cannot exceed 100 characters' }),
  phone: z
    .string()
    .trim()
    .min(10, { message: 'Please enter a valid phone number' })
    .max(20, { message: 'Phone number cannot exceed 20 characters' })
    .regex(/^[0-9+\s\-()]{10,20}$/, { message: 'Please enter a valid Nigerian contact number' }),
  address: z
    .string()
    .trim()
    .min(5, { message: 'Delivery address must be at least 5 characters' })
    .max(200, { message: 'Address cannot exceed 200 characters' }),
  city: z
    .string()
    .trim()
    .min(2, { message: 'City is required' })
    .max(100, { message: 'City cannot exceed 100 characters' }),
  state: z.string().refine((val) => SHOP.nigerianStates.includes(val as (typeof SHOP.nigerianStates)[number]), {
    message: 'Please select a valid Nigerian state',
  }),
  notes: z
    .string()
    .trim()
    .max(500, { message: 'Delivery notes cannot exceed 500 characters' })
    .optional()
    .or(z.literal('')),
});

export const paymentMethodSchema = z.enum(['pay_on_delivery', 'bank_transfer', 'card'], {
  message: 'Please select a payment method',
});

export const createOrderSchema = z
  .object({
    items: z
      .array(orderItemSchema)
      .min(1, { message: 'Cart cannot be empty' })
      .max(20, { message: 'Cannot checkout more than 20 distinct timepieces at once' }),
    shipping: shippingAddressSchema,
    paymentMethod: paymentMethodSchema,
  })
  .superRefine((data, ctx) => {
    if (data.paymentMethod === 'pay_on_delivery' && !isPayOnDeliverySupported(data.shipping.state)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['paymentMethod'],
        message: `Pay on Delivery is only available for delivery to ${SHOP.payOnDeliveryStates.join(', ')}. Please choose Card or Bank Transfer, or change delivery state.`,
      });
    }
  });

export type OrderItemInput = z.infer<typeof orderItemSchema>;
export type ShippingAddressInput = z.infer<typeof shippingAddressSchema>;
export type PaymentMethod = z.infer<typeof paymentMethodSchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;

// Checkout form specific schema (matches fields rendered in React Hook Form)
export const checkoutFormSchema = z
  .object({
    name: shippingAddressSchema.shape.name,
    email: z.string().email(),
    phone: shippingAddressSchema.shape.phone,
    address: shippingAddressSchema.shape.address,
    city: shippingAddressSchema.shape.city,
    state: shippingAddressSchema.shape.state,
    notes: shippingAddressSchema.shape.notes,
    paymentMethod: paymentMethodSchema,
  })
  .superRefine((data, ctx) => {
    if (data.paymentMethod === 'pay_on_delivery' && !isPayOnDeliverySupported(data.state)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['paymentMethod'],
        message: `Pay on Delivery is currently only available for ${SHOP.payOnDeliveryStates.join(', ')}.`,
      });
    }
  });

export type CheckoutFormData = z.infer<typeof checkoutFormSchema>;
