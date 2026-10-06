import React, { useState } from 'react';
import { Menu, X, Shield, ArrowRight, MessageCircle, QrCode } from 'lucide-react';
import { Logo } from './Logo';
import { WhatsAppButton } from './WhatsAppButton';
import { WhatsAppIcon } from './WhatsAppWidget';

interface NavbarProps {
  onOpenOrder: (serviceId?: string) => void;
  onOpenSample: () => void;
  onOpenTrack: () => void;
  onOpenFaq: () => void;
  onScrollTo: (sectionId: string) => void;
  isAdminView: boolean;
  onToggleAdminView: () => void;
  newOrdersCount: number;
  onRequestReport?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenOrder,
  onOpenSample,
  onOpenTrack,
  onOpenFaq,
  onScrollTo,
  isAdminView,
  onToggleAdminView,
  newOrdersCount,
  onRequestReport,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = (sectionId: string) => {
    onScrollTo(sectionId);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#0B132B] text-white border-b border-[#1E293B] shadow-md">
      {/* Top Support Banner featuring WhatsApp QR 03420617217 */}
      <div className="bg-[#061e14] text-slate-300 text-xs py-1.5 px-4 border-b border-emerald-900/60 hidden sm:block">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-[11px] sm:text-xs">
          <div className="flex items-center gap-2">
            <QrCode className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="text-slate-300">Live Support & VIN Verification:</span>
            <a
              href="https://wa.me/923420617217?text=Hello%20AutoAudit%20Support%2C%20I%20would%20like%20assistance%20with%20a%20vehicle%20history%20report."
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-400 font-bold hover:text-emerald-300 flex items-center gap-1 transition-colors group cursor-pointer"
            >
              <span>WhatsApp QR: 03420617217</span>
              <span className="text-slate-400 font-normal group-hover:text-emerald-300">(+92 342 0617217)</span>
            </a>
          </div>
          <div className="flex items-center gap-3 text-slate-400">
            <span className="text-emerald-400/90 font-medium">⚡ Avg Response &lt; 5 Mins</span>
            <span className="text-slate-600">•</span>
            <span>24/7 Dedicated Support</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* Left: AutoAudit logo + wordmark */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleNavClick('hero')}
            className="flex items-center text-left group cursor-pointer transition-transform active:scale-95"
            aria-label="AutoAudit Home"
          >
            <Logo variant="navbar" size="sm" theme="dark" />
          </button>
        </div>

        {/* Center: Navigation Links (Desktop) */}
        <nav className="hidden lg:flex items-center gap-7 text-sm font-medium text-slate-300">
          <button
            onClick={() => handleNavClick('hero')}
            className="hover:text-white transition-colors cursor-pointer"
          >
            Home
          </button>
          <button
            onClick={() => handleNavClick('services')}
            className="hover:text-white transition-colors cursor-pointer"
          >
            Vehicle Reports
          </button>
          <button
            onClick={() => handleNavClick('services')}
            className="hover:text-white transition-colors cursor-pointer"
          >
            Pricing
          </button>
          <button
            onClick={() => handleNavClick('how-it-works')}
            className="hover:text-white transition-colors cursor-pointer"
          >
            How It Works
          </button>
          <button
            onClick={onOpenSample}
            className="hover:text-white transition-colors cursor-pointer"
          >
            Sample Report
          </button>
          <button
            onClick={() => handleNavClick('faq')}
            className="hover:text-white transition-colors cursor-pointer"
          >
            FAQ
          </button>
          {onRequestReport && (
            <button
              onClick={onRequestReport}
              className="text-amber-400 hover:text-amber-300 font-semibold transition-colors cursor-pointer flex items-center gap-1 text-xs px-2.5 py-1 rounded bg-amber-400/10 border border-amber-400/20"
            >
              <span>Request Vehicle Report</span>
            </button>
          )}
        </nav>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          {/* Customer Portal Quick Track */}
          <button
            onClick={onOpenTrack}
            className="hidden sm:inline-flex text-xs text-slate-300 hover:text-white px-3 py-2 rounded-[8px] hover:bg-[#1E293B] transition-colors cursor-pointer"
          >
            My Reports
          </button>

          {/* WhatsApp Direct QR Support Button: 03420617217 */}
          <WhatsAppButton
            variant="secondary"
            source="navbar"
            intent="general_support"
            label="QR: 03420617217"
            openQrModal={true}
            className="hidden xl:inline-flex bg-emerald-950/50 hover:bg-emerald-900/70 text-emerald-300 border border-emerald-800/80 px-3 py-2 rounded-[8px] font-semibold text-xs leading-[1.43]"
          />

          {/* Secondary: Admin Portal */}
          <button
            onClick={onToggleAdminView}
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[8px] text-xs font-semibold text-slate-300 hover:text-white bg-[#0F172A] hover:bg-[#1E293B] border border-[#334155] transition-colors cursor-pointer"
            title="Toggle Admin Fulfillment Console"
          >
            <span>Admin Portal</span>
            {newOrdersCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </button>

          {/* Primary CTA: Get Report (#FB2C36 accent, 8px radius, micro-shadow) */}
          <button
            onClick={() => onOpenOrder()}
            className="px-4 sm:px-5 py-2.5 rounded-[8px] text-xs sm:text-sm font-medium bg-[#FB2C36] hover:bg-[#E0242E] text-white shadow-[0_1px_2px_rgba(0,0,0,0.05)] transition-all duration-150 flex items-center gap-1.5 cursor-pointer active:scale-95 leading-[1.43]"
          >
            <span>Get Report</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-[8px] text-slate-300 hover:text-white hover:bg-[#1E293B] transition-colors cursor-pointer"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#0B132B] border-b border-[#1E293B] px-4 pt-3 pb-6 space-y-3 animate-fade-in text-sm">
          <nav className="flex flex-col space-y-2 text-slate-300 font-medium">
            <button
              onClick={() => handleNavClick('hero')}
              className="text-left px-3 py-2 rounded-[8px] hover:bg-[#1E293B] hover:text-white transition-colors"
            >
              Home
            </button>
            <button
              onClick={() => handleNavClick('services')}
              className="text-left px-3 py-2 rounded-[8px] hover:bg-[#1E293B] hover:text-white transition-colors"
            >
              Vehicle Reports & Pricing
            </button>
            <button
              onClick={() => handleNavClick('how-it-works')}
              className="text-left px-3 py-2 rounded-[8px] hover:bg-[#1E293B] hover:text-white transition-colors"
            >
              How It Works
            </button>
            <button
              onClick={() => {
                onOpenSample();
                setMobileMenuOpen(false);
              }}
              className="text-left px-3 py-2 rounded-[8px] hover:bg-[#1E293B] hover:text-white transition-colors"
            >
              Sample Report
            </button>
            <button
              onClick={() => handleNavClick('faq')}
              className="text-left px-3 py-2 rounded-[8px] hover:bg-[#1E293B] hover:text-white transition-colors"
            >
              FAQ
            </button>
            {onRequestReport && (
              <button
                onClick={() => {
                  onRequestReport();
                  setMobileMenuOpen(false);
                }}
                className="text-left px-3 py-2 rounded-[8px] bg-amber-500/10 text-amber-300 border border-amber-500/30 font-semibold"
              >
                Request Vehicle Report (Intake Form)
              </button>
            )}
            <button
              onClick={() => {
                onOpenTrack();
                setMobileMenuOpen(false);
              }}
              className="text-left px-3 py-2 rounded-[8px] hover:bg-[#1E293B] hover:text-white transition-colors"
            >
              Customer Order Portal
            </button>
            <button
              onClick={() => {
                onToggleAdminView();
                setMobileMenuOpen(false);
              }}
              className="text-left px-3 py-2 rounded-[8px] bg-[#0F172A] text-slate-200 border border-[#334155] font-semibold"
            >
              Admin Portal
            </button>

            {/* Mobile WhatsApp Quick Support: 03420617217 */}
            <div className="pt-2 border-t border-[#1E293B] mt-2">
              <a
                href="https://wa.me/923420617217?text=Hello%20AutoAudit%20Support%2C%20I%20would%20like%20assistance%20with%20a%20vehicle%20history%20report."
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between p-3 rounded-xl bg-emerald-950/40 border border-emerald-900/60 text-emerald-300 hover:text-emerald-200 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#25D366] text-white flex items-center justify-center shrink-0">
                    <WhatsAppIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">WhatsApp Support</div>
                    <div className="text-[11px] text-emerald-400 font-mono">03420617217</div>
                  </div>
                </div>
                <span className="text-[11px] bg-emerald-800/60 px-2 py-1 rounded text-white font-medium">Chat</span>
              </a>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};
