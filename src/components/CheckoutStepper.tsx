import React from 'react';
import { Check, Layers, Car, User, CreditCard, ShieldCheck } from 'lucide-react';

export interface CheckoutStepItem {
  number: number;
  label: string;
  shortLabel: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const CHECKOUT_STEPS: CheckoutStepItem[] = [
  {
    number: 1,
    label: 'Select Plan',
    shortLabel: 'Plan',
    description: 'Tier & pricing',
    icon: Layers
  },
  {
    number: 2,
    label: 'VIN Entry',
    shortLabel: 'VIN Entry',
    description: 'Vehicle identifier',
    icon: Car
  },
  {
    number: 3,
    label: 'Customer Info',
    shortLabel: 'Contact',
    description: 'Email & delivery',
    icon: User
  },
  {
    number: 4,
    label: 'Payment Details',
    shortLabel: 'Payment',
    description: 'Encrypted checkout',
    icon: CreditCard
  },
  {
    number: 5,
    label: 'Confirmation',
    shortLabel: 'Confirmed',
    description: 'Order confirmed',
    icon: ShieldCheck
  }
];

interface CheckoutStepperProps {
  currentStep: number;
  onStepClick?: (step: number) => void;
  className?: string;
}

export const CheckoutStepper: React.FC<CheckoutStepperProps> = ({
  currentStep,
  onStepClick,
  className = ''
}) => {
  const totalSteps = CHECKOUT_STEPS.length;
  // Progress percentage calculation
  const progressPercent = Math.min(100, Math.max(0, ((currentStep - 1) / (totalSteps - 1)) * 100));

  const currentStepItem = CHECKOUT_STEPS.find(s => s.number === currentStep) || CHECKOUT_STEPS[0];

  return (
    <div className={`bg-[#0B132B] border-b border-[#1E293B] px-3.5 sm:px-6 py-2.5 sm:py-3.5 select-none ${className}`}>
      {/* Desktop / Tablet Horizontal Stepper */}
      <div className="relative">
        {/* Background Connecting Track Line */}
        <div 
          className="hidden sm:block absolute top-4 left-6 right-6 h-0.5 bg-slate-800 -translate-y-1/2 z-0"
          aria-hidden="true"
        >
          {/* Animated Active Progress Fill Bar */}
          <div 
            className="h-full bg-gradient-to-r from-emerald-500 via-blue-500 to-[#FB2C36] transition-all duration-300 ease-out"
            style={{ 
              width: `${progressPercent}%`,
              background: currentStep === 5 ? '#059669' : undefined 
            }}
          />
        </div>

        {/* Stepper Milestones Grid */}
        <div className="hidden sm:flex items-center justify-between relative z-10">
          {CHECKOUT_STEPS.map((stepItem) => {
            const isCompleted = stepItem.number < currentStep || (currentStep === 5 && stepItem.number === 5);
            const isCurrent = stepItem.number === currentStep && currentStep !== 5;
            const isClickable = onStepClick && stepItem.number < currentStep && currentStep !== 5;
            const Icon = stepItem.icon;

            return (
              <button
                key={stepItem.number}
                type="button"
                disabled={!isClickable}
                onClick={() => isClickable && onStepClick(stepItem.number)}
                className={`flex flex-col items-center group transition-all ${
                  isClickable ? 'cursor-pointer' : 'cursor-default'
                }`}
                title={
                  isClickable
                    ? `Return to Step ${stepItem.number}: ${stepItem.label}`
                    : `Step ${stepItem.number}: ${stepItem.label}`
                }
              >
                {/* Step Circle Badge */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200 border-2 ${
                    isCompleted
                      ? 'bg-emerald-600 border-emerald-500 text-white shadow-xs group-hover:scale-105'
                      : isCurrent
                      ? 'bg-[#FB2C36] border-white text-white shadow-lg ring-4 ring-[#FB2C36]/30 scale-105'
                      : 'bg-slate-900 border-slate-700 text-slate-400'
                  }`}
                >
                  {isCompleted ? (
                    <Check className="w-4 h-4 stroke-[3]" />
                  ) : (
                    <Icon className="w-3.5 h-3.5" />
                  )}
                </div>

                {/* Step Labels */}
                <div className="mt-1.5 text-center">
                  <span
                    className={`block text-[11px] font-bold tracking-tight transition-colors ${
                      isCompleted
                        ? 'text-emerald-400 group-hover:text-emerald-300'
                        : isCurrent
                        ? 'text-white'
                        : 'text-slate-400'
                    }`}
                  >
                    {stepItem.label}
                  </span>
                  <span
                    className={`hidden md:block text-[9.5px] font-mono leading-tight ${
                      isCurrent ? 'text-slate-300' : 'text-slate-500'
                    }`}
                  >
                    {isCompleted ? '✓ Completed' : isCurrent ? 'Active' : stepItem.description}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Mobile View: Compact Single Step & Progress Pill */}
        <div className="sm:hidden space-y-2">
          {/* Top Line: Active Step Title & Step Indicator */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                currentStep === 5 ? 'bg-emerald-600 text-white' : 'bg-[#FB2C36] text-white'
              }`}>
                {currentStep === 5 ? '✓' : currentStep}
              </span>
              <div>
                <span className="text-[10px] text-slate-400 font-mono block uppercase tracking-wider">
                  Step {currentStep} of {totalSteps}
                </span>
                <span className="text-xs font-bold text-white block">
                  {currentStepItem.label}
                </span>
              </div>
            </div>

            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              {Math.round(progressPercent)}% Done
            </span>
          </div>

          {/* Mobile Track Bar */}
          <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ease-out ${
                currentStep === 5 ? 'bg-emerald-500' : 'bg-gradient-to-r from-blue-500 to-[#FB2C36]'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Clickable breadcrumbs for previous steps on mobile */}
          {currentStep > 1 && currentStep < 5 && onStepClick && (
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 pt-0.5 overflow-x-auto">
              <span className="shrink-0 text-slate-500">Go to:</span>
              {CHECKOUT_STEPS.filter(s => s.number < currentStep).map((s) => (
                <button
                  key={s.number}
                  type="button"
                  onClick={() => onStepClick(s.number)}
                  className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded text-[9.5px] font-mono shrink-0 cursor-pointer"
                >
                  ← {s.shortLabel}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
