/**
 * Utility functions for integer kobo <-> Naira (NGN) conversion
 * 1 Naira = 100 Kobo
 */

/**
 * Converts integer kobo (number or string) to Naira number.
 * e.g., 10000 kobo or "10000" -> 100.00 Naira
 */
export function koboToNaira(kobo: number | string): number {
  if (kobo === '' || kobo === null || kobo === undefined) return 0;
  const numericKobo = typeof kobo === 'string' ? parseFloat(kobo) : kobo;
  if (isNaN(numericKobo)) return 0;
  return numericKobo / 100;
}

/**
 * Converts Naira input (number or numeric string) to integer kobo.
 * Uses Math.round to avoid float precision issues.
 */
export function nairaToKobo(naira: number | string): number {
  if (naira === '' || naira === null || naira === undefined) return 0;
  const numericNaira = typeof naira === 'string' ? parseFloat(naira) : naira;
  if (isNaN(numericNaira) || numericNaira < 0) return 0;
  return Math.round(numericNaira * 100);
}

/**
 * Formats integer kobo string or number as a formatted Naira currency string.
 * e.g., 1500000 or "1500000" -> "₦15,000.00"
 */
export function formatNaira(kobo: number | string): string {
  const naira = koboToNaira(kobo);
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(naira);
}
