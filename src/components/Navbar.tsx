import React, { useState, useEffect } from 'react';
import { Menu, X, ArrowRight, QrCode, Globe, FileCheck, Shield, ChevronRight, Gift } from 'lucide-react';
import { Logo } from './Logo';
import { WhatsAppIcon } from './WhatsAppWidget';
import { useTranslation } from '../context/LanguageContext';

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
  onOpenVideoStudio?: () => void;
  onOpenReferral?: () => void;
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
  onOpenVideoStudio,
  onOpenReferral,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { language, setLanguage, t } = useTranslation();

  // Lock background body scrolling when mobile drawer is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  // Close drawer on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  const handleNavClick = (sectionId: string) => {
    onScrollTo(sectionId);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full max-w-full bg-[#07111F]/95 backdrop-blur-md text-white border-b border-[rgba(148,163,184,0.20)] shadow-md">
      {/* Top Support Banner featuring WhatsApp QR Support (+92 342 0617217) */}
      <div className="bg-[#061E14] text-slate-300 text-xs py-1.5 px-4 border-b border-emerald-900/60 hidden sm:block w-full overflow-hidden">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-[11px] sm:text-xs">
          <div className="flex items-center gap-2">
            <QrCode className="w-3.5 h-3.5 text-[#10B981] shrink-0" />
            <span className="text-[#CBD5E1]">{t('topBannerLive')}</span>
            <a
              href="https://wa.me/923420617217?text=Hello%20AutoAudit%20Support%2C%20I%20would%20like%20assistance%20with%20a%20vehicle%20history%20report."
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#10B981] font-bold hover:text-emerald-300 flex items-center gap-1 transition-colors group cursor-pointer"
            >
              <span>{t('whatsAppQr')}</span>
              <span className="text-slate-400 font-normal group-hover:text-emerald-300">(+92 342 0617217)</span>
            </a>
          </div>
          <div className="flex items-center gap-3 text-slate-400">
            <span className="text-[#10B981]/90 font-medium">{t('topBannerResponse')}</span>
            <span className="text-slate-600">•</span>
            <span>{t('topBannerCoverage')}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
        
        {/* Left: AutoAudit logo brand mark */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => handleNavClick('hero')}
            className="flex items-center text-left group cursor-pointer transition-transform active:scale-95"
            aria-label="AutoAudit Home"
          >
            <Logo variant="navbar" size="sm" theme="dark" />
          </button>
        </div>

        {/* Center: Navigation Links (Desktop - xl and above to ensure clean fit) */}
        <nav className="hidden xl:flex items-center gap-5 2xl:gap-6 text-xs xl:text-sm font-medium text-[#CBD5E1]">
          <button
            onClick={() => handleNavClick('hero')}
            className="hover:text-white transition-colors cursor-pointer"
          >
            {t('navHome')}
          </button>
          <button
            onClick={() => handleNavClick('services')}
            className="hover:text-white transition-colors cursor-pointer"
          >
            {t('navPricing')}
          </button>
          <button
            onClick={() => handleNavClick('how-it-works')}
            className="hover:text-white transition-colors cursor-pointer"
          >
            {t('navHowItWorks')}
          </button>
          <button
            onClick={onOpenSample}
            className="hover:text-white transition-colors cursor-pointer"
          >
            {t('navSampleReport')}
          </button>
          <button
            onClick={() => handleNavClick('interactive-view')}
            className="hover:text-white transition-colors cursor-pointer text-[#10B981] font-semibold"
          >
            Inspection View
          </button>
          <button
            onClick={() => handleNavClick('faq')}
            className="hover:text-white transition-colors cursor-pointer"
          >
            {t('navFaq')}
          </button>
        </nav>

        {/* Right: Actions with distinct spacing and no overlapping */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Language Switcher (EN / ES) */}
          <div
            className="flex items-center bg-[#0F1B2D] border border-[rgba(148,163,184,0.20)] rounded-[8px] p-0.5"
            title={language === 'en' ? 'Cambiar a Español' : 'Switch to English'}
          >
            <div className="pl-1.5 pr-1 text-slate-400">
              <Globe className="w-3.5 h-3.5 text-blue-400" />
            </div>
            <button
              type="button"
              onClick={() => setLanguage('en')}
              className={`px-2 py-1 rounded-[6px] text-xs font-bold transition-all cursor-pointer ${
                language === 'en'
                  ? 'bg-[#2563EB] text-white shadow-xs'
                  : 'text-[#CBD5E1] hover:text-white'
              }`}
              aria-label="Switch to English"
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => setLanguage('es')}
              className={`px-2 py-1 rounded-[6px] text-xs font-bold transition-all cursor-pointer ${
                language === 'es'
                  ? 'bg-[#2563EB] text-white shadow-xs'
                  : 'text-[#CBD5E1] hover:text-white'
              }`}
              aria-label="Cambiar a Español"
            >
              ES
            </button>
          </div>

          {/* Refer & Earn Button */}
          {onOpenReferral && (
            <button
              onClick={onOpenReferral}
              className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-[8px] text-xs font-semibold text-emerald-300 hover:text-white bg-emerald-950/50 hover:bg-emerald-900/70 border border-emerald-500/30 transition-all cursor-pointer shadow-xs active:scale-95"
              title="Refer a Friend & Earn 20% Discounts"
            >
              <Gift className="w-3.5 h-3.5 text-emerald-400" />
              <span>Refer & Earn</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded font-mono font-bold">20%</span>
            </button>
          )}

          {/* Customer Portal Quick Track (Wide screens) */}
          <button
            onClick={onOpenTrack}
            className="hidden 2xl:inline-flex text-xs text-[#CBD5E1] hover:text-white px-3 py-2 rounded-[8px] hover:bg-[#0F1B2D] transition-colors cursor-pointer"
          >
            {t('navMyReports')}
          </button>

          {/* Secondary: Admin Portal (Clearly separated) */}
          <button
            onClick={onToggleAdminView}
            className="hidden xl:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-xs font-semibold text-[#CBD5E1] hover:text-white bg-[#0F1B2D] hover:bg-[#162740] border border-[rgba(148,163,184,0.20)] transition-colors cursor-pointer"
            title="Toggle Admin Fulfillment Console"
          >
            <span>{t('navAdminPortal')}</span>
            {newOrdersCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
            )}
          </button>

          {/* Primary CTA: Get Report (Distinct #2563EB blue CTA button) */}
          <button
            onClick={() => onOpenOrder()}
            className="px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-[8px] text-xs sm:text-sm font-semibold bg-[#2563EB] hover:bg-[#1D4ED8] text-white shadow-[0_1px_2px_rgba(0,0,0,0.1)] transition-all duration-150 flex items-center gap-1.5 cursor-pointer active:scale-95 leading-[1.43]"
          >
            <span>{t('navGetReport')}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          {/* Mobile Hamburger Button (triggers drawer on screens below xl) */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="xl:hidden p-2 rounded-[8px] text-[#CBD5E1] hover:text-white hover:bg-[#0F1B2D] transition-colors cursor-pointer"
            aria-label="Open Navigation Menu"
            aria-expanded={mobileMenuOpen}
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>

      </div>

      {/* Mobile Slide-Out Drawer & Backdrop Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 xl:hidden flex justify-end" role="dialog" aria-modal="true" aria-label="Mobile Navigation Menu">
          {/* Semi-transparent Backdrop Overlay */}
          <div
            className="fixed inset-0 bg-[#07111F]/80 backdrop-blur-sm animate-drawer-fade-in"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Slide-out Drawer Panel */}
          <aside className="relative w-full max-w-sm sm:max-w-md bg-[#0B132B] border-l border-[rgba(148,163,184,0.20)] text-white h-full flex flex-col shadow-2xl z-10 animate-drawer-slide-in">
            {/* Drawer Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(148,163,184,0.15)] bg-[#07111F]">
              <div className="flex items-center gap-2.5">
                <Shield className="w-5 h-5 text-[#10B981]" />
                <span className="font-bold text-sm tracking-wide text-white uppercase font-mono">AutoAudit Menu</span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#0F1B2D] transition-colors cursor-pointer"
                aria-label="Close Navigation Menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Language Switcher Bar inside Drawer */}
            <div className="p-4 border-b border-[rgba(148,163,184,0.15)] bg-[#0F1B2D]/60 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#CBD5E1]">
                <Globe className="w-4 h-4 text-blue-400 shrink-0" />
                <span>{t('languageLabel')}:</span>
              </div>
              <div className="flex items-center gap-1 bg-[#07111F] p-1 rounded-lg text-xs font-bold border border-[rgba(148,163,184,0.20)]">
                <button
                  type="button"
                  onClick={() => setLanguage('en')}
                  className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                    language === 'en' ? 'bg-[#2563EB] text-white shadow-xs' : 'text-[#CBD5E1] hover:text-white'
                  }`}
                >
                  English
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage('es')}
                  className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                    language === 'es' ? 'bg-[#2563EB] text-white shadow-xs' : 'text-[#CBD5E1] hover:text-white'
                  }`}
                >
                  Español
                </button>
              </div>
            </div>

            {/* Scrollable Navigation Items */}
            <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-1 text-sm font-medium">
              <button
                onClick={() => handleNavClick('hero')}
                className="w-full flex items-center justify-between text-left px-3.5 py-2.5 rounded-lg text-[#CBD5E1] hover:text-white hover:bg-[#0F1B2D] transition-colors cursor-pointer"
              >
                <span>{t('navHome')}</span>
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </button>

              <button
                onClick={() => handleNavClick('services')}
                className="w-full flex items-center justify-between text-left px-3.5 py-2.5 rounded-lg text-[#CBD5E1] hover:text-white hover:bg-[#0F1B2D] transition-colors cursor-pointer"
              >
                <span>{t('navVehicleReports')}</span>
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </button>

              <button
                onClick={() => handleNavClick('services')}
                className="w-full flex items-center justify-between text-left px-3.5 py-2.5 rounded-lg text-[#CBD5E1] hover:text-white hover:bg-[#0F1B2D] transition-colors cursor-pointer"
              >
                <span>{t('navPricing')}</span>
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </button>

              <button
                onClick={() => handleNavClick('how-it-works')}
                className="w-full flex items-center justify-between text-left px-3.5 py-2.5 rounded-lg text-[#CBD5E1] hover:text-white hover:bg-[#0F1B2D] transition-colors cursor-pointer"
              >
                <span>{t('navHowItWorks')}</span>
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </button>

              <button
                onClick={() => {
                  onOpenSample();
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-between text-left px-3.5 py-2.5 rounded-lg text-[#CBD5E1] hover:text-white hover:bg-[#0F1B2D] transition-colors cursor-pointer"
              >
                <span>{t('navSampleReport')}</span>
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </button>

              <button
                onClick={() => handleNavClick('interactive-view')}
                className="w-full flex items-center justify-between text-left px-3.5 py-2.5 rounded-lg text-[#10B981] hover:text-emerald-300 hover:bg-[#0F1B2D] font-semibold transition-colors cursor-pointer"
              >
                <span>Interactive Inspection View</span>
                <ChevronRight className="w-4 h-4 text-emerald-500/70" />
              </button>

              <button
                onClick={() => handleNavClick('faq')}
                className="w-full flex items-center justify-between text-left px-3.5 py-2.5 rounded-lg text-[#CBD5E1] hover:text-white hover:bg-[#0F1B2D] transition-colors cursor-pointer"
              >
                <span>{t('navFaq')}</span>
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </button>

              {onRequestReport && (
                <button
                  onClick={() => {
                    onRequestReport();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-between text-left px-3.5 py-2.5 rounded-lg bg-[#059669]/15 text-[#10B981] hover:text-emerald-300 border border-[#059669]/30 font-semibold transition-colors cursor-pointer my-1"
                >
                  <div className="flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-[#10B981]" />
                    <span>{t('navRequestReport')}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-emerald-400" />
                </button>
              )}

              <div className="pt-2 border-t border-[rgba(148,163,184,0.15)] my-2 space-y-1">
                {onOpenReferral && (
                  <button
                    onClick={() => {
                      onOpenReferral();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center justify-between text-left px-3.5 py-2.5 rounded-lg text-xs font-semibold text-emerald-300 hover:text-white bg-emerald-950/40 border border-emerald-500/30 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Gift className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Refer a Friend (Earn 20% Off)</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-emerald-400" />
                  </button>
                )}

                <button
                  onClick={() => {
                    onOpenTrack();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-between text-left px-3.5 py-2 rounded-lg text-xs font-semibold text-[#CBD5E1] hover:text-white hover:bg-[#0F1B2D] transition-colors cursor-pointer"
                >
                  <span>{t('navCustomerPortal')}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                </button>

                <button
                  onClick={() => {
                    onToggleAdminView();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-between text-left px-3.5 py-2 rounded-lg text-xs font-semibold text-[#CBD5E1] hover:text-white bg-[#0F1B2D]/80 border border-[rgba(148,163,184,0.20)] transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span>{t('navAdminPortal')}</span>
                    {newOrdersCount > 0 && (
                      <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
                    )}
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                </button>
              </div>
            </nav>

            {/* Drawer Bottom Actions: Primary CTA and WhatsApp Support */}
            <div className="p-4 border-t border-[rgba(148,163,184,0.15)] bg-[#07111F] space-y-3">
              {/* Primary Action Button */}
              <button
                onClick={() => {
                  onOpenOrder();
                  setMobileMenuOpen(false);
                }}
                className="w-full py-3 px-4 rounded-xl text-sm font-semibold bg-[#2563EB] hover:bg-[#1D4ED8] text-white shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98"
              >
                <span>{t('navGetReport')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Mobile WhatsApp Quick Support Card */}
              <a
                href="https://wa.me/923420617217?text=Hello%20AutoAudit%20Support%2C%20I%20would%20like%20assistance%20with%20a%20vehicle%20history%20report."
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-900/60 text-emerald-300 hover:text-emerald-200 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#25D366] text-white flex items-center justify-center shrink-0 shadow-sm">
                    <WhatsAppIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">WhatsApp QR Support</div>
                    <div className="text-[11px] text-[#10B981] font-mono">03420617217</div>
                  </div>
                </div>
                <span className="text-[11px] bg-emerald-800/60 px-2 py-1 rounded text-white font-medium">Scan / Chat</span>
              </a>
            </div>
          </aside>
        </div>
      )}
    </header>
  );
};
