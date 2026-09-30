import React from 'react';
import { ShoppingBag, FileText, Lock, MailCheck, ArrowRight } from 'lucide-react';

interface HowItWorksProps {
  onStartOrder: () => void;
}

export const HowItWorks: React.FC<HowItWorksProps> = ({ onStartOrder }) => {
  const steps = [
    {
      num: '01',
      title: 'Choose Your Report',
      desc: 'Select the vehicle report or service that fits your purchase needs.',
      icon: ShoppingBag,
    },
    {
      num: '02',
      title: 'Enter Vehicle Details',
      desc: 'Enter the 17-digit VIN or required vehicle registration information.',
      icon: FileText,
    },
    {
      num: '03',
      title: 'Pay Securely',
      desc: 'Complete checkout using the available secure, encrypted payment method.',
      icon: Lock,
    },
    {
      num: '04',
      title: 'Receive Your Report',
      desc: 'Receive the completed result through email and access it through your account when available.',
      icon: MailCheck,
    },
  ];

  return (
    <section id="how-it-works" className="py-20 bg-[#F8FAFC] border-b border-[#E2E8F0]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Heading */}
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
          <span className="text-xs font-bold uppercase tracking-wider text-[#FB2C36] bg-red-50 px-3 py-1 rounded-full border border-red-100">
            SIMPLE PROCESS
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-[-1.2px]">
            How AutoAudit Works
          </h2>
          <p className="text-base text-slate-600 leading-[1.6]">
            Follow four simple steps from entering your vehicle details to receiving your verified report.
          </p>
        </div>

        {/* 4 Steps Timeline (Horizontal desktop / Vertical mobile) */}
        <div className="relative">
          {/* Horizontal connecting line on desktop */}
          <div className="hidden lg:block absolute top-12 left-16 right-16 h-0.5 bg-[#E2E8F0] z-0" />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 relative z-10">
            {steps.map((step, idx) => {
              const Icon = step.icon;
              return (
                <div
                  key={idx}
                  className="bg-white rounded-[14px] border border-[#EBEBEB] p-6 sm:p-7 shadow-[0_1px_2px_rgba(0,0,0,0.05)] hover:border-slate-300 transition-colors relative flex flex-col"
                >
                  {/* Step Number & Icon Header */}
                  <div className="flex items-center justify-between mb-5">
                    <span className="font-mono text-2xl font-black text-[#FB2C36]">
                      {step.num}
                    </span>
                    <div className="w-11 h-11 rounded-[8px] bg-red-50 text-[#FB2C36] flex items-center justify-center border border-red-100">
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>

                  {/* Title & Desc */}
                  <h3 className="text-base font-bold text-slate-900 mb-2 tracking-[-0.35px]">
                    {step.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-[1.5] flex-1">
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
            className="px-6 py-3 rounded-[8px] text-sm font-medium bg-[#FB2C36] hover:bg-[#E0242E] text-white shadow-[0_1px_2px_rgba(0,0,0,0.05)] transition-all duration-150 inline-flex items-center gap-2 cursor-pointer active:scale-95 leading-[1.43]"
          >
            <span>Order Your Vehicle Report Now</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </section>
  );
};
