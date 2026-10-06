import React, { useState } from 'react';
import { QrCode } from 'lucide-react';
import { getWhatsAppUrl, AUTUAUDIT_WHATSAPP_NUMBER } from './WhatsAppWidget';
import { WhatsAppQRCodeModal } from './WhatsAppQRCodeModal';
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
  openQrModal?: boolean;
  onClick?: (e: React.MouseEvent<HTMLElement>) => void;
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
  openQrModal = false,
  onClick,
}) => {
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
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
  const defaultLabel = label || (showNumber ? 'WhatsApp QR: 03420617217' : 'WhatsApp QR Code');

  const baseStyles = 'inline-flex items-center justify-center gap-2 font-medium transition-all duration-150 cursor-pointer text-center text-xs';

  const variants = {
    primary: 'bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl shadow-xs hover:shadow-md font-semibold',
    secondary: 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 px-3.5 py-2 rounded-xl font-semibold',
    outline: 'border border-emerald-500/50 hover:border-emerald-500 text-emerald-600 hover:text-emerald-700 bg-transparent px-3 py-1.5 rounded-lg',
    compact: 'px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-[11px]',
    text: 'text-slate-400 hover:text-emerald-400 transition-colors p-0 font-normal',
  };

  const handleClick = (e: React.MouseEvent<HTMLElement>) => {
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

    if (openQrModal) {
      e.preventDefault();
      setIsQrModalOpen(true);
    }

    if (onClick) {
      onClick(e);
    }
  };

  if (openQrModal) {
    return (
      <>
        <button
          type="button"
          onClick={handleClick}
          className={`${baseStyles} ${variants[variant]} ${className}`}
          aria-label={`View WhatsApp QR Code: ${defaultLabel}`}
        >
          <QrCode className={variant === 'compact' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
          <span>{defaultLabel}</span>
        </button>

        <WhatsAppQRCodeModal
          isOpen={isQrModalOpen}
          onClose={() => setIsQrModalOpen(false)}
          message={computedMessage}
          orderNumber={orderNumber}
          vin={vin}
        />
      </>
    );
  }

  return (
    <>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleClick}
        className={`${baseStyles} ${variants[variant]} ${className}`}
        aria-label={`Open WhatsApp to chat with AutoAudit Support: ${defaultLabel}`}
      >
        <QrCode className={variant === 'compact' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
        <span>{defaultLabel}</span>
      </a>

      {isQrModalOpen && (
        <WhatsAppQRCodeModal
          isOpen={isQrModalOpen}
          onClose={() => setIsQrModalOpen(false)}
          message={computedMessage}
          orderNumber={orderNumber}
          vin={vin}
        />
      )}
    </>
  );
};
