import React from 'react';
import { CheckCircle2, ShieldAlert, FileText, Send, Sparkles } from 'lucide-react';

interface Step {
  number: number;
  title: string;
  subtitle: string;
  status: 'active' | 'upcoming' | 'completed';
  icon: React.ReactNode;
}

interface ProgressStepperProps {
  currentStep?: number;
  className?: string;
}

export const ProgressStepper: React.FC<ProgressStepperProps> = ({
  currentStep = 1,
  className = '',
}) => {
  const steps: Step[] = [
    {
      number: 1,
      title: 'Vehicle & Contact Details',
      subtitle: 'Complete intake form below',
      status: currentStep === 1 ? 'active' : currentStep > 1 ? 'completed' : 'upcoming',
      icon: <FileText className="w-4 h-4" />,
    },
    {
      number: 2,
      title: 'Vehicle Records Scan',
      subtitle: 'Title status, salvage & history check',
      status: currentStep === 2 ? 'active' : currentStep > 2 ? 'completed' : 'upcoming',
      icon: <ShieldAlert className="w-4 h-4" />,
    },
    {
      number: 3,
      title: 'Report Delivery',
      subtitle: 'PDF report sent to your email',
      status: currentStep === 3 ? 'active' : currentStep > 3 ? 'completed' : 'upcoming',
      icon: <Send className="w-4 h-4" />,
    },
  ];

  return (
    <div className={`w-full rounded-2xl bg-[#0F1B2D]/95 border border-[rgba(148,163,184,0.20)] p-4 sm:p-6 shadow-xl ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 mb-4 border-b border-[rgba(148,163,184,0.12)]">
        <div>
          <span className="text-[11px] font-bold text-[#10B981] uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            Report Request Workflow
          </span>
          <h3 className="text-sm sm:text-base font-bold text-white mt-0.5">
            How Your Vehicle Audit Is Processed
          </h3>
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0B132B] border border-slate-700 text-xs text-slate-300 self-start sm:self-auto">
          <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse"></span>
          <span>Step {currentStep} of 3 in progress</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative">
        {steps.map((step, idx) => {
          const isActive = step.status === 'active';
          const isCompleted = step.status === 'completed';

          return (
            <div
              key={step.number}
              className={`relative rounded-xl p-3.5 sm:p-4 border transition-all ${
                isActive
                  ? 'bg-[#162740]/80 border-[#2563EB]/50 shadow-[0_0_15px_rgba(37,99,235,0.15)] ring-1 ring-[#2563EB]/30'
                  : isCompleted
                  ? 'bg-[#0B132B]/80 border-emerald-500/30 text-slate-400'
                  : 'bg-[#0B132B]/50 border-slate-800 text-slate-500'
              }`}
            >
              {/* Top Step Number Badge & Status */}
              <div className="flex items-center justify-between mb-2.5">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                    isActive
                      ? 'bg-[#2563EB] text-white shadow-md'
                      : isCompleted
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : step.number}
                </div>

                <span
                  className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    isActive
                      ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                      : isCompleted
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {isActive ? 'Current Step' : isCompleted ? 'Completed' : 'Next Step'}
                </span>
              </div>

              {/* Title & Subtitle */}
              <div className="space-y-1">
                <h4
                  className={`text-xs sm:text-sm font-bold flex items-center gap-1.5 ${
                    isActive ? 'text-white' : isCompleted ? 'text-slate-200' : 'text-slate-400'
                  }`}
                >
                  {step.title}
                </h4>
                <p className="text-[11px] sm:text-xs text-slate-400 leading-snug">
                  {step.subtitle}
                </p>
              </div>

              {/* Step indicator arrow for desktop */}
              {idx < steps.length - 1 && (
                <div className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 z-10 text-slate-600">
                  →
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
