import React, { useEffect, useState } from 'react';
import { Tag, Sparkles, ShieldCheck, Check, Clock, TrendingDown } from 'lucide-react';
import { ServicePlan, Coupon } from '../types';

interface RealtimePricePreviewProps {
  currentPlan: ServicePlan;
  subtotal: number;
  discountAmount: number;
  total: number;
  appliedCoupon: Coupon | null;
  step: number;
  className?: string;
  onApplyCouponChip?: (code: string) => void;
}

export const RealtimePricePreview: React.FC<RealtimePricePreviewProps> = ({
  currentPlan,
  subtotal,
  discountAmount,
  total,
  appliedCoupon,
  step,
  className = '',
  onApplyCouponChip,
}) => {
  // Visual pulse / highlight state triggered when plan or total updates
  const [highlightTrigger, setHighlightTrigger] = useState(false);

  useEffect(() => {
    setHighlightTrigger(true);
    const timer = setTimeout(() => {
      setHighlightTrigger(false);
    }, 450);
    return () => clearTimeout(timer);
  }, [currentPlan.id, total, discountAmount]);

  return (
    <div
      className={`rounded-xl border transition-all duration-300 ${
        highlightTrigger
          ? 'border-emerald-500 bg-emerald-50/40 shadow-sm ring-1 ring-emerald-400/30'
          : 'border-slate-200 bg-slate-50/80'
      } p-3 sm:p-3.5 ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        
        {/* Left: Selected Service Plan Badge & Delivery Speed */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-[#0B132B] text-white flex items-center justify-center shrink-0 font-bold text-xs shadow-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-bold text-slate-900 truncate">
                {currentPlan.name}
              </span>
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100/70 border border-emerald-300 px-1.5 py-0.2 rounded-full inline-flex items-center gap-0.5">
                <Clock className="w-2.5 h-2.5" />
                <span>{currentPlan.deliveryTime}</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-500 truncate">
              {currentPlan.tagline}
            </p>
          </div>
        </div>

        {/* Right: Live Price Breakdown with Discount Badge and Total */}
        <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/80">
          
          {/* Subtotal & Discount if active */}
          <div className="text-right">
            <div className="flex items-center gap-1.5 justify-end">
              {appliedCoupon ? (
                <>
                  <span className="text-xs font-mono text-slate-400 line-through">
                    ${subtotal.toFixed(2)}
                  </span>
                  <span className="text-[11px] font-bold text-emerald-600 bg-emerald-100/80 px-1.5 py-0.2 rounded flex items-center gap-0.5">
                    <TrendingDown className="w-3 h-3" />
                    <span>-${discountAmount.toFixed(2)}</span>
                  </span>
                </>
              ) : (
                <span className="text-[11px] text-slate-500">Live Total</span>
              )}
            </div>

            {appliedCoupon && (
              <span className="text-[10px] text-emerald-700 font-mono font-medium block">
                Code {appliedCoupon.code} applied
              </span>
            )}
          </div>

          {/* Big Live Total Cost with micro-transition */}
          <div className="flex items-baseline gap-1 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 shadow-xs">
            <span
              className={`text-base sm:text-lg font-black font-mono transition-colors duration-200 ${
                appliedCoupon ? 'text-[#059669]' : 'text-slate-900'
              } ${highlightTrigger ? 'scale-105 transition-transform' : ''}`}
            >
              ${total.toFixed(2)}
            </span>
            <span className="text-[10px] font-bold text-slate-400">USD</span>
          </div>

        </div>

      </div>

      {/* Optional Helpful Hint during Steps 1-3 */}
      {step < 4 && !appliedCoupon && (
        <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10.5px] text-slate-500">
          <span className="flex items-center gap-1">
            <Tag className="w-3 h-3 text-blue-500" />
            <span>Have a discount code? Apply in checkout.</span>
          </span>
        </div>
      )}
    </div>
  );
};
