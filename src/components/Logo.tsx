import React from 'react';

interface LogoProps {
  className?: string;
  variant?: 'navbar' | 'full' | 'icon' | 'badge' | 'footer';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  theme?: 'dark' | 'light';
  showTagline?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
  className = '',
  variant = 'navbar',
  size = 'md',
  theme = 'light',
  showTagline = false,
}) => {
  // Dimension tokens based on 8px grid
  const dimensions = {
    sm: { box: 32, icon: 20 },
    md: { box: 40, icon: 24 },
    lg: { box: 48, icon: 28 },
    xl: { box: 64, icon: 36 },
  }[size];

  // Geometric Emerald Shield with White Verification Checkmark and subtle automotive/data lines
  const ShieldEmblem = (
    <svg
      width={dimensions.box}
      height={dimensions.box}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0 select-none transition-transform duration-200 group-hover:scale-105"
      aria-label="AutoAudit Shield Emblem"
    >
      <defs>
        {/* Emerald to Teal Gradient */}
        <linearGradient id="shieldGrad" x1="6" y1="4" x2="42" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#10B981" />
          <stop offset="50%" stopColor="#059669" />
          <stop offset="100%" stopColor="#047857" />
        </linearGradient>

        {/* Subtle Tech Grid / Automotive Sweep */}
        <linearGradient id="sweepGrad" x1="12" y1="14" x2="36" y2="34" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#34D399" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#065F46" stopOpacity="0.1" />
        </linearGradient>
      </defs>

      {/* Geometric Outer Shield */}
      <path
        d="M24 4L9 10.5V23C9 32.5 15.5 41.2 24 44C32.5 41.2 39 32.5 39 23V10.5L24 4Z"
        fill="url(#shieldGrad)"
      />

      {/* Subtle Automotive Dynamic Arcs / Data Reference in Shield Base */}
      <path
        d="M13 22C13 30 18 36.5 24 39C30 36.5 35 30 35 22L24 16L13 22Z"
        fill="url(#sweepGrad)"
      />

      {/* Subtle Speed / Data Lines (Horizontal notches) */}
      <line x1="15" y1="18" x2="19" y2="18" stroke="#A7F3D0" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
      <line x1="29" y1="18" x2="33" y2="18" stroke="#A7F3D0" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
      <path d="M16 28 Q 24 33 32 28" stroke="#A7F3D0" strokeWidth="1.2" strokeLinecap="round" fill="none" opacity="0.4" />

      {/* Prominent White Verification Checkmark */}
      <path
        d="M17.5 23.5L22 28L31 18"
        stroke="#FFFFFF"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  if (variant === 'icon') {
    return <div className={`inline-flex items-center ${className}`}>{ShieldEmblem}</div>;
  }

  const isDark = theme === 'dark';

  return (
    <div className={`inline-flex items-center gap-2.5 sm:gap-3 select-none ${className}`}>
      {/* Shield Emblem */}
      {ShieldEmblem}

      {/* Wordmark Typography */}
      <div className="flex flex-col text-left leading-none">
        <div className="flex items-baseline tracking-tight">
          <span
            className={`font-black text-xl sm:text-2xl tracking-tight ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}
          >
            Auto
          </span>
          <span className="font-black text-xl sm:text-2xl text-emerald-500 tracking-tight">
            Audit
          </span>
        </div>

        {(variant === 'full' || variant === 'footer' || showTagline) && (
          <div className="flex items-center gap-1.5 mt-1">
            <span
              className={`text-[10px] font-bold uppercase tracking-[0.16em] font-sans ${
                isDark ? 'text-slate-400' : 'text-slate-500'
              }`}
            >
              Vehicle History. Verified.
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
