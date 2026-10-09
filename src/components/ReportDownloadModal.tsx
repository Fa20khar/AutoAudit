import React, { useState, useEffect, useRef } from 'react';
import { GearboxLoader } from './GearLoader';
import { X, CheckCircle2, Download, FileText, ArrowRight, Printer, RefreshCw, ShieldCheck, MessageCircle, Lock } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { downloadReportPdfBlob } from '../utils/pdfGenerator';

interface ReportDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicleTitle?: string;
  vin?: string;
  orderNumber?: string;
  onComplete?: () => void;
}

export const ReportDownloadModal: React.FC<ReportDownloadModalProps> = ({
  isOpen,
  onClose,
  vehicleTitle = '2021 Audi A4 45 TFSI quattro',
  vin = 'WAUZZZF45LA019283',
  orderNumber = 'AA-10025',
  onComplete,
}) => {
  const { showToast } = useToast();
  const [percent, setPercent] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState<string>('Connecting to NMVTIS & DMV Registries...');
  const [isGenerating, setIsGenerating] = useState<boolean>(true);
  const [isDone, setIsDone] = useState<boolean>(false);

  const hasNotifiedStart = useRef<boolean>(false);
  const hasNotifiedComplete = useRef<boolean>(false);

  useEffect(() => {
    if (!isOpen) {
      setPercent(0);
      setIsGenerating(true);
      setIsDone(false);
      setStatusMessage('Connecting to NMVTIS & DMV Registries...');
      hasNotifiedStart.current = false;
      hasNotifiedComplete.current = false;
      return;
    }

    setPercent(0);
    setIsGenerating(true);
    setIsDone(false);

    // Notify user that report download / generation has started
    if (!hasNotifiedStart.current) {
      hasNotifiedStart.current = true;
      showToast({
        type: 'info',
        title: 'Report Generation Started',
        message: `Compiling vehicle history & title records for ${vehicleTitle}...`,
        duration: 4000,
      });
    }

    // Smooth incremental progress simulation
    const interval = setInterval(() => {
      setPercent((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsGenerating(false);
          setIsDone(true);
          
          if (!hasNotifiedComplete.current) {
            hasNotifiedComplete.current = true;
            showToast({
              type: 'success',
              title: 'Report Generation Complete',
              message: `Official PDF report for ${vehicleTitle} is ready to view and download.`,
              duration: 5000,
            });
          }

          if (onComplete) onComplete();
          return 100;
        }

        const next = Math.min(100, prev + Math.floor(Math.random() * 8) + 4);

        if (next < 30) {
          setStatusMessage('Connecting to NMVTIS & DMV Registries...');
        } else if (next < 60) {
          setStatusMessage('Cross-referencing Title Brands & Collision Records...');
        } else if (next < 85) {
          setStatusMessage('Verifying Odometer Readings & Auction Archive...');
        } else if (next < 100) {
          setStatusMessage('Compiling Encrypted PDF Document & Security Seals...');
        } else {
          setStatusMessage('Official Vehicle History Report Ready!');
        }

        return next;
      });
    }, 140);

    return () => clearInterval(interval);
  }, [isOpen, onComplete, showToast, vehicleTitle]);

  if (!isOpen) return null;

  // Browser print-to-PDF flow specifically formatted for our existing print-friendly CSS rules
  const handleDownloadAsPdf = () => {
    const originalTitle = document.title;
    const sanitizedVin = (vin || 'RECORD').replace(/[^a-zA-Z0-9]/g, '_');
    const sanitizedOrder = (orderNumber || 'AA').replace(/[^a-zA-Z0-9]/g, '_');
    const pdfFilename = `AutoAudit_Report_${sanitizedVin}_${sanitizedOrder}`;

    // Temporarily set document.title so browsers default to this filename for "Save as PDF"
    document.title = pdfFilename;

    showToast({
      type: 'info',
      title: 'Download as PDF Initialized',
      message: 'In the print dialog, select "Save as PDF" as the Destination to download your official report.',
      duration: 5000,
    });

    setTimeout(() => {
      window.print();

      const restoreTitle = () => {
        document.title = originalTitle;
        window.removeEventListener('afterprint', restoreTitle);
      };
      window.addEventListener('afterprint', restoreTitle);
      setTimeout(restoreTitle, 2000);
    }, 120);
  };

  const handleDownloadPdf = () => {
    try {
      const parts = (vehicleTitle || '').trim().split(' ');
      const year = parts[0] || '2021';
      const make = parts[1] || 'Vehicle';
      const model = parts.slice(2).join(' ') || 'Record';

      const fileName = downloadReportPdfBlob({
        orderNumber: orderNumber || 'AA-10025',
        vehicle: {
          vinOrReg: vin,
          year,
          make,
          model,
        },
        serviceName: 'Comprehensive Vehicle History Report',
      });

      showToast({
        type: 'success',
        title: 'Certified PDF Downloaded',
        message: `Saved official report: ${fileName}`,
        duration: 4500,
      });
    } catch {
      handleDownloadAsPdf();
    }
  };

  const handlePrintReport = () => {
    showToast({
      type: 'info',
      title: 'Preparing Print Preview',
      message: `Formatting official paper report for VIN: ${vin}. Check your printer settings.`,
      duration: 3500,
    });
    window.print();
  };

  const handleRegenerate = () => {
    setPercent(0);
    setIsGenerating(true);
    setIsDone(false);
    setStatusMessage('Connecting to NMVTIS & DMV Registries...');
    hasNotifiedComplete.current = false;

    showToast({
      type: 'info',
      title: 'Re-compiling Report',
      message: 'Re-querying authorized database clearinghouses...',
      duration: 3500,
    });

    const interval = setInterval(() => {
      setPercent((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsGenerating(false);
          setIsDone(true);
          
          if (!hasNotifiedComplete.current) {
            hasNotifiedComplete.current = true;
            showToast({
              type: 'success',
              title: 'Report Re-compiled',
              message: `Report for ${vehicleTitle} refreshed with active timestamp.`,
              duration: 4500,
            });
          }
          return 100;
        }
        const next = Math.min(100, prev + Math.floor(Math.random() * 10) + 5);
        if (next < 30) setStatusMessage('Connecting to NMVTIS & DMV Registries...');
        else if (next < 60) setStatusMessage('Cross-referencing Title Brands & Collision Records...');
        else if (next < 85) setStatusMessage('Verifying Odometer Readings & Auction Archive...');
        else if (next < 100) setStatusMessage('Compiling Encrypted PDF Document & Security Seals...');
        else setStatusMessage('Official Vehicle History Report Ready!');
        return next;
      });
    }, 130);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 print-modal-container">
      <div className="bg-slate-900 border border-slate-700/80 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col text-white animate-fade-in print-modal-card">
        
        {/* Top Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${isGenerating ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'}`} />
            <h4 className="text-sm font-bold tracking-tight text-white font-mono uppercase">
              {isGenerating ? 'Compiling Vehicle History' : 'Report Ready for Download'}
            </h4>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Center Body */}
        <div className="p-6 text-center space-y-6">
          
          {/* Uiverse Gearbox Loader Animation during loading/generating state */}
          <div className="py-2 flex flex-col items-center justify-center">
            <div className="relative">
              <GearboxLoader />
              {isDone && (
                <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-xs rounded-md flex flex-col items-center justify-center transition-all duration-300 report-ready-transition">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mb-2 report-checkmark-pop">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <span className="text-xs font-bold text-emerald-400 tracking-wider font-mono">
                    100% COMPLETE
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Vehicle summary banner */}
          <div className={`bg-slate-800/80 border border-slate-700/80 rounded-xl p-3.5 text-xs text-left space-y-1.5 shadow-inner transition-all duration-300 ${isDone ? 'border-emerald-500/30 bg-slate-800/95 report-ready-transition' : ''}`}>
            <div className="flex justify-between items-center text-slate-400 text-[11px]">
              <span className="font-mono">Order: {orderNumber}</span>
              <span className={`font-mono px-2 py-0.5 rounded text-[10px] font-bold transition-all duration-300 ${isDone ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'}`}>
                {isDone ? 'RECORDS READY' : 'NMVTIS VERIFIED'}
              </span>
            </div>
            <p className="font-bold text-white text-sm truncate">{vehicleTitle}</p>
            <p className="font-mono text-[11px] text-slate-300">VIN: {vin}</p>
          </div>

          {/* Status Text & Step Details */}
          <div className="space-y-1.5">
            <p className={`text-sm font-semibold text-slate-200 min-h-[22px] transition-all duration-300 ${isDone ? 'text-emerald-300 report-ready-transition' : ''}`}>
              {statusMessage}
            </p>
            <p className="text-xs text-slate-400 transition-opacity duration-300">
              {isGenerating
                ? 'Official records are being retrieved and formatted into a tamper-evident PDF.'
                : 'All ownership history, title records, and damage logs compiled successfully.'}
            </p>
          </div>

          {/* Action Area: Progress State replacing static button during generation */}
          <div className="pt-2 space-y-3">
            {isGenerating ? (
              /* PROGRESS STATE BUTTON: Active dynamic progress container while generating */
              <div
                className="relative w-full h-12 bg-slate-800 border border-blue-500/40 rounded-xl overflow-hidden shadow-inner flex items-center justify-between px-4 select-none"
                role="progressbar"
                aria-valuenow={percent}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                {/* Animated fill bar */}
                <div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-600 transition-all duration-200 ease-out"
                  style={{ width: `${percent}%` }}
                />

                {/* Subtle animated striped overlay on progress fill */}
                <div
                  className="absolute inset-0 opacity-20 bg-[linear-gradient(45deg,rgba(255,255,255,0.15)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.15)_50%,rgba(255,255,255,0.15)_75%,transparent_75%,transparent)] bg-[size:24px_24px] pointer-events-none"
                />

                {/* Progress State Label & Counter */}
                <div className="relative z-10 flex items-center gap-2 text-white font-medium text-xs sm:text-sm">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  <span>Generating Report...</span>
                </div>

                <div className="relative z-10 font-mono font-bold text-xs sm:text-sm text-white tabular-nums">
                  {percent}%
                </div>
              </div>
            ) : (
              /* SUCCESS STATE: Action buttons once generation finishes with subtle CSS transitions */
              <div className="space-y-3 report-ready-transition report-ready-glow">
                {/* Primary Button: Instant Certified PDF File (.pdf) */}
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm rounded-xl transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-[0.99] report-stagger-1 group"
                >
                  <Download className="w-4 h-4 transition-transform group-hover:-translate-y-0.5" />
                  <span>Download Certified PDF (Admin Only)</span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-800 text-emerald-100 border border-emerald-400/30">
                    Admin Dispatch
                  </span>
                </button>

                {/* Admin Fulfillment & Payment Protection Policy Banner */}
                <div className="p-3 bg-blue-950/70 border border-blue-500/40 rounded-xl text-left text-xs space-y-1.5 shadow-inner">
                  <div className="flex items-center gap-1.5 font-bold text-blue-300 text-[11px]">
                    <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0" />
                    <span>Admin Fulfillment & Payment Protection Notice</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Client self-downloads on the public website are disabled to prevent customers taking reports without paying. Download this certified PDF and dispatch it directly to the customer via WhatsApp or Email once you have verified their payment.
                  </p>
                </div>

                {/* WhatsApp Payment & Delivery Link */}
                <a
                  href={`https://wa.me/923420617217?text=${encodeURIComponent(
                    `Hi, AutoAudit Administration here regarding order #${orderNumber} for ${vehicleTitle} (VIN: ${vin}). Your official report has been verified. Please confirm payment so we can dispatch your certified PDF document.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-4 bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Message Customer on WhatsApp (Payment & Report)</span>
                </a>

                {/* Print-to-PDF browser guidance tip */}
                <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3 text-left flex items-start gap-2.5 text-xs text-slate-300">
                  <Printer className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <p className="font-semibold text-white">Direct Download or Print:</p>
                    <p className="text-[11px] text-slate-400 leading-normal">
                      Click the green button above for an instant <strong className="text-slate-200">.pdf</strong> download, or use Print-to-PDF below to format with your local print destination.
                    </p>
                  </div>
                </div>

                {/* Secondary Actions Row */}
                <div className="grid grid-cols-2 gap-2 report-stagger-2">
                  {/* Print to PDF */}
                  <button
                    type="button"
                    onClick={handleDownloadAsPdf}
                    className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-slate-700"
                  >
                    <Download className="w-3.5 h-3.5 text-blue-400" />
                    <span>Print to PDF</span>
                  </button>

                  {/* Paper Print */}
                  <button
                    type="button"
                    onClick={handlePrintReport}
                    className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-slate-700"
                  >
                    <Printer className="w-3.5 h-3.5 text-amber-400" />
                    <span>Paper Print</span>
                  </button>
                </div>

                {/* Footer Controls: Re-run & Close */}
                <div className="flex gap-2 report-stagger-3 pt-1">
                  <button
                    type="button"
                    onClick={handleRegenerate}
                    className="flex-1 py-2 px-3 bg-slate-800/60 hover:bg-slate-700/80 text-slate-400 hover:text-slate-200 font-medium text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer border border-slate-800"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Re-run Generation</span>
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 py-2 px-3 bg-slate-800/60 hover:bg-slate-700/80 text-slate-400 hover:text-slate-200 font-medium text-xs rounded-xl transition-colors cursor-pointer border border-slate-800"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}

            <div className="text-[11px] text-slate-500 font-mono flex items-center justify-center gap-2">
              <span>Encrypted SHA-256 PDF</span>
              <span aria-hidden="true">·</span>
              <span>Watermarked Verification Seal</span>
            </div>
          </div>

        </div>

      </div>

      {/* Printable Vehicle History Report (Paper Copy Target for @media print) */}
      <div id="printable-vehicle-report" className="hidden print:block text-slate-900 font-sans p-2">
        {/* Subtle diagonal watermark (visible only when printed) */}
        <div className="print-watermark" aria-hidden="true">
          OFFICIAL AUTOAUDIT REPORT
        </div>

        {/* Document Header */}
        <div className="border-b-2 border-slate-900 pb-4 mb-4 flex items-start justify-between print-header">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xl tracking-tight text-slate-900">AutoAudit™</span>
              <span className="text-[10px] font-mono uppercase bg-slate-100 border border-slate-300 px-2 py-0.5 rounded font-bold">
                Official Vehicle History Record
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-1">
              NMVTIS National Motor Vehicle Title Information System · Certified Database Clearinghouse
            </p>
          </div>
          <div className="text-right print-header-badge">
            <span className="inline-block bg-emerald-50 border border-emerald-300 text-emerald-800 font-bold text-xs px-2.5 py-1 rounded">
              ✓ CLEAN TITLE CERTIFIED
            </span>
            <p className="text-[10px] text-slate-500 font-mono mt-1">
              Order Ref: {orderNumber}
            </p>
          </div>
        </div>

        {/* Vehicle Metadata Summary */}
        <div className="bg-slate-50 border border-slate-200 rounded p-3 mb-4 print-avoid-break print-meta-box">
          <div className="grid grid-cols-3 gap-3 text-xs print-meta-grid">
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-semibold">Vehicle Specification</span>
              <span className="font-bold text-slate-900 text-sm print-meta-val">{vehicleTitle}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-semibold">Vehicle Identification (VIN)</span>
              <span className="font-mono font-bold text-blue-700 text-sm print-meta-vin">{vin}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-semibold">Audit Generated</span>
              <span className="font-mono text-slate-700 print-meta-date">{new Date().toLocaleDateString()} {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>
        </div>

        {/* Key Findings 4-Card Summary */}
        <div className="grid grid-cols-4 gap-2.5 mb-4 print-avoid-break print-findings-grid">
          <div className="border border-slate-200 p-2.5 rounded bg-emerald-50/50 print-finding-card">
            <span className="text-[10px] uppercase font-bold text-slate-600 block">Title Brands</span>
            <span className="font-bold text-emerald-700 text-xs mt-1 block">0 Brands Reported</span>
            <span className="text-[9px] text-slate-500">No salvage, junk, flood</span>
          </div>
          <div className="border border-slate-200 p-2.5 rounded bg-emerald-50/50 print-finding-card">
            <span className="text-[10px] uppercase font-bold text-slate-600 block">Accident History</span>
            <span className="font-bold text-emerald-700 text-xs mt-1 block">0 Severe Accidents</span>
            <span className="text-[9px] text-slate-500">Airbags intact, no frame loss</span>
          </div>
          <div className="border border-slate-200 p-2.5 rounded bg-emerald-50/50 print-finding-card">
            <span className="text-[10px] uppercase font-bold text-slate-600 block">Odometer Integrity</span>
            <span className="font-bold text-emerald-700 text-xs mt-1 block">Actual Mileage Verified</span>
            <span className="text-[9px] text-slate-500">No rollback discrepancies</span>
          </div>
          <div className="border border-slate-200 p-2.5 rounded bg-emerald-50/50 print-finding-card">
            <span className="text-[10px] uppercase font-bold text-slate-600 block">Safety Recalls</span>
            <span className="font-bold text-emerald-700 text-xs mt-1 block">0 Open NHTSA Recalls</span>
            <span className="text-[9px] text-slate-500">Compliant with federal safety</span>
          </div>
        </div>

        {/* Detailed Brand Checks */}
        <div className="space-y-4 text-xs">
          <div className="print-avoid-break">
            <div className="font-bold text-slate-900 border-b border-slate-300 pb-1 mb-2 flex items-center justify-between print-section-header">
              <span>1. State Title Brand Clearinghouse (All 50 US States + Federal Registries)</span>
              <span className="text-[10px] text-emerald-700 font-semibold font-mono">STATUS: PASSED</span>
            </div>
            <table className="w-full text-left border-collapse text-[10px] print-table">
              <thead>
                <tr className="bg-slate-100 text-slate-700">
                  <th className="p-1.5 border border-slate-200">Record Verification</th>
                  <th className="p-1.5 border border-slate-200">Reporting Clearinghouse</th>
                  <th className="p-1.5 border border-slate-200">Result</th>
                  <th className="p-1.5 border border-slate-200">Finding Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <td className="p-1.5 border border-slate-200 font-semibold">Salvage / Total Loss</td>
                  <td className="p-1.5 border border-slate-200">Insurance Clearinghouses & Auto Auctions</td>
                  <td className="p-1.5 border border-slate-200 text-emerald-700 font-bold">Clear</td>
                  <td className="p-1.5 border border-slate-200 text-slate-600">No total loss claims or salvage auction transfers reported</td>
                </tr>
                <tr>
                  <td className="p-1.5 border border-slate-200 font-semibold">Flood / Hail / Water Damage</td>
                  <td className="p-1.5 border border-slate-200">FEMA Emergency Registries & State DMVs</td>
                  <td className="p-1.5 border border-slate-200 text-emerald-700 font-bold">Clear</td>
                  <td className="p-1.5 border border-slate-200 text-slate-600">No flood title brands or hurricane storm damage flags found</td>
                </tr>
                <tr>
                  <td className="p-1.5 border border-slate-200 font-semibold">Junk / Dismantler Record</td>
                  <td className="p-1.5 border border-slate-200">NMVTIS National Motor Clearinghouse</td>
                  <td className="p-1.5 border border-slate-200 text-emerald-700 font-bold">Clear</td>
                  <td className="p-1.5 border border-slate-200 text-slate-600">Vehicle was never scrapped, crushed, or parted out</td>
                </tr>
                <tr>
                  <td className="p-1.5 border border-slate-200 font-semibold">Stolen Vehicle Database</td>
                  <td className="p-1.5 border border-slate-200">NICB & Federal Law Enforcement</td>
                  <td className="p-1.5 border border-slate-200 text-emerald-700 font-bold">Clear</td>
                  <td className="p-1.5 border border-slate-200 text-slate-600">No active police theft records or stolen vehicle reports</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Section 2: Certified Odometer Timeline */}
          <div className="print-avoid-break">
            <div className="font-bold text-slate-900 border-b border-slate-300 pb-1 mb-2 flex items-center justify-between print-section-header">
              <span>2. Odometer Readings & Annual Mileage Timeline</span>
              <span className="text-[10px] text-emerald-700 font-semibold font-mono">INTEGRITY: CERTIFIED</span>
            </div>
            <p className="text-[10px] text-slate-600 mb-2 print-section-desc">
              Cross-checked across state registration renewals, annual safety inspection centers, and authorized dealership services. Certified steady mileage accumulation without reverse rollback indicators.
            </p>
            <table className="w-full text-left border-collapse text-[10px] print-table">
              <thead>
                <tr className="bg-slate-100 text-slate-700">
                  <th className="p-1.5 border border-slate-200">Reading Date</th>
                  <th className="p-1.5 border border-slate-200">Recorded Mileage</th>
                  <th className="p-1.5 border border-slate-200">Reporting Facility</th>
                  <th className="p-1.5 border border-slate-200">Source Category</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <td className="p-1.5 border border-slate-200 font-mono">11/14/2021</td>
                  <td className="p-1.5 border border-slate-200 font-bold">12 mi</td>
                  <td className="p-1.5 border border-slate-200">Authorized Dealership Network</td>
                  <td className="p-1.5 border border-slate-200">Pre-Delivery Inspection</td>
                </tr>
                <tr>
                  <td className="p-1.5 border border-slate-200 font-mono">10/05/2023</td>
                  <td className="p-1.5 border border-slate-200 font-bold">18,420 mi</td>
                  <td className="p-1.5 border border-slate-200">State DMV Registration Bureau</td>
                  <td className="p-1.5 border border-slate-200">Annual Registration Renewal</td>
                </tr>
                <tr>
                  <td className="p-1.5 border border-slate-200 font-mono">08/19/2025</td>
                  <td className="p-1.5 border border-slate-200 font-bold">36,810 mi</td>
                  <td className="p-1.5 border border-slate-200">Certified Vehicle Service Center</td>
                  <td className="p-1.5 border border-slate-200">Scheduled 35k Mile Service</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Document Legal Footnote */}
          <div className="pt-3 border-t border-slate-300 text-[9px] text-slate-500 flex items-center justify-between print-avoid-break print-footer-note">
            <div>
              <p>Official Vehicle History Document generated for VIN: <strong>{vin}</strong> by AutoAudit Technologies Inc.</p>
              <p>Provided in accordance with the Federal Anti-Car Theft Act and NMVTIS public access mandates.</p>
            </div>
            <div className="text-right font-mono">
              <span className="text-slate-400">SECURITY DIGEST:</span><br />
              <span className="text-slate-800 font-bold">AA-CERT-{orderNumber}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
