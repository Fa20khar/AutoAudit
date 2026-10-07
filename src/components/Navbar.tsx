import React, { useState } from 'react';
import { Menu, X, Shield, ArrowRight, QrCode, Globe } from 'lucide-react';
import { Logo } from './Logo';
import { WhatsAppButton } from './WhatsAppButton';
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
  const { language, setLanguage, t } = useTranslation();

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
            <span className="text-slate-300">{t('topBannerLive')}</span>
            <a
              href="https://wa.me/923420617217?text=Hello%20AutoAudit%20Support%2C%20I%20would%20like%20assistance%20with%20a%20vehicle%20history%20report."
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-400 font-bold hover:text-emerald-300 flex items-center gap-1 transition-colors group cursor-pointer"
            >
              <span>{t('whatsAppQr')}</span>
              <span className="text-slate-400 font-normal group-hover:text-emerald-300">(+92 342 0617217)</span>
            </a>
          </div>
          <div className="flex items-center gap-3 text-slate-400">
            <span className="text-emerald-400/90 font-medium">{t('topBannerResponse')}</span>
            <span className="text-slate-600">•</span>
            <span>{t('topBannerCoverage')}</span>
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
            {t('navHome')}
          </button>
          <button
            onClick={() => handleNavClick('services')}
            className="hover:text-white transition-colors cursor-pointer"
          >
            {t('navVehicleReports')}
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
          {onRequestReport && (
            <button
              onClick={onRequestReport}
              className="text-amber-400 hover:text-amber-300 font-semibold transition-colors cursor-pointer flex items-center gap-1 text-xs px-2.5 py-1 rounded bg-amber-400/10 border border-amber-400/20"
            >
              <span>{t('navRequestReport')}</span>
            </button>
          )}
        </nav>

        {/* Right: Actions */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Language Switcher (EN / ES) */}
          <div
            className="flex items-center bg-[#0F172A] border border-[#334155] rounded-[8px] p-0.5"
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
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
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
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
              aria-label="Cambiar a Español"
            >
              ES
            </button>
          </div>

          {/* Customer Portal Quick Track */}
          <button
            onClick={onOpenTrack}
            className="hidden sm:inline-flex text-xs text-slate-300 hover:text-white px-3 py-2 rounded-[8px] hover:bg-[#1E293B] transition-colors cursor-pointer"
          >
            {t('navMyReports')}
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
            <span>{t('navAdminPortal')}</span>
            {newOrdersCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </button>

          {/* Primary CTA: Get Report (#FB2C36 accent, 8px radius, micro-shadow) */}
          <button
            onClick={() => onOpenOrder()}
            className="px-4 sm:px-5 py-2.5 rounded-[8px] text-xs sm:text-sm font-medium bg-[#FB2C36] hover:bg-[#E0242E] text-white shadow-[0_1px_2px_rgba(0,0,0,0.05)] transition-all duration-150 flex items-center gap-1.5 cursor-pointer active:scale-95 leading-[1.43]"
          >
            <span>{t('navGetReport')}</span>
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
          {/* Mobile Language Switcher */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-[#0F172A] border border-[#334155]">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
              <Globe className="w-4 h-4 text-blue-400" />
              <span>{t('languageLabel')}:</span>
            </div>
            <div className="flex items-center gap-1 bg-[#1E293B] p-0.5 rounded-lg text-xs font-bold">
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                  language === 'en' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => setLanguage('es')}
                className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                  language === 'es' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                Español
              </button>
            </div>
          </div>

          <nav className="flex flex-col space-y-2 text-slate-300 font-medium">
            <button
              onClick={() => handleNavClick('hero')}
              className="text-left px-3 py-2 rounded-[8px] hover:bg-[#1E293B] hover:text-white transition-colors"
            >
              {t('navHome')}
            </button>
            <button
              onClick={() => handleNavClick('services')}
              className="text-left px-3 py-2 rounded-[8px] hover:bg-[#1E293B] hover:text-white transition-colors"
            >
              {t('navVehicleReports')}
            </button>
            <button
              onClick={() => handleNavClick('how-it-works')}
              className="text-left px-3 py-2 rounded-[8px] hover:bg-[#1E293B] hover:text-white transition-colors"
            >
              {t('navHowItWorks')}
            </button>
            <button
              onClick={() => {
                onOpenSample();
                setMobileMenuOpen(false);
              }}
              className="text-left px-3 py-2 rounded-[8px] hover:bg-[#1E293B] hover:text-white transition-colors"
            >
              {t('navSampleReport')}
            </button>
            <button
              onClick={() => handleNavClick('faq')}
              className="text-left px-3 py-2 rounded-[8px] hover:bg-[#1E293B] hover:text-white transition-colors"
            >
              {t('navFaq')}
            </button>
            {onRequestReport && (
              <button
                onClick={() => {
                  onRequestReport();
                  setMobileMenuOpen(false);
                }}
                className="text-left px-3 py-2 rounded-[8px] bg-amber-500/10 text-amber-300 border border-amber-500/30 font-semibold"
              >
                {t('navRequestReport')}
              </button>
            )}
            <button
              onClick={() => {
                onOpenTrack();
                setMobileMenuOpen(false);
              }}
              className="text-left px-3 py-2 rounded-[8px] hover:bg-[#1E293B] hover:text-white transition-colors"
            >
              {t('navCustomerPortal')}
            </button>
            <button
              onClick={() => {
                onToggleAdminView();
                setMobileMenuOpen(false);
              }}
              className="text-left px-3 py-2 rounded-[8px] bg-[#0F172A] text-slate-200 border border-[#334155] font-semibold"
            >
              {t('navAdminPortal')}
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
                    <div className="text-xs font-bold text-white">WhatsApp QR Support</div>
                    <div className="text-[11px] text-emerald-400 font-mono">03420617217</div>
                  </div>
                </div>
                <span className="text-[11px] bg-emerald-800/60 px-2 py-1 rounded text-white font-medium">Scan / Chat</span>
              </a>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};
