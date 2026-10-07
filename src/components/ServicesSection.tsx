import React from 'react';
import { ServicePlan } from '../types';
import { Check, X, Clock, ShieldCheck, ArrowRight, Sparkles } from 'lucide-react';
import { WhatsAppButton } from './WhatsAppButton';
import { useTranslation } from '../context/LanguageContext';

interface ServicesSectionProps {
  services: ServicePlan[];
  onSelectService: (serviceId: string) => void;
}

export const ServicesSection: React.FC<ServicesSectionProps> = ({
  services,
  onSelectService,
}) => {
  const { t } = useTranslation();

  return (
    <section id="services" className="py-12 sm:py-16 lg:py-20 bg-white border-b border-[#E2E8F0]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-2.5 sm:space-y-3 mb-8 sm:mb-12">
          <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-[#FB2C36] bg-red-50 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full border border-red-100">
            {t('pricingBadge')}
          </span>
          <h2 className="text-2xl xs:text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-[-1.2px] leading-tight">
            {t('pricingTitle')}
          </h2>
          <p className="text-xs sm:text-base text-slate-600 leading-[1.6] max-w-xl mx-auto">
            {t('pricingSubtitle')}
          </p>
        </div>

        {/* Pricing Cards: Vertical Stack on screens below 430px / mobile, 3-column grid on desktop */}
        <div className="flex flex-col lg:grid lg:grid-cols-3 gap-5 sm:gap-6 lg:gap-8 items-stretch max-w-6xl mx-auto w-full">
          {services.map((plan) => {
            const isFeatured = plan.isPopular;
            const ctaLabel = plan.id === 'basic-report'
              ? 'Get Basic Report'
              : plan.id === 'premium-auction-audit'
              ? 'Get Premium Report'
              : 'Get Complete Report';

            return (
              <div
                key={plan.id}
                className={`relative flex flex-col w-full rounded-[14px] bg-white transition-all duration-200 ${
                  isFeatured
                    ? 'border-2 border-[#FB2C36] shadow-[0_1px_2px_rgba(0,0,0,0.05)] lg:-translate-y-2'
                    : 'border border-[#E2E8F0] hover:border-slate-300'
                }`}
              >
                {/* Featured Badge */}
                {isFeatured && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#FB2C36] text-white text-[10px] sm:text-[11px] font-black uppercase tracking-wider px-3 sm:px-3.5 py-0.5 sm:py-1 rounded-full shadow-[0_1px_2px_rgba(0,0,0,0.05)] flex items-center gap-1.5 whitespace-nowrap z-10">
                    <Sparkles className="w-3 h-3 text-amber-300" />
                    <span>{t('mostPopular')}</span>
                  </div>
                )}

                {/* 16px Padding (p-4) on small mobile below 430px per Acme.ai spacing.md */}
                <div className="p-4 sm:p-6 lg:p-8 flex-1 flex flex-col w-full min-w-0">
                  {/* Plan Name & Tagline */}
                  <div className="mb-3 sm:mb-4">
                    <h3 className="text-lg sm:text-xl font-bold text-slate-900 truncate tracking-[-0.35px]">{plan.name}</h3>
                    <p className="text-xs text-slate-500 mt-0.5 sm:mt-1 leading-[1.5]">
                      {plan.tagline}
                    </p>
                  </div>

                  {/* Price Heading: Exactly 32px (text-[32px]) below 430px with -1.2px letter-spacing */}
                  <div className="mb-3.5 pb-3.5 sm:mb-5 sm:pb-5 border-b border-slate-100">
                    <div className="flex items-baseline gap-1">
                      <span className="text-[32px] sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-[-1.2px] leading-none">
                        ${plan.price.toFixed(2)}
                      </span>
                      <span className="text-xs font-semibold text-slate-400">USD</span>
                    </div>
                    {plan.originalPrice && (
                      <span className="text-[11px] sm:text-xs text-slate-400 line-through mt-1 block">
                        Regular ${plan.originalPrice.toFixed(2)}
                      </span>
                    )}
                  </div>

                  {/* Processing Time Badge (8px radius) */}
                  <div className="mb-4 sm:mb-6 flex items-center gap-2 text-[11px] sm:text-xs font-medium text-slate-600 bg-[#F8FAFC] border border-[#E2E8F0] px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-[8px]">
                    <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#FB2C36] shrink-0" />
                    <span>{plan.deliveryTime}</span>
                  </div>

                  {/* Included Items */}
                  <div className="space-y-2 sm:space-y-2.5 mb-4 sm:mb-6 flex-1">
                    <p className="text-[11px] sm:text-xs font-bold text-slate-900 uppercase tracking-wider">
                      What's Included:
                    </p>
                    <ul className="space-y-2 sm:space-y-2.5 text-xs text-slate-600">
                      {plan.includedItems.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2 sm:gap-2.5">
                          <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#059669] shrink-0 mt-0.5 stroke-[2.5]" />
                          <span className="text-[11.5px] sm:text-xs leading-[1.5] break-words">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Limitations / Exclusions */}
                  {plan.exclusions && plan.exclusions.length > 0 && (
                    <div className="space-y-1.5 sm:space-y-2 mb-4 sm:mb-6 pt-3 sm:pt-4 border-t border-slate-100">
                      <p className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        Limitations / Exclusions:
                      </p>
                      <ul className="space-y-1 sm:space-y-1.5 text-[10.5px] sm:text-[11px] text-slate-400">
                        {plan.exclusions.map((ex, idx) => (
                          <li key={idx} className="flex items-start gap-1.5 sm:gap-2">
                            <X className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-400 shrink-0 mt-0.5" />
                            <span className="break-words leading-[1.43]">{ex}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* CTA Button (8px button radius, #FB2C36 on featured, micro-shadow) */}
                  <div className="pt-2 space-y-2">
                    <button
                      type="button"
                      onClick={() => onSelectService(plan.id)}
                      className={`w-full py-2.5 sm:py-3 px-3.5 sm:px-4 rounded-[8px] text-xs sm:text-sm font-medium transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer active:scale-98 min-h-[44px] shadow-[0_1px_2px_rgba(0,0,0,0.05)] leading-[1.43] ${
                        isFeatured
                          ? 'bg-[#FB2C36] hover:bg-[#E0242E] text-white'
                          : 'bg-[#000000] hover:bg-slate-800 text-white'
                      }`}
                    >
                      <span>{ctaLabel}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>

                    <div className="text-center">
                      <WhatsAppButton
                        variant="text"
                        source="pricing"
                        intent="pricing"
                        label={`Questions about ${plan.name}? Chat on WhatsApp`}
                        message={`Hi AutoAudit Support, I have a question regarding the ${plan.name} ($${plan.price.toFixed(2)}).`}
                        className="text-[11px] text-slate-500 hover:text-emerald-600 font-normal"
                      />
                    </div>
                  </div>

                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
