import React from 'react';
import { CheckCircle2, ShieldCheck, Car, User, FileText, Check, Sparkles } from 'lucide-react';

export interface IntakeProgressStats {
  percentage: number;
  contactFilled: boolean;
  vehicleFilled: boolean;
  scopeFilled: boolean;
  consentFilled: boolean;
  currentStepMessage: string;
}

interface IntakeProgressBarProps {
  stats: IntakeProgressStats;
  currentStep: number;
  totalSteps?: number;
  onSelectStep?: (step: number) => void;
  isGoogleFormMode?: boolean;
  onToggleFormMode?: (mode: 'direct' | 'google') => void;
}

export const IntakeProgressBar: React.FC<IntakeProgressBarProps> = ({
  stats,
  currentStep,
  onSelectStep,
  isGoogleFormMode = false,
  onToggleFormMode
}) => {
  const { percentage, contactFilled, vehicleFilled, scopeFilled, consentFilled, currentStepMessage } = stats;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-3.5 sm:p-4 shadow-xs space-y-3">
      {/* Top Bar: Title & Percentage */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-[#059669] flex items-center justify-center font-bold text-xs">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <span>Form Completion Progress</span>
              <span className="text-[10px] px-1.5 py-0.2 bg-slate-100 rounded text-slate-500 font-mono">
                {percentage}%
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              {currentStepMessage}
            </p>
          </div>
        </div>

        {/* Mode Toggle if provided */}
        {onToggleFormMode && (
          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-[11px]">
            <button
              type="button"
              onClick={() => onToggleFormMode('direct')}
              className={`px-2 py-1 rounded font-medium transition-all cursor-pointer ${
                !isGoogleFormMode
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Intake Form
            </button>
            <button
              type="button"
              onClick={() => onToggleFormMode('google')}
              className={`px-2 py-1 rounded font-medium transition-all cursor-pointer flex items-center gap-1 ${
                isGoogleFormMode
                  ? 'bg-[#059669] text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:text-[#059669]'
              }`}
            >
              <span>Google Form</span>
            </button>
          </div>
        )}
      </div>

      {/* Progress Track & Fill */}
      <div className="space-y-1">
        <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/80">
          <div
            className={`h-full rounded-full transition-all duration-300 ease-out ${
              percentage === 100
                ? 'bg-gradient-to-r from-emerald-500 to-emerald-600'
                : percentage >= 60
                ? 'bg-gradient-to-r from-blue-600 to-emerald-500'
                : 'bg-gradient-to-r from-blue-500 to-blue-600'
            }`}
            style={{ width: `${Math.max(5, Math.min(100, percentage))}%` }}
          />
        </div>
      </div>

      {/* Checklist Badges for Sections */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-0.5">
        <button
          type="button"
          onClick={() => onSelectStep?.(1)}
          className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[11px] border text-left transition-colors cursor-pointer ${
            contactFilled
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : currentStep === 1
              ? 'bg-blue-50 text-blue-800 border-blue-200 font-semibold'
              : 'bg-slate-50 text-slate-500 border-slate-200'
          }`}
        >
          {contactFilled ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          ) : (
            <User className="w-3.5 h-3.5 shrink-0 opacity-70" />
          )}
          <span className="truncate">1. Contact Info</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectStep?.(2)}
          className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[11px] border text-left transition-colors cursor-pointer ${
            vehicleFilled
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : currentStep === 2
              ? 'bg-blue-50 text-blue-800 border-blue-200 font-semibold'
              : 'bg-slate-50 text-slate-500 border-slate-200'
          }`}
        >
          {vehicleFilled ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          ) : (
            <Car className="w-3.5 h-3.5 shrink-0 opacity-70" />
          )}
          <span className="truncate">2. Vehicle Details</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectStep?.(3)}
          className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[11px] border text-left transition-colors cursor-pointer ${
            scopeFilled
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : currentStep === 3
              ? 'bg-blue-50 text-blue-800 border-blue-200 font-semibold'
              : 'bg-slate-50 text-slate-500 border-slate-200'
          }`}
        >
          {scopeFilled ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          ) : (
            <FileText className="w-3.5 h-3.5 shrink-0 opacity-70" />
          )}
          <span className="truncate">3. Scope & Type</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectStep?.(5)}
          className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[11px] border text-left transition-colors cursor-pointer ${
            consentFilled
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : currentStep === 5
              ? 'bg-blue-50 text-blue-800 border-blue-200 font-semibold'
              : 'bg-slate-50 text-slate-500 border-slate-200'
          }`}
        >
          {consentFilled ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          ) : (
            <ShieldCheck className="w-3.5 h-3.5 shrink-0 opacity-70" />
          )}
          <span className="truncate">4. Consent & Submit</span>
        </button>
      </div>
    </div>
  );
};
