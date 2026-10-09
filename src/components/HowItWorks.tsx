import React from 'react';
import { ShoppingBag, FileText, Lock, MailCheck, ArrowRight } from 'lucide-react';
import { useTranslation } from '../context/LanguageContext';

interface HowItWorksProps {
  onStartOrder: () => void;
}

export const HowItWorks: React.FC<HowItWorksProps> = ({ onStartOrder }) => {
  const { t } = useTranslation();

  const steps = [
    {
      num: '01',
      title: t('howStep1Title'),
      desc: t('howStep1Desc'),
      icon: ShoppingBag,
    },
    {
      num: '02',
      title: t('howStep2Title'),
      desc: t('howStep2Desc'),
      icon: FileText,
    },
    {
      num: '03',
      title: t('howStep3Title'),
      desc: t('howStep3Desc'),
      icon: Lock,
    },
    {
      num: '04',
      title: t('howStep4Title'),
      desc: t('howStep4Desc'),
      icon: MailCheck,
    },
  ];

  return (
    <section id="how-it-works" className="py-20 bg-[#0B132B] text-white border-b border-[rgba(148,163,184,0.20)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Heading */}
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
          <span className="text-xs font-bold uppercase tracking-wider text-[#10B981] bg-[#059669]/20 px-3 py-1 rounded-full border border-[#059669]/40">
            {t('howBadge')}
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-[-1.2px]">
            {t('howTitle')}
          </h2>
          <p className="text-base text-[#CBD5E1] leading-[1.6]">
            {t('howSubtitle')}
          </p>
        </div>

        {/* 4 Steps Timeline */}
        <div className="relative">
          {/* Horizontal connecting line on desktop */}
          <div className="hidden lg:block absolute top-12 left-16 right-16 h-0.5 bg-[rgba(148,163,184,0.20)] z-0" />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 relative z-10">
            {steps.map((step, idx) => {
              const Icon = step.icon;
              return (
                <div
                  key={idx}
                  className="bg-[#0F1B2D] rounded-[14px] border border-[rgba(148,163,184,0.20)] p-6 sm:p-7 shadow-lg hover:border-slate-500 transition-colors relative flex flex-col"
                >
                  {/* Step Number & Icon Header */}
                  <div className="flex items-center justify-between mb-5">
                    <span className="font-mono text-2xl font-black text-[#10B981]">
                      {step.num}
                    </span>
                    <div className="w-11 h-11 rounded-[8px] bg-[#0B132B] text-[#10B981] flex items-center justify-center border border-[rgba(148,163,184,0.20)]">
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>

                  {/* Title & Desc */}
                  <h3 className="text-base font-bold text-white mb-2 tracking-[-0.35px]">
                    {step.title}
                  </h3>
                  <p className="text-xs text-[#CBD5E1] leading-[1.5] flex-1">
                    {step.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-12">
          <button
            type="button"
            onClick={onStartOrder}
            className="px-6 py-3 rounded-[8px] text-sm font-semibold bg-[#2563EB] hover:bg-[#1D4ED8] text-white shadow-[0_1px_2px_rgba(0,0,0,0.1)] transition-all duration-150 inline-flex items-center gap-2 cursor-pointer active:scale-95 leading-[1.43]"
          >
            <span>Order Your Vehicle Report Now</span>
            <ArrowRight className="w-4 h-4 text-[#10B981]" />
          </button>
        </div>

      </div>
    </section>
  );
};
