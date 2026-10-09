import React from 'react';
import { Receipt, Lock, Mail, Headset } from 'lucide-react';

export const TrustStrip: React.FC = () => {
  const items = [
    {
      icon: Receipt,
      title: 'Transparent Pricing',
      desc: 'No hidden recurring subscriptions or unexpected checkout surcharges.',
    },
    {
      icon: Lock,
      title: 'Secure Checkout',
      desc: '256-bit encrypted transactions protecting customer payment details.',
    },
    {
      icon: Mail,
      title: 'Email Delivery',
      desc: 'High-resolution PDF delivered directly to your inbox within minutes.',
    },
    {
      icon: Headset,
      title: 'Customer Support',
      desc: 'Dedicated support specialists available to assist with report lookups.',
    },
  ];

  return (
    <section className="bg-[#0B132B] border-b border-[rgba(148,163,184,0.20)] py-6 sm:py-8 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
          {items.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} className="flex items-start gap-3.5 p-3 sm:p-3.5 rounded-[12px] bg-[#0F1B2D] border border-[rgba(148,163,184,0.20)] shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-[#0B132B] border border-[rgba(148,163,184,0.20)] text-[#10B981] flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-sm font-bold text-white leading-snug">
                    {item.title}
                  </h4>
                  <p className="text-xs text-[#CBD5E1] leading-relaxed">
                    {item.desc}
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
