import React, { useState, useEffect } from 'react';
import { SAMPLE_REPORT_DATA } from '../data/initialData';
import { VehiclePlaceholderDisplay } from './VehiclePlaceholderDisplay';
import {
  X,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Printer,
  ArrowRight,
  Car,
  History,
  Wrench,
  ShieldAlert,
  Gauge,
} from 'lucide-react';

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
}) => {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'accidents' | 'ownership' | 'service'
  >('overview');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const data = SAMPLE_REPORT_DATA;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Sample Vehicle History Report"
    >
      <div className="bg-white w-full max-w-4xl rounded-[12px] shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Top Bar: Navy #0B132B */}
        <div className="px-6 py-4 bg-[#0B132B] text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-[8px] bg-[#2563EB] flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm sm:text-base tracking-tight">
                  Vehicle History Report
                </span>
                <span className="text-[11px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-[4px] font-mono font-semibold">
                  SAMPLE REPORT - demo data
                </span>
              </div>
              <p className="text-xs text-slate-300 font-mono">
                VIN: <span className="text-white font-semibold">{data.vin}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-[8px] transition-colors cursor-pointer"
              title="Print or save as PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-[8px] text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Close sample report modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body / Report Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {isLoading ? (
            <div className="py-14 flex flex-col items-center justify-center space-y-3">
              <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 text-[#2563EB] flex items-center justify-center shadow-xs">
                <ShieldCheck className="w-6 h-6 animate-pulse" />
              </div>
              <p className="text-sm font-semibold text-slate-800">
                Loading Sample Records...
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* Sample Notice Banner */}
              <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-[8px] text-xs text-amber-900 flex items-start gap-2.5">
                <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <strong className="font-semibold">Sample Demonstration Data:</strong> This document displays representative vehicle record formats. Real reports are generated, payment-verified, and dispatched securely via email.
                </div>
              </div>

              {/* Vehicle Profile Card */}
              <div className="bg-[#F8FAFC] border border-slate-200 rounded-[12px] p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-[#2563EB] uppercase tracking-wider block">
                      Audited Vehicle Profile
                    </span>
                    <h3 className="text-lg sm:text-xl font-bold text-slate-900">
                      {data.vehicle}
                    </h3>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600">
                      <span>{data.engine}</span>
                      <span aria-hidden="true" className="text-slate-300">·</span>
                      <span>{data.transmission}</span>
                      <span aria-hidden="true" className="text-slate-300">·</span>
                      <span>{data.drivetrain}</span>
                      <span aria-hidden="true" className="text-slate-300">·</span>
                      <span>Assembly: {data.assembly}</span>
                    </div>
                  </div>

                  <div className="text-left sm:text-right sm:border-l sm:border-slate-200 sm:pl-6 shrink-0">
                    <span className="text-xs text-slate-500 block">Verified Odometer</span>
                    <span className="text-lg font-bold text-slate-900 font-mono tabular-nums">
                      {data.estimatedMileage}
                    </span>
                    <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1 justify-start sm:justify-end">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Consistent Trend</span>
                    </span>
                  </div>
                </div>

                <div className="pt-1">
                  <VehiclePlaceholderDisplay
                    vehicleTitle={data.vehicle}
                    initialBodyStyle="sedan"
                    allowStyleSwitch={true}
                  />
                </div>
              </div>

              {/* Quick Pillar Status Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-[8px] border border-emerald-200 bg-emerald-50/60">
                  <span className="text-slate-500 block text-[11px]">Title Record</span>
                  <span className="font-semibold text-emerald-800 flex items-center gap-1 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Clean Title</span>
                  </span>
                </div>

                <div className="p-3 rounded-[8px] border border-amber-200 bg-amber-50/60">
                  <span className="text-slate-500 block text-[11px]">Accident History</span>
                  <span className="font-semibold text-amber-800 flex items-center gap-1 mt-0.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>1 Minor Record</span>
                  </span>
                </div>

                <div className="p-3 rounded-[8px] border border-emerald-200 bg-emerald-50/60">
                  <span className="text-slate-500 block text-[11px]">Salvage / Junk Brand</span>
                  <span className="font-semibold text-emerald-800 flex items-center gap-1 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>0 Flags (Passed)</span>
                  </span>
                </div>

                <div className="p-3 rounded-[8px] border border-slate-200 bg-[#F8FAFC]">
                  <span className="text-slate-500 block text-[11px]">Total Owners</span>
                  <span className="font-semibold text-slate-900 mt-0.5 block">
                    2 Previous Owners
                  </span>
                </div>
              </div>

              {/* Navigation Tabs including dedicated 'Data Sources' Tab */}
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
                  <button
                    onClick={() => setActiveTab('overview')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-[6px] transition-colors cursor-pointer flex items-center gap-1.5 ${
                      activeTab === 'overview'
                        ? 'bg-[#0F172A] text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Car className="w-3.5 h-3.5" />
                    <span>Full Specifications</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('accidents')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-[6px] transition-colors cursor-pointer flex items-center gap-1.5 ${
                      activeTab === 'accidents'
                        ? 'bg-[#0F172A] text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>Accident & Damage Record</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('ownership')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-[6px] transition-colors cursor-pointer flex items-center gap-1.5 ${
                      activeTab === 'ownership'
                        ? 'bg-[#0F172A] text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <History className="w-3.5 h-3.5" />
                    <span>Ownership Timeline</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('service')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-[6px] transition-colors cursor-pointer flex items-center gap-1.5 ${
                      activeTab === 'service'
                        ? 'bg-[#0F172A] text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Wrench className="w-3.5 h-3.5" />
                    <span>Service Logs</span>
                  </button>

                </div>

                {/* Tab 1: Overview */}
                {activeTab === 'overview' && (
                  <div key="overview" className="space-y-4">
                    <h4 className="text-sm font-bold text-slate-900">
                      Title Brand & Severe Event Audit
                    </h4>
                    <div className="border border-slate-200 rounded-[8px] divide-y divide-slate-100 text-xs">
                      <div className="p-3 flex items-center justify-between">
                        <span className="text-slate-700">Salvage, Junk or Total Loss Certificate</span>
                        <span className="font-semibold text-emerald-700 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Not Issued (Clear)
                        </span>
                      </div>
                      <div className="p-3 flex items-center justify-between">
                        <span className="text-slate-700">Flood, Hail or Fire Casualty Insurance Brand</span>
                        <span className="font-semibold text-emerald-700 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> None Found
                        </span>
                      </div>
                      <div className="p-3 flex items-center justify-between">
                        <span className="text-slate-700">Police Theft / Stolen Vehicle Record</span>
                        <span className="font-semibold text-emerald-700 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> No Stolen Record
                        </span>
                      </div>
                      <div className="p-3 flex items-center justify-between">
                        <span className="text-slate-700">Odometer Tampering / Rollback Record</span>
                        <span className="font-semibold text-emerald-700 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Verified Actual Mileage
                        </span>
                      </div>
                      <div className="p-3 flex items-center justify-between">
                        <span className="text-slate-700">Active Financial Lien / Lender Encumbrance</span>
                        <span className="font-semibold text-emerald-700 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Clean / No Outstanding Lien
                        </span>
                      </div>
                      <div className="p-3 flex items-center justify-between">
                        <span className="text-slate-700">Open Safety Recalls</span>
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
                      <h4 className="text-sm font-bold text-slate-900">
                        Documented Collision & Damage Incidents
                      </h4>
                      <span className="text-xs text-slate-500">1 Incident on File</span>
                    </div>

                    {data.accidentDetails.map((acc, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-[8px] border border-amber-200 bg-amber-50/40 space-y-3 text-xs"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-amber-200/60">
                          <span className="font-bold text-slate-900 text-sm">
                            Incident #1: {acc.severity}
                          </span>
                          <span className="text-slate-600 font-mono">
                            {acc.date} · {acc.location}
                          </span>
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

                        <div className="pt-2 text-slate-600 leading-relaxed bg-white/80 p-3 rounded-[6px] border border-amber-100">
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
                    <h4 className="text-sm font-bold text-slate-900">
                      Ownership & Registration History
                    </h4>
                    <div className="space-y-3">
                      {data.ownershipTimeline.map((item, idx) => (
                        <div
                          key={idx}
                          className="p-4 rounded-[8px] border border-slate-200 bg-white flex flex-col sm:flex-row sm:items-start justify-between gap-3 text-xs"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 text-sm">
                                Owner {idx + 1}: {item.type}
                              </span>
                              <span className="text-slate-400 font-mono">({item.period})</span>
                            </div>
                            <p className="text-slate-600">Location: <strong>{item.location}</strong></p>
                            <p className="text-slate-500 italic">{item.notes}</p>
                          </div>

                          <div className="text-left sm:text-right shrink-0">
                            <span className="text-slate-400 block">Mileage Added:</span>
                            <span className="font-semibold text-slate-800 font-mono">
                              {item.mileageAccumulated}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tab 4: Service */}
                {activeTab === 'service' && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-slate-900">
                      Dealer & Shop Service Records
                    </h4>
                    <div className="border border-slate-200 rounded-[8px] divide-y divide-slate-100 text-xs">
                      {data.serviceHistory.map((srv, idx) => (
                        <div
                          key={idx}
                          className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                        >
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

              </div>

              {/* Demo Data Disclaimer */}
              <div className="p-3 bg-slate-50 rounded-[8px] border border-slate-200 text-xs text-slate-500 text-center">
                Sample report layout. Data shown is for demonstration and is not a real vehicle record.
              </div>

            </div>
          )}
        </div>

        {/* Modal Bottom Bar: Clean Primary Blue CTA Button (#2563EB) */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-xs text-slate-600 text-center sm:text-left">
            Ready to inspect your vehicle? Instant delivery to your email after verification.
          </span>
          <button
            onClick={() => {
              onClose();
              onOrderNow();
            }}
            className="w-full sm:w-auto min-h-[44px] px-6 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] active:bg-[#1E40AF] text-white font-semibold text-sm rounded-[8px] transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]"
          >
            <span>Order Your Vehicle Report</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};
