import React from 'react';
import { 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  Download, 
  FileText, 
  Check, 
  Database,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { OrderStatus } from '../types';

interface OrderTrackingProgressBarProps {
  status: OrderStatus;
  hasResultFile?: boolean;
  orderNumber?: string;
  createdAt?: string;
  updatedAt?: string;
  compact?: boolean;
}

interface StageConfig {
  id: string;
  title: string;
  shortDesc: string;
  fullDesc: string;
  icon: React.ElementType;
}

const STAGES: StageConfig[] = [
  {
    id: 'ordered',
    title: 'Ordered',
    shortDesc: 'Payment & VIN Logged',
    fullDesc: 'Order confirmed and encrypted VIN profile registered.',
    icon: FileText,
  },
  {
    id: 'processing',
    title: 'Processing',
    shortDesc: 'Ingesting Records',
    fullDesc: 'Factory specifications, lien registries, and auction databases queried.',
    icon: Clock,
  },
  {
    id: 'nmvtis_check',
    title: 'NMVTIS Check',
    shortDesc: 'DMV & Title Clearing',
    fullDesc: 'Cross-referencing 50-state DMV databases, salvage brands, and flood records.',
    icon: ShieldCheck,
  },
  {
    id: 'ready',
    title: 'Ready for Download',
    shortDesc: 'PDF Compiled & Sealed',
    fullDesc: 'Tamper-evident official vehicle history report ready for download.',
    icon: Download,
  },
];

export const OrderTrackingProgressBar: React.FC<OrderTrackingProgressBarProps> = ({
  status,
  hasResultFile = false,
  orderNumber,
  createdAt,
  updatedAt,
  compact = false,
}) => {
  // Determine current active stage index (0 to 3)
  // 0: Ordered, 1: Processing, 2: NMVTIS Check, 3: Ready for Download
  let currentStageIndex = 0;
  let isComplete = false;
  let isCancelled = status === 'Cancelled' || status === 'Refunded';

  if (hasResultFile || status === 'Ready' || status === 'Delivered' || status === 'Completed') {
    currentStageIndex = 3;
    isComplete = true;
  } else if (status === 'NMVTIS Check') {
    currentStageIndex = 2;
  } else if (status === 'Processing') {
    currentStageIndex = 2; // In processing, currently verifying NMVTIS & state databases
  } else if (status === 'Paid / New') {
    currentStageIndex = 1; // Ordered complete, now in processing queue
  } else {
    currentStageIndex = 0;
  }

  // Calculate percentage for background progress track fill
  const progressPercent = isCancelled
    ? 100
    : isComplete
    ? 100
    : currentStageIndex === 0
    ? 12
    : currentStageIndex === 1
    ? 40
    : currentStageIndex === 2
    ? 72
    : 100;

  if (isCancelled) {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-xs space-y-1">
        <div className="flex items-center gap-2 text-rose-800 font-bold">
          <span className="w-2 h-2 rounded-full bg-rose-500" />
          <span>Order Status: {status}</span>
        </div>
        <p className="text-rose-700 leading-relaxed">
          This order was cancelled or refunded. If you have questions, please contact support with order number {orderNumber}.
        </p>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl border border-slate-200 ${compact ? 'p-3 sm:p-4 text-xs' : 'p-3.5 sm:p-5'} shadow-xs space-y-3 sm:space-y-4`}>
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-1.5 pb-2 border-b border-slate-100">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-500">
            Fulfillment Progress
          </span>
          <span className="font-mono text-[10px] sm:text-[11px] text-slate-400">
            Stage {isComplete ? '4 of 4' : `${currentStageIndex + 1} of 4`}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {isComplete ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
              <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-600" />
              <span>Ready for Download</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-ping" />
              <span>{STAGES[currentStageIndex].title} in progress</span>
            </span>
          )}
        </div>
      </div>

      {/* Progress Track & Nodes */}
      <div className="relative pt-1.5 pb-1">
        {/* Track Line Background */}
        <div className="absolute top-4 sm:top-5 left-3.5 right-3.5 sm:left-8 sm:right-8 h-1 sm:h-1.5 bg-slate-100 rounded-full" />

        {/* Track Line Active Fill */}
        <div
          className={`absolute top-4 sm:top-5 left-3.5 sm:left-8 h-1 sm:h-1.5 rounded-full transition-all duration-700 ease-out ${
            isComplete
              ? 'bg-gradient-to-r from-emerald-500 to-emerald-600'
              : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500'
          }`}
          style={{ width: `calc(${progressPercent}% - 1.5rem)` }}
        />

        {/* Step Nodes Grid */}
        <div className="relative grid grid-cols-4 gap-1 sm:gap-2">
          {STAGES.map((stage, idx) => {
            const isStageDone = isComplete || idx < currentStageIndex;
            const isStageActive = !isComplete && idx === currentStageIndex;
            const isStagePending = !isComplete && idx > currentStageIndex;
            const Icon = stage.icon;

            return (
              <div key={stage.id} className="flex flex-col items-center text-center group">
                {/* Node Circle */}
                <div
                  className={`w-7 h-7 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all duration-300 z-10 ${
                    isStageDone
                      ? 'bg-emerald-600 text-white shadow-xs ring-2 sm:ring-4 ring-emerald-50'
                      : isStageActive
                      ? 'bg-blue-600 text-white shadow-xs ring-2 sm:ring-4 ring-blue-100 scale-105'
                      : 'bg-white border-2 border-slate-200 text-slate-400'
                  }`}
                >
                  {isStageDone ? (
                    <Check className="w-3.5 h-3.5 sm:w-5 sm:h-5 stroke-[2.5]" />
                  ) : isStageActive ? (
                    <Icon className="w-3.5 h-3.5 sm:w-5 sm:h-5 animate-pulse" />
                  ) : (
                    <span className="text-[10px] sm:text-xs font-mono font-bold">{idx + 1}</span>
                  )}
                </div>

                {/* Stage Title & Short Description */}
                <div className="mt-1.5 sm:mt-2.5 space-y-0.5 px-0.5">
                  <p
                    className={`text-[10px] sm:text-xs md:text-sm font-bold leading-tight ${
                      isStageDone
                        ? 'text-slate-900'
                        : isStageActive
                        ? 'text-blue-700 font-extrabold'
                        : 'text-slate-400'
                    }`}
                  >
                    {stage.title}
                  </p>
                  <p className="hidden sm:block text-[11px] text-slate-500 leading-tight truncate">
                    {stage.shortDesc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Stage Detail Highlight Box */}
      <div
        className={`rounded-xl p-3.5 sm:p-4 text-xs transition-colors flex items-start gap-3 ${
          isComplete
            ? 'bg-emerald-50/80 border border-emerald-200 text-emerald-950'
            : 'bg-blue-50/70 border border-blue-200 text-slate-800'
        }`}
      >
        <div
          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
            isComplete
              ? 'bg-emerald-600 text-white'
              : 'bg-blue-600 text-white'
          }`}
        >
          {isComplete ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : (
            <Database className="w-4 h-4 animate-spin-slow" />
          )}
        </div>

        <div className="flex-1 space-y-1">
          <div className="flex flex-wrap items-center justify-between gap-1">
            <span className="font-bold text-xs uppercase tracking-wide">
              {isComplete ? 'All 4 Stages Complete' : `Current Stage: ${STAGES[currentStageIndex].title}`}
            </span>
            <span className="text-[11px] font-mono text-slate-500">
              {isComplete
                ? 'Report verified & ready'
                : 'Est. Delivery: 15–30 mins'}
            </span>
          </div>

          <p className="text-xs leading-relaxed text-slate-600">
            {isComplete
              ? 'Official NMVTIS and title clearing verification completed successfully. Encrypted PDF report is generated and ready for instant viewing or download.'
              : STAGES[currentStageIndex].fullDesc}
          </p>

          {!isComplete && currentStageIndex === 2 && (
            <div className="pt-1 flex items-center gap-1.5 text-[11px] text-blue-700 font-medium font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
              <span>Querying NMVTIS, AAMVA, and state DMV clearinghouses...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
