import React, { useState, useRef, useEffect, useId } from 'react';
import { Info } from 'lucide-react';

export interface TooltipProps {
  content: React.ReactNode;
  title?: string;
  children?: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
  triggerClassName?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  title,
  children,
  position = 'top',
  className = '',
  triggerClassName = '',
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const tooltipId = useId();

  // Close tooltip on outside click or escape
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsVisible(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsVisible(false);
      }
    };

    if (isVisible) {
      document.addEventListener('mousedown', handleOutside);
      document.addEventListener('keydown', handleKey);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleKey);
    };
  }, [isVisible]);

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  }[position];

  return (
    <div
      ref={containerRef}
      className={`relative inline-flex items-center ${className}`}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      <button
        type="button"
        aria-describedby={isVisible ? tooltipId : undefined}
        onClick={(e) => {
          e.stopPropagation();
          setIsVisible((prev) => !prev);
        }}
        onFocus={() => setIsVisible(true)}
        onBlur={() => setIsVisible(false)}
        className={`inline-flex items-center justify-center p-0.5 rounded text-slate-400 hover:text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] cursor-pointer transition-colors ${triggerClassName}`}
      >
        {children || <Info className="w-3.5 h-3.5" aria-hidden="true" />}
        <span className="sr-only">More information</span>
      </button>

      {isVisible && (
        <div
          id={tooltipId}
          role="tooltip"
          className={`absolute z-50 w-64 sm:w-72 p-3 bg-[#0F172A] text-white text-xs rounded-[8px] shadow-xl border border-slate-700/80 pointer-events-auto transition-opacity duration-150 animate-fade-in ${positionClasses}`}
        >
          {title && (
            <h6 className="font-bold text-slate-100 pb-1 mb-1 border-b border-slate-700/60 flex items-center gap-1.5">
              <span>{title}</span>
            </h6>
          )}
          <div className="text-slate-300 leading-relaxed font-normal">{content}</div>
        </div>
      )}
    </div>
  );
};
