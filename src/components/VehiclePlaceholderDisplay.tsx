import React, { useState } from 'react';
import {
  VehicleBodyStyle,
  VEHICLE_SILHOUETTES,
  detectVehicleBodyStyle,
} from '../utils/vehiclePlaceholders';
import { Car, Layers, Eye } from 'lucide-react';

interface VehiclePlaceholderDisplayProps {
  vehicleTitle?: string;
  actualImageUrl?: string | null;
  initialBodyStyle?: VehicleBodyStyle;
  allowStyleSwitch?: boolean;
  className?: string;
  compact?: boolean;
}

export const VehiclePlaceholderDisplay: React.FC<VehiclePlaceholderDisplayProps> = ({
  vehicleTitle = 'Vehicle',
  actualImageUrl,
  initialBodyStyle,
  allowStyleSwitch = true,
  className = '',
  compact = false,
}) => {
  const detectedStyle = initialBodyStyle || detectVehicleBodyStyle(vehicleTitle);
  const [selectedStyle, setSelectedStyle] = useState<VehicleBodyStyle>(detectedStyle);
  const [imgError, setImgError] = useState<boolean>(false);

  // If actual image is provided and hasn't errored, show it; otherwise show placeholder silhouette
  const showActualImage = Boolean(actualImageUrl && !imgError);
  const currentSilhouette = VEHICLE_SILHOUETTES[selectedStyle];

  if (compact) {
    return (
      <div className={`relative rounded-lg overflow-hidden border border-slate-700/60 bg-slate-900 ${className}`}>
        <img
          src={showActualImage ? actualImageUrl! : currentSilhouette.image}
          alt={`${vehicleTitle} - ${currentSilhouette.label} Placeholder`}
          className="w-full h-24 object-cover object-center"
          onError={() => setImgError(true)}
          loading="lazy"
        />
        <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-slate-950/80 backdrop-blur-xs text-[9px] font-mono text-slate-300 border border-slate-700/50">
          {currentSilhouette.label}
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-xl overflow-hidden border border-slate-800 bg-gradient-to-b from-slate-900 to-[#0B132B] shadow-lg flex flex-col ${className}`}>
      {/* Top Banner / Technical Tag */}
      <div className="px-3.5 py-2 border-b border-slate-800/80 bg-slate-950/60 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
          <span className="font-semibold text-slate-200 text-[11px] tracking-wide flex items-center gap-1.5">
            <Car className="w-3.5 h-3.5 text-blue-400" />
            {showActualImage ? 'Verified Vehicle Photo' : 'Technical Blueprint Silhouette'}
          </span>
        </div>

        <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800/90 text-slate-300 border border-slate-700/60">
          {showActualImage ? 'Actual Photo' : `${currentSilhouette.label} (Generic Placeholder)`}
        </span>
      </div>

      {/* Main Image Container */}
      <div className="relative aspect-video w-full overflow-hidden bg-slate-950/90 flex items-center justify-center group">
        <img
          src={showActualImage ? actualImageUrl! : currentSilhouette.image}
          alt={`${vehicleTitle} Silhouette - ${currentSilhouette.label}`}
          className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-[1.02]"
          onError={() => setImgError(true)}
          loading="lazy"
        />

        {/* Blueprint Grid Overlay lines watermark for authentic audit look */}
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-transparent to-slate-950/40" />

        <div className="absolute bottom-2.5 left-2.5 flex items-center gap-2">
          <div className="px-2 py-1 rounded-md bg-slate-950/80 backdrop-blur-md border border-slate-700/60 text-[10px] text-slate-300 font-mono flex items-center gap-1.5 shadow-sm">
            <Layers className="w-3 h-3 text-blue-400" />
            <span>ISO-Standard Silhouette</span>
          </div>
        </div>

        {!showActualImage && (
          <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-slate-950/70 backdrop-blur-xs border border-slate-700/50 text-[10px] text-slate-400 font-sans">
            Generic silhouette used when real photo is unavailable
          </div>
        )}
      </div>

      {/* Style Switcher Bar (allows previewing Sedan, SUV, Pickup styles) */}
      {allowStyleSwitch && !showActualImage && (
        <div className="px-3.5 py-2.5 bg-slate-900/90 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="text-[11px] text-slate-400 flex items-center gap-1">
            <Eye className="w-3 h-3 text-slate-400" />
            <span>Body Style Silhouette:</span>
          </span>

          <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800">
            {(['sedan', 'suv', 'pickup'] as VehicleBodyStyle[]).map((style) => {
              const opt = VEHICLE_SILHOUETTES[style];
              const isSelected = selectedStyle === style;
              return (
                <button
                  key={style}
                  type="button"
                  onClick={() => setSelectedStyle(style)}
                  className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600 text-white font-semibold shadow-xs'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                  title={opt.description}
                >
                  {opt.label.split(' / ')[0]}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
