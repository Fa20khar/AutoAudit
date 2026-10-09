import React from 'react';
import { ShieldCheck, CheckCircle2, ArrowRight } from 'lucide-react';
import { SAMPLE_REPORT_DATA } from '../data/initialData';

interface SampleReportSectionProps {
  onOpenSampleModal: () => void;
}

export const SampleReportSection: React.FC<SampleReportSectionProps> = ({
  onOpenSampleModal,
}) => {
  return (
    <section className="py-20 bg-[#07111F] text-white border-b border-[rgba(148,163,184,0.20)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column */}
          <div className="lg:col-span-5 space-y-6">
            <span className="text-xs font-bold uppercase tracking-wider text-[#10B981] bg-[#059669]/20 px-3 py-1 rounded-full border border-[#059669]/40">
              SAMPLE REPORT
            </span>

            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-[-1.2px] leading-tight">
              See What Your Report Includes
            </h2>

            <p className="text-base text-[#CBD5E1] leading-[1.6]">
              Preview an anonymized sample report before purchasing so you can understand the comprehensive history records available.
            </p>

            <div className="space-y-3 pt-2 text-xs text-[#CBD5E1]">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0" />
                <span>DMV title brand registrations across all provinces & states</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0" />
                <span>Documented collision records and structural damage assessments</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0" />
                <span>Consecutive odometer timeline tracking to uncover rollbacks</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0" />
                <span>Salvage, rebuilt, flood, and insurance total loss determinations</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={onOpenSampleModal}
                className="px-6 py-3 rounded-[8px] text-sm font-semibold bg-[#2563EB] hover:bg-[#1D4ED8] text-white shadow-[0_1px_2px_rgba(0,0,0,0.1)] transition-all duration-150 inline-flex items-center gap-2 cursor-pointer active:scale-95 leading-[1.43]"
              >
                <span>View Sample Report</span>
                <ArrowRight className="w-4 h-4 text-[#10B981]" />
              </button>
            </div>
          </div>

          {/* Right Column: Large Report Preview */}
          <div className="lg:col-span-7">
            <div className="bg-[#0F1B2D] border border-[rgba(148,163,184,0.20)] rounded-[14px] p-5 sm:p-7 shadow-2xl text-white space-y-6">
              
              {/* Header Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[rgba(148,163,184,0.20)]">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-[#2563EB] flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-100">AutoAudit Official History Report</h4>
                    <span className="text-[11px] text-[#CBD5E1] font-mono">VIN: 1HGCM82633A004352</span>
                  </div>
                </div>

                <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
                  SAMPLE / DEMO DATA
                </span>
              </div>

              {/* Section 1: Vehicle Information */}
              <div className="bg-[#0B132B] rounded-[8px] p-4 border border-[rgba(148,163,184,0.20)] space-y-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  1. Vehicle Information
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block">Vehicle</span>
                    <span className="font-semibold text-slate-100">2020 Honda Accord</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Trim / Engine</span>
                    <span className="font-semibold text-slate-100">Touring 2.0T</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Odometer</span>
                    <span className="font-semibold text-[#10B981] font-mono">41,800 mi</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Body Class</span>
                    <span className="font-semibold text-slate-100">4-Door Sedan</span>
                  </div>
                </div>
              </div>

              {/* Section 2, 3, 4: Title History, Accident Records, Salvage Status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                
                {/* Title History */}
                <div className="bg-[#0B132B] rounded-[8px] p-3.5 border border-[rgba(148,163,184,0.20)] space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Title History
                    </span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
                  </div>
                  <p className="font-bold text-white text-sm">Clean Title</p>
                  <p className="text-[11px] text-[#CBD5E1] leading-snug">
                    0 junk or salvage brands recorded across 50 state DMVs.
                  </p>
                </div>

                {/* Accident Records */}
                <div className="bg-[#0B132B] rounded-[8px] p-3.5 border border-[rgba(148,163,184,0.20)] space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Accident Records
                    </span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
                  </div>
                  <p className="font-bold text-white text-sm">0 Accidents</p>
                  <p className="text-[11px] text-[#CBD5E1] leading-snug">
                    No insurance collision claims or airbag deployments reported.
                  </p>
                </div>

                {/* Salvage Status */}
                <div className="bg-[#0B132B] rounded-[8px] p-3.5 border border-[rgba(148,163,184,0.20)] space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Salvage Status
                    </span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
                  </div>
                  <p className="font-bold text-white text-sm">Clear Status</p>
                  <p className="text-[11px] text-[#CBD5E1] leading-snug">
                    No total loss declarations from major insurance underwriters.
                  </p>
                </div>

              </div>

              {/* Section 5: Odometer Records & Timeline Graph */}
              <div className="bg-[#0B132B] rounded-[8px] p-4 border border-[rgba(148,163,184,0.20)] space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Odometer Records & Timeline
                  </span>
                  <span className="text-[#10B981] font-mono font-semibold text-[11px]">
                    Consistent Mileage Trend
                  </span>
                </div>
                
                {/* Visual Timeline Bar */}
                <div className="h-2 w-full bg-[#07111F] rounded-full overflow-hidden flex border border-[rgba(148,163,184,0.15)]">
                  <div className="w-1/3 bg-[#2563EB]" />
                  <div className="w-1/3 bg-emerald-600" />
                  <div className="w-1/3 bg-[#10B981]" />
                </div>

                <div className="flex justify-between text-[11px] text-[#CBD5E1] font-mono pt-1">
                  <span>2020: 12 mi (Delivery)</span>
                  <span>2022: 18,400 mi (Service)</span>
                  <span>2024: 41,800 mi (Inspection)</span>
                </div>
              </div>

              {/* Section 6: Report Summary Notice */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-slate-400">
                  Data compiled from NMVTIS, state DMVs, insurance carriers, and auction registries.
                </span>
                <button
                  type="button"
                  onClick={onOpenSampleModal}
                  className="text-xs text-[#10B981] hover:underline font-semibold cursor-pointer shrink-0"
                >
                  Inspect Full Sample →
                </button>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
