import React, { useState, useEffect } from 'react';
import { Menu, X, ArrowRight, Globe, ChevronRight, Gift } from 'lucide-react';
import { Logo } from './Logo';
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
  onOpenVideoStudio?: () => void; // Hidden in UI per design spec; retained for interface compatibility
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
    <header className="sticky top-0 z-40 w-full max-w-full bg-[#0B132B] text-white border-b border-[rgba(148,163,184,0.15)] shadow-xs">
      {/* Slim Navy Bar (64px) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
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

        {/* Center: Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-6 text-xs sm:text-sm font-medium text-slate-300">
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
            onClick={() => handleNavClick('faq')}
            className="hover:text-white transition-colors cursor-pointer"
          >
            {t('navFaq')}
          </button>
          <button
            onClick={onOpenTrack}
            className="hover:text-white transition-colors cursor-pointer text-slate-400 hover:text-slate-200"
          >
            {t('navMyReports')}
          </button>
        </nav>

        {/* Right: Actions (Language toggle, Refer & Earn, Get Report, Mobile Menu) */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Language Switcher (EN / ES) */}
          <div
            className="flex items-center bg-[#0F172A] border border-[rgba(148,163,184,0.20)] rounded-[8px] p-0.5"
            title={language === 'en' ? 'Cambiar a Español' : 'Switch to English'}
          >
            <div className="pl-1.5 pr-1 text-slate-400">
              <Globe className="w-3.5 h-3.5 text-blue-400" />
            </div>
            <button
              type="button"
              onClick={() => setLanguage('en')}
              className={`px-2 py-1 rounded-[6px] text-xs font-semibold transition-all cursor-pointer ${
                language === 'en'
                  ? 'bg-[#2563EB] text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
              aria-label="Switch to English"
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => setLanguage('es')}
              className={`px-2 py-1 rounded-[6px] text-xs font-semibold transition-all cursor-pointer ${
                language === 'es'
                  ? 'bg-[#2563EB] text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
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
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-[8px] text-xs font-semibold text-slate-200 hover:text-white bg-[#0F172A] hover:bg-[#1E293B] border border-slate-700/60 transition-all cursor-pointer shadow-2xs active:scale-95"
              title="Refer a Friend & Earn Discounts"
            >
              <Gift className="w-3.5 h-3.5 text-blue-400" />
              <span>{t('navRefer')}</span>
            </button>
          )}

          {/* Admin Portal Toggle (For authenticated/authorized access) */}
          <button
            onClick={onToggleAdminView}
            className="hidden xl:inline-flex items-center gap-1.5 px-3 py-2 rounded-[8px] text-xs font-semibold text-slate-300 hover:text-white bg-[#0F172A] hover:bg-[#1E293B] border border-slate-700/60 transition-colors cursor-pointer"
            title="Toggle Admin Fulfillment Console"
          >
            <span>{t('navAdminPortal')}</span>
            {newOrdersCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
            )}
          </button>

          {/* Primary Action Button: "Get Report" (Primary Blue #2563EB) */}
          <button
            onClick={() => onOpenOrder()}
            className="min-h-[40px] px-4 py-2 rounded-[8px] text-xs sm:text-sm font-semibold bg-[#2563EB] hover:bg-[#1D4ED8] active:bg-[#1E40AF] text-white shadow-xs transition-all duration-150 flex items-center gap-1.5 cursor-pointer active:scale-95 leading-normal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2"
          >
            <span>{t('navGetReport')}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="lg:hidden p-2 rounded-[8px] text-slate-300 hover:text-white hover:bg-[#0F172A] transition-colors cursor-pointer"
            aria-label="Open Navigation Menu"
            aria-expanded={mobileMenuOpen}
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>

      </div>

      {/* Mobile Slide-Out Drawer & Backdrop Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden flex justify-end"
          role="dialog"
          aria-modal="true"
          aria-label="Mobile Navigation Menu"
        >
          {/* Semi-transparent Backdrop Overlay */}
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs animate-drawer-fade-in"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Slide-out Drawer Panel */}
          <aside className="relative w-full max-w-sm bg-[#0B132B] border-l border-slate-800 text-white h-full flex flex-col shadow-2xl z-10 animate-drawer-slide-in">
            {/* Drawer Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-[#0F172A]">
              <Logo variant="navbar" size="sm" theme="dark" />
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                aria-label="Close Navigation Menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Language Switcher Bar inside Drawer */}
            <div className="p-4 border-b border-slate-800 bg-[#0B132B] flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                <Globe className="w-4 h-4 text-blue-400 shrink-0" />
                <span>{t('languageLabel')}:</span>
              </div>
              <div className="flex items-center gap-1 bg-[#0F172A] p-1 rounded-lg text-xs font-bold border border-slate-700">
                <button
                  type="button"
                  onClick={() => setLanguage('en')}
                  className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                    language === 'en' ? 'bg-[#2563EB] text-white shadow-xs' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  English
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage('es')}
                  className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                    language === 'es' ? 'bg-[#2563EB] text-white shadow-xs' : 'text-slate-400 hover:text-white'
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
                className="w-full flex items-center justify-between text-left px-3.5 py-2.5 rounded-lg text-slate-300 hover:text-white hover:bg-[#0F172A] transition-colors cursor-pointer"
              >
                <span>{t('navHome')}</span>
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </button>

              <button
                onClick={() => handleNavClick('services')}
                className="w-full flex items-center justify-between text-left px-3.5 py-2.5 rounded-lg text-slate-300 hover:text-white hover:bg-[#0F172A] transition-colors cursor-pointer"
              >
                <span>{t('navPricing')}</span>
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </button>

              <button
                onClick={() => handleNavClick('how-it-works')}
                className="w-full flex items-center justify-between text-left px-3.5 py-2.5 rounded-lg text-slate-300 hover:text-white hover:bg-[#0F172A] transition-colors cursor-pointer"
              >
                <span>{t('navHowItWorks')}</span>
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </button>

              <button
                onClick={() => {
                  onOpenSample();
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-between text-left px-3.5 py-2.5 rounded-lg text-slate-300 hover:text-white hover:bg-[#0F172A] transition-colors cursor-pointer"
              >
                <span>{t('navSampleReport')}</span>
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </button>

              <button
                onClick={() => handleNavClick('faq')}
                className="w-full flex items-center justify-between text-left px-3.5 py-2.5 rounded-lg text-slate-300 hover:text-white hover:bg-[#0F172A] transition-colors cursor-pointer"
              >
                <span>{t('navFaq')}</span>
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </button>

              <div className="pt-2 border-t border-slate-800 my-2 space-y-1">
                {onOpenReferral && (
                  <button
                    onClick={() => {
                      onOpenReferral();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center justify-between text-left px-3.5 py-2.5 rounded-lg text-xs font-semibold text-slate-200 hover:text-white bg-[#0F172A] border border-slate-700 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Gift className="w-3.5 h-3.5 text-blue-400" />
                      <span>{t('navRefer')}</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                  </button>
                )}

                <button
                  onClick={() => {
                    onOpenTrack();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-between text-left px-3.5 py-2 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-[#0F172A] transition-colors cursor-pointer"
                >
                  <span>{t('navMyReports')}</span>
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                </button>

                <button
                  onClick={() => {
                    onToggleAdminView();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-between text-left px-3.5 py-2 rounded-lg text-xs font-semibold text-slate-400 hover:text-white hover:bg-[#0F172A] transition-colors cursor-pointer"
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

            {/* Drawer Bottom Action: Primary CTA */}
            <div className="p-4 border-t border-slate-800 bg-[#0F172A]">
              <button
                onClick={() => {
                  onOpenOrder();
                  setMobileMenuOpen(false);
                }}
                className="w-full min-h-[44px] py-2.5 px-4 rounded-[8px] text-sm font-semibold bg-[#2563EB] hover:bg-[#1D4ED8] text-white shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98"
              >
                <span>{t('navGetReport')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </aside>
        </div>
      )}
    </header>
  );
};
