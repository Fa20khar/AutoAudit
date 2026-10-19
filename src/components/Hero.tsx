import React, { useState, useEffect } from 'react';
import { Search, CheckCircle2, ArrowRight, Car, FileCheck, Loader2, AlertCircle } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { useTranslation } from '../context/LanguageContext';
import { validateVinChecksum } from '../utils/vinValidator';

interface HeroProps {
  onStartOrderWithVin: (vin: string, isVin: boolean) => void;
  onOpenSample: () => void;
  onRequestReport?: () => void;
  onOpenVideoStudio?: () => void; // Retained in interface, hidden in UI per design spec
}

// Standard ISO 3779 VIN: 17 alphanumeric characters, excluding I, O, Q
const VIN_REGEX = /^[A-HJ-NPR-Z0-9]{17}$/i;

// Verified Sample VIN where 10th character ('L') corresponds to 2020 and checksum matches
const SAMPLE_VERIFIED_VIN = '1HGCV1F33LA000001';
const SAMPLE_VEHICLE_TITLE = '2020 Honda Accord Touring 2.0T';

export const Hero: React.FC<HeroProps> = ({
  onStartOrderWithVin,
  onOpenSample,
}) => {
  const { showToast } = useToast();
  const { t } = useTranslation();
  const [vehicleInput, setVehicleInput] = useState('');
  const [inputType, setInputType] = useState<'vin' | 'plate'>('vin');
  const [selectedState, setSelectedState] = useState('CA');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [validationState, setValidationState] = useState<'idle' | 'validating' | 'valid' | 'invalid'>('idle');
  const [validationFeedback, setValidationFeedback] = useState<string | null>(null);

  // Debounced real-time visual checksum validation effect for VIN input
  useEffect(() => {
    if (inputType !== 'vin') {
      setValidationState('idle');
      setValidationFeedback(null);
      return;
    }

    const clean = vehicleInput.trim().toUpperCase();
    if (!clean) {
      setValidationState('idle');
      setValidationFeedback(null);
      return;
    }

    // Prohibited letters I, O, Q in standard VINs
    if (/[IOQ]/i.test(clean)) {
      setValidationState('invalid');
      setValidationFeedback('Letters I, O, and Q are prohibited in standard 17-digit VINs.');
      return;
    }

    // Invalid symbols/spaces
    if (/[^A-HJ-NPR-Z0-9]/i.test(clean)) {
      setValidationState('invalid');
      setValidationFeedback('Alphanumeric letters and numbers only.');
      return;
    }

    // Incomplete length
    if (clean.length < 17) {
      setValidationState('idle');
      setValidationFeedback(`${clean.length}/17 characters entered`);
      return;
    }

    // Exactly 17 characters entered: evaluate checksum
    if (clean.length === 17) {
      setValidationState('validating');
      setValidationFeedback('Validating VIN checksum...');

      const validationTimer = setTimeout(() => {
        const result = validateVinChecksum(clean);
        if (result.isValidChecksum || (result.isFormatValid && !result.expectedCheckDigit)) {
          setValidationState('valid');
          setValidationFeedback('Valid VIN structure and checksum verified');
          setErrorMessage(null);
        } else if (result.isFormatValid && result.actualCheckDigit !== result.expectedCheckDigit) {
          setValidationState('invalid');
          setValidationFeedback(`Checksum mismatch: expected '${result.expectedCheckDigit}' at position 9`);
        } else {
          setValidationState('invalid');
          setValidationFeedback('Invalid VIN structure');
        }
      }, 300);

      return () => clearTimeout(validationTimer);
    }

    if (clean.length > 17) {
      setValidationState('invalid');
      setValidationFeedback('VIN cannot exceed 17 characters.');
    }
  }, [vehicleInput, inputType]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = vehicleInput.trim().toUpperCase();

    if (!clean) {
      setErrorMessage(
        inputType === 'vin'
          ? 'Please enter a 17-character VIN.'
          : 'Please enter a US license plate number.'
      );
      showToast({
        type: 'warning',
        title: 'Vehicle Identifier Required',
        message:
          inputType === 'vin'
            ? 'Please enter a 17-character VIN to proceed.'
            : 'Please enter your license plate number to proceed.',
        duration: 3500,
      });
      return;
    }

    if (inputType === 'vin') {
      if (/[IOQ]/i.test(clean)) {
        setErrorMessage('Invalid VIN: Letters I, O, and Q are never used in 17-digit VINs.');
        return;
      }
      if (clean.length !== 17 || !VIN_REGEX.test(clean)) {
        setErrorMessage(`VIN must be exactly 17 characters long (currently ${clean.length}/17).`);
        return;
      }
    } else {
      if (clean.length < 3) {
        setErrorMessage('License plate must be at least 3 characters.');
        return;
      }
    }

    setErrorMessage(null);
    onStartOrderWithVin(clean, inputType === 'vin');
  };

  const handleQuickFill = (vin: string) => {
    setVehicleInput(vin);
    setInputType('vin');
    setErrorMessage(null);
  };

  return (
    <section id="hero" className="w-full bg-[#0B132B] text-white py-14 sm:py-20 border-b border-[rgba(148,163,184,0.15)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          
          {/* Left Column: Headline, Supporting Copy, Main Action Form & Secondary Link */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Subtle Eyebrow */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-[6px] bg-[#0F172A] border border-slate-700/60 text-xs font-semibold text-slate-300 tracking-wider uppercase">
              <span>{t('heroBadge')}</span>
            </div>

            {/* Headline */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-[1.2] text-balance">
              {t('heroTitle1')} {t('heroTitle2')}
            </h1>

            {/* One short supporting sentence with no unverifiable claims */}
            <p className="text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed">
              {t('heroSubtitle')}
            </p>

            {/* Main Action Container: VIN / US License Plate tabbed input */}
            <div className="bg-[#0F172A] border border-slate-700/70 rounded-[12px] p-5 sm:p-6 shadow-md space-y-4">
              
              {/* Tabs: VIN or License Plate */}
              <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                <button
                  type="button"
                  onClick={() => {
                    setInputType('vin');
                    setErrorMessage(null);
                  }}
                  className={`px-3.5 py-1.5 text-xs font-semibold rounded-[6px] transition-colors cursor-pointer ${
                    inputType === 'vin'
                      ? 'bg-[#2563EB] text-white shadow-2xs'
                      : 'text-slate-400 hover:text-white bg-slate-800/60'
                  }`}
                >
                  {t('tabVin')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setInputType('plate');
                    setErrorMessage(null);
                  }}
                  className={`px-3.5 py-1.5 text-xs font-semibold rounded-[6px] transition-colors cursor-pointer ${
                    inputType === 'plate'
                      ? 'bg-[#2563EB] text-white shadow-2xs'
                      : 'text-slate-400 hover:text-white bg-slate-800/60'
                  }`}
                >
                  {t('tabPlate')}
                </button>
              </div>

              {/* Form Input: Button NEVER covers the input, placeholder fully visible */}
              <form onSubmit={handleSubmit} className="space-y-3">
                <label
                  htmlFor="vehicle-identifier-input"
                  className="block text-xs font-semibold text-slate-300 tracking-tight"
                >
                  {inputType === 'vin'
                    ? 'Enter 17-Character Vehicle Identification Number (VIN)'
                    : 'Enter US License Plate & Registration State'}
                </label>

                {/* Main Input Row: Standalone input with adjacent action button */}
                <div className="flex flex-col sm:flex-row items-stretch gap-2.5">
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Search className="w-4 h-4" />
                    </div>

                    <input
                      id="vehicle-identifier-input"
                      type="text"
                      value={vehicleInput}
                      onChange={(e) => {
                        setVehicleInput(e.target.value.toUpperCase());
                        if (errorMessage) setErrorMessage(null);
                      }}
                      placeholder={
                        inputType === 'vin'
                          ? 'e.g. 1HGCV1F33LA000001'
                          : 'e.g. 7XYZ890'
                      }
                      maxLength={inputType === 'vin' ? 17 : 12}
                      aria-invalid={Boolean(errorMessage) || validationState === 'invalid'}
                      className={`w-full min-h-[48px] pl-10 pr-4 py-2.5 bg-[#0B132B] border rounded-[8px] text-white placeholder-slate-400 font-mono text-sm tracking-wider uppercase transition-colors focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] ${
                        validationState === 'valid'
                          ? 'border-emerald-500/80 focus:ring-emerald-500'
                          : validationState === 'invalid' || errorMessage
                          ? 'border-rose-500/80 focus:ring-rose-500 text-rose-200'
                          : 'border-slate-700 focus:border-[#2563EB]'
                      }`}
                    />
                  </div>

                  {/* US State Selector when in License Plate Mode */}
                  {inputType === 'plate' && (
                    <select
                      value={selectedState}
                      onChange={(e) => setSelectedState(e.target.value)}
                      className="min-h-[48px] px-3 py-2.5 bg-[#0B132B] border border-slate-700 rounded-[8px] text-white text-xs font-semibold cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                    >
                      {['CA', 'TX', 'FL', 'NY', 'PA', 'IL', 'OH', 'GA', 'NC', 'MI', 'NJ', 'VA', 'WA', 'AZ', 'MA', 'TN', 'IN', 'MO', 'MD', 'WI', 'CO', 'MN', 'SC', 'AL', 'LA', 'KY', 'OR', 'OK', 'CT', 'UT', 'IA', 'NV', 'AR', 'MS', 'KS', 'NM', 'NE', 'WV', 'ID', 'HI', 'NH', 'ME', 'MT', 'RI', 'DE', 'SD', 'ND', 'AK', 'DC', 'VT', 'WY'].map((st) => (
                        <option key={st} value={st} className="bg-[#0B132B] text-white">
                          {st}
                        </option>
                      ))}
                    </select>
                  )}

                  {/* Order Button: Standalone and Never Overlapping the Input */}
                  <button
                    type="submit"
                    className="min-h-[48px] px-6 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] active:bg-[#1E40AF] text-white font-semibold text-sm rounded-[8px] transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2"
                  >
                    <span>{t('orderReportBtn')}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Inline Validation Feedback Below Input */}
                <div className="min-h-[22px] flex items-center justify-between text-xs pt-0.5">
                  <div>
                    {inputType === 'vin' && validationState === 'valid' && (
                      <span className="text-emerald-400 font-medium flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>{validationFeedback || 'Valid VIN verified'}</span>
                      </span>
                    )}
                    {inputType === 'vin' && validationState === 'validating' && (
                      <span className="text-blue-400 font-medium flex items-center gap-1.5">
                        <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin shrink-0" />
                        <span>Validating VIN checksum...</span>
                      </span>
                    )}
                    {inputType === 'vin' && validationState === 'invalid' && (
                      <span className="text-rose-400 font-medium flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        <span>{validationFeedback}</span>
                      </span>
                    )}
                    {errorMessage && validationState !== 'invalid' && (
                      <span className="text-rose-400 font-medium flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        <span>{errorMessage}</span>
                      </span>
                    )}
                    {validationState === 'idle' && !errorMessage && (
                      <span className="text-slate-400">
                        Enter any 17-digit VIN or US plate to inspect records.
                      </span>
                    )}
                  </div>

                  {/* Sample VIN Quick Fill helper */}
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <span>Try sample:</span>
                    <button
                      type="button"
                      onClick={() => handleQuickFill(SAMPLE_VERIFIED_VIN)}
                      className="text-blue-400 hover:text-blue-300 font-mono hover:underline cursor-pointer"
                    >
                      {SAMPLE_VERIFIED_VIN}
                    </button>
                  </div>
                </div>

              </form>
            </div>

            {/* One Secondary Link: View Sample Report */}
            <div className="pt-1">
              <button
                type="button"
                onClick={onOpenSample}
                className="inline-flex items-center gap-2 text-sm font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer group"
              >
                <FileCheck className="w-4 h-4 text-blue-400" />
                <span className="group-hover:underline">View Sample Report</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform text-slate-400" />
              </button>
            </div>

          </div>

          {/* Right Column: Sample Report Card on Desktop, Below on Mobile */}
          <div className="lg:col-span-5">
            <div className="bg-[#0F172A] border border-slate-700/70 rounded-[12px] p-5 sm:p-6 shadow-md space-y-4">
              
              {/* Clear Sample Report Label */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  SAMPLE REPORT - demo data
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[4px] text-xs font-semibold bg-emerald-950/70 text-emerald-400 border border-emerald-500/40">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>VERIFIED RECORD</span>
                </span>
              </div>

              {/* Stated Model Year Consistent with 10th Character ('L' = 2020) */}
              <div className="space-y-1">
                <p className="text-base font-bold text-white tracking-tight">
                  {SAMPLE_VEHICLE_TITLE}
                </p>
                <p className="text-xs font-mono text-slate-300">
                  VIN: <span className="font-semibold text-white">{SAMPLE_VERIFIED_VIN}</span>
                </p>
                <p className="text-xs text-slate-400">
                  Model Year 2020 (10th VIN Character: &apos;L&apos;)
                </p>
              </div>

              {/* 4 Verified Metric Cards */}
              <div className="grid grid-cols-2 gap-2.5 text-xs pt-1">
                <div className="p-3 bg-[#0B132B] rounded-[8px] border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                    TITLE STATUS
                  </span>
                  <div className="flex items-center gap-1.5 text-white font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Clean</span>
                  </div>
                </div>

                <div className="p-3 bg-[#0B132B] rounded-[8px] border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                    ACCIDENTS
                  </span>
                  <div className="flex items-center gap-1.5 text-white font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>0 Reported</span>
                  </div>
                </div>

                <div className="p-3 bg-[#0B132B] rounded-[8px] border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                    ODOMETER TREND
                  </span>
                  <div className="flex items-center gap-1.5 text-white font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Consistent</span>
                  </div>
                </div>

                <div className="p-3 bg-[#0B132B] rounded-[8px] border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                    SALVAGE / JUNK
                  </span>
                  <div className="flex items-center gap-1.5 text-white font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Clear</span>
                  </div>
                </div>
              </div>

              {/* Sample Card Action */}
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  Full 18-point verification preview
                </span>
                <button
                  type="button"
                  onClick={onOpenSample}
                  className="text-xs font-semibold text-blue-400 hover:text-blue-300 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>Inspect Sample</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
