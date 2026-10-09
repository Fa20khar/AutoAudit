import React, { useState } from 'react';
import { ChevronDown, QrCode } from 'lucide-react';
import { FAQS } from '../data/initialData';
import { WhatsAppButton } from './WhatsAppButton';

export const FAQSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleAccordion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-20 bg-[#0B132B] text-white border-b border-[rgba(148,163,184,0.20)]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center space-y-3 mb-14">
          <span className="text-xs font-bold uppercase tracking-wider text-[#10B981] bg-[#059669]/20 px-3 py-1 rounded-full border border-[#059669]/40">
            COMMON QUESTIONS
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-base text-[#CBD5E1] leading-relaxed">
            Everything you need to know about our vehicle history reports, fulfillment, and terms.
          </p>
        </div>

        {/* 6 Accordion Items */}
        <div className="space-y-3">
          {FAQS.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={index}
                className="border border-[rgba(148,163,184,0.20)] rounded-xl overflow-hidden bg-[#0F1B2D] transition-colors"
              >
                <button
                  type="button"
                  onClick={() => toggleAccordion(index)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-white text-sm sm:text-base hover:text-[#10B981] transition-colors cursor-pointer"
                  aria-expanded={isOpen}
                >
                  <span className="flex items-center gap-3">
                    <span className="font-mono text-xs text-[#10B981] font-bold">
                      0{index + 1}
                    </span>
                    <span>{faq.q}</span>
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${
                      isOpen ? 'rotate-180 text-[#10B981]' : ''
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-[#CBD5E1] leading-relaxed border-t border-[rgba(148,163,184,0.15)] bg-[#0B132B]/60">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom WhatsApp Help Banner */}
        <div className="mt-10 p-6 rounded-2xl bg-[#0F1B2D] border border-[rgba(148,163,184,0.20)] flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left shadow-lg">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#0B132B] text-[#10B981] border border-[rgba(148,163,184,0.20)] flex items-center justify-center shrink-0">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">
                Still have questions about a vehicle?
              </h4>
              <p className="text-xs text-[#CBD5E1] mt-0.5">
                Our team is available on WhatsApp 24/7 at <strong className="text-white font-mono">03420617217</strong> (+92 342 0617217) to help you verify VINs and choose the right report.
              </p>
            </div>
          </div>
          <WhatsAppButton
            variant="primary"
            openQrModal={true}
            label="Scan WhatsApp QR: 03420617217"
            className="shrink-0 px-4 py-2.5 text-xs font-bold shadow-md hover:shadow-lg"
          />
        </div>

      </div>
    </section>
  );
};
