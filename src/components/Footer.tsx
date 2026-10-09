import React from 'react';
import { Logo } from './Logo';
import { WhatsAppButton } from './WhatsAppButton';

interface FooterProps {
  onOpenLegal: (tab: 'terms' | 'privacy' | 'refund' | 'compliance') => void;
  onOpenOrder: () => void;
  onOpenSample: () => void;
  onOpenTrack: () => void;
  onScrollTo: (sectionId: string) => void;
  onToggleAdmin: () => void;
  onRequestReport?: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onOpenLegal,
  onOpenOrder,
  onOpenSample,
  onOpenTrack,
  onScrollTo,
  onToggleAdmin,
  onRequestReport,
}) => {
  return (
    <footer className="bg-[#0B132B] text-[#CBD5E1] text-xs border-t border-[rgba(148,163,184,0.20)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10 mb-12">
          
          {/* Left Column: Logo & Description */}
          <div className="md:col-span-2 space-y-4">
            <Logo variant="navbar" size="sm" theme="dark" />
            <p className="text-slate-300 text-sm leading-relaxed max-w-sm">
              Simple, transparent vehicle history reporting.
            </p>
            <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
              AutoAudit is an online digital ordering platform compiling vehicle title, salvage, and collision records from authorized registries. We do not provide physical vehicle inspections.
            </p>
            <div className="pt-2">
              <WhatsAppButton
                variant="secondary"
                label="Scan WhatsApp QR: 03420617217"
                openQrModal={true}
                className="bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border-emerald-800 text-xs font-semibold"
              />
            </div>
          </div>

          {/* Column 1: Company */}
          <div className="space-y-3">
            <span className="font-bold text-white text-xs uppercase tracking-wider block">
              Company
            </span>
            <ul className="space-y-2.5">
              <li>
                <button
                  type="button"
                  onClick={() => onScrollTo('hero')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  About
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onOpenLegal('compliance')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Contact
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onScrollTo('faq')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  FAQ
                </button>
              </li>
            </ul>
          </div>

          {/* Column 2: Reports */}
          <div className="space-y-3">
            <span className="font-bold text-white text-xs uppercase tracking-wider block">
              Reports
            </span>
            <ul className="space-y-2.5">
              <li>
                <button
                  type="button"
                  onClick={() => onScrollTo('services')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Vehicle History Report
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onOpenOrder()}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  VIN Report
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={onOpenSample}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Sample Report
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onScrollTo('services')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Pricing
                </button>
              </li>
              {onRequestReport && (
                <li>
                  <button
                    type="button"
                    onClick={onRequestReport}
                    className="text-amber-400 hover:text-amber-300 font-semibold transition-colors cursor-pointer"
                  >
                    Request Vehicle Report (Intake Form)
                  </button>
                </li>
              )}
            </ul>
          </div>

          {/* Column 3: Support & Legal */}
          <div className="space-y-3">
            <span className="font-bold text-white text-xs uppercase tracking-wider block">
              Support & Legal
            </span>
            <ul className="space-y-2.5">
              <li>
                <button
                  type="button"
                  onClick={onOpenTrack}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Order Support & Tracking
                </button>
              </li>
              <li>
                <WhatsAppButton
                  variant="text"
                  openQrModal={true}
                  label="WhatsApp QR: 03420617217 (+92 342 0617217)"
                  className="hover:text-emerald-400 text-slate-400"
                />
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onOpenLegal('terms')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Terms
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onOpenLegal('privacy')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Privacy
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onOpenLegal('refund')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Refund & Cancellation
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onOpenLegal('compliance')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Disclaimer
                </button>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-[rgba(148,163,184,0.20)] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© 2026 AutoAudit. All rights reserved.</p>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={onToggleAdmin}
              className="hover:text-slate-300 transition-colors cursor-pointer font-mono text-[11px]"
            >
              Admin Portal
            </button>
          </div>
        </div>

      </div>
    </footer>
  );
};
