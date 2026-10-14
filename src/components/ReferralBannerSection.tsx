import React, { useState } from 'react';
import { Gift, Share2, Copy, Check, Users, Sparkles, ArrowRight, DollarSign, Tag, QrCode } from 'lucide-react';
import { getReferralProfile, buildReferralLink, DEFAULT_FRIEND_DISCOUNT_PERCENT, DEFAULT_REWARD_CREDIT } from '../utils/referralStorage';
import { useToast } from '../context/ToastContext';

interface ReferralBannerSectionProps {
  onOpenReferralModal: () => void;
  onOpenOrder?: () => void;
}

export const ReferralBannerSection: React.FC<ReferralBannerSectionProps> = ({
  onOpenReferralModal,
  onOpenOrder,
}) => {
  const { showToast } = useToast();
  const profile = getReferralProfile();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(profile.referralCode);
    setCopied(true);
    showToast({
      title: 'Referral Code Copied',
      message: `${profile.referralCode} copied! Share it to give friends 20% off.`,
      type: 'success',
    });
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <section className="py-16 bg-[#07111F] relative overflow-hidden border-b border-[rgba(148,163,184,0.15)]">
      {/* Background radial gradient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-72 bg-gradient-to-r from-blue-600/10 via-emerald-600/10 to-teal-600/10 blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="bg-gradient-to-br from-[#0B132B] via-[#0F1B2D] to-[#0B132B] border-2 border-emerald-500/30 rounded-2xl p-6 sm:p-8 md:p-10 shadow-2xl relative overflow-hidden">
          
          {/* Top Decorative Pill */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-bold">
              <Gift className="w-3.5 h-3.5" />
              <span>AutoAudit Refer-a-Friend Rewards</span>
            </div>

            <div className="text-xs text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Unlimited referrals · Instant report discounts</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Left Column: Heading and Value proposition */}
            <div className="lg:col-span-7 space-y-4">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight leading-tight">
                Give Friends <span className="text-emerald-400">20% OFF</span>.<br className="hidden sm:inline" />
                Earn <span className="text-blue-400">$5 Discounts</span> on Future Reports.
              </h2>

              <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-xl">
                Know someone buying, selling, or inspecting a used car? Share your personal referral code. They save 20% on any vehicle history report, and you receive $5 credit towards your next VIN audit.
              </p>

              {/* 3 Value Pillars */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
                <div className="p-3 rounded-xl bg-[#07111F]/80 border border-slate-800 space-y-1">
                  <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                    <Tag className="w-4 h-4 shrink-0" />
                    <span>20% Off For Them</span>
                  </div>
                  <p className="text-slate-400 text-[11px]">Applied automatically on checkout</p>
                </div>

                <div className="p-3 rounded-xl bg-[#07111F]/80 border border-slate-800 space-y-1">
                  <div className="flex items-center gap-1.5 text-blue-400 font-bold">
                    <DollarSign className="w-4 h-4 shrink-0" />
                    <span>$5 For You</span>
                  </div>
                  <p className="text-slate-400 text-[11px]">Earned on every completed report</p>
                </div>

                <div className="p-3 rounded-xl bg-[#07111F]/80 border border-slate-800 space-y-1">
                  <div className="flex items-center gap-1.5 text-amber-300 font-bold">
                    <Sparkles className="w-4 h-4 shrink-0" />
                    <span>Stack Discounts</span>
                  </div>
                  <p className="text-slate-400 text-[11px]">Refer 3 friends = 1 Free Report</p>
                </div>
              </div>
            </div>

            {/* Right Column: Code Card with Quick Action */}
            <div className="lg:col-span-5">
              <div className="bg-[#07111F] border border-emerald-500/40 rounded-xl p-5 sm:p-6 shadow-xl space-y-4">
                
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-400 uppercase tracking-wider">Your Personal Code</span>
                  <span className="text-emerald-400 font-semibold text-[11px] bg-emerald-950 px-2 py-0.5 rounded border border-emerald-500/30">
                    Active & Ready
                  </span>
                </div>

                {/* Big Code Pill */}
                <div className="p-3.5 bg-[#0B132B] rounded-xl border border-emerald-500/30 flex items-center justify-between gap-3">
                  <span className="text-xl sm:text-2xl font-black font-mono tracking-wider text-emerald-300">
                    {profile.referralCode}
                  </span>

                  <button
                    type="button"
                    onClick={handleCopy}
                    className="p-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold active:scale-95"
                    title="Copy referral code"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={onOpenReferralModal}
                    className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Refer Friends</span>
                  </button>

                  <button
                    type="button"
                    onClick={onOpenReferralModal}
                    className="w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <QrCode className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Show QR Code</span>
                  </button>
                </div>

                <div className="pt-1 text-center">
                  <button
                    type="button"
                    onClick={onOpenReferralModal}
                    className="text-[11px] text-slate-400 hover:text-emerald-300 underline font-medium cursor-pointer transition-colors"
                  >
                    View your earned rewards dashboard ({profile.rewardCoupons.filter(r => !r.used).length} vouchers available) →
                  </button>
                </div>

              </div>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
};
