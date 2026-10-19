import React from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      className = '',
      disabled,
      type = 'button',
      ...props
    },
    ref
  ) => {
    // 44px minimum touch target height
    const sizeClasses = {
      sm: 'min-h-[40px] px-3.5 py-1.5 text-xs',
      md: 'min-h-[44px] px-5 py-2.5 text-sm',
      lg: 'min-h-[48px] px-6 py-3 text-base',
    }[size];

    const variantClasses = {
      primary:
        'bg-[#2563EB] hover:bg-[#1D4ED8] active:bg-[#1E40AF] text-white shadow-xs border border-transparent font-semibold',
      secondary:
        'bg-transparent hover:bg-slate-100 active:bg-slate-200 text-slate-800 border border-slate-300 shadow-2xs font-medium',
      ghost:
        'bg-transparent hover:bg-slate-100/80 active:bg-slate-200/80 text-slate-700 hover:text-slate-900 border border-transparent font-medium',
      danger:
        'bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white shadow-xs border border-transparent font-semibold',
    }[variant];

    const isDisabled = disabled || isLoading;

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        aria-busy={isLoading}
        className={`inline-flex items-center justify-center gap-2 rounded-[8px] transition-colors duration-150 cursor-pointer select-none
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2
          disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none
          ${sizeClasses} ${variantClasses} ${className}`}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin shrink-0" aria-hidden="true" />
            <span>{children}</span>
          </>
        ) : (
          <>
            {leftIcon && <span className="shrink-0" aria-hidden="true">{leftIcon}</span>}
            <span>{children}</span>
            {rightIcon && <span className="shrink-0" aria-hidden="true">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
