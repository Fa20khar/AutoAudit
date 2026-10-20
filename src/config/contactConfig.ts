/**
 * AutoAudit Customer Support & Contact Configuration
 */
export const WHATSAPP_NUMBER = '923420617217';
export const WHATSAPP_DISPLAY = '+92 342 0617217';
export const WHATSAPP_LOCAL = '03420617217';
export const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}`;
export const SUPPORT_EMAIL = 'support@autoaudit.com';

export function getWhatsAppSupportUrl(customMessage?: string): string {
  const text = customMessage || 'Hello AutoAudit Support, I would like assistance with a vehicle history report.';
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
}
