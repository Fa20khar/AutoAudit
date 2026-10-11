import React, { useState } from 'react';
import { 
  ShieldCheck, 
  ArrowLeft, 
  FileCheck, 
  ExternalLink, 
  Lock, 
  HelpCircle, 
  CheckCircle2, 
  Loader2, 
  AlertCircle,
  Copy,
  Check,
  Table,
  FileSpreadsheet,
  Camera,
  Image as ImageIcon,
  Info
} from 'lucide-react';
import { 
  GOOGLE_FORMS_CONFIG, 
  GOOGLE_FORMS_EMBED_URL, 
  GOOGLE_FORMS_EDITOR_ID, 
  GOOGLE_FORMS_EDITOR_URL, 
  GOOGLE_FORMS_RESPONSES_URL,
  VEHICLE_PHOTO_UPLOAD_GUIDE 
} from '../config/googleFormsConfig';
import { SocialProofTicker } from './SocialProofTicker';
import { ProgressStepper } from './ProgressStepper';
import { ActiveSafetyRecallsBanner } from './ActiveSafetyRecallsBanner';

interface VehicleReportFormProps {
  onBackToHome?: () => void;
  onOpenSample?: () => void;
  onOpenPricing?: () => void;
}

export const VehicleReportForm: React.FC<VehicleReportFormProps> = ({
  onBackToHome,
  onOpenSample,
  onOpenPricing,
}) => {
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [showConfigHelper, setShowConfigHelper] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Active public embed URL from central config
  const embedUrl = GOOGLE_FORMS_CONFIG.embedUrl;

  const handleCopyUrl = () => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(embedUrl).then(() => {
        setCopiedUrl(true);
        setTimeout(() => setCopiedUrl(false), 2000);
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#07111F] text-[#CBD5E1] py-8 sm:py-12 lg:py-16 px-4 sm:px-6 lg:px-8 flex flex-col justify-between selection:bg-[#2563EB] selection:text-white">
      
      {/* Background ambient lighting matching AutoAudit branding */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0" aria-hidden="true">
        <div className="absolute inset-0 bg-gradient-to-b from-[#07111F] via-[#0B132B] to-[#07111F]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-[radial-gradient(ellipse_70%_50%_at_50%_0%,rgba(16,185,129,0.12),transparent_70%)]" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto w-full">
        
        {/* Navigation Breadcrumb / Back button */}
        <div className="mb-6 flex items-center justify-between">
          {onBackToHome ? (
            <button
              type="button"
              onClick={onBackToHome}
              className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#CBD5E1] hover:text-white bg-[#0F1B2D] hover:bg-[#162740] px-3.5 py-2 rounded-[8px] border border-[rgba(148,163,184,0.20)] transition-all cursor-pointer group"
            >
              <ArrowLeft className="w-4 h-4 text-[#10B981] group-hover:-translate-x-0.5 transition-transform" />
              <span>Back to Homepage</span>
            </button>
          ) : (
            <a
              href="/"
              className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#CBD5E1] hover:text-white bg-[#0F1B2D] hover:bg-[#162740] px-3.5 py-2 rounded-[8px] border border-[rgba(148,163,184,0.20)] transition-all group"
            >
              <ArrowLeft className="w-4 h-4 text-[#10B981] group-hover:-translate-x-0.5 transition-transform" />
              <span>Back to Homepage</span>
            </a>
          )}

          <div className="flex items-center gap-2">
            <a
              href={GOOGLE_FORMS_RESPONSES_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] sm:text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5 transition-colors cursor-pointer bg-emerald-950/40 hover:bg-emerald-900/40 px-2.5 py-1.5 rounded-[6px] border border-emerald-500/30"
              title="Open Google Sheet & Responses in Google Forms"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-[#10B981]" />
              <span className="hidden sm:inline">Google Sheet Responses</span>
            </a>

            <button
              type="button"
              onClick={() => setShowConfigHelper(!showConfigHelper)}
              className="text-[11px] sm:text-xs text-slate-400 hover:text-emerald-400 flex items-center gap-1.5 transition-colors cursor-pointer bg-[#0F1B2D]/60 px-2.5 py-1.5 rounded-[6px] border border-[rgba(148,163,184,0.15)]"
              title="Google Forms Integration Info"
            >
              <HelpCircle className="w-3.5 h-3.5 text-[#10B981]" />
              <span className="hidden sm:inline">Form Config</span>
            </button>
          </div>
        </div>

        {/* Active NHTSA Safety Recalls Banner */}
        <ActiveSafetyRecallsBanner />

        {/* Real-Time Social Proof Ticker (Live recent customer vehicle verifications) */}
        <div className="mb-6">
          <SocialProofTicker />
        </div>

        {/* Collapsible Form Configuration & Troubleshooting helper */}
        {showConfigHelper && (
          <div className="mb-6 p-4 rounded-[12px] bg-[#0F1B2D] border border-emerald-900/60 shadow-xl space-y-3 text-xs animate-fadeIn">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 text-emerald-400 font-bold">
                <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0" />
                <span>Google Forms & Google Sheets Production Connection</span>
              </div>
              <button
                type="button"
                onClick={() => setShowConfigHelper(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <p className="text-slate-300 leading-relaxed">
              <strong>Where is Google Form & Google Sheet?</strong><br />
              • <strong>Google Form:</strong> Embedded below in the white interactive container. Visitors fill and submit directly on this page.<br />
              • <strong>Google Sheet:</strong> All submissions automatically sync to your linked private Google Sheet via Google Forms built-in Sheets integration.
            </p>
            <div className="bg-[#0B132B] p-3 rounded-[8px] font-mono text-[11px] space-y-2 border border-[rgba(148,163,184,0.15)]">
              <div>
                <span className="text-slate-400">Google Form ID:</span>{' '}
                <span className="text-[#10B981]">{GOOGLE_FORMS_EDITOR_ID}</span>
              </div>
              <div className="break-all flex items-center justify-between gap-2">
                <div>
                  <span className="text-slate-400">Embed URL (Public Form):</span>{' '}
                  <span className="text-blue-400">{embedUrl}</span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyUrl}
                  className="px-2 py-1 rounded bg-[#0F1B2D] hover:bg-[#162740] text-slate-300 shrink-0 text-[10px] flex items-center gap-1 border border-[rgba(148,163,184,0.20)]"
                  title="Copy URL"
                >
                  {copiedUrl ? <Check className="w-3 h-3 text-[#10B981]" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedUrl ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <a
                  href={GOOGLE_FORMS_RESPONSES_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-400 hover:underline flex items-center gap-1 text-[11px]"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Open Google Sheets Responses in Google Drive</span>
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Branded Header Container */}
        <div className="text-center space-y-4 mb-6 sm:mb-8">
          
          {/* Status Badge: VEHICLE REPORT REQUEST */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0F1B2D] border border-[rgba(148,163,184,0.20)] text-xs font-bold text-[#10B981] tracking-wider uppercase shadow-xs">
            <ShieldCheck className="w-3.5 h-3.5 text-[#10B981]" />
            <span>{GOOGLE_FORMS_CONFIG.statusBadge}</span>
          </div>

          {/* Heading: Request Your Vehicle History Report */}
          <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-extrabold tracking-[-1.2px] text-white leading-tight">
            {GOOGLE_FORMS_CONFIG.heading}
          </h1>

          {/* Short explanatory paragraph */}
          <p className="text-sm sm:text-base text-[#CBD5E1] max-w-2xl mx-auto leading-relaxed">
            {GOOGLE_FORMS_CONFIG.description}
          </p>

          {/* Trust Guarantees */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs text-slate-400">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
              <span>Direct Google Intake</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
              <span>No Credit Card Required</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-[#10B981]" />
              <span>Encrypted Submission</span>
            </div>
          </div>
        </div>

        {/* Progress Stepper Component (Design card: Add Progress Stepper) */}
        <div className="mb-6">
          <ProgressStepper currentStep={1} />
        </div>

        {/* Customer Vehicle Photo Uploads Guidance Card */}
        <div className="mb-6 rounded-[14px] bg-[#0F1B2D] border border-emerald-500/30 p-4 sm:p-5 shadow-lg space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-white font-bold text-sm">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-[#10B981] flex items-center justify-center shrink-0">
                <Camera className="w-4 h-4" />
              </div>
              <div>
                <span>{VEHICLE_PHOTO_UPLOAD_GUIDE.questionTitle}</span>
                <span className="ml-2 text-[11px] font-normal text-slate-400">
                  (Optional • Supports Customer Report Review)
                </span>
              </div>
            </div>
            <span className="text-[11px] text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-1 rounded-full self-start sm:self-auto font-medium">
              Google Forms & Drive Stored
            </span>
          </div>

          <p className="text-xs text-[#CBD5E1] leading-relaxed">
            {VEHICLE_PHOTO_UPLOAD_GUIDE.questionDescription}
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 pt-1 text-[11px]">
            {VEHICLE_PHOTO_UPLOAD_GUIDE.recommendedPhotos.map((item, idx) => (
              <div
                key={idx}
                className="bg-[#0B132B] border border-slate-800 rounded-lg p-2.5 flex flex-col justify-between"
              >
                <div className="font-semibold text-slate-200 flex items-center gap-1">
                  <span className="text-[#10B981]">{idx + 1}.</span> {item.title}
                </div>
                <div className="text-[10px] text-slate-500 mt-1 line-clamp-2">
                  {item.desc}
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800 text-[11px] text-slate-400">
            <div className="flex items-center gap-2">
              <Info className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span>{VEHICLE_PHOTO_UPLOAD_GUIDE.legalNotice}</span>
            </div>
            <div className="text-slate-500">
              Accepted: JPG, PNG, WebP, PDF • Up to 10 MB per file
            </div>
          </div>
        </div>

        {/* Clean Form Card Container with Dark Slate / Navy border */}
        <div className="bg-[#0F1B2D] border border-[rgba(148,163,184,0.20)] rounded-[16px] shadow-2xl overflow-hidden relative transition-all">
          
          {/* Skeleton Loading State (renders until the Google Form iframe completes loading) */}
          {!iframeLoaded && (
            <div 
              aria-label="Loading report request form" 
              className="p-6 sm:p-8 space-y-6 bg-gradient-to-b from-[#0B132B] via-[#0F1B2D] to-[#0B132B] min-h-[780px] sm:min-h-[880px]"
            >
              {/* Skeleton Header banner */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                    <Loader2 className="w-4 h-4 text-[#10B981] animate-spin" />
                  </div>
                  <div>
                    <div className="h-4 w-48 sm:w-64 bg-slate-700/60 rounded-md animate-pulse" />
                    <div className="h-3 w-32 sm:w-40 bg-slate-800/80 rounded mt-1.5 animate-pulse" />
                  </div>
                </div>
                <div className="hidden sm:flex items-center gap-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span className="text-[11px] text-slate-400 font-medium">Connecting Google Forms...</span>
                </div>
              </div>

              {/* Form header pill & title skeleton */}
              <div className="space-y-3 pt-2">
                <div className="h-3 w-28 bg-emerald-900/40 border border-emerald-500/20 rounded-full animate-pulse" />
                <div className="h-6 w-3/4 max-w-md bg-slate-700/50 rounded-md animate-pulse" />
                <div className="h-3.5 w-full max-w-lg bg-slate-800/80 rounded animate-pulse" />
              </div>

              {/* Form Input Fields Skeletons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                {/* Field 1: Full Name */}
                <div className="space-y-2 p-3.5 rounded-xl bg-[#07111F]/60 border border-slate-800/60">
                  <div className="flex items-center justify-between">
                    <div className="h-3.5 w-24 bg-slate-700/70 rounded animate-pulse" />
                    <div className="h-2.5 w-12 bg-red-900/40 rounded animate-pulse" />
                  </div>
                  <div className="h-10 w-full bg-slate-800/50 rounded-lg border border-slate-700/40 animate-pulse" />
                </div>

                {/* Field 2: Email Address */}
                <div className="space-y-2 p-3.5 rounded-xl bg-[#07111F]/60 border border-slate-800/60">
                  <div className="flex items-center justify-between">
                    <div className="h-3.5 w-28 bg-slate-700/70 rounded animate-pulse" />
                    <div className="h-2.5 w-12 bg-red-900/40 rounded animate-pulse" />
                  </div>
                  <div className="h-10 w-full bg-slate-800/50 rounded-lg border border-slate-700/40 animate-pulse" />
                </div>

                {/* Field 3: Phone / WhatsApp */}
                <div className="space-y-2 p-3.5 rounded-xl bg-[#07111F]/60 border border-slate-800/60">
                  <div className="flex items-center justify-between">
                    <div className="h-3.5 w-32 bg-slate-700/70 rounded animate-pulse" />
                    <div className="h-2.5 w-12 bg-red-900/40 rounded animate-pulse" />
                  </div>
                  <div className="h-10 w-full bg-slate-800/50 rounded-lg border border-slate-700/40 animate-pulse" />
                </div>

                {/* Field 4: VIN */}
                <div className="space-y-2 p-3.5 rounded-xl bg-[#07111F]/60 border border-slate-800/60">
                  <div className="flex items-center justify-between">
                    <div className="h-3.5 w-44 bg-slate-700/70 rounded animate-pulse" />
                    <div className="h-2.5 w-12 bg-red-900/40 rounded animate-pulse" />
                  </div>
                  <div className="h-10 w-full bg-slate-800/50 rounded-lg border border-slate-700/40 animate-pulse" />
                </div>
              </div>

              {/* Photo Upload Question Skeleton Card */}
              <div className="p-4 rounded-xl bg-[#07111F]/80 border border-slate-800/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded bg-emerald-950 border border-emerald-500/30 flex items-center justify-center">
                      <Camera className="w-3 h-3 text-[#10B981]" />
                    </div>
                    <div className="h-4 w-40 bg-slate-700/70 rounded animate-pulse" />
                  </div>
                  <div className="h-3 w-16 bg-slate-800 rounded animate-pulse" />
                </div>
                <div className="h-3 w-3/4 bg-slate-800/70 rounded animate-pulse" />
                <div className="h-20 w-full rounded-lg border border-dashed border-slate-700/60 bg-slate-900/40 flex flex-col items-center justify-center gap-1.5">
                  <div className="h-3 w-48 bg-slate-800 rounded animate-pulse" />
                  <div className="h-2.5 w-32 bg-slate-850 rounded animate-pulse" />
                </div>
              </div>

              {/* Consent checkbox & Submit button skeleton */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded bg-slate-700/60 animate-pulse shrink-0" />
                  <div className="h-3 w-64 sm:w-96 bg-slate-800 rounded animate-pulse" />
                </div>
                <div className="flex items-center justify-between pt-2">
                  <div className="h-11 w-36 rounded-lg bg-emerald-600/30 border border-emerald-500/20 animate-pulse" />
                  <div className="h-3 w-28 bg-slate-800/60 rounded animate-pulse" />
                </div>
              </div>
            </div>
          )}

          {/* 
            Responsive Google Forms Iframe
            - Real published respondent/embed URL
            - Accessible title
            - Width: 100%
            - Legible light/white background for internal Google Form rendering
            - Clean vertical scroll without horizontal overflow
          */}
          <div className={`w-full overflow-hidden bg-white ${!iframeLoaded ? 'hidden' : 'block'}`}>
            <iframe
              src={embedUrl}
              title={GOOGLE_FORMS_CONFIG.iframeTitle}
              width="100%"
              height="880"
              frameBorder="0"
              marginHeight={0}
              marginWidth={0}
              onLoad={() => setIframeLoaded(true)}
              className="w-full min-h-[780px] sm:min-h-[880px] border-0 overflow-y-auto block"
              allow="camera; microphone; clipboard-write"
            >
              Loading Google Form...
            </iframe>
          </div>

          {/* Form Bottom Privacy & Policy Notice */}
          <div className="bg-[#0B132B] px-5 sm:px-6 py-4 border-t border-[rgba(148,163,184,0.20)]">
            <div className="flex items-start gap-2.5">
              <Lock className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-xs text-[#CBD5E1] leading-relaxed">
                  <strong className="text-white">Privacy Notice: </strong>
                  {GOOGLE_FORMS_CONFIG.privacyNotice}
                </p>
                <p className="text-[11px] text-slate-500">
                  Submissions are recorded into AutoAudit's private records spreadsheet for customer service and report fulfillment.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Alternative Actions & Support Bar */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-[12px] bg-[#0F1B2D]/60 border border-[rgba(148,163,184,0.15)] text-xs">
          <div className="text-slate-400 text-center sm:text-left">
            Need an instant automated report lookup right now?
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            {onOpenPricing && (
              <button
                type="button"
                onClick={onOpenPricing}
                className="px-3.5 py-1.5 rounded-[8px] bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold transition-colors cursor-pointer"
              >
                View Report Packages
              </button>
            )}
            {onOpenSample && (
              <button
                type="button"
                onClick={onOpenSample}
                className="px-3.5 py-1.5 rounded-[8px] bg-[#0B132B] hover:bg-[#162740] text-[#CBD5E1] border border-[rgba(148,163,184,0.20)] font-medium transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <FileCheck className="w-3.5 h-3.5 text-[#10B981]" />
                <span>View Sample Report</span>
              </button>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
