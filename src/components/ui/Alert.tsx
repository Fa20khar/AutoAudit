import React from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info } from 'lucide-react';

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  icon?: React.ReactNode;
}

export const Alert: React.FC<AlertProps> = ({
  children,
  variant = 'info',
  title,
  icon,
  className = '',
  ...props
}) => {
  const config = {
    info: {
      container: 'bg-blue-50/70 border-blue-200 text-blue-900',
      iconColor: 'text-[#2563EB]',
      defaultIcon: <Info className="w-4 h-4 shrink-0 text-[#2563EB]" />,
    },
    success: {
      container: 'bg-emerald-50/70 border-emerald-200 text-emerald-900',
      iconColor: 'text-[#059669]',
      defaultIcon: <CheckCircle2 className="w-4 h-4 shrink-0 text-[#059669]" />,
    },
    warning: {
      container: 'bg-amber-50/70 border-amber-200 text-amber-900',
      iconColor: 'text-amber-600',
      defaultIcon: <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />,
    },
    error: {
      container: 'bg-rose-50/70 border-rose-200 text-rose-900',
      iconColor: 'text-rose-600',
      defaultIcon: <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />,
    },
  }[variant];

  return (
    <div
      role="alert"
      className={`p-4 rounded-[8px] border text-xs sm:text-sm flex items-start gap-3 ${config.container} ${className}`}
      {...props}
    >
      <div className="mt-0.5">{icon !== undefined ? icon : config.defaultIcon}</div>
      <div className="flex-1 space-y-0.5">
        {title && <h5 className="font-semibold text-inherit leading-tight">{title}</h5>}
        <div className="leading-relaxed text-inherit/90">{children}</div>
      </div>
    </div>
  );
};
