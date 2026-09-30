import React from 'react';
import { FileText, ShieldCheck, Lock, CheckCircle2, Sparkles } from 'lucide-react';

export const TrustBenefitsSection: React.FC = () => {
  const cards = [
    {
      title: 'Clear Information',
      desc: 'Easy-to-understand vehicle report information without confusing technical jargon.',
      icon: FileText,
      accent: 'text-[#2563EB] bg-blue-50 border-blue-100',
    },
    {
      title: 'Secure Checkout',
      desc: 'Protect customer payment information with tokenized, PCI-compliant processing.',
      icon: Lock,
      accent: 'text-[#059669] bg-emerald-50 border-emerald-100',
    },
    {
      title: 'Private Delivery',
      desc: 'Results delivered securely to the customer with confidential, encrypted access.',
      icon: ShieldCheck,
      accent: 'text-[#2563EB] bg-blue-50 border-blue-100',
    },
    {
      title: 'Simple Experience',
      desc: 'Order a report without unnecessary steps or forced long-term subscription commitments.',
      icon: CheckCircle2,
      accent: 'text-[#059669] bg-emerald-50 border-emerald-100',
    },
  ];

  return (
    <section className="py-20 bg-white border-b border-[#E2E8F0]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-14">
          <span className="text-xs font-bold uppercase tracking-wider text-[#059669] bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
            TRANSPARENCY FIRST
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Built Around Transparency
          </h2>
          <p className="text-base text-slate-600 leading-relaxed">
            Every feature is engineered to provide verified automotive records with complete clarity and privacy.
          </p>
        </div>

        {/* 4 Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {cards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <div
                key={idx}
                className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-6 space-y-4 hover:shadow-md transition-shadow"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center border shadow-xs ${card.accent}`}>
                  <Icon className="w-6 h-6 stroke-[1.75]" />
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-base font-bold text-slate-900">
                    {card.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {card.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
