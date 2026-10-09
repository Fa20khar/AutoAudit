import React from 'react';
import { ServicePlan } from '../types';
import { Check, X, Clock, ArrowRight, Sparkles } from 'lucide-react';
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
    <section id="services" className="py-12 sm:py-16 lg:py-20 bg-[#07111F] text-white border-b border-[rgba(148,163,184,0.20)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-2.5 sm:space-y-3 mb-8 sm:mb-12">
          <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-[#10B981] bg-[#059669]/20 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full border border-[#059669]/40">
            {t('pricingBadge')}
          </span>
          <h2 className="text-2xl xs:text-3xl sm:text-4xl font-extrabold text-white tracking-[-1.2px] leading-tight">
            {t('pricingTitle')}
          </h2>
          <p className="text-xs sm:text-base text-[#CBD5E1] leading-[1.6] max-w-xl mx-auto">
            {t('pricingSubtitle')}
          </p>
        </div>

        {/* Pricing Cards */}
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
                className={`relative flex flex-col w-full rounded-[14px] bg-[#0F1B2D] transition-all duration-200 ${
                  isFeatured
                    ? 'border-2 border-[#10B981] shadow-2xl lg:-translate-y-2 ring-1 ring-[#10B981]/50'
                    : 'border border-[rgba(148,163,184,0.20)] hover:border-slate-500'
                }`}
              >
                {/* Featured Badge */}
                {isFeatured && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#10B981] text-white text-[10px] sm:text-[11px] font-black uppercase tracking-wider px-3 sm:px-3.5 py-0.5 sm:py-1 rounded-full shadow-lg flex items-center gap-1.5 whitespace-nowrap z-10">
                    <Sparkles className="w-3 h-3 text-amber-300" />
                    <span>{t('mostPopular')}</span>
                  </div>
                )}

                <div className="p-4 sm:p-6 lg:p-8 flex-1 flex flex-col w-full min-w-0">
                  {/* Plan Name & Tagline */}
                  <div className="mb-3 sm:mb-4">
                    <h3 className="text-lg sm:text-xl font-bold text-white truncate tracking-[-0.35px]">{plan.name}</h3>
                    <p className="text-xs text-[#CBD5E1] mt-0.5 sm:mt-1 leading-[1.5]">
                      {plan.tagline}
                    </p>
                  </div>

                  {/* Price Heading */}
                  <div className="mb-3.5 pb-3.5 sm:mb-5 sm:pb-5 border-b border-[rgba(148,163,184,0.20)]">
                    <div className="flex items-baseline gap-1">
                      <span className="text-[32px] sm:text-4xl lg:text-5xl font-extrabold text-white tracking-[-1.2px] leading-none">
                        ${plan.price.toFixed(2)}
                      </span>
                      <span className="text-xs font-semibold text-slate-400">USD</span>
                    </div>
                    {plan.originalPrice && (
                      <span className="text-[11px] sm:text-xs text-slate-500 line-through mt-1 block">
                        Regular ${plan.originalPrice.toFixed(2)}
                      </span>
                    )}
                  </div>

                  {/* Processing Time Badge */}
                  <div className="mb-4 sm:mb-6 flex items-center gap-2 text-[11px] sm:text-xs font-medium text-[#CBD5E1] bg-[#0B132B] border border-[rgba(148,163,184,0.20)] px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-[8px]">
                    <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#10B981] shrink-0" />
                    <span>{plan.deliveryTime}</span>
                  </div>

                  {/* Included Items */}
                  <div className="space-y-2 sm:space-y-2.5 mb-4 sm:mb-6 flex-1">
                    <p className="text-[11px] sm:text-xs font-bold text-white uppercase tracking-wider">
                      What's Included:
                    </p>
                    <ul className="space-y-2 sm:space-y-2.5 text-xs text-[#CBD5E1]">
                      {plan.includedItems.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2 sm:gap-2.5">
                          <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#10B981] shrink-0 mt-0.5 stroke-[2.5]" />
                          <span className="text-[11.5px] sm:text-xs leading-[1.5] break-words text-[#CBD5E1]">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Limitations / Exclusions */}
                  {plan.exclusions && plan.exclusions.length > 0 && (
                    <div className="space-y-1.5 sm:space-y-2 mb-4 sm:mb-6 pt-3 sm:pt-4 border-t border-[rgba(148,163,184,0.20)]">
                      <p className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        Limitations / Exclusions:
                      </p>
                      <ul className="space-y-1 sm:space-y-1.5 text-[10.5px] sm:text-[11px] text-slate-400">
                        {plan.exclusions.map((ex, idx) => (
                          <li key={idx} className="flex items-start gap-1.5 sm:gap-2">
                            <X className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-500 shrink-0 mt-0.5" />
                            <span className="break-words leading-[1.43]">{ex}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* CTA Button */}
                  <div className="pt-2 space-y-2">
                    <button
                      type="button"
                      onClick={() => onSelectService(plan.id)}
                      className={`w-full py-2.5 sm:py-3 px-3.5 sm:px-4 rounded-[8px] text-xs sm:text-sm font-semibold transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer active:scale-98 min-h-[44px] shadow-[0_1px_2px_rgba(0,0,0,0.1)] leading-[1.43] ${
                        isFeatured
                          ? 'bg-[#2563EB] hover:bg-[#1D4ED8] text-white shadow-blue-500/20 shadow-lg'
                          : 'bg-[#0B132B] hover:bg-[#162740] text-white border border-[rgba(148,163,184,0.20)]'
                      }`}
                    >
                      <span>{ctaLabel}</span>
                      <ArrowRight className="w-4 h-4 text-[#10B981]" />
                    </button>

                    <div className="text-center">
                      <WhatsAppButton
                        variant="text"
                        source="pricing"
                        intent="pricing"
                        label={`Questions about ${plan.name}? Chat on WhatsApp`}
                        message={`Hi AutoAudit Support, I have a question regarding the ${plan.name} ($${plan.price.toFixed(2)}).`}
                        className="text-[11px] text-slate-400 hover:text-[#10B981] font-normal"
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
