import React, { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Send, Clock, ShieldCheck, QrCode, Smartphone, Copy, Check, ExternalLink, MessageSquare } from 'lucide-react';
import { api } from '../services/api';
import { ContactIntent, WhatsAppConfig } from '../types';
import { INITIAL_WHATSAPP_CONFIG } from '../data/initialData';

export const AUTUAUDIT_WHATSAPP_NUMBER = '923420617217'; // 03420617217 (+92 342 0617217)
export const AUTUAUDIT_WHATSAPP_DISPLAY = '+92 342 0617217';
export const AUTUAUDIT_WHATSAPP_LOCAL = '03420617217';

export function formatWhatsAppNumberForLink(phone: string): string {
  let clean = phone.replace(/[^0-9]/g, '');
  if (clean.startsWith('03') && clean.length === 11) {
    clean = '92' + clean.slice(1);
  }
  return clean || AUTUAUDIT_WHATSAPP_NUMBER;
}

export function getWhatsAppUrl(customMessage?: string, phoneNumber?: string): string {
  const rawNumber = phoneNumber || AUTUAUDIT_WHATSAPP_NUMBER;
  const number = formatWhatsAppNumberForLink(rawNumber);
  const text = customMessage || 'Hello AutoAudit Support, I would like assistance with a vehicle history report.';
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}

// Replaced old phone icon with QR Code icon as requested
export function WhatsAppIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return <QrCode className={className} />;
}

interface WhatsAppWidgetProps {
  initialMessage?: string;
  orderNumber?: string;
  vin?: string;
}

export const WhatsAppWidget: React.FC<WhatsAppWidgetProps> = ({
  initialMessage,
  orderNumber,
  vin,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'qr' | 'message'>('qr');
  const [message, setMessage] = useState(initialMessage || '');
  const [hasUnreadAlert, setHasUnreadAlert] = useState(true);
  const [copied, setCopied] = useState(false);
  const [config, setConfig] = useState<WhatsAppConfig>(INITIAL_WHATSAPP_CONFIG);
  const widgetRef = useRef<HTMLDivElement>(null);

  // Load dynamic configuration from server on mount
  useEffect(() => {
    let isMounted = true;
    api.getWhatsAppConfig()
      .then((res) => {
        if (isMounted && res) {
          setConfig(res);
        }
      })
      .catch(() => {
        // Fallback to initial config
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Close widget on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (widgetRef.current && !widgetRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setHasUnreadAlert(false);
    }
  };

  const quickPrompts: { label: string; text: string; intent: ContactIntent }[] = [
    {
      label: 'Check a VIN',
      text: vin
        ? `Hi AutoAudit, I have a question regarding vehicle with VIN: ${vin}.`
        : 'Hi AutoAudit, I would like to verify a VIN before placing an order.',
      intent: 'vin_check',
    },
    {
      label: orderNumber ? `Order #${orderNumber}` : 'Track my report',
      text: orderNumber
        ? `Hello AutoAudit Support, I need an update on my order #${orderNumber}.`
        : 'Hello AutoAudit, could you please help me check the status of my order?',
      intent: 'order_tracking',
    },
    {
      label: 'Pricing & Delivery',
      text: 'Hi AutoAudit, how fast are reports delivered to my email after purchase?',
      intent: 'pricing',
    },
  ];

  const currentMessageText = message.trim() || config.defaultGreeting || 'Hello AutoAudit Support, I need help with vehicle history reports.';
  const currentWhatsAppUrl = getWhatsAppUrl(currentMessageText, config.phoneNumber);

  const handleCopy = () => {
    navigator.clipboard.writeText(currentWhatsAppUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleSend = (customText?: string, promptIntent: ContactIntent = 'general_support') => {
    const textToSend = customText || currentMessageText;
    const url = getWhatsAppUrl(textToSend, config.phoneNumber);

    // Fire contact analytics asynchronously
    try {
      const deviceType = typeof window !== 'undefined'
        ? window.innerWidth < 768 ? 'mobile' : window.innerWidth < 1024 ? 'tablet' : 'desktop'
        : 'desktop';

      api.logContactEvent({
        channel: 'whatsapp',
        source: 'floating_widget',
        intent: promptIntent,
        vin,
        orderNumber,
        messagePreview: textToSend.slice(0, 120),
        pageUrl: typeof window !== 'undefined' ? window.location.pathname + window.location.hash : '/',
        deviceType,
      });
    } catch {
      // Ignore background analytics logging errors
    }

    setIsOpen(false);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div ref={widgetRef} className="fixed bottom-6 right-6 z-40 print:hidden font-sans">
      {/* Popover Card */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="WhatsApp QR Code & Live Support"
          className="mb-3 w-80 sm:w-96 rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200"
        >
          {/* Header */}
          <div className="bg-[#0B132B] text-white p-4 flex items-center justify-between border-b border-[#1E293B]">
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0 shadow-md">
                <QrCode className="w-5 h-5" />
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#0B132B]" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="text-sm font-bold text-white">WhatsApp QR Support</h4>
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>03420617217 · Live Support</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Close WhatsApp chat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tab Selector */}
          <div className="flex items-center border-b border-slate-200 bg-slate-50 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab('qr')}
              className={`flex-1 py-2.5 px-3 flex items-center justify-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
                activeTab === 'qr'
                  ? 'border-emerald-500 text-emerald-700 bg-white font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Scan QR Code</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('message')}
              className={`flex-1 py-2.5 px-3 flex items-center justify-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
                activeTab === 'message'
                  ? 'border-emerald-500 text-emerald-700 bg-white font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Quick Message</span>
            </button>
          </div>

          {/* Tab 1: QR Code View */}
          {activeTab === 'qr' && (
            <div className="p-4 bg-slate-50 space-y-3.5 text-center">
              {/* QR Code Container */}
              <div className="inline-block p-3.5 bg-white rounded-2xl shadow-sm border border-slate-200">
                <QRCodeSVG
                  value={currentWhatsAppUrl}
                  size={180}
                  level="H"
                  includeMargin={true}
                  className="mx-auto rounded-lg"
                />
                <div className="mt-2 text-[11px] font-mono font-bold text-emerald-800 bg-emerald-50 py-1 px-2 rounded border border-emerald-200">
                  WhatsApp: {AUTUAUDIT_WHATSAPP_LOCAL}
                </div>
              </div>

              {/* Instructions */}
              <div className="space-y-1 text-xs">
                <div className="flex items-center justify-center gap-1.5 font-bold text-slate-800">
                  <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Scan with your phone camera</span>
                </div>
                <p className="text-[11px] text-slate-500 max-w-[260px] mx-auto leading-relaxed">
                  Open your phone camera or WhatsApp QR scanner to start chat immediately with our vehicle history team.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="py-2 px-3 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                      <span>Copy Link</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleSend(currentMessageText)}
                  className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm hover:shadow transition-colors cursor-pointer"
                >
                  <span>Open Chat</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Tab 2: Quick Message View */}
          {activeTab === 'message' && (
            <div className="p-4 bg-slate-50 space-y-3 max-h-[380px] overflow-y-auto">
              <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-xs space-y-1">
                <p className="text-xs font-bold text-slate-800">
                  Direct WhatsApp Support
                </p>
                <div className="text-[11px] text-slate-500 flex items-center gap-1 font-medium">
                  <Clock className="w-3 h-3 text-emerald-600" />
                  <span>Helpline: <strong className="text-emerald-700 font-mono">03420617217</strong></span>
                </div>
              </div>

              {/* Quick Prompts */}
              <div className="space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                  Choose a topic:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {quickPrompts.map((prompt, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setMessage(prompt.text);
                      }}
                      className="text-left text-xs bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-emerald-300 transition-colors cursor-pointer"
                    >
                      {prompt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Input & Send CTA */}
              <div className="space-y-2 pt-1">
                <label htmlFor="wa-message-input" className="sr-only">
                  Message to AutoAudit Support
                </label>
                <textarea
                  id="wa-message-input"
                  rows={2}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type your vehicle inquiry or VIN here..."
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                />

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('qr')}
                    className="py-2.5 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <QrCode className="w-3.5 h-3.5 text-emerald-600" />
                    <span>View QR</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSend(message, 'general_support')}
                    className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm hover:shadow transition-all cursor-pointer"
                  >
                    <span>Send Chat</span>
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Footer note */}
          <div className="p-2.5 bg-white border-t border-slate-100 text-center">
            <span className="text-[10px] text-slate-400">
              {config.supportAvailability || 'Official AutoAudit Help Desk · Mon-Sun 24/7 Coverage'}
            </span>
          </div>
        </div>
      )}

      {/* Floating Action Button featuring QR Code */}
      <div className="flex items-center gap-2 justify-end">
        {/* Helper tooltip tag when closed */}
        {!isOpen && hasUnreadAlert && (
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-medium shadow-lg border border-slate-700 animate-bounce">
            <QrCode className="w-3.5 h-3.5 text-emerald-400" />
            <span>Scan WhatsApp QR: <strong className="text-emerald-400 font-mono">03420617217</strong></span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setHasUnreadAlert(false);
              }}
              className="text-slate-400 hover:text-white ml-1 cursor-pointer"
              aria-label="Dismiss notification"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={handleToggle}
          className="relative group p-3.5 sm:p-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl hover:shadow-2xl transition-all duration-200 transform hover:scale-105 active:scale-95 cursor-pointer flex items-center justify-center focus:outline-none focus:ring-4 focus:ring-emerald-200 border-2 border-white/20"
          aria-label="Open WhatsApp QR Code & Chat (03420617217)"
          title="Scan WhatsApp QR Code (03420617217)"
        >
          {isOpen ? (
            <X className="w-6 h-6 text-white" />
          ) : (
            <>
              <QrCode className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
              {hasUnreadAlert && (
                <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-400 border-2 border-slate-900" />
                </span>
              )}
            </>
          )}
        </button>
      </div>
    </div>
  );
};
