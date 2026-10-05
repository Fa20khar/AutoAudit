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
    <section className="py-20 bg-[#0B132B] text-white relative overflow-hidden border-t border-[#1E293B]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 space-y-6">
        
        {/* Eyebrow */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0F172A] border border-[#334155] text-xs font-bold text-emerald-400">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>INDEPENDENT & VERIFIED DATA</span>
        </div>

        {/* Heading with -1.2px tracking */}
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-[-1.2px] text-white max-w-3xl mx-auto text-balance">
          Know More Before You Buy
        </h2>

        {/* Supporting Copy */}
        <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-[1.6]">
          Check the available vehicle history information and make your next vehicle decision with greater confidence.
        </p>

        {/* Buttons (8px button radius per Acme.ai) */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-3">
          <button
            type="button"
            onClick={onStartOrder}
            className="px-6 sm:px-8 py-3.5 rounded-[8px] text-sm font-medium bg-[#FB2C36] hover:bg-[#E0242E] text-white shadow-[0_1px_2px_rgba(0,0,0,0.05)] transition-all duration-150 flex items-center gap-2 cursor-pointer active:scale-95 leading-[1.43]"
          >
            <span>Get Your Report</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onOpenSample}
            className="px-6 py-3.5 rounded-[8px] text-sm font-medium bg-[#0F172A] hover:bg-[#1E293B] text-slate-200 border border-[#334155] transition-colors flex items-center gap-2 cursor-pointer leading-[1.43]"
          >
            <FileCheck className="w-4 h-4 text-emerald-400" />
            <span>View Sample Report</span>
          </button>

          {onRequestReport && (
            <button
              type="button"
              onClick={onRequestReport}
              className="px-6 py-3.5 rounded-[8px] text-sm font-semibold bg-blue-950/60 hover:bg-blue-900/80 text-blue-300 border border-blue-800 transition-colors flex items-center gap-2 cursor-pointer leading-[1.43]"
            >
              <span>Request Vehicle Report Form</span>
            </button>
          )}
        </div>

        {/* Subtle trust badge underneath */}
        <p className="text-xs text-slate-400 pt-2">
          Secure 256-bit checkout · Standard or priority turnaround · Direct email PDF delivery
        </p>

      </div>
    </section>
  );
};
