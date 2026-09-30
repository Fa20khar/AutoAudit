import React, { useState, useEffect, useRef } from 'react';
import { GearboxLoader } from './GearLoader';
import { X, CheckCircle2, Download, FileText, ArrowRight, Printer, RefreshCw } from 'lucide-react';
import { useToast } from '../context/ToastContext';

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

  const handleDownloadPdf = () => {
    showToast({
      type: 'success',
      title: 'Report Download Started',
      message: `Downloading official record for VIN: ${vin}. Check your browser print/save dialog.`,
      duration: 4500,
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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
      <div className="bg-slate-900 border border-slate-700/80 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col text-white animate-fade-in">
        
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
                <div className="absolute inset-0 bg-slate-900/85 backdrop-blur-xs rounded-md flex flex-col items-center justify-center transition-all duration-300">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mb-2">
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
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3.5 text-xs text-left space-y-1.5 shadow-inner">
            <div className="flex justify-between items-center text-slate-400 text-[11px]">
              <span className="font-mono">Order: {orderNumber}</span>
              <span className="font-mono px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                NMVTIS VERIFIED
              </span>
            </div>
            <p className="font-bold text-white text-sm truncate">{vehicleTitle}</p>
            <p className="font-mono text-[11px] text-slate-300">VIN: {vin}</p>
          </div>

          {/* Status Text & Step Details */}
          <div className="space-y-1.5">
            <p className="text-sm font-semibold text-slate-200 min-h-[22px] transition-all duration-200">
              {statusMessage}
            </p>
            <p className="text-xs text-slate-400">
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
              /* SUCCESS STATE: Action buttons once generation finishes */
              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-[0.99]"
                >
                  <Download className="w-4 h-4" />
                  <span>Download / Print Official PDF</span>
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleRegenerate}
                    className="flex-1 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer border border-slate-700"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Re-run Generation</span>
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs rounded-xl transition-colors cursor-pointer border border-slate-700"
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
    </div>
  );
};
