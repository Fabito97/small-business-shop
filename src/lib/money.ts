/**
 * Currency utilities for Nigerian Naira (NGN).
 * All money in the database and internal logic is stored strictly as integer kobo.
 * ₦1 = 100 kobo.
 */

export function koboToNaira(kobo: number): number {
  return Math.floor(kobo / 100);
}

export function nairaToKobo(naira: number): number {
  return Math.round(naira * 100);
}

export function formatNaira(kobo: number, options?: { showDecimal?: boolean }): string {
  const naira = kobo / 100;
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: options?.showDecimal ? 2 : 0,
    maximumFractionDigits: options?.showDecimal ? 2 : 0,
  }).format(naira);
}
