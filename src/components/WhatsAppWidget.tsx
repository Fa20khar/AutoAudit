import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Clock, ShieldCheck } from 'lucide-react';
import { api } from '../services/api';
import { ContactIntent, WhatsAppConfig } from '../types';
import { INITIAL_WHATSAPP_CONFIG } from '../data/initialData';

export const AUTUAUDIT_WHATSAPP_NUMBER = '18005552886'; // +1 800-555-AUTO

export function getWhatsAppUrl(customMessage?: string, phoneNumber?: string): string {
  const number = phoneNumber || AUTUAUDIT_WHATSAPP_NUMBER;
  const text = customMessage || 'Hello AutoAudit Support, I would like assistance with a vehicle history report.';
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}

export function WhatsAppIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.456 5.711 1.457h.005c6.554 0 11.89-5.335 11.893-11.893a11.82 11.82 0 00-3.48-8.413z" />
    </svg>
  );
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
  const [message, setMessage] = useState(initialMessage || '');
  const [hasUnreadAlert, setHasUnreadAlert] = useState(true);
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

  const handleSend = (customText?: string, promptIntent: ContactIntent = 'general_support') => {
    const textToSend = customText || message.trim() || config.defaultGreeting || 'Hello AutoAudit Support, I need help with vehicle history reports.';
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
      {/* Popover Chat Card */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="WhatsApp Customer Support"
          className="mb-3 w-80 sm:w-96 rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200"
        >
          {/* Header */}
          <div className="bg-[#0B132B] text-white p-4 flex items-center justify-between border-b border-[#1E293B]">
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 rounded-full bg-[#25D366] text-white flex items-center justify-center shrink-0 shadow-md">
                <WhatsAppIcon className="w-6 h-6" />
                <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#0B132B]" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="text-sm font-bold text-white">AutoAudit Support</h4>
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Online · Typically replies in &lt; 5 mins</span>
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

          {/* Conversation Bubble */}
          <div className="p-4 bg-slate-50 space-y-3 max-h-[360px] overflow-y-auto">
            {/* Automated Support Intro */}
            <div className="bg-white p-3.5 rounded-xl rounded-tl-none border border-slate-200/80 shadow-xs space-y-1.5">
              <p className="text-xs text-slate-800 leading-relaxed">
                👋 <strong>Welcome to AutoAudit Customer Care!</strong>
              </p>
              <p className="text-xs text-slate-600 leading-relaxed">
                Need immediate help with a vehicle history report, VIN decoding, or an existing order? Send us a message on WhatsApp and an auditor will assist you directly.
              </p>
              <div className="text-[10px] text-slate-400 flex items-center gap-1 pt-1">
                <Clock className="w-3 h-3" />
                <span>Support Line: {config.displayNumber || '+1 (800) 555-AUTO'}</span>
              </div>
            </div>

            {/* Quick Prompts */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                Quick Inquiries:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {quickPrompts.map((prompt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setMessage(prompt.text);
                      handleSend(prompt.text, prompt.intent);
                    }}
                    className="text-left text-xs bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-emerald-300 transition-colors cursor-pointer"
                  >
                    {prompt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Input & Send CTA */}
            <div className="space-y-2 pt-2">
              <label htmlFor="wa-message-input" className="sr-only">
                Message to AutoAudit Support
              </label>
              <textarea
                id="wa-message-input"
                rows={2}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message or VIN here..."
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#25D366] resize-none"
              />

              <button
                type="button"
                onClick={() => handleSend(message, 'general_support')}
                className="w-full py-2.5 px-4 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer text-center"
              >
                <WhatsAppIcon className="w-4 h-4" />
                <span>Start WhatsApp Chat</span>
                <Send className="w-3.5 h-3.5 ml-0.5" />
              </button>
            </div>
          </div>

          {/* Footer note */}
          <div className="p-2.5 bg-white border-t border-slate-100 text-center">
            <span className="text-[10px] text-slate-400">
              {config.supportAvailability || 'Official AutoAudit Help Desk · Mon-Sun 24/7 Coverage'}
            </span>
          </div>
        </div>
      )}

      {/* Floating Action Button */}
      <div className="flex items-center gap-2 justify-end">
        {/* Helper tooltip tag when closed */}
        {!isOpen && hasUnreadAlert && (
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-medium shadow-lg border border-slate-700 animate-bounce">
            <span className="w-2 h-2 rounded-full bg-[#25D366]" />
            <span>Chat on WhatsApp</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setHasUnreadAlert(false);
              }}
              className="text-slate-400 hover:text-white ml-1"
              aria-label="Dismiss notification"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={handleToggle}
          className="relative group p-3.5 sm:p-4 rounded-full bg-[#25D366] hover:bg-[#20bd5a] text-white shadow-xl hover:shadow-2xl transition-all duration-200 transform hover:scale-105 active:scale-95 cursor-pointer flex items-center justify-center focus:outline-none focus:ring-4 focus:ring-emerald-200"
          aria-label="Chat with AutoAudit Support on WhatsApp"
          title="Chat with AutoAudit on WhatsApp"
        >
          {isOpen ? (
            <X className="w-6 h-6 text-white" />
          ) : (
            <>
              <WhatsAppIcon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
              {hasUnreadAlert && (
                <span className="absolute top-0 right-0 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-white" />
                </span>
              )}
            </>
          )}
        </button>
      </div>
    </div>
  );
};
