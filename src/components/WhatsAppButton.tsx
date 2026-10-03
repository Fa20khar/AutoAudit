import React from 'react';
import { WhatsAppIcon, getWhatsAppUrl, AUTUAUDIT_WHATSAPP_NUMBER } from './WhatsAppWidget';
import { ContactSource, ContactIntent } from '../types';
import { api } from '../services/api';

interface WhatsAppButtonProps {
  message?: string;
  orderNumber?: string;
  vin?: string;
  source?: ContactSource;
  intent?: ContactIntent;
  variant?: 'primary' | 'secondary' | 'outline' | 'compact' | 'text';
  className?: string;
  label?: string;
  showNumber?: boolean;
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
}

export const WhatsAppButton: React.FC<WhatsAppButtonProps> = ({
  message,
  orderNumber,
  vin,
  source = 'navbar',
  intent = 'general_support',
  variant = 'primary',
  className = '',
  label,
  showNumber = false,
  onClick,
}) => {
  let computedMessage = message;
  let resolvedIntent = intent;

  if (!computedMessage) {
    if (orderNumber && vin) {
      computedMessage = `Hello AutoAudit Support, I need assistance with Order #${orderNumber} for VIN: ${vin}.`;
      resolvedIntent = 'order_tracking';
    } else if (orderNumber) {
      computedMessage = `Hello AutoAudit Support, I need help with my Order #${orderNumber}.`;
      resolvedIntent = 'order_tracking';
    } else if (vin) {
      computedMessage = `Hi AutoAudit, I would like to inquire about vehicle history for VIN: ${vin}.`;
      resolvedIntent = 'vin_check';
    } else {
      computedMessage = 'Hello AutoAudit Support, I would like assistance with a vehicle history report.';
    }
  }

  const url = getWhatsAppUrl(computedMessage);
  const defaultLabel = label || (showNumber ? 'WhatsApp: +1 (800) 555-AUTO' : 'Chat on WhatsApp');

  const baseStyles = 'inline-flex items-center justify-center gap-2 font-medium transition-all duration-150 cursor-pointer text-center text-xs';

  const variants = {
    primary: 'bg-[#25D366] hover:bg-[#20bd5a] text-white px-3.5 py-2 rounded-xl shadow-xs hover:shadow-md font-semibold',
    secondary: 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 px-3.5 py-2 rounded-xl font-semibold',
    outline: 'border border-emerald-500/50 hover:border-emerald-500 text-emerald-600 hover:text-emerald-700 bg-transparent px-3 py-1.5 rounded-lg',
    compact: 'px-2.5 py-1.5 rounded-lg bg-[#25D366] hover:bg-[#20bd5a] text-white font-medium text-[11px]',
    text: 'text-slate-400 hover:text-emerald-400 transition-colors p-0 font-normal',
  };

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Fire contact analytics asynchronously
    try {
      const deviceType = typeof window !== 'undefined'
        ? window.innerWidth < 768 ? 'mobile' : window.innerWidth < 1024 ? 'tablet' : 'desktop'
        : 'desktop';

      api.logContactEvent({
        channel: 'whatsapp',
        source,
        intent: resolvedIntent,
        vin,
        orderNumber,
        messagePreview: computedMessage?.slice(0, 120),
        pageUrl: typeof window !== 'undefined' ? window.location.pathname + window.location.hash : '/',
        deviceType,
      });
    } catch {
      // Ignore background analytics errors
    }

    if (onClick) {
      onClick(e);
    }
  };

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      className={`${baseStyles} ${variants[variant]} ${className}`}
      aria-label={`Open WhatsApp to chat with AutoAudit Support: ${defaultLabel}`}
    >
      <WhatsAppIcon className={variant === 'compact' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
      <span>{defaultLabel}</span>
    </a>
  );
};
