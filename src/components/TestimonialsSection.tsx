import React from 'react';
import { Star, CheckCircle2 } from 'lucide-react';
import { TESTIMONIALS } from '../data/initialData';

export const TestimonialsSection: React.FC = () => {
  return (
    <section className="py-20 bg-[#F8FAFC] border-b border-[#E2E8F0]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-14">
          <span className="text-xs font-bold uppercase tracking-wider text-[#2563EB] bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
            CUSTOMER EXPERIENCES
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            What Customers Say
          </h2>
          <p className="text-base text-slate-600 leading-relaxed">
            Real feedback from private buyers who checked vehicle histories before purchasing.
          </p>
        </div>

        {/* 3 Review Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {TESTIMONIALS.map((t, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl border border-[#E2E8F0] p-6 sm:p-7 shadow-xs flex flex-col justify-between space-y-5"
            >
              <div className="space-y-3">
                {/* 5 Yellow Stars */}
                <div className="flex items-center gap-1">
                  {[...Array(t.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>

                {/* Review Copy */}
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed italic">
                  "{t.content}"
                </p>
              </div>

              {/* Customer Profile & Green Verified Badge */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <div className="flex items-center gap-3">
                  {t.avatar ? (
                    <img
                      src={t.avatar}
                      alt={t.name}
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 rounded-full object-cover border border-slate-200"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-[#0B132B] text-white flex items-center justify-center font-bold text-xs">
                      {t.name.split(' ').map((n) => n[0]).join('')}
                    </div>
                  )}

                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{t.name}</h4>
                    <p className="text-[11px] text-slate-500">{t.role}</p>
                  </div>
                </div>

                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-[#059669] border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#059669]" />
                  <span>Verified</span>
                </div>
              </div>

            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
