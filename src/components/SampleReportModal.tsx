import React, { useState } from 'react';
import { SAMPLE_REPORT_DATA } from '../data/initialData';
import { X, ShieldCheck, AlertTriangle, CheckCircle2, FileText, Printer, ArrowRight, Car, History, Wrench, ShieldAlert } from 'lucide-react';

interface SampleReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderNow: () => void;
  onDownloadReport?: (vin: string, title: string, orderNumber: string) => void;
}

export const SampleReportModal: React.FC<SampleReportModalProps> = ({
  isOpen,
  onClose,
  onOrderNow,
  onDownloadReport,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'accidents' | 'ownership' | 'service'>('overview');

  if (!isOpen) return null;

  const data = SAMPLE_REPORT_DATA;

  const handlePrint = () => {
    if (onDownloadReport) {
      onDownloadReport(data.vin, data.vehicle, 'SAMPLE-REPORT');
    } else {
      window.print();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
      <div className="bg-white w-full max-w-4xl rounded-[14px] shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Top Bar */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-[8px] bg-[#FB2C36] flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm sm:text-base">Official Vehicle History Report</span>
                <span className="text-[11px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono">
                  ANONYMIZED SAMPLE
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">VIN: {data.vin}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-[8px] transition-colors cursor-pointer leading-[1.43]"
              title="Print or save as PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-[8px] text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body / Report Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Vehicle Profile Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider">
                Audited Vehicle Profile
              </span>
              <h3 className="text-xl font-extrabold text-slate-900">{data.vehicle}</h3>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600">
                <span>{data.engine}</span>
                <span aria-hidden="true">·</span>
                <span>{data.transmission}</span>
                <span aria-hidden="true">·</span>
                <span>{data.drivetrain}</span>
                <span aria-hidden="true">·</span>
                <span>Assembly: {data.assembly}</span>
              </div>
            </div>

            <div className="text-right sm:border-l sm:border-slate-200 sm:pl-6 shrink-0">
              <span className="text-xs text-slate-500 block">Verified Odometer</span>
              <span className="text-lg font-bold text-slate-900 font-mono tabular-nums">
                {data.estimatedMileage}
              </span>
              <span className="text-[11px] text-emerald-700 font-semibold block">
                Consistent Trend
              </span>
            </div>
          </div>

          {/* Quick Pillar Status Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-lg border border-emerald-200 bg-emerald-50/60">
              <span className="text-slate-500 block">Title Record</span>
              <span className="font-bold text-emerald-800 flex items-center gap-1 mt-0.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Clean Title
              </span>
            </div>

            <div className="p-3 rounded-lg border border-amber-200 bg-amber-50/60">
              <span className="text-slate-500 block">Accident History</span>
              <span className="font-bold text-amber-800 flex items-center gap-1 mt-0.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> 1 Minor Record
              </span>
            </div>

            <div className="p-3 rounded-lg border border-emerald-200 bg-emerald-50/60">
              <span className="text-slate-500 block">Salvage / Junk Brand</span>
              <span className="font-bold text-emerald-800 flex items-center gap-1 mt-0.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> 0 Flags (Passed)
              </span>
            </div>

            <div className="p-3 rounded-lg border border-emerald-200 bg-emerald-50/60">
              <span className="text-slate-500 block">Total Owners</span>
              <span className="font-bold text-slate-900 mt-0.5 block">
                2 Previous Owners
              </span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'overview'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Car className="w-3.5 h-3.5" />
              <span>Full Specifications</span>
            </button>
            <button
              onClick={() => setActiveTab('accidents')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'accidents'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Accident & Damage Record</span>
            </button>
            <button
              onClick={() => setActiveTab('ownership')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'ownership'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Ownership Timeline</span>
            </button>
            <button
              onClick={() => setActiveTab('service')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'service'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>Service Logs</span>
            </button>
          </div>

          {/* Tab 1: Overview */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-slate-900">Title Brand & Severe Event Audit</h4>
              <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 text-xs">
                <div className="p-3 flex items-center justify-between">
                  <span className="text-slate-600">Salvage, Junk or Total Loss Certificate</span>
                  <span className="font-semibold text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Not Issued (Clear)
                  </span>
                </div>
                <div className="p-3 flex items-center justify-between">
                  <span className="text-slate-600">Flood, Hail or Fire Casualty Insurance Brand</span>
                  <span className="font-semibold text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> None Found
                  </span>
                </div>
                <div className="p-3 flex items-center justify-between">
                  <span className="text-slate-600">Police Theft / Stolen Vehicle Database</span>
                  <span className="font-semibold text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> No Stolen Record
                  </span>
                </div>
                <div className="p-3 flex items-center justify-between">
                  <span className="text-slate-600">Odometer Tampering / Rollback Record</span>
                  <span className="font-semibold text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Verified Actual Mileage
                  </span>
                </div>
                <div className="p-3 flex items-center justify-between">
                  <span className="text-slate-600">Active Financial Lien / Lender Encumbrance</span>
                  <span className="font-semibold text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Clean / No Outstanding Lien
                  </span>
                </div>
                <div className="p-3 flex items-center justify-between">
                  <span className="text-slate-600">Open Safety Recalls (NHTSA / Manufacturer)</span>
                  <span className="font-semibold text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> 0 Open Recalls
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Accidents */}
          {activeTab === 'accidents' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-900">Documented Collision & Damage Incidents</h4>
                <span className="text-xs text-slate-500">1 Incident on File</span>
              </div>

              {data.accidentDetails.map((acc, idx) => (
                <div key={idx} className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 space-y-3 text-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-amber-200/60">
                    <span className="font-bold text-slate-900 text-sm">Incident #1: {acc.severity}</span>
                    <span className="text-slate-600 font-mono">{acc.date} · {acc.location}</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-slate-700">
                    <div>
                      <span className="text-slate-500 block">Airbags Deployed:</span>
                      <span className="font-semibold text-emerald-700">{acc.airbagsDeployed}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Structural Frame:</span>
                      <span className="font-semibold text-emerald-700">{acc.structuralDamage}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Drivability:</span>
                      <span className="font-semibold text-slate-900">{acc.vehicleDrivable}</span>
                    </div>
                  </div>

                  <div className="pt-2 text-slate-600 leading-relaxed bg-white/80 p-3 rounded-lg border border-amber-100">
                    <strong className="text-slate-800">Inspector & Insurance Notes: </strong>
                    {acc.details}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tab 3: Ownership */}
          {activeTab === 'ownership' && (
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-slate-900">Ownership & Registration History</h4>
              <div className="space-y-3">
                {data.ownershipTimeline.map((item, idx) => (
                  <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-white flex flex-col sm:flex-row sm:items-start justify-between gap-3 text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">Owner {idx + 1}: {item.type}</span>
                        <span className="text-slate-400 font-mono">({item.period})</span>
                      </div>
                      <p className="text-slate-600">Location: <strong>{item.location}</strong></p>
                      <p className="text-slate-500 italic">{item.notes}</p>
                    </div>

                    <div className="text-left sm:text-right shrink-0">
                      <span className="text-slate-400 block">Mileage Added:</span>
                      <span className="font-semibold text-slate-800 font-mono">{item.mileageAccumulated}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 4: Service */}
          {activeTab === 'service' && (
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-slate-900">Dealer & Shop Service Records</h4>
              <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 text-xs">
                {data.serviceHistory.map((srv, idx) => (
                  <div key={idx} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="space-y-0.5">
                      <span className="font-medium text-slate-900">{srv.service}</span>
                      <span className="text-slate-400 block font-mono">{srv.date}</span>
                    </div>
                    <span className="font-semibold text-slate-700 font-mono tabular-nums shrink-0">
                      {srv.mileage}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Compliance & Limitation Notice (Section 13 & 17 of PDF) */}
          <div className="p-4 bg-slate-100 rounded-xl border border-slate-200 text-[11px] text-slate-600 space-y-1.5">
            <p className="font-bold text-slate-800 uppercase tracking-wider">
              Legal Disclosure & Information Scope
            </p>
            <p className="leading-relaxed">
              This report compiles information gathered from authorized state and federal databases, insurance write-off clearinghouses, and participating repair centers. AutoAudit provides online fulfillment of vehicle records and is not an in-person physical inspection service. We do not warranty undisclosed repairs performed without an insurance claim or outside registered facilities.
            </p>
          </div>

        </div>

        {/* Modal Bottom CTA */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-xs text-slate-600 text-center sm:text-left">
            Ready to check any vehicle? Reports delivered directly to your email in minutes.
          </span>
          <button
            onClick={() => {
              onClose();
              onOrderNow();
            }}
            className="w-full sm:w-auto px-5 py-2.5 bg-[#FB2C36] hover:bg-[#E0242E] text-white font-medium text-xs sm:text-sm rounded-[8px] transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-[0_1px_2px_rgba(0,0,0,0.05)] leading-[1.43]"
          >
            <span>Order Your Vehicle Report</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};
