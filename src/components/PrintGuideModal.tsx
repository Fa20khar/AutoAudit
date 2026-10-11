import React, { useState } from 'react';
import { 
  X, 
  Printer, 
  Download, 
  CheckCircle2, 
  Laptop, 
  Smartphone, 
  HelpCircle, 
  Sparkles, 
  ExternalLink,
  ChevronRight,
  FileText
} from 'lucide-react';

interface PrintGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSample?: () => void;
}

export const PrintGuideModal: React.FC<PrintGuideModalProps> = ({
  isOpen,
  onClose,
  onOpenSample,
}) => {
  const [activeOs, setActiveOs] = useState<'desktop' | 'mobile'>('desktop');

  if (!isOpen) return null;

  const handleTriggerPrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="bg-[#0B132B] border border-[rgba(148,163,184,0.25)] text-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="px-6 py-5 bg-[#07111F] border-b border-[rgba(148,163,184,0.20)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-[#10B981] flex items-center justify-center shadow-xs">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base sm:text-lg text-white">
                  Print to PDF Guide
                </h3>
                <span className="text-[10px] bg-emerald-950 border border-emerald-500/30 text-[#10B981] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  No Software Needed
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Export and archive any AutoAudit vehicle report using your browser's built-in tools.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection: Desktop vs Mobile */}
        <div className="px-6 pt-3 bg-[#0F1B2D] border-b border-[rgba(148,163,184,0.15)] flex gap-3 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveOs('desktop')}
            className={`pb-3 px-3.5 border-b-2 flex items-center gap-2 cursor-pointer transition-colors ${
              activeOs === 'desktop'
                ? 'border-[#10B981] text-[#10B981]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Laptop className="w-4 h-4" />
            <span>Desktop (Chrome, Edge, Safari, Firefox)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveOs('mobile')}
            className={`pb-3 px-3.5 border-b-2 flex items-center gap-2 cursor-pointer transition-colors ${
              activeOs === 'mobile'
                ? 'border-[#10B981] text-[#10B981]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>Mobile (iOS Safari & Android Chrome)</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 space-y-5 overflow-y-auto text-xs sm:text-sm text-slate-300 leading-relaxed">
          
          {/* Quick Notice */}
          <div className="p-3.5 rounded-xl bg-blue-950/40 border border-blue-500/30 flex items-start gap-3 text-blue-200 text-xs">
            <Sparkles className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <div>
              <strong>Instant Digital PDF:</strong> Every AutoAudit interactive report includes styled print stylesheets. When printed to PDF, clean page breaks, official stamps, and high-contrast tables format automatically.
            </div>
          </div>

          {activeOs === 'desktop' ? (
            <div className="space-y-4">
              <h4 className="font-bold text-white text-sm flex items-center gap-2">
                <span>Desktop Step-by-Step Instructions</span>
              </h4>

              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-[#0F1B2D] border border-[rgba(148,163,184,0.15)] flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-[#10B981] font-bold text-xs flex items-center justify-center shrink-0">
                    1
                  </div>
                  <div>
                    <h5 className="font-bold text-white text-xs sm:text-sm">Open the Print Dialogue</h5>
                    <p className="text-slate-400 text-xs mt-0.5">
                      While viewing your report, click the <strong>"Print / Save PDF"</strong> button on the report header, or press keyboard shortcut:
                    </p>
                    <div className="flex flex-wrap gap-2 pt-1.5 font-mono text-[11px]">
                      <span className="bg-[#07111F] px-2.5 py-1 rounded border border-slate-700 text-emerald-400">
                        Ctrl + P (Windows / Linux)
                      </span>
                      <span className="bg-[#07111F] px-2.5 py-1 rounded border border-slate-700 text-blue-400">
                        ⌘ Cmd + P (Mac)
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#0F1B2D] border border-[rgba(148,163,184,0.15)] flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-[#10B981] font-bold text-xs flex items-center justify-center shrink-0">
                    2
                  </div>
                  <div>
                    <h5 className="font-bold text-white text-xs sm:text-sm">Select "Save as PDF" as Destination</h5>
                    <p className="text-slate-400 text-xs mt-0.5">
                      In the print preview window, locate the <strong>Destination</strong> dropdown menu. Change it from your physical printer to:
                    </p>
                    <ul className="list-disc pl-5 text-slate-300 text-xs mt-1 space-y-1">
                      <li><strong>Google Chrome & Edge:</strong> Select <em>"Save as PDF"</em></li>
                      <li><strong>Apple Safari (Mac):</strong> Click the bottom dropdown labeled <em>"PDF"</em> → choose <em>"Save as PDF..."</em></li>
                      <li><strong>Mozilla Firefox:</strong> Select <em>"Save to PDF"</em></li>
                    </ul>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#0F1B2D] border border-[rgba(148,163,184,0.15)] flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-[#10B981] font-bold text-xs flex items-center justify-center shrink-0">
                    3
                  </div>
                  <div>
                    <h5 className="font-bold text-white text-xs sm:text-sm">Enable "Background graphics" (Crucial)</h5>
                    <p className="text-slate-400 text-xs mt-0.5">
                      Expand <strong>"More settings"</strong> in Chrome / Edge or check the options in Safari / Firefox.
                    </p>
                    <div className="mt-1.5 p-2 rounded bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0" />
                      <span>Check the box: <strong>"Background graphics"</strong> to retain status colors, safety badges & vehicle header styling.</span>
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#0F1B2D] border border-[rgba(148,163,184,0.15)] flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-[#10B981] font-bold text-xs flex items-center justify-center shrink-0">
                    4
                  </div>
                  <div>
                    <h5 className="font-bold text-white text-xs sm:text-sm">Click "Save"</h5>
                    <p className="text-slate-400 text-xs mt-0.5">
                      Choose your preferred folder (Documents, Desktop, Downloads) and click Save. Your vehicle history document is now ready to email, print, or present to a seller or buyer.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <h4 className="font-bold text-white text-sm flex items-center gap-2">
                <span>Mobile (Smartphone & Tablet) Instructions</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* iOS Safari */}
                <div className="p-4 rounded-xl bg-[#0F1B2D] border border-[rgba(148,163,184,0.15)] space-y-2">
                  <div className="flex items-center gap-2 text-white font-bold text-xs">
                    <span className="w-2 h-2 rounded-full bg-blue-400" />
                    <span>iPhone & iPad (Safari)</span>
                  </div>
                  <ol className="list-decimal pl-4 text-xs text-slate-300 space-y-1.5">
                    <li>Tap the <strong>Share</strong> button (box with upward arrow) at the bottom toolbar.</li>
                    <li>Scroll down and tap <strong>"Print"</strong>.</li>
                    <li>On the print preview page, <strong>pinch outward</strong> with two fingers on the page thumbnail to zoom into PDF mode.</li>
                    <li>Tap the <strong>Share</strong> icon at top right and choose <strong>"Save to Files"</strong>.</li>
                  </ol>
                </div>

                {/* Android Chrome */}
                <div className="p-4 rounded-xl bg-[#0F1B2D] border border-[rgba(148,163,184,0.15)] space-y-2">
                  <div className="flex items-center gap-2 text-white font-bold text-xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span>Android (Google Chrome)</span>
                  </div>
                  <ol className="list-decimal pl-4 text-xs text-slate-300 space-y-1.5">
                    <li>Tap the <strong>three dots (⋮)</strong> menu in the upper right corner.</li>
                    <li>Select <strong>"Share..."</strong> → then choose <strong>"Print"</strong>.</li>
                    <li>Tap the printer drop-down at the top and pick <strong>"Save as PDF"</strong>.</li>
                    <li>Tap the yellow/blue <strong>PDF download icon</strong> to save to your device storage.</li>
                  </ol>
                </div>
              </div>
            </div>
          )}

          {/* Recommended Print Settings Table */}
          <div className="p-4 rounded-xl bg-[#07111F] border border-slate-800 space-y-2">
            <h5 className="font-bold text-white text-xs flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
              <span>Recommended PDF Print Settings</span>
            </h5>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
              <div className="bg-[#0B132B] p-2 rounded border border-slate-800">
                <span className="text-slate-500 block">Paper Size:</span>
                <span className="text-white font-medium">Letter / A4</span>
              </div>
              <div className="bg-[#0B132B] p-2 rounded border border-slate-800">
                <span className="text-slate-500 block">Orientation:</span>
                <span className="text-white font-medium">Portrait</span>
              </div>
              <div className="bg-[#0B132B] p-2 rounded border border-slate-800">
                <span className="text-slate-500 block">Margins:</span>
                <span className="text-white font-medium">Default or Minimum</span>
              </div>
              <div className="bg-[#0B132B] p-2 rounded border border-slate-800">
                <span className="text-slate-500 block">Graphics:</span>
                <span className="text-[#10B981] font-medium">Background On</span>
              </div>
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-[#07111F] border-t border-[rgba(148,163,184,0.20)] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <HelpCircle className="w-4 h-4 text-[#10B981]" />
            <span>Need help? Free support available on WhatsApp 24/7.</span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            {onOpenSample && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenSample();
                }}
                className="px-3.5 py-2 rounded-lg bg-[#0F1B2D] hover:bg-[#162740] text-slate-200 border border-[rgba(148,163,184,0.20)] font-medium transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <FileText className="w-3.5 h-3.5 text-[#10B981]" />
                <span>Test with Sample Report</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleTriggerPrint}
              className="px-4 py-2 rounded-lg bg-[#10B981] hover:bg-[#059669] text-white font-semibold transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Open Print Preview Now</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
