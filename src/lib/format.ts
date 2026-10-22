/**
 * Format currency with Naira sign and Nigerian locale standard formatting
 * Example: 25000 -> ₦25,000
 */
export function formatNaira(amount: number | string | undefined | null): string {
  if (amount === undefined || amount === null || isNaN(Number(amount))) {
    return '₦0';
  }
  const numeric = typeof amount === 'string' ? parseFloat(amount.replace(/[^0-9.-]+/g, '')) || 0 : amount;
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numeric).replace('NGN', '₦').trim();
}

/**
 * Format raw number with comma separators
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-NG').format(num);
}

/**
 * Format Nigerian phone number into international WhatsApp format
 * e.g., "08012345678" -> "2348012345678"
 */
export function formatWhatsAppPhone(phone: string): string {
  let cleaned = phone.replace(/[^0-9]/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '234' + cleaned.slice(1);
  } else if (!cleaned.startsWith('234') && cleaned.length === 10) {
    cleaned = '234' + cleaned;
  }
  return cleaned;
}

/**
 * Format phone for human display: 0801 234 5678
 */
export function formatDisplayPhone(phone: string): string {
  const digits = phone.replace(/[^0-9]/g, '');
  if (digits.length === 11 && digits.startsWith('0')) {
    return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
  }
  if (digits.startsWith('234') && digits.length === 13) {
    return `+234 ${digits.slice(3, 6)} ${digits.slice(6, 9)} ${digits.slice(9)}`;
  }
  return phone;
}

/**
 * Calculate discount percentage
 */
export function calculateDiscount(price: number, oldPrice?: number): number {
  if (!oldPrice || oldPrice <= price) return 0;
  return Math.round(((oldPrice - price) / oldPrice) * 100);
}
