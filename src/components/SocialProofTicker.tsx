import React, { useState, useEffect } from 'react';
import { ShieldCheck, Sparkles, CheckCircle2, Clock, Car } from 'lucide-react';

interface TickerItem {
  id: string;
  name: string;
  location: string;
  vehicle: string;
  action: string;
  timeAgo: string;
  badge: string;
}

const DEFAULT_ACTIVITIES: TickerItem[] = [
  {
    id: '1',
    name: 'Marcus T.',
    location: 'Dallas, TX',
    vehicle: '2021 Ford F-150 XLT',
    action: 'Requested Certified History Report',
    timeAgo: '2 mins ago',
    badge: 'Clean Title Verified',
  },
  {
    id: '2',
    name: 'Elena R.',
    location: 'Los Angeles, CA',
    vehicle: '2020 Honda Civic EX',
    action: 'Verified NMVTIS & Odometer Records',
    timeAgo: '4 mins ago',
    badge: '0 Accidents Reported',
  },
  {
    id: '3',
    name: 'David K.',
    location: 'Miami, FL',
    vehicle: '2019 BMW 330i xDrive',
    action: 'Scanned Salvage, Theft & Flood Database',
    timeAgo: '7 mins ago',
    badge: 'No Flood / Salvage',
  },
  {
    id: '4',
    name: 'Sarah L.',
    location: 'Brooklyn, NY',
    vehicle: '2022 Toyota RAV4 XLE',
    action: 'Checked Multi-Owner History & Liens',
    timeAgo: '11 mins ago',
    badge: '1-Owner Verified',
  },
  {
    id: '5',
    name: 'Carlos M.',
    location: 'Phoenix, AZ',
    vehicle: '2023 Chevrolet Silverado 1500',
    action: 'Requested Official Vehicle Report',
    timeAgo: '14 mins ago',
    badge: 'Passed NMVTIS Audit',
  },
  {
    id: '6',
    name: 'Amanda W.',
    location: 'Chicago, IL',
    vehicle: '2021 Jeep Grand Cherokee Limited',
    action: 'Verified Structural Damage & Airbag Deployment',
    timeAgo: '18 mins ago',
    badge: 'Structural Integrity Clear',
  },
];

interface SocialProofTickerProps {
  className?: string;
  compact?: boolean;
}

export const SocialProofTicker: React.FC<SocialProofTickerProps> = ({
  className = '',
  compact = false,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % DEFAULT_ACTIVITIES.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [isPaused]);

  const current = DEFAULT_ACTIVITIES[currentIndex];

  if (compact) {
    return (
      <div 
        className={`bg-[#0A1628] border-y border-[rgba(148,163,184,0.15)] py-2 px-4 overflow-hidden text-xs ${className}`}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
          <div className="flex items-center gap-2 shrink-0">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10B981] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#10B981]"></span>
            </span>
            <span className="text-[11px] font-bold text-[#10B981] tracking-wider uppercase flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-[#10B981]" />
              Live Activity
            </span>
          </div>

          <div className="flex items-center gap-2 text-slate-300 truncate transition-opacity duration-300">
            <span className="font-semibold text-white">{current.name}</span>
            <span className="text-slate-400 hidden sm:inline">({current.location})</span>
            <span className="text-slate-400">•</span>
            <span className="text-blue-300 font-medium">{current.vehicle}</span>
            <span className="text-slate-400 hidden md:inline">— {current.action}</span>
          </div>

          <div className="flex items-center gap-2 shrink-0 text-[11px]">
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-medium hidden sm:inline">
              {current.badge}
            </span>
            <span className="text-slate-400 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {current.timeAgo}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`rounded-xl bg-[#0F1B2D]/90 border border-[rgba(148,163,184,0.20)] p-3 sm:p-4 shadow-lg transition-all ${className}`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Left header / status */}
        <div className="flex items-center gap-2.5">
          <div className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10B981] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#10B981]"></span>
          </div>
          <span className="text-[11px] sm:text-xs font-bold text-[#10B981] uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-[#10B981]" />
            Recent Customer Activity
          </span>
          <span className="text-slate-400 text-xs hidden md:inline">• Real-time verifications</span>
        </div>

        {/* Right Counter */}
        <div className="text-[11px] text-slate-400 flex items-center gap-2 self-start sm:self-auto">
          <span className="bg-[#0B132B] px-2 py-0.5 rounded border border-slate-700 font-mono text-emerald-400">
            {currentIndex + 1} / {DEFAULT_ACTIVITIES.length}
          </span>
          <span>Updated continuously</span>
        </div>
      </div>

      {/* Dynamic Activity Card Content */}
      <div className="mt-3 pt-3 border-t border-[rgba(148,163,184,0.12)] flex flex-col md:flex-row md:items-center justify-between gap-2.5">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#2563EB]/15 border border-[#2563EB]/30 flex items-center justify-center shrink-0 text-blue-400">
            <Car className="w-4 h-4" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-x-2 text-xs sm:text-sm">
              <span className="font-bold text-white">{current.name}</span>
              <span className="text-slate-400 text-xs">({current.location})</span>
              <span className="text-slate-400 hidden sm:inline">•</span>
              <span className="text-emerald-400 font-semibold">{current.vehicle}</span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              {current.action}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end md:self-auto shrink-0 text-xs">
          <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 font-semibold text-[11px] flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-[#10B981]" />
            {current.badge}
          </span>
          <span className="text-slate-400 text-[11px] flex items-center gap-1 pl-1">
            <Clock className="w-3 h-3 text-slate-400" />
            {current.timeAgo}
          </span>
        </div>
      </div>
    </div>
  );
};
