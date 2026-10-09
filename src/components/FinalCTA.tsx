import React from 'react';
import { ArrowRight, FileCheck, ShieldCheck } from 'lucide-react';

interface FinalCTAProps {
  onStartOrder: () => void;
  onOpenSample: () => void;
  onRequestReport?: () => void;
}

export const FinalCTA: React.FC<FinalCTAProps> = ({
  onStartOrder,
  onOpenSample,
  onRequestReport,
}) => {
  return (
    <section className="py-20 bg-[#07111F] text-white relative overflow-hidden border-t border-[rgba(148,163,184,0.20)]">
      {/* Subtle emerald radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_100%,rgba(16,185,129,0.1),transparent_70%)] pointer-events-none" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 space-y-6">
        
        {/* Eyebrow */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0F1B2D] border border-[rgba(148,163,184,0.20)] text-xs font-bold text-[#10B981]">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>INDEPENDENT & VERIFIED DATA</span>
        </div>

        {/* Heading */}
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-[-1.2px] text-white max-w-3xl mx-auto text-balance">
          Know More Before You Buy
        </h2>

        {/* Supporting Copy */}
        <p className="text-base sm:text-lg text-[#CBD5E1] max-w-2xl mx-auto leading-[1.6]">
          Check the available vehicle history information and make your next vehicle decision with greater confidence.
        </p>

        {/* Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-3">
          <button
            type="button"
            onClick={onStartOrder}
            className="px-6 sm:px-8 py-3.5 rounded-[8px] text-sm font-semibold bg-[#2563EB] hover:bg-[#1D4ED8] text-white shadow-[0_1px_2px_rgba(0,0,0,0.1)] transition-all duration-150 flex items-center gap-2 cursor-pointer active:scale-95 leading-[1.43]"
          >
            <span>Get Your Report</span>
            <ArrowRight className="w-4 h-4 text-[#10B981]" />
          </button>

          <button
            type="button"
            onClick={onOpenSample}
            className="px-6 sm:px-8 py-3.5 rounded-[8px] text-sm font-medium bg-[#0F1B2D] hover:bg-[#162740] text-[#CBD5E1] border border-[rgba(148,163,184,0.20)] transition-colors flex items-center gap-2 cursor-pointer leading-[1.43]"
          >
            <FileCheck className="w-4 h-4 text-[#10B981]" />
            <span>View Sample Report</span>
          </button>

          {onRequestReport && (
            <button
              type="button"
              onClick={onRequestReport}
              className="px-6 sm:px-8 py-3.5 rounded-[8px] text-sm font-semibold bg-[#059669]/20 hover:bg-[#059669]/30 text-[#10B981] border border-[#059669]/40 transition-colors flex items-center gap-2 cursor-pointer leading-[1.43]"
            >
              <span>Request Vehicle Report Form</span>
            </button>
          )}
        </div>

        {/* Subtle trust badge underneath */}
        <p className="text-xs text-[#CBD5E1] pt-2">
          Secure 256-bit checkout · Standard or priority turnaround · Direct email PDF delivery
        </p>

      </div>
    </section>
  );
};
