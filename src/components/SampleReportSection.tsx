import React from 'react';
import { FileCheck, ShieldCheck, CheckCircle2, ArrowRight, Car, History, Wrench, AlertCircle } from 'lucide-react';
import { SAMPLE_REPORT_DATA } from '../data/initialData';

interface SampleReportSectionProps {
  onOpenSampleModal: () => void;
}

export const SampleReportSection: React.FC<SampleReportSectionProps> = ({
  onOpenSampleModal,
}) => {
  const data = SAMPLE_REPORT_DATA;

  return (
    <section className="py-20 bg-white border-b border-[#E2E8F0]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column */}
          <div className="lg:col-span-5 space-y-6">
            <span className="text-xs font-bold uppercase tracking-wider text-[#FB2C36] bg-red-50 px-3 py-1 rounded-full border border-red-100">
              SAMPLE REPORT
            </span>

            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-[-1.2px] leading-tight">
              See What Your Report Includes
            </h2>

            <p className="text-base text-slate-600 leading-[1.6]">
              Preview an anonymized sample report before purchasing so you can understand the type of information available.
            </p>

            <div className="space-y-3 pt-2 text-xs text-slate-700">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#059669] shrink-0" />
                <span>DMV title brand registrations across all provinces & states</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#059669] shrink-0" />
                <span>Documented collision records and structural damage assessments</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#059669] shrink-0" />
                <span>Consecutive odometer timeline tracking to uncover rollbacks</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#059669] shrink-0" />
                <span>Salvage, rebuilt, flood, and insurance total loss determinations</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={onOpenSampleModal}
                className="px-6 py-3 rounded-[8px] text-sm font-medium bg-[#FB2C36] hover:bg-[#E0242E] text-white shadow-[0_1px_2px_rgba(0,0,0,0.05)] transition-all duration-150 inline-flex items-center gap-2 cursor-pointer active:scale-95 leading-[1.43]"
              >
                <span>View Sample Report</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Right Column: Large Report Preview (Container radius = 14px) */}
          <div className="lg:col-span-7">
            <div className="bg-[#0F172A] border border-[#334155] rounded-[14px] p-5 sm:p-7 shadow-2xl text-white space-y-6">
              
              {/* Header Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#334155]">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-[#2563EB] flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-100">AutoAudit Official History Report</h4>
                    <span className="text-[11px] text-slate-400 font-mono">VIN: 1HGCM82633A004352</span>
                  </div>
                </div>

                <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
                  SAMPLE / DEMO DATA
                </span>
              </div>

              {/* Section 1: Vehicle Information (8px radius) */}
              <div className="bg-[#0B132B] rounded-[8px] p-4 border border-[#334155]/80 space-y-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  1. Vehicle Information
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500 block">Vehicle</span>
                    <span className="font-semibold text-slate-200">2020 Honda Accord</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Trim / Engine</span>
                    <span className="font-semibold text-slate-200">Touring 2.0T</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Odometer</span>
                    <span className="font-semibold text-[#10B981] font-mono">41,800 mi</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Body Class</span>
                    <span className="font-semibold text-slate-200">4-Door Sedan</span>
                  </div>
                </div>
              </div>

              {/* Section 2, 3, 4: Title History, Accident Records, Salvage Status (8px radius) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                
                {/* Title History */}
                <div className="bg-[#0B132B] rounded-[8px] p-3.5 border border-[#334155]/80 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Title History
                    </span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
                  </div>
                  <p className="font-bold text-white text-sm">Clean Title</p>
                  <p className="text-[11px] text-slate-400 leading-snug">
                    0 junk or salvage brands recorded across 50 state DMVs.
                  </p>
                </div>

                {/* Accident Records */}
                <div className="bg-[#0B132B] rounded-[8px] p-3.5 border border-[#334155]/80 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Accident Records
                    </span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
                  </div>
                  <p className="font-bold text-white text-sm">0 Accidents</p>
                  <p className="text-[11px] text-slate-400 leading-snug">
                    No insurance collision claims or airbag deployments reported.
                  </p>
                </div>

                {/* Salvage Status */}
                <div className="bg-[#0B132B] rounded-[8px] p-3.5 border border-[#334155]/80 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Salvage Status
                    </span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
                  </div>
                  <p className="font-bold text-white text-sm">Clear Status</p>
                  <p className="text-[11px] text-slate-400 leading-snug">
                    No total loss declarations from major insurance underwriters.
                  </p>
                </div>

              </div>

              {/* Section 5: Odometer Records & Timeline Graph (8px radius) */}
              <div className="bg-[#0B132B] rounded-[8px] p-4 border border-[#334155]/80 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Odometer Records & Timeline
                  </span>
                  <span className="text-[#10B981] font-mono font-semibold text-[11px]">
                    Consistent Mileage Trend
                  </span>
                </div>
                
                {/* Visual Timeline Bar */}
                <div className="h-2 w-full bg-[#1E293B] rounded-full overflow-hidden flex">
                  <div className="w-1/3 bg-[#FB2C36]" />
                  <div className="w-1/3 bg-amber-500" />
                  <div className="w-1/3 bg-[#10B981]" />
                </div>

                <div className="flex justify-between text-[11px] text-slate-400 font-mono pt-1">
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
                  className="text-xs text-[#FB2C36] hover:underline font-semibold cursor-pointer shrink-0"
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
