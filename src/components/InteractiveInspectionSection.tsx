import React, { useState } from 'react';
import { 
  ShieldCheck, CheckCircle2, Eye, ZoomIn, 
  Sparkles, Wrench, ArrowRight, Check, Maximize2, X, Lock, FileCheck, Layers
} from 'lucide-react';
import { WhatsAppButton } from './WhatsAppButton';

interface InteractiveInspectionSectionProps {
  onStartOrderWithVin: (vin: string, isVin: boolean) => void;
  onOpenSample: () => void;
}

interface InspectionViewPoint {
  id: string;
  tabLabel: string;
  badge: string;
  title: string;
  subtitle: string;
  image: string;
  category: string;
  status: 'Verified Clear' | 'Certified OEM' | 'Pass - No Defects';
  hotspots: {
    id: string;
    x: number; // percentage
    y: number; // percentage
    label: string;
    detail: string;
    status: 'pass' | 'verified';
  }[];
  telemetry: {
    label: string;
    value: string;
    subtext: string;
  }[];
}

const INSPECTION_VIEWS: InspectionViewPoint[] = [
  {
    id: 'paint-finish',
    tabLabel: 'Paint & Body Finish',
    badge: 'Surface Integrity',
    title: 'Micro-Finish & Collision Re-Spray Audit',
    subtitle: 'High-intensity optical inspection detects undisclosed repainting, body filler, structural seam repairs, and panel replacements.',
    image: '/images/inspection/paint-inspection.jpg',
    category: 'Exterior Surface Telemetry',
    status: 'Verified Clear',
    hotspots: [
      {
        id: 'hs-clearcoat',
        x: 42,
        y: 48,
        label: 'Clearcoat & Swirl Analysis',
        detail: 'Original factory clearcoat verified. Uniform 118μm thickness with no overspray or masking lines.',
        status: 'verified',
      },
      {
        id: 'hs-panel',
        x: 68,
        y: 35,
        label: 'A-Pillar & Fender Seam',
        detail: 'Robotic factory seam welds intact. No collision pull marks or panel alignment deviations.',
        status: 'pass',
      },
      {
        id: 'hs-light',
        x: 78,
        y: 20,
        label: 'Optical Flashlight Audit',
        detail: 'Surface uniformity certified across 8 inspection quadrants under 5500K inspection lighting.',
        status: 'verified',
      },
    ],
    telemetry: [
      { label: 'Paint Depth', value: '118 μm', subtext: 'Factory OEM Spec (105-130μm)' },
      { label: 'Collision Repair', value: '0 Detected', subtext: 'No body filler or aftermarket welds' },
      { label: 'Panel Alignment', value: '±0.4 mm', subtext: 'Within strict factory tolerances' },
      { label: 'Title Brand Check', value: 'Clean', subtext: 'Zero salvage or total loss records' },
    ],
  },
  {
    id: 'engine-bay',
    tabLabel: 'Engine & Mechanical',
    badge: 'Powertrain Verification',
    title: 'Mechanical Integrity & Engine Bay Review',
    subtitle: 'Dual-technician inspection cross-verifying factory VIN stampings, engine fluid records, and mechanical maintenance history.',
    image: '/images/inspection/engine-inspection.jpg',
    category: 'Powertrain & Mechanical',
    status: 'Pass - No Defects',
    hotspots: [
      {
        id: 'hs-block',
        x: 52,
        y: 65,
        label: 'Engine Block & VIN Stamping',
        detail: 'Factory engine serial number matches NMVTIS build registry records. No engine swap detected.',
        status: 'verified',
      },
      {
        id: 'hs-fluids',
        x: 35,
        y: 52,
        label: 'Fluid Lines & Cooling Core',
        detail: 'Coolant and hydraulic brake lines verified dry with no thermal stress cracks or leaks.',
        status: 'pass',
      },
      {
        id: 'hs-paper',
        x: 64,
        y: 40,
        label: 'Service Documentation',
        detail: 'Complete dealership maintenance log with 12 scheduled service checkpoints registered.',
        status: 'verified',
      },
    ],
    telemetry: [
      { label: 'Powertrain Match', value: '100% OEM', subtext: 'Original numbers-matching assembly' },
      { label: 'Service History', value: '12 Logs', subtext: 'Certified dealer oil & fluid records' },
      { label: 'Flood / Water Risk', value: '0% None', subtext: 'No corrosion or silt in electrical looms' },
      { label: 'ECU Tamper Check', value: 'Intact', subtext: 'Odometer mileage sync confirmed' },
    ],
  },
  {
    id: 'headlight-optics',
    tabLabel: 'Lighting & Electronics',
    badge: 'Front-End Assembly',
    title: 'Headlight Assembly & Crash Impact Check',
    subtitle: 'Detailed inspection of front clip components, LED light modules, and radiator support structures where minor impacts hide.',
    image: '/images/inspection/headlight-inspection.jpg',
    category: 'Optical & Electrical Integrity',
    status: 'Certified OEM',
    hotspots: [
      {
        id: 'hs-lens',
        x: 55,
        y: 45,
        label: 'OEM Matrix LED Cluster',
        detail: 'Original factory manufacture stamp date matches vehicle build month. No aftermarket replacement.',
        status: 'verified',
      },
      {
        id: 'hs-bumper',
        x: 82,
        y: 60,
        label: 'Bumper Fascia Gap',
        detail: 'Gap variance under 0.3mm across hood interface. No impact clip fracture detected.',
        status: 'pass',
      },
      {
        id: 'hs-radiator',
        x: 25,
        y: 35,
        label: 'Core Support Member',
        detail: 'Radiator support framework free from impact folds, clamp marks, or paint discoloration.',
        status: 'verified',
      },
    ],
    telemetry: [
      { label: 'Headlight Module', value: 'Factory OEM', subtext: 'Original date stamp matches VIN' },
      { label: 'Front Clip Impact', value: 'None', subtext: 'Airbag sensors have zero deployment flags' },
      { label: 'Electrical Health', value: 'No Faults', subtext: 'CAN bus diagnostics show zero codes' },
      { label: 'Bumper Retainers', value: 'Original', subtext: 'All factory plastic fasteners intact' },
    ],
  },
  {
    id: 'luxury-profile',
    tabLabel: 'Certified Vehicle Profile',
    badge: 'Executive Audit',
    title: 'Complete Vehicle Profile & Registry History',
    subtitle: 'Studio-verified automotive record linking nationwide DMV title events, lien records, and ownership transfers into one report.',
    image: '/images/inspection/luxury-bentley.jpg',
    category: 'Executive Vehicle Registry',
    status: 'Verified Clear',
    hotspots: [
      {
        id: 'hs-vin-title',
        x: 48,
        y: 62,
        label: 'Title Status: Clean',
        detail: 'No junk, salvage, rebuilt, lemon law, or insurance total loss brands registered nationwide.',
        status: 'verified',
      },
      {
        id: 'hs-owners',
        x: 75,
        y: 50,
        label: 'Ownership Timeline',
        detail: 'Single corporate executive lease owner. No auction wholesale flip or gray-market import history.',
        status: 'pass',
      },
      {
        id: 'hs-lien',
        x: 25,
        y: 55,
        label: 'Financial Lien Clearance',
        detail: 'Lien release letter verified on file with state registry. Clear title ready for ownership transfer.',
        status: 'verified',
      },
    ],
    telemetry: [
      { label: 'Title Brands', value: 'Clean Title', subtext: 'Zero salvage or brand restrictions' },
      { label: 'Prior Owners', value: '1 Owner', subtext: 'Corporate lease with full history' },
      { label: 'Lien Status', value: 'Clear', subtext: 'No unpaid bank loans or security interests' },
      { label: 'Theft / Stolen', value: 'No Records', subtext: 'Cleared against active NCIC hot sheets' },
    ],
  },
  {
    id: 'highway-chassis',
    tabLabel: 'Highway & Dynamic Audit',
    badge: 'Chassis & Road Test',
    title: 'Dynamic Chassis & Odometer Trend Audit',
    subtitle: 'Chronological odometer verification tracking annual mileage accumulation to uncover digital rollback tampering before purchase.',
    image: '/images/inspection/highway-night-drive.jpg',
    category: 'Chassis & Mileage Audit',
    status: 'Pass - No Defects',
    hotspots: [
      {
        id: 'hs-odo',
        x: 52,
        y: 48,
        label: 'Odometer Telemetry Curve',
        detail: 'Annual mileage progression: 12 mi (2020) → 18.4k mi (2022) → 41.8k mi (2024). Smooth linear curve.',
        status: 'verified',
      },
      {
        id: 'hs-susp',
        x: 70,
        y: 65,
        label: 'Chassis Stability & Alignment',
        detail: 'Four-wheel alignment verified within factory laser specs. No curb or pothole subframe bending.',
        status: 'pass',
      },
    ],
    telemetry: [
      { label: 'Mileage Trend', value: 'Consistent', subtext: 'Zero rollback or cluster tampering' },
      { label: 'Recorded Miles', value: '41,800 mi', subtext: 'Confirmed via 3 independent DMV audits' },
      { label: 'Annual Average', value: '10,450 mi/yr', subtext: 'Standard normal personal driving' },
      { label: 'Structural Health', value: '100% True', subtext: 'Unibody laser geometry verified' },
    ],
  },
];

export const InteractiveInspectionSection: React.FC<InteractiveInspectionSectionProps> = ({
  onStartOrderWithVin,
  onOpenSample,
}) => {
  const [activeViewId, setActiveViewId] = useState<string>('paint-finish');
  const [selectedHotspotId, setSelectedHotspotId] = useState<string | null>('hs-clearcoat');
  const [isLightActive, setIsLightActive] = useState<boolean>(true);
  const [isFullscreenModalOpen, setIsFullscreenModalOpen] = useState<boolean>(false);

  const activeView = INSPECTION_VIEWS.find((v) => v.id === activeViewId) || INSPECTION_VIEWS[0];
  const activeHotspot = activeView.hotspots.find((h) => h.id === selectedHotspotId) || activeView.hotspots[0];

  const handleSelectTab = (viewId: string) => {
    setActiveViewId(viewId);
    const targetView = INSPECTION_VIEWS.find((v) => v.id === viewId);
    if (targetView && targetView.hotspots.length > 0) {
      setSelectedHotspotId(targetView.hotspots[0].id);
    } else {
      setSelectedHotspotId(null);
    }
  };

  return (
    <section id="interactive-view" className="py-16 sm:py-24 bg-[#07111F] text-white border-b border-[rgba(148,163,184,0.20)] relative overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-[radial-gradient(circle,rgba(16,185,129,0.08)_0%,transparent_70%)] pointer-events-none" />
      <div className="absolute bottom-0 left-10 w-96 h-96 bg-[radial-gradient(circle,rgba(37,99,235,0.08)_0%,transparent_70%)] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-10 sm:mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0F1B2D] border border-[rgba(148,163,184,0.20)] text-xs font-bold text-[#10B981] tracking-wider uppercase shadow-xs">
            <Eye className="w-3.5 h-3.5 text-[#10B981]" />
            <span>Interactive Customer Inspection View</span>
          </div>

          <h2 className="text-2xl sm:text-4xl lg:text-[42px] font-extrabold tracking-[-1.2px] text-white leading-tight text-balance">
            Inspect Vehicle Records Like a Professional Auditor
          </h2>

          <p className="text-sm sm:text-base text-[#CBD5E1] leading-[1.6]">
            Click the interactive inspection viewpoints and telemetry points below to see how AutoAudit cross-examines title records, collision damage, and mechanical integrity before purchase.
          </p>
        </div>

        {/* Interactive View Selector Tabs */}
        <div className="flex items-center justify-start sm:justify-center gap-2 overflow-x-auto pb-4 mb-8 no-scrollbar scroll-smooth">
          {INSPECTION_VIEWS.map((view) => {
            const isActive = view.id === activeViewId;
            return (
              <button
                key={view.id}
                type="button"
                onClick={() => handleSelectTab(view.id)}
                className={`px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-[10px] text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 border leading-[1.43] ${
                  isActive
                    ? 'bg-[#2563EB] text-white border-[#2563EB] shadow-lg shadow-blue-500/20'
                    : 'bg-[#0F1B2D] text-[#CBD5E1] border-[rgba(148,163,184,0.20)] hover:text-white hover:bg-[#162740]'
                }`}
              >
                <span>{view.tabLabel}</span>
                {isActive && (
                  <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
                )}
              </button>
            );
          })}
        </div>

        {/* Main Interactive Stage Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Interactive Image Viewer with Hotspots (lg:col-span-8) */}
          <div className="lg:col-span-8 space-y-4">
            <div className="bg-[#0F1B2D] border border-[rgba(148,163,184,0.20)] rounded-[16px] overflow-hidden shadow-2xl relative group">
              
              {/* Viewer Header Overlay Bar */}
              <div className="absolute top-0 inset-x-0 p-3 sm:p-4 z-20 bg-gradient-to-b from-[#07111F]/90 via-[#07111F]/50 to-transparent flex items-center justify-between pointer-events-none">
                <div className="flex items-center gap-2 pointer-events-auto">
                  <span className="px-2.5 py-1 rounded-[6px] text-[11px] font-bold uppercase tracking-wider bg-[#07111F]/80 border border-[rgba(148,163,184,0.30)] text-[#10B981] backdrop-blur-md">
                    {activeView.badge}
                  </span>
                  <span className="text-xs font-mono text-white/90 hidden sm:inline-block">
                    LIVE TELEMETRY
                  </span>
                </div>

                <div className="flex items-center gap-2 pointer-events-auto">
                  {/* Inspection Flashlight Toggle */}
                  <button
                    type="button"
                    onClick={() => setIsLightActive(!isLightActive)}
                    className={`px-2.5 py-1 rounded-[6px] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border ${
                      isLightActive
                        ? 'bg-[#10B981]/20 text-[#10B981] border-[#10B981]/50'
                        : 'bg-[#07111F]/80 text-[#CBD5E1] border-[rgba(148,163,184,0.20)]'
                    }`}
                    title="Toggle Inspection Spotlight Mode"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span className="text-[11px]">{isLightActive ? 'Spotlight ON' : 'Spotlight'}</span>
                  </button>

                  {/* Fullscreen Zoom */}
                  <button
                    type="button"
                    onClick={() => setIsFullscreenModalOpen(true)}
                    className="p-1.5 rounded-[6px] bg-[#07111F]/80 text-[#CBD5E1] hover:text-white border border-[rgba(148,163,184,0.20)] transition-colors cursor-pointer"
                    title="View High Resolution Evidence"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Main Inspection Image Container with Interactive Hotspots */}
              <div className="relative aspect-[16/9] sm:aspect-[16/10] w-full bg-[#0B132B] overflow-hidden select-none">
                <img
                  src={activeView.image}
                  alt={activeView.title}
                  className={`w-full h-full object-cover transition-transform duration-700 ${
                    isLightActive ? 'brightness-105 contrast-105' : 'brightness-95'
                  }`}
                />

                {/* Subtle vignette gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#07111F]/85 via-transparent to-transparent pointer-events-none" />

                {/* Pulsating Interactive Hotspots */}
                {activeView.hotspots.map((hs, index) => {
                  const isSelected = selectedHotspotId === hs.id;
                  return (
                    <div
                      key={hs.id}
                      style={{ top: `${hs.y}%`, left: `${hs.x}%` }}
                      className="absolute -translate-x-1/2 -translate-y-1/2 z-30"
                    >
                      <button
                        type="button"
                        onClick={() => setSelectedHotspotId(hs.id)}
                        className={`relative group/btn cursor-pointer flex items-center justify-center transition-all ${
                          isSelected ? 'scale-125' : 'hover:scale-110'
                        }`}
                        aria-label={hs.label}
                      >
                        {/* Ping radar animation */}
                        <span className={`absolute -inset-2 rounded-full opacity-75 animate-ping ${
                          isSelected ? 'bg-[#10B981]' : 'bg-blue-400'
                        }`} />

                        {/* Center Badge Pill */}
                        <span className={`relative w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-xs border shadow-lg transition-colors ${
                          isSelected
                            ? 'bg-[#10B981] text-white border-white ring-4 ring-[#10B981]/30'
                            : 'bg-[#0B132B]/90 text-white border-[rgba(148,163,184,0.40)] hover:border-[#10B981]'
                        }`}>
                          {index + 1}
                        </span>

                        {/* Hover Tooltip Label */}
                        <span className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-[6px] bg-[#07111F]/95 border border-[rgba(148,163,184,0.30)] text-white text-[11px] font-semibold whitespace-nowrap shadow-xl opacity-0 group-hover/btn:opacity-100 transition-opacity pointer-events-none">
                          {hs.label}
                        </span>
                      </button>
                    </div>
                  );
                })}

                {/* Bottom Status Ticker Overlay */}
                <div className="absolute bottom-3 inset-x-3 sm:bottom-4 sm:inset-x-4 z-20 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 bg-[#07111F]/85 border border-[rgba(148,163,184,0.20)] px-3 py-1.5 rounded-[8px] backdrop-blur-md">
                    <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
                    <span className="font-semibold text-white">{activeView.status}</span>
                  </div>

                  <span className="text-[11px] font-mono text-[#CBD5E1] bg-[#07111F]/70 px-2.5 py-1 rounded-[6px] border border-[rgba(148,163,184,0.15)]">
                    HOTSPOT {activeView.hotspots.findIndex(h => h.id === selectedHotspotId) + 1} OF {activeView.hotspots.length} ACTIVE
                  </span>
                </div>
              </div>

              {/* Active Hotspot Detail Card underneath image */}
              {activeHotspot && (
                <div className="p-4 sm:p-5 bg-[#0B132B] border-t border-[rgba(148,163,184,0.15)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#10B981]" />
                      <h4 className="text-sm font-bold text-white">
                        {activeHotspot.label}
                      </h4>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30">
                        {activeHotspot.status === 'verified' ? 'Verified by NMVTIS' : 'Pass Inspection'}
                      </span>
                    </div>
                    <p className="text-xs text-[#CBD5E1] leading-relaxed max-w-2xl">
                      {activeHotspot.detail}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => onStartOrderWithVin('1HGCM82633A004352', true)}
                    className="shrink-0 px-3.5 py-2 rounded-[8px] text-xs font-semibold bg-[#2563EB] hover:bg-[#1D4ED8] text-white flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <span>Audit This Vehicle</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

            </div>

            {/* Quick Angle Thumbnails Bar */}
            <div className="grid grid-cols-5 gap-2 sm:gap-3">
              {INSPECTION_VIEWS.map((item, idx) => {
                const isSelected = item.id === activeViewId;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectTab(item.id)}
                    className={`relative rounded-[10px] overflow-hidden border aspect-[16/10] transition-all cursor-pointer group text-left ${
                      isSelected
                        ? 'border-[#10B981] ring-2 ring-[#10B981]/40 scale-[1.02]'
                        : 'border-[rgba(148,163,184,0.20)] hover:border-slate-400 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={item.image}
                      alt={item.tabLabel}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#07111F]/90 via-transparent to-transparent flex items-end p-1.5 sm:p-2">
                      <span className="text-[9px] sm:text-[10px] font-bold text-white truncate block">
                        {idx + 1}. {item.badge}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column: Telemetry Specs & Direct Verification Card (lg:col-span-4) */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Telemetry Overview Card */}
            <div className="bg-[#0F1B2D] border border-[rgba(148,163,184,0.20)] rounded-[16px] p-5 sm:p-6 shadow-2xl space-y-5">
              
              <div className="border-b border-[rgba(148,163,184,0.15)] pb-4">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                  {activeView.category}
                </span>
                <h3 className="text-lg font-bold text-white mt-1">
                  {activeView.title}
                </h3>
                <p className="text-xs text-[#CBD5E1] mt-1.5 leading-relaxed">
                  {activeView.subtitle}
                </p>
              </div>

              {/* 4 Telemetry Metrics */}
              <div className="space-y-3">
                {activeView.telemetry.map((tItem, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-[#0B132B] rounded-[10px] border border-[rgba(148,163,184,0.15)] flex items-center justify-between gap-3"
                  >
                    <div>
                      <span className="text-[10.5px] font-semibold text-slate-400 uppercase tracking-wider block">
                        {tItem.label}
                      </span>
                      <span className="text-[11px] text-[#CBD5E1] block mt-0.5">
                        {tItem.subtext}
                      </span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-sm font-bold font-mono text-[#10B981] block">
                        {tItem.value}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Certification Assurance */}
              <div className="p-3.5 rounded-[10px] bg-emerald-950/30 border border-emerald-800/50 flex items-start gap-2.5 text-xs text-emerald-300">
                <ShieldCheck className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  All metrics backed by the National Motor Vehicle Title Information System (NMVTIS) and verified state DMV registry records.
                </p>
              </div>

              {/* Primary Call to Action */}
              <div className="space-y-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => onStartOrderWithVin('1HGCM82633A004352', true)}
                  className="w-full py-3 px-4 rounded-[8px] bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-sm shadow-[0_1px_2px_rgba(0,0,0,0.1)] transition-colors flex items-center justify-center gap-2 cursor-pointer leading-[1.43]"
                >
                  <span>Order Full Report for This VIN</span>
                  <ArrowRight className="w-4 h-4 text-[#10B981]" />
                </button>

                <button
                  type="button"
                  onClick={onOpenSample}
                  className="w-full py-2.5 px-4 rounded-[8px] bg-[#0B132B] hover:bg-[#162740] text-[#CBD5E1] border border-[rgba(148,163,184,0.20)] font-medium text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer leading-[1.43]"
                >
                  <FileCheck className="w-3.5 h-3.5 text-[#10B981]" />
                  <span>Preview Full Sample PDF</span>
                </button>
              </div>

            </div>

            {/* Live WhatsApp Consultant Box */}
            <div className="p-4 rounded-[14px] bg-[#0F1B2D] border border-[rgba(148,163,184,0.20)] flex items-center justify-between gap-3 text-xs">
              <div className="space-y-0.5">
                <p className="font-bold text-white">Need an urgent vehicle lookup?</p>
                <p className="text-[11px] text-slate-400">Scan or chat with our 24/7 admin team</p>
              </div>
              <WhatsAppButton
                variant="secondary"
                source="sample_report"
                intent="vin_check"
                openQrModal={true}
                label="WhatsApp"
                className="px-3 py-1.5 text-xs bg-emerald-950/50 hover:bg-emerald-900/70 text-emerald-300 border border-emerald-800/80 rounded-[8px]"
              />
            </div>

          </div>

        </div>

      </div>

      {/* Fullscreen High-Resolution Inspection Modal */}
      {isFullscreenModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#07111F]/95 backdrop-blur-lg flex flex-col p-4 sm:p-8 animate-fade-in">
          <div className="flex items-center justify-between pb-4 border-b border-[rgba(148,163,184,0.20)]">
            <div>
              <h3 className="text-lg font-bold text-white">{activeView.title}</h3>
              <p className="text-xs text-slate-400 font-mono">HIGH-RESOLUTION 1080P AUDIT TELEMETRY</p>
            </div>
            <button
              type="button"
              onClick={() => setIsFullscreenModalOpen(false)}
              className="p-2 rounded-lg bg-[#0F1B2D] text-slate-300 hover:text-white border border-[rgba(148,163,184,0.20)] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 flex items-center justify-center py-4 overflow-hidden relative">
            <img
              src={activeView.image}
              alt={activeView.title}
              className="max-h-full max-w-full object-contain rounded-xl shadow-2xl border border-[rgba(148,163,184,0.30)]"
            />
          </div>

          <div className="pt-4 border-t border-[rgba(148,163,184,0.20)] flex items-center justify-between text-xs text-slate-400">
            <span>Official AutoAudit inspection snapshot sourced from certified vehicle audit documentation.</span>
            <button
              type="button"
              onClick={() => {
                setIsFullscreenModalOpen(false);
                onStartOrderWithVin('1HGCM82633A004352', true);
              }}
              className="px-4 py-2 rounded-md bg-[#2563EB] text-white font-semibold cursor-pointer"
            >
              Get Report
            </button>
          </div>
        </div>
      )}
    </section>
  );
};
