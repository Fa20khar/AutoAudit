import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'success' | 'neutral' | 'warning' | 'info' | 'outline';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  className = '',
  ...props
}) => {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[10px] leading-tight',
    md: 'px-2.5 py-1 text-xs leading-tight',
  }[size];

  // Note: Emerald is reserved strictly for verified / clean / success states per brand guidelines
  const variantClasses = {
    success:
      'bg-emerald-50 text-emerald-800 border border-emerald-200/80 font-semibold',
    neutral:
      'bg-slate-100 text-slate-700 border border-slate-200 font-medium',
    warning:
      'bg-amber-50 text-amber-800 border border-amber-200/80 font-medium',
    info:
      'bg-blue-50 text-blue-800 border border-blue-200/80 font-medium',
    outline:
      'bg-transparent text-slate-700 border border-slate-300 font-medium',
  }[variant];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-[6px] tracking-normal select-none ${sizeClasses} ${variantClasses} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};
