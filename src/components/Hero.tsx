import React, { useState } from 'react';
import { Search, ShieldCheck, CheckCircle2, ArrowRight, Car, Lock, Zap, Shield, FileCheck, Check, FileText } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { WhatsAppButton } from './WhatsAppButton';

interface HeroProps {
  onStartOrderWithVin: (vin: string, isVin: boolean) => void;
  onOpenSample: () => void;
  onRequestReport?: () => void;
}

// Standard ISO 3779 VIN: 17 alphanumeric characters, excluding I, O, Q
const VIN_REGEX = /^[A-HJ-NPR-Z0-9]{17}$/i;

export const Hero: React.FC<HeroProps> = ({ onStartOrderWithVin, onOpenSample, onRequestReport }) => {
  const { showToast } = useToast();
  const [vinInput, setVinInput] = useState('');
  const [inputType, setInputType] = useState<'vin' | 'plate'>('vin');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState(false);

  const triggerShake = (message: string) => {
    setErrorMessage(message);
    setIsShaking(true);
    showToast({
      type: 'warning',
      title: 'Invalid Vehicle Identifier',
      message,
      duration: 4000,
    });
    setTimeout(() => {
      setIsShaking(false);
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
    <section id="hero" className="relative pt-12 pb-20 overflow-hidden bg-gradient-to-b from-[#0B132B] via-[#0B132B] to-[#0F172A] text-white">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Eyebrow, Headline, Copy, CTAs & Search Panel (Sections 6 & 7) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0F172A] border border-[#334155] text-xs font-bold text-emerald-400 tracking-wider uppercase">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>VERIFIED VEHICLE INFORMATION</span>
            </div>

            {/* Headline with -1.2px negative letter-spacing per Acme.ai Display MD Strong rule */}
            <h1 className="text-4xl sm:text-5xl lg:text-[54px] font-extrabold tracking-[-1.2px] text-white leading-[1.15] text-balance">
              Uncover Any Vehicle’s True History{' '}
              <span className="text-[#10B981]">Before You Buy</span>
            </h1>

            {/* Supporting Copy */}
            <p className="text-base sm:text-lg text-slate-300 max-w-2xl leading-[1.6]">
              Get the information you need to make a more informed vehicle purchase with a clear, easy-to-understand vehicle history report.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => onStartOrderWithVin('1HGCM82633A004352', true)}
                className="px-6 py-3 rounded-[8px] text-sm font-medium bg-[#FB2C36] hover:bg-[#E0242E] text-white shadow-[0_1px_2px_rgba(0,0,0,0.05)] transition-all duration-150 flex items-center gap-2 cursor-pointer active:scale-95 leading-[1.43]"
              >
                <span>Get Your Report</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={onOpenSample}
                className="px-5 py-3 rounded-[8px] text-sm font-medium bg-[#0F172A] hover:bg-[#1E293B] text-slate-200 border border-[#334155] transition-colors flex items-center gap-2 cursor-pointer leading-[1.43]"
              >
                <FileCheck className="w-4 h-4 text-emerald-400" />
                <span>View Sample Report</span>
              </button>

              <WhatsAppButton
                variant="secondary"
                source="hero"
                intent="vin_check"
                label="WhatsApp Chat"
                className="px-4 py-3 rounded-[8px] bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 border-emerald-800/80 font-medium text-sm leading-[1.43]"
              />
            </div>

            {/* Section 7: Vehicle Search / Order Component (Card radius = 14px) */}
            <div className={`mt-4 bg-[#0F172A]/90 border border-[#334155] rounded-[14px] p-4 sm:p-5 md:p-6 shadow-2xl backdrop-blur-sm max-w-xl transition-all ${isShaking ? 'animate-shake border-rose-500' : ''}`}>
              
              {/* Tabs (8px button radius) */}
              <div className="flex items-center gap-1.5 sm:gap-2 mb-3 sm:mb-4">
                <button
                  type="button"
                  onClick={() => setInputType('vin')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-[8px] transition-colors cursor-pointer leading-[1.43] ${
                    inputType === 'vin'
                      ? 'bg-[#FB2C36] text-white shadow-[0_1px_2px_rgba(0,0,0,0.05)]'
                      : 'text-slate-400 hover:text-white bg-[#0B132B]'
                  }`}
                >
                  By 17-Digit VIN
                </button>
                <button
                  type="button"
                  onClick={() => setInputType('plate')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-[8px] transition-colors cursor-pointer leading-[1.43] ${
                    inputType === 'plate'
                      ? 'bg-[#FB2C36] text-white shadow-[0_1px_2px_rgba(0,0,0,0.05)]'
                      : 'text-slate-400 hover:text-white bg-[#0B132B]'
                  }`}
                >
                  By License / Reg No
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
                    placeholder={inputType === 'vin' ? 'Enter 17-digit VIN' : 'Enter Reg Plate'}
                    maxLength={inputType === 'vin' ? 17 : 20}
                    className="w-full pl-9 sm:pl-10 pr-26 sm:pr-30 py-2.5 sm:py-3 bg-[#0B132B] border border-[#334155] rounded-[8px] text-white placeholder-slate-400 font-mono text-xs sm:text-sm tracking-wider uppercase focus:outline-none focus:border-[#FB2C36] transition-colors"
                  />

                  <div className="absolute inset-y-1 sm:inset-y-1.5 right-1 sm:right-1.5">
                    <button
                      type="submit"
                      className="h-full px-3 sm:px-4 rounded-[8px] bg-[#FB2C36] hover:bg-[#E0242E] text-white text-xs font-medium flex items-center gap-1 sm:gap-1.5 transition-colors cursor-pointer shadow-[0_1px_2px_rgba(0,0,0,0.05)] active:scale-95 leading-[1.43]"
                    >
                      <span>Order Report</span>
                      <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    </button>
                  </div>
                </div>

                {errorMessage && (
                  <p className="text-[11px] sm:text-xs text-rose-400 font-medium">
                    {errorMessage}
                  </p>
                )}

                {/* Quick Examples */}
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 pt-0.5 sm:pt-1 text-[10px] sm:text-[11px] text-slate-400">
                  <span className="text-slate-500">Quick Test VINs:</span>
                  <button
                    type="button"
                    onClick={() => handleQuickFill('1HGCM82633A004352')}
                    className="text-emerald-400 hover:underline font-mono cursor-pointer"
                  >
                    1HGCM82633A004352
                  </button>
                  <span aria-hidden="true">·</span>
                  <button
                    type="button"
                    onClick={() => handleQuickFill('WAUZZZF45LA019283')}
                    className="text-blue-400 hover:underline font-mono cursor-pointer"
                  >
                    Audi A4
                  </button>
                </div>

                {/* Trust Message & WhatsApp Quick Link Below */}
                <div className="pt-2.5 border-t border-[#334155]/60 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10.5px] sm:text-xs text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <Lock className="w-3 h-3 text-emerald-400 shrink-0" />
                    <span>Secure checkout • Fast email delivery</span>
                  </div>
                  <WhatsAppButton
                    variant="text"
                    source="hero"
                    intent="vin_check"
                    label="Need VIN Help? Chat on WhatsApp"
                    className="text-emerald-400 hover:text-emerald-300 font-medium text-[11px]"
                  />
                </div>
              </form>

              {/* Customer Intake Specification Link */}
              {onRequestReport && (
                <div className="pt-3 border-t border-[#334155]/60 flex items-center justify-between text-xs">
                  <span className="text-slate-400 text-[11px]">Need custom verification or full customer intake?</span>
                  <button
                    type="button"
                    onClick={onRequestReport}
                    className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Request Vehicle Report Form →</span>
                  </button>
                </div>
              )}

            </div>

          </div>

          {/* Right Column: Hero Right — Vehicle Report Preview (Section 8) (Card radius = 14px) */}
          <div className="lg:col-span-5">
            <div className="bg-[#0F172A] border border-[#334155] rounded-[14px] p-5 sm:p-6 shadow-2xl space-y-5">
              
              {/* Header with Title and Verified Badge */}
              <div className="flex items-center justify-between pb-3.5 border-b border-[#334155]">
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
                <p className="text-xs text-slate-300 mt-0.5">
                  2020 Honda Accord Touring 2.0T
                </p>
              </div>

              {/* Generic Premium Car Silhouette */}
              <div className="relative h-28 bg-[#0B132B] rounded-[8px] border border-[#334155]/80 flex items-center justify-center overflow-hidden">
                <svg
                  viewBox="0 0 200 70"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-44 h-auto opacity-75 drop-shadow-sm"
                >
                  {/* Roofline and body contours of premium modern sports sedan */}
                  <path
                    d="M20 50 C30 48, 45 46, 60 38 C75 30, 95 24, 125 24 C145 24, 160 32, 175 42 C185 48, 192 50, 195 52 L190 56 C170 56, 160 56, 150 56 C145 52, 140 50, 130 50 C120 50, 115 52, 110 56 L85 56 C80 52, 75 50, 65 50 C55 50, 50 52, 45 56 L15 56 Z"
                    fill="#1E293B"
                    stroke="#475569"
                    strokeWidth="1.5"
                  />
                  {/* Windshield & Windows */}
                  <path
                    d="M68 37 C80 31, 95 27, 122 27 C138 27, 150 33, 160 41 L120 41 C95 41, 80 41, 68 37 Z"
                    fill="#0F172A"
                  />
                  {/* Wheels */}
                  <circle cx="65" cy="54" r="10" fill="#0B132B" stroke="#64748B" strokeWidth="2" />
                  <circle cx="65" cy="54" r="4" fill="#10B981" />
                  <circle cx="130" cy="54" r="10" fill="#0B132B" stroke="#64748B" strokeWidth="2" />
                  <circle cx="130" cy="54" r="4" fill="#10B981" />
                  {/* Headlight glow */}
                  <polygon points="188,48 196,51 190,53" fill="#10B981" opacity="0.9" />
                </svg>
                <span className="absolute bottom-2 right-3 text-[10px] text-slate-500 font-mono">
                  DEMO RECORD
                </span>
              </div>

              {/* 4 Metric Cards with Green Check Indicators (8px radius) */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                
                {/* Metric 1 */}
                <div className="p-3 bg-[#0B132B] rounded-[8px] border border-[#334155]/80 space-y-1">
                  <span className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase block">
                    TITLE RECORD
                  </span>
                  <div className="flex items-center gap-1.5 text-white font-bold text-sm">
                    <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
                    <span>Clean</span>
                  </div>
                </div>

                {/* Metric 2 */}
                <div className="p-3 bg-[#0B132B] rounded-[8px] border border-[#334155]/80 space-y-1">
                  <span className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase block">
                    REPORTED ACCIDENTS
                  </span>
                  <div className="flex items-center gap-1.5 text-white font-bold text-sm">
                    <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
                    <span>0</span>
                  </div>
                </div>

                {/* Metric 3 */}
                <div className="p-3 bg-[#0B132B] rounded-[8px] border border-[#334155]/80 space-y-1">
                  <span className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase block">
                    ODOMETER TREND
                  </span>
                  <div className="flex items-center gap-1.5 text-white font-bold text-sm">
                    <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
                    <span>Consistent</span>
                  </div>
                </div>

                {/* Metric 4 */}
                <div className="p-3 bg-[#0B132B] rounded-[8px] border border-[#334155]/80 space-y-1">
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
                  className="text-xs font-semibold text-slate-300 hover:text-white inline-flex items-center gap-1.5 transition-colors cursor-pointer group"
                >
                  <span>Sample Report Preview</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
