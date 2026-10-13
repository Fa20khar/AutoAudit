import React, { useState } from 'react';
import { Search, ShieldCheck, CheckCircle2, ArrowRight, Car, Lock, FileCheck, Check, FileText, Loader2, AlertCircle, Video } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { useTranslation } from '../context/LanguageContext';
import { WhatsAppButton } from './WhatsAppButton';
import { validateVinChecksum } from '../utils/vinValidator';

interface HeroProps {
  onStartOrderWithVin: (vin: string, isVin: boolean) => void;
  onOpenSample: () => void;
  onRequestReport?: () => void;
  onOpenVideoStudio?: () => void;
}

// Standard ISO 3779 VIN: 17 alphanumeric characters, excluding I, O, Q
const VIN_REGEX = /^[A-HJ-NPR-Z0-9]{17}$/i;

export const Hero: React.FC<HeroProps> = ({ onStartOrderWithVin, onOpenSample, onRequestReport, onOpenVideoStudio }) => {
  const { showToast } = useToast();
  const { t } = useTranslation();
  const [vinInput, setVinInput] = useState('');
  const [inputType, setInputType] = useState<'vin' | 'plate'>('vin');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState(false);
  const [isInputShaking, setIsInputShaking] = useState(false);
  const [validationState, setValidationState] = useState<'idle' | 'validating' | 'valid' | 'invalid'>('idle');
  const [validationFeedback, setValidationFeedback] = useState<string | null>(null);
  const [heroInspectAngle, setHeroInspectAngle] = useState<'paint' | 'profile' | 'engine' | 'headlight'>('paint');

  // Immediate debounced visual validation effect for VIN input
  React.useEffect(() => {
    if (inputType !== 'vin') {
      setValidationState('idle');
      setValidationFeedback(null);
      return;
    }

    const clean = vinInput.trim().toUpperCase();
    if (!clean) {
      setValidationState('idle');
      setValidationFeedback(null);
      return;
    }

    // If characters I, O, or Q are detected or invalid characters present
    if (/[IOQ]/i.test(clean)) {
      setValidationState('invalid');
      setValidationFeedback('Letters I, O, and Q are prohibited in standard VINs.');
      setIsInputShaking(true);
      const timer = setTimeout(() => setIsInputShaking(false), 500);
      return () => clearTimeout(timer);
    }

    if (/[^A-HJ-NPR-Z0-9]/i.test(clean)) {
      setValidationState('invalid');
      setValidationFeedback('Alphanumeric characters only.');
      setIsInputShaking(true);
      const timer = setTimeout(() => setIsInputShaking(false), 500);
      return () => clearTimeout(timer);
    }

    // Partial length (less than 17): show progress, clear validated state
    if (clean.length < 17) {
      setValidationState('idle');
      setValidationFeedback(`${clean.length}/17 digits entered`);
      return;
    }

    // When full 17 characters are entered: show 'Validating...' spinner followed by checksum pass/fail
    if (clean.length === 17) {
      setValidationState('validating');
      setValidationFeedback('Validating VIN checksum...');

      const validationTimer = setTimeout(() => {
        const result = validateVinChecksum(clean);
        if (result.isValidChecksum || (result.isFormatValid && !result.expectedCheckDigit)) {
          // Checksum passed or format verified
          setValidationState('valid');
          setValidationFeedback('Valid VIN verified');
          setErrorMessage(null);
        } else if (result.isFormatValid && result.actualCheckDigit !== result.expectedCheckDigit) {
          // Checksum mismatch
          setValidationState('invalid');
          setValidationFeedback(`Checksum mismatch: expected check digit '${result.expectedCheckDigit}' at position 9`);
          setIsInputShaking(true);
          setTimeout(() => setIsInputShaking(false), 500);
        } else {
          setValidationState('invalid');
          setValidationFeedback('Invalid VIN structure');
          setIsInputShaking(true);
          setTimeout(() => setIsInputShaking(false), 500);
        }
      }, 420); // Smooth authentic validation response window

      return () => clearTimeout(validationTimer);
    }

    if (clean.length > 17) {
      setValidationState('invalid');
      setValidationFeedback('VIN cannot exceed 17 characters.');
      setIsInputShaking(true);
      const timer = setTimeout(() => setIsInputShaking(false), 500);
      return () => clearTimeout(timer);
    }
  }, [vinInput, inputType]);

  const triggerShake = (message: string) => {
    setErrorMessage(message);
    setIsShaking(true);
    setIsInputShaking(true);
    showToast({
      type: 'warning',
      title: 'Invalid Vehicle Identifier',
      message,
      duration: 4000,
    });
    setTimeout(() => {
      setIsShaking(false);
      setIsInputShaking(false);
    }, 500);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanInput = vinInput.trim().toUpperCase();

    if (!cleanInput) {
      triggerShake(inputType === 'vin' ? 'Please enter a 17-digit VIN number.' : 'Please enter a license plate number.');
      return;
    }

    if (inputType === 'vin') {
      if (/[IOQ]/i.test(cleanInput)) {
        triggerShake('Invalid VIN: Letters I, O, and Q are never used in 17-digit VINs (use 1 or 0).');
        return;
      }

      if (cleanInput.length !== 17) {
        triggerShake(`VIN must be exactly 17 characters long (currently ${cleanInput.length}/17).`);
        return;
      }

      if (!VIN_REGEX.test(cleanInput)) {
        triggerShake('Invalid VIN: Standard VINs only contain alphanumeric letters and numbers.');
        return;
      }
    } else {
      if (cleanInput.length < 3) {
        triggerShake('Registration plate must be at least 3 characters long.');
        return;
      }
    }

    setErrorMessage(null);
    onStartOrderWithVin(cleanInput, inputType === 'vin');
  };

  const handleInputChange = (value: string) => {
    setVinInput(value.toUpperCase());
    if (errorMessage) {
      setErrorMessage(null);
    }
  };

  const handleQuickFill = (sampleVin: string) => {
    setVinInput(sampleVin);
    setInputType('vin');
    setErrorMessage(null);
  };

  return (
    <section id="hero" className="relative pt-12 pb-20 overflow-hidden bg-[#07111F] text-white">
      {/* 
        Clean Premium SaaS Ambient Background (No background video)
        - Rich dark navy (#07111F to #0B132B)
        - Subtle emerald radial glow at top-center
        - High-contrast, lightning-fast rendering without motion distraction
      */}
      <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0" aria-hidden="true">
        {/* Deep navy background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#07111F] via-[#0B132B] to-[#07111F]" />

        {/* Emerald ambient glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_75%_50%_at_50%_0%,rgba(16,185,129,0.12),transparent_70%)]" />

        {/* Subtle geometric grid / mesh lines */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

        {/* Edge gradient fade */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#07111F]" />
      </div>

      {/* Hero Content Layer */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Eyebrow, Headline, Copy, CTAs & Search Panel */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0F1B2D] border border-[rgba(148,163,184,0.20)] text-xs font-bold text-[#10B981] tracking-wider uppercase shadow-xs">
              <ShieldCheck className="w-3.5 h-3.5 text-[#10B981]" />
              <span>{t('heroBadge')}</span>
            </div>

            {/* Headline with -1.2px negative letter-spacing */}
            <h1 className="text-4xl sm:text-5xl lg:text-[54px] font-extrabold tracking-[-1.2px] text-white leading-[1.15] text-balance">
              {t('heroTitle1')}{' '}
              <span className="text-[#10B981]">{t('heroTitle2')}</span>
            </h1>

            {/* Supporting Copy */}
            <p className="text-base sm:text-lg text-[#CBD5E1] max-w-2xl leading-[1.6]">
              {t('heroSubtitle')}
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => onStartOrderWithVin('1HGCM82633A004352', true)}
                className="px-6 py-3 rounded-[8px] text-sm font-semibold bg-[#2563EB] hover:bg-[#1D4ED8] text-white shadow-[0_1px_2px_rgba(0,0,0,0.1)] transition-all duration-150 flex items-center gap-2 cursor-pointer active:scale-95 leading-[1.43]"
              >
                <span>{t('checkHistoryBtn')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={onOpenSample}
                className="px-5 py-3 rounded-[8px] text-sm font-medium bg-[#0F1B2D] hover:bg-[#162740] text-[#CBD5E1] border border-[rgba(148,163,184,0.20)] transition-colors flex items-center gap-2 cursor-pointer leading-[1.43]"
              >
                <FileCheck className="w-4 h-4 text-[#10B981]" />
                <span>{t('viewSampleBtn')}</span>
              </button>

              {onRequestReport && (
                <button
                  type="button"
                  onClick={onRequestReport}
                  className="px-5 py-3 rounded-[8px] text-sm font-semibold bg-[#059669]/20 hover:bg-[#059669]/30 text-[#10B981] border border-[#059669]/40 transition-colors flex items-center gap-2 cursor-pointer leading-[1.43]"
                >
                  <ShieldCheck className="w-4 h-4 text-[#10B981]" />
                  <span>Request Vehicle Report</span>
                </button>
              )}

              <WhatsAppButton
                variant="secondary"
                source="hero"
                intent="vin_check"
                label={t('needVinHelp')}
                openQrModal={true}
                className="px-4 py-3 rounded-[8px] bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-700/60 font-medium text-sm leading-[1.43]"
              />

              {onOpenVideoStudio && (
                <button
                  type="button"
                  onClick={onOpenVideoStudio}
                  className="px-4 py-3 rounded-[8px] text-sm font-semibold bg-purple-950/60 hover:bg-purple-900/80 text-purple-200 border border-purple-700/60 transition-colors flex items-center gap-2 cursor-pointer leading-[1.43]"
                  title="Generate 360° vehicle video with Veo 3 (16:9 & 9:16)"
                >
                  <Video className="w-4 h-4 text-purple-400" />
                  <span>Veo 3 Video Studio</span>
                </button>
              )}
            </div>

            {/* Section 7: Vehicle Search / Order Component */}
            <div className={`mt-4 bg-[#0F1B2D]/95 border border-[rgba(148,163,184,0.20)] rounded-[14px] p-4 sm:p-5 md:p-6 shadow-2xl backdrop-blur-md max-w-xl transition-all ${isShaking ? 'animate-shake border-rose-500' : ''}`}>
              
              {/* Tabs */}
              <div className="flex items-center gap-1.5 sm:gap-2 mb-3 sm:mb-4">
                <button
                  type="button"
                  onClick={() => setInputType('vin')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-[8px] transition-colors cursor-pointer leading-[1.43] ${
                    inputType === 'vin'
                      ? 'bg-[#2563EB] text-white shadow-[0_1px_2px_rgba(0,0,0,0.1)]'
                      : 'text-[#CBD5E1] hover:text-white bg-[#0B132B]'
                  }`}
                >
                  {t('tabVin')}
                </button>
                <button
                  type="button"
                  onClick={() => setInputType('plate')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-[8px] transition-colors cursor-pointer leading-[1.43] ${
                    inputType === 'plate'
                      ? 'bg-[#2563EB] text-white shadow-[0_1px_2px_rgba(0,0,0,0.1)]'
                      : 'text-[#CBD5E1] hover:text-white bg-[#0B132B]'
                  }`}
                >
                  {t('tabPlate')}
                </button>
              </div>

              {/* Form Input + Button */}
              <form onSubmit={handleSubmit} className="space-y-2.5 sm:space-y-3">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 sm:pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>

                  <input
                    type="text"
                    value={vinInput}
                    onChange={(e) => handleInputChange(e.target.value)}
                    placeholder={inputType === 'vin' ? t('vinPlaceholder') : t('platePlaceholder')}
                    maxLength={inputType === 'vin' ? 17 : 20}
                    className={`w-full pl-9 sm:pl-10 ${
                      inputType === 'vin' && validationState !== 'idle'
                        ? 'pr-44 sm:pr-48'
                        : 'pr-26 sm:pr-30'
                    } py-2.5 sm:py-3 bg-[#0B132B] border rounded-[8px] text-white placeholder-slate-400 font-mono text-xs sm:text-sm tracking-wider uppercase focus:outline-none transition-all ${
                      isInputShaking ? 'animate-gentle-shake border-rose-500 ring-1 ring-rose-500/50' : ''
                    } ${
                      inputType === 'vin' && validationState === 'valid'
                        ? 'border-emerald-500 ring-1 ring-emerald-500/30'
                        : inputType === 'vin' && validationState === 'invalid'
                        ? 'border-rose-500/80 ring-1 ring-rose-500/20'
                        : inputType === 'vin' && validationState === 'validating'
                        ? 'border-blue-500/80 ring-1 ring-blue-500/30'
                        : 'border-[rgba(148,163,184,0.20)] focus:border-[#10B981]'
                    }`}
                  />

                  {/* Immediate Visual Validation Status Indicator (Validating Spinner / Checkmark / Alert) */}
                  {inputType === 'vin' && validationState !== 'idle' && (
                    <div className="absolute inset-y-0 right-28 sm:right-32 flex items-center pr-1.5 pointer-events-none transition-all">
                      {validationState === 'validating' && (
                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-400 text-[10px] font-medium tracking-normal animate-pulse">
                          <Loader2 className="w-3 h-3 animate-spin text-blue-400 shrink-0" />
                          <span className="hidden xs:inline">Validating...</span>
                        </div>
                      )}
                      {validationState === 'valid' && (
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 text-[10px] font-semibold tracking-normal shadow-xs">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 report-checkmark-pop" />
                          <span className="hidden xs:inline">Passed</span>
                        </div>
                      )}
                      {validationState === 'invalid' && (
                        <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/40 text-rose-400 text-[10px] font-medium tracking-normal">
                          <AlertCircle className="w-3 h-3 text-rose-400 shrink-0" />
                          <span className="hidden xs:inline">Invalid</span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="absolute inset-y-1 sm:inset-y-1.5 right-1 sm:right-1.5">
                    <button
                      type="submit"
                      className="h-full px-3 sm:px-4 rounded-[8px] bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold flex items-center gap-1 sm:gap-1.5 transition-colors cursor-pointer shadow-[0_1px_2px_rgba(0,0,0,0.1)] active:scale-95 leading-[1.43]"
                    >
                      <span>{t('orderReportBtn')}</span>
                      <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Immediate Real-time Validation Feedback Message */}
                {inputType === 'vin' && validationFeedback && (
                  <div
                    className={`flex items-center gap-1.5 text-[11px] sm:text-xs font-medium transition-colors ${
                      validationState === 'valid'
                        ? 'text-emerald-400'
                        : validationState === 'validating'
                        ? 'text-blue-400'
                        : validationState === 'invalid'
                        ? 'text-rose-400'
                        : 'text-slate-400'
                    }`}
                  >
                    {validationState === 'valid' ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    ) : validationState === 'validating' ? (
                      <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin shrink-0" />
                    ) : validationState === 'invalid' ? (
                      <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    ) : (
                      <Car className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    )}
                    <span>{validationFeedback}</span>
                  </div>
                )}

                {errorMessage && (!validationFeedback || validationState !== 'invalid') && (
                  <p className="text-[11px] sm:text-xs text-rose-400 font-medium flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    <span>{errorMessage}</span>
                  </p>
                )}

                {/* Quick Examples */}
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 pt-0.5 sm:pt-1 text-[10px] sm:text-[11px] text-[#CBD5E1]">
                  <span className="text-slate-400">{t('quickSampleVins')}</span>
                  <button
                    type="button"
                    onClick={() => handleQuickFill('1HGCM82633A004352')}
                    className="text-[#10B981] hover:underline font-mono cursor-pointer"
                  >
                    1HGCM82633A004352
                  </button>
                  <span aria-hidden="true" className="text-slate-600">·</span>
                  <button
                    type="button"
                    onClick={() => handleQuickFill('WAUZZZF45LA019283')}
                    className="text-blue-400 hover:underline font-mono cursor-pointer"
                  >
                    Audi A4
                  </button>
                </div>

                {/* Trust Message & WhatsApp Quick Link Below */}
                <div className="pt-2.5 border-t border-[rgba(148,163,184,0.15)] flex flex-col sm:flex-row items-center justify-between gap-2 text-[10.5px] sm:text-xs text-[#CBD5E1]">
                  <div className="flex items-center gap-1.5">
                    <Lock className="w-3 h-3 text-[#10B981] shrink-0" />
                    <span>{t('secureCheckoutNote')}</span>
                  </div>
                  <WhatsAppButton
                    variant="text"
                    source="hero"
                    intent="vin_check"
                    openQrModal={true}
                    label={t('needVinHelp')}
                    className="text-[#10B981] hover:text-emerald-300 font-medium text-[11px]"
                  />
                </div>
              </form>

              {/* Customer Intake Specification Link */}
              {onRequestReport && (
                <div className="pt-3 border-t border-[rgba(148,163,184,0.15)] flex items-center justify-between text-xs">
                  <span className="text-slate-400 text-[11px]">{t('customIntakePrompt')}</span>
                  <button
                    type="button"
                    onClick={onRequestReport}
                    className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>{t('fillIntakeBtn')} →</span>
                  </button>
                </div>
              )}

            </div>

          </div>

          {/* Right Column: Hero Right — Vehicle Report Preview */}
          <div className="lg:col-span-5">
            <div className="bg-[#0F1B2D]/95 border border-[rgba(148,163,184,0.20)] rounded-[14px] p-5 sm:p-6 shadow-2xl space-y-5 backdrop-blur-md">
              
              {/* Header with Title and Verified Badge */}
              <div className="flex items-center justify-between pb-3.5 border-b border-[rgba(148,163,184,0.20)]">
                <div className="flex items-center gap-2">
                  <Car className="w-4 h-4 text-slate-400" />
                  <span className="font-bold text-sm text-slate-200">Vehicle History Report</span>
                </div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#059669]/20 text-[#10B981] border border-[#059669]/40">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>VERIFIED</span>
                </div>
              </div>

              {/* Fictional Example Notice & VIN */}
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Example Vehicle Profile
                </span>
                <p className="text-base font-bold text-white font-mono mt-0.5">
                  VIN: 1HGCM82633A004352
                </p>
                <p className="text-xs text-[#CBD5E1] mt-0.5">
                  2020 Honda Accord Touring 2.0T
                </p>
              </div>

              {/* Interactive Customer Vehicle Inspection View */}
              <div className="relative rounded-[10px] overflow-hidden border border-[rgba(148,163,184,0.25)] bg-[#0B132B] shadow-inner group">
                <div className="relative aspect-[16/9] w-full overflow-hidden">
                  <img
                    src={
                      heroInspectAngle === 'paint'
                        ? '/images/inspection/paint-inspection.jpg'
                        : heroInspectAngle === 'profile'
                        ? '/images/inspection/luxury-bentley.jpg'
                        : heroInspectAngle === 'engine'
                        ? '/images/inspection/engine-inspection.jpg'
                        : '/images/inspection/headlight-inspection.jpg'
                    }
                    alt="AutoAudit Vehicle Inspection Telemetry"
                    className="w-full h-full object-cover transition-all duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#07111F]/90 via-transparent to-[#07111F]/30 pointer-events-none" />

                  {/* Pulsing Interactive Hotspot Indicator */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                    <span className="relative flex h-8 w-8 items-center justify-center">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10B981] opacity-75" />
                      <span className="relative inline-flex rounded-full h-4 w-4 bg-[#10B981] border-2 border-white shadow-lg" />
                    </span>
                  </div>

                  {/* Top Badge: View Angle Tag */}
                  <div className="absolute top-2 left-2 flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-[4px] text-[10px] font-bold uppercase tracking-wider bg-[#07111F]/80 text-[#10B981] border border-[#10B981]/30 backdrop-blur-md">
                      {heroInspectAngle === 'paint' ? 'Paint Surface Audit' : heroInspectAngle === 'profile' ? 'Executive Profile' : heroInspectAngle === 'engine' ? 'Engine Bay Check' : 'Optical Headlight'}
                    </span>
                  </div>

                  {/* Live Inspection Hotspot Label */}
                  <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[11px] text-white">
                    <span className="bg-[#07111F]/80 px-2 py-0.5 rounded backdrop-blur-md text-[10px] font-mono border border-[rgba(148,163,184,0.20)]">
                      {heroInspectAngle === 'paint' ? 'Micro-Depth: 118μm' : heroInspectAngle === 'profile' ? 'Clean Title Verified' : heroInspectAngle === 'engine' ? 'Numbers-Matching OEM' : 'OEM Date Verified'}
                    </span>
                    <a
                      href="#interactive-view"
                      className="text-[10px] text-[#10B981] hover:underline font-semibold flex items-center gap-0.5"
                    >
                      <span>Explore 360° View →</span>
                    </a>
                  </div>
                </div>

                {/* Interactive Angle Switcher Tabs */}
                <div className="grid grid-cols-4 gap-1 p-1 bg-[#07111F]/90 border-t border-[rgba(148,163,184,0.20)] text-[10px]">
                  <button
                    type="button"
                    onClick={() => setHeroInspectAngle('paint')}
                    className={`py-1 px-1.5 rounded-[6px] font-semibold text-center transition-colors cursor-pointer truncate ${
                      heroInspectAngle === 'paint'
                        ? 'bg-[#10B981] text-white shadow-xs'
                        : 'text-[#CBD5E1] hover:text-white hover:bg-[#0F1B2D]'
                    }`}
                  >
                    Paint
                  </button>
                  <button
                    type="button"
                    onClick={() => setHeroInspectAngle('profile')}
                    className={`py-1 px-1.5 rounded-[6px] font-semibold text-center transition-colors cursor-pointer truncate ${
                      heroInspectAngle === 'profile'
                        ? 'bg-[#10B981] text-white shadow-xs'
                        : 'text-[#CBD5E1] hover:text-white hover:bg-[#0F1B2D]'
                    }`}
                  >
                    Profile
                  </button>
                  <button
                    type="button"
                    onClick={() => setHeroInspectAngle('engine')}
                    className={`py-1 px-1.5 rounded-[6px] font-semibold text-center transition-colors cursor-pointer truncate ${
                      heroInspectAngle === 'engine'
                        ? 'bg-[#10B981] text-white shadow-xs'
                        : 'text-[#CBD5E1] hover:text-white hover:bg-[#0F1B2D]'
                    }`}
                  >
                    Engine
                  </button>
                  <button
                    type="button"
                    onClick={() => setHeroInspectAngle('headlight')}
                    className={`py-1 px-1.5 rounded-[6px] font-semibold text-center transition-colors cursor-pointer truncate ${
                      heroInspectAngle === 'headlight'
                        ? 'bg-[#10B981] text-white shadow-xs'
                        : 'text-[#CBD5E1] hover:text-white hover:bg-[#0F1B2D]'
                    }`}
                  >
                    Optics
                  </button>
                </div>
              </div>

              {/* 4 Metric Cards with Green Check Indicators */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                
                {/* Metric 1 */}
                <div className="p-3 bg-[#0B132B] rounded-[8px] border border-[rgba(148,163,184,0.20)] space-y-1">
                  <span className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase block">
                    TITLE RECORD
                  </span>
                  <div className="flex items-center gap-1.5 text-white font-bold text-sm">
                    <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
                    <span>Clean</span>
                  </div>
                </div>

                {/* Metric 2 */}
                <div className="p-3 bg-[#0B132B] rounded-[8px] border border-[rgba(148,163,184,0.20)] space-y-1">
                  <span className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase block">
                    REPORTED ACCIDENTS
                  </span>
                  <div className="flex items-center gap-1.5 text-white font-bold text-sm">
                    <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
                    <span>0</span>
                  </div>
                </div>

                {/* Metric 3 */}
                <div className="p-3 bg-[#0B132B] rounded-[8px] border border-[rgba(148,163,184,0.20)] space-y-1">
                  <span className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase block">
                    ODOMETER TREND
                  </span>
                  <div className="flex items-center gap-1.5 text-white font-bold text-sm">
                    <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
                    <span>Consistent</span>
                  </div>
                </div>

                {/* Metric 4 */}
                <div className="p-3 bg-[#0B132B] rounded-[8px] border border-[rgba(148,163,184,0.20)] space-y-1">
                  <span className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase block">
                    SALVAGE STATUS
                  </span>
                  <div className="flex items-center gap-1.5 text-white font-bold text-sm">
                    <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
                    <span>Clear</span>
                  </div>
                </div>

              </div>

              {/* Bottom Label: Sample Report Preview */}
              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={onOpenSample}
                  className="text-xs font-semibold text-[#CBD5E1] hover:text-white inline-flex items-center gap-1.5 transition-colors cursor-pointer group"
                >
                  <span>Sample Report Preview</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform text-[#10B981]" />
                </button>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
