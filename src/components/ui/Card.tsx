import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'subtle' | 'navy';
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className = '', variant = 'default', children, ...props }, ref) => {
    const variantClasses = {
      default: 'bg-white border border-slate-200 text-slate-900 shadow-2xs',
      subtle: 'bg-[#F8FAFC] border border-slate-200/80 text-slate-900 shadow-2xs',
      navy: 'bg-[#0F172A] border border-slate-800 text-white shadow-md',
    }[variant];

    return (
      <div
        ref={ref}
        className={`rounded-[12px] transition-all duration-150 ${variantClasses} ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

export const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className = '', children, ...props }, ref) => (
    <div ref={ref} className={`p-5 sm:p-6 pb-3 space-y-1.5 ${className}`} {...props}>
      {children}
    </div>
  )
);
CardHeader.displayName = 'CardHeader';

export const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className = '', children, ...props }, ref) => (
    <h3 ref={ref} className={`text-base sm:text-lg font-bold tracking-tight text-inherit ${className}`} {...props}>
      {children}
    </h3>
  )
);
CardTitle.displayName = 'CardTitle';

export const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className = '', children, ...props }, ref) => (
    <p ref={ref} className={`text-xs sm:text-sm text-slate-500 leading-relaxed ${className}`} {...props}>
      {children}
    </p>
  )
);
CardDescription.displayName = 'CardDescription';

export const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className = '', children, ...props }, ref) => (
    <div ref={ref} className={`p-5 sm:p-6 pt-0 ${className}`} {...props}>
      {children}
    </div>
  )
);
CardContent.displayName = 'CardContent';

export const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className = '', children, ...props }, ref) => (
    <div ref={ref} className={`p-5 sm:p-6 pt-0 flex items-center gap-3 ${className}`} {...props}>
      {children}
    </div>
  )
);
CardFooter.displayName = 'CardFooter';
