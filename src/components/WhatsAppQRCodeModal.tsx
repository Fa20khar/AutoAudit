import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, QrCode, ExternalLink, Copy, Check, Smartphone, ShieldCheck, Clock } from 'lucide-react';
import { getWhatsAppUrl, AUTUAUDIT_WHATSAPP_NUMBER, AUTUAUDIT_WHATSAPP_DISPLAY, AUTUAUDIT_WHATSAPP_LOCAL } from './WhatsAppWidget';

interface WhatsAppQRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  message?: string;
  orderNumber?: string;
  vin?: string;
}

export const WhatsAppQRCodeModal: React.FC<WhatsAppQRCodeModalProps> = ({
  isOpen,
  onClose,
  message,
  orderNumber,
  vin,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  let computedMessage = message;
  if (!computedMessage) {
    if (orderNumber && vin) {
      computedMessage = `Hello AutoAudit Support, I need assistance with Order #${orderNumber} for VIN: ${vin}.`;
    } else if (orderNumber) {
      computedMessage = `Hello AutoAudit Support, I need help with Order #${orderNumber}.`;
    } else if (vin) {
      computedMessage = `Hi AutoAudit, I would like to inquire about vehicle history for VIN: ${vin}.`;
    } else {
      computedMessage = 'Hello AutoAudit Support, I would like assistance with a vehicle history report.';
    }
  }

  const qrUrl = getWhatsAppUrl(computedMessage);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(qrUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden transform transition-all scale-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#0B132B] text-white p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                WhatsApp QR Code
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              </h3>
              <p className="text-xs text-slate-400">
                Scan with phone camera or WhatsApp
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close QR Code Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 text-center space-y-5">
          {/* Main QR Code container with visual styling */}
          <div className="inline-block p-4 bg-white rounded-2xl shadow-lg border-2 border-slate-100 relative group">
            <div className="relative p-2 bg-slate-50/80 rounded-xl">
              <QRCodeSVG
                value={qrUrl}
                size={220}
                level="H"
                includeMargin={true}
                className="mx-auto rounded-lg"
              />
            </div>
            
            <div className="mt-2 text-[11px] font-mono font-bold text-emerald-700 bg-emerald-50 py-1 px-2.5 rounded-md border border-emerald-200 inline-block">
              {AUTUAUDIT_WHATSAPP_LOCAL} ({AUTUAUDIT_WHATSAPP_DISPLAY})
            </div>
          </div>

          {/* Quick Guidance */}
          <div className="space-y-1.5 text-xs text-slate-600">
            <div className="flex items-center justify-center gap-1.5 text-slate-900 font-bold text-sm">
              <Smartphone className="w-4 h-4 text-emerald-600" />
              <span>Point your camera to scan & chat</span>
            </div>
            <p className="text-slate-500 max-w-xs mx-auto">
              Scan this QR code with your mobile camera or WhatsApp QR scanner to start a live support conversation instantly.
            </p>
          </div>

          {/* Availability notice */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-[11px] text-slate-600 flex items-center justify-center gap-2">
            <Clock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>24/7 Coverage · Average response under 5 minutes</span>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              type="button"
              onClick={handleCopyLink}
              className="py-2.5 px-3 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-700">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-slate-500" />
                  <span>Copy Link</span>
                </>
              )}
            </button>

            <a
              href={qrUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md hover:shadow-lg transition-all cursor-pointer"
            >
              <span>Open Chat</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
