import React, { useId } from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  leftElement?: React.ReactNode;
  rightElement?: React.ReactNode;
  containerClassName?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      hint,
      error,
      leftElement,
      rightElement,
      id: customId,
      className = '',
      containerClassName = '',
      disabled,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const inputId = customId || generatedId;
    const hintId = `${inputId}-hint`;
    const errorId = `${inputId}-error`;

    const describedBy = [
      hint ? hintId : null,
      error ? errorId : null,
      props['aria-describedby'] || null,
    ]
      .filter(Boolean)
      .join(' ') || undefined;

    return (
      <div className={`w-full space-y-1.5 ${containerClassName}`}>
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold text-slate-700 tracking-tight"
          >
            {label}
            {props.required && <span className="text-rose-500 ml-1" aria-hidden="true">*</span>}
          </label>
        )}

        <div className="relative flex items-center">
          {leftElement && (
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              {leftElement}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            aria-invalid={Boolean(error)}
            aria-describedby={describedBy}
            className={`w-full min-h-[44px] py-2.5 px-3.5 bg-white text-slate-900 border rounded-[8px] text-sm
              placeholder:text-slate-400
              transition-colors duration-150
              focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB]
              disabled:bg-slate-50 disabled:text-slate-500 disabled:border-slate-200 disabled:cursor-not-allowed
              ${leftElement ? 'pl-10' : ''}
              ${rightElement ? 'pr-10' : ''}
              ${error ? 'border-rose-400 focus:ring-rose-500 focus:border-rose-500 text-rose-900' : 'border-slate-300'}
              ${className}`}
            {...props}
          />

          {rightElement && (
            <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center">
              {rightElement}
            </div>
          )}
        </div>

        {hint && !error && (
          <p id={hintId} className="text-xs text-slate-500">
            {hint}
          </p>
        )}

        {error && (
          <p id={errorId} role="alert" className="text-xs font-medium text-rose-600">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
