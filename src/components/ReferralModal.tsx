import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  X,
  Gift,
  Copy,
  Check,
  Share2,
  QrCode,
  DollarSign,
  Users,
  Award,
  ArrowRight,
  RefreshCw,
  ExternalLink,
  Tag,
  CheckCircle2,
  Clock,
  Car
} from 'lucide-react';
import {
  ReferralProfile,
  ReferralRewardCoupon
} from '../types/referral';
import {
  getReferralProfile,
  saveReferralProfile,
  generateUniqueReferralCode,
  buildReferralLink,
  updateReferralCode,
  DEFAULT_FRIEND_DISCOUNT_PERCENT,
  DEFAULT_REWARD_CREDIT
} from '../utils/referralStorage';
import { useToast } from '../context/ToastContext';
import { formatWhatsAppNumberForLink, AUTUAUDIT_WHATSAPP_NUMBER } from './WhatsAppWidget';

interface ReferralModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyRewardToCheckout?: (couponCode: string) => void;
}

export const ReferralModal: React.FC<ReferralModalProps> = ({
  isOpen,
  onClose,
  onApplyRewardToCheckout
}) => {
  const { showToast } = useToast();
  const [profile, setProfile] = useState<ReferralProfile>(getReferralProfile);
  const [activeTab, setActiveTab] = useState<'share' | 'qr' | 'rewards'>('share');
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedRewardIndex, setCopiedRewardIndex] = useState<number | null>(null);
  
  // Custom code editing
  const [isEditingCode, setIsEditingCode] = useState(false);
  const [customInput, setCustomInput] = useState('');

  useEffect(() => {
    if (isOpen) {
      setProfile(getReferralProfile());
      setCopiedCode(false);
      setCopiedLink(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const referralLink = profile.referralLink || buildReferralLink(profile.referralCode);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(profile.referralCode);
    setCopiedCode(true);
    showToast({
      title: 'Referral Code Copied',
      message: `${profile.referralCode} copied to clipboard!`,
      type: 'success'
    });
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopiedLink(true);
    showToast({
      title: 'Referral Link Copied',
      message: 'Share this link to give friends 20% OFF and earn discounts!',
      type: 'success'
    });
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleRegenerateCode = () => {
    const newCode = generateUniqueReferralCode();
    const updated = updateReferralCode(newCode);
    setProfile(updated);
    showToast({
      title: 'New Code Generated',
      message: `Your new referral code is ${updated.referralCode}`,
      type: 'info'
    });
  };

  const handleSaveCustomCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customInput.trim()) return;
    const clean = customInput.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (clean.length < 3) {
      showToast({
        title: 'Code Too Short',
        message: 'Custom referral codes must be at least 3 characters.',
        type: 'warning'
      });
      return;
    }
    const fullCode = clean.startsWith('REF-') ? clean : `REF-${clean}`;
    const updated = updateReferralCode(fullCode);
    setProfile(updated);
    setIsEditingCode(false);
    setCustomInput('');
    showToast({
      title: 'Referral Code Updated',
      message: `Your custom code is now ${fullCode}`,
      type: 'success'
    });
  };

  const whatsappShareText = `Hey! Check a vehicle's history with AutoAudit. Use my referral code ${profile.referralCode} for ${profile.discountPercentForFriend}% OFF your report: ${referralLink}`;
  const whatsappShareUrl = `https://wa.me/?text=${encodeURIComponent(whatsappShareText)}`;

  const emailSubject = encodeURIComponent('20% OFF Vehicle History Report on AutoAudit');
  const emailBody = encodeURIComponent(
    `Hi,\n\nI recommend using AutoAudit to check vehicle history before buying or selling a car.\n\nUse my referral code ${profile.referralCode} or visit the link below for 20% OFF:\n${referralLink}\n\nSafe driving!`
  );
  const emailShareUrl = `mailto:?subject=${emailSubject}&body=${emailBody}`;

  const twitterShareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    `Get 20% OFF vehicle history reports with AutoAudit! Use code ${profile.referralCode}: ${referralLink}`
  )}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="referral-modal-title"
    >
      <div className="relative w-full max-w-xl bg-[#0B132B] border border-emerald-500/30 rounded-2xl shadow-2xl text-slate-100 overflow-hidden my-8 animate-drawer-fade-in">
        
        {/* Header with Automotive Gradient */}
        <div className="relative bg-gradient-to-r from-blue-900/80 via-indigo-900/80 to-emerald-950/90 p-5 sm:p-6 border-b border-[rgba(148,163,184,0.15)] flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-white shrink-0">
              <Gift className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-400/30 text-emerald-300">
                  Rewards Program
                </span>
                <span className="text-xs text-amber-300 font-semibold flex items-center gap-1">
                  <Gift className="w-3 h-3" /> Give 20% • Earn $5
                </span>
              </div>
              <h2 id="referral-modal-title" className="text-xl sm:text-2xl font-black text-white tracking-tight mt-0.5">
                Refer a Friend & Earn
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close Refer a Friend Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center border-b border-[rgba(148,163,184,0.15)] bg-[#07111F]/70 text-xs font-semibold px-4 pt-2">
          <button
            type="button"
            onClick={() => setActiveTab('share')}
            className={`py-2.5 px-4 flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
              activeTab === 'share'
                ? 'border-emerald-500 text-emerald-400 font-bold bg-[#0B132B]/60 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share & Invite</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('qr')}
            className={`py-2.5 px-4 flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
              activeTab === 'qr'
                ? 'border-emerald-500 text-emerald-400 font-bold bg-[#0B132B]/60 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Scan QR Code</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('rewards')}
            className={`py-2.5 px-4 flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
              activeTab === 'rewards'
                ? 'border-emerald-500 text-emerald-400 font-bold bg-[#0B132B]/60 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>My Rewards ({profile.rewardCoupons.filter(r => !r.used).length})</span>
          </button>
        </div>

        {/* Tab 1: Share & Invite */}
        {activeTab === 'share' && (
          <div className="p-5 sm:p-6 space-y-6">
            
            {/* Value Proposition Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-[#07111F] border border-blue-500/20 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                  <Tag className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Friend Receives</span>
                  <p className="text-sm font-bold text-white">20% OFF Instant Discount</p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#07111F] border border-emerald-500/20 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">You Earn</span>
                  <p className="text-sm font-bold text-emerald-400">$5.00 Credit Per Report</p>
                </div>
              </div>
            </div>

            {/* Unique Referral Code Box */}
            <div className="bg-[#07111F] border-2 border-emerald-500/40 rounded-xl p-4 sm:p-5 relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-emerald-400" />
                  Your Unique Referral Code
                </span>
                
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditingCode(!isEditingCode)}
                    className="text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer underline"
                  >
                    {isEditingCode ? 'Cancel' : 'Customize'}
                  </button>
                  <button
                    type="button"
                    onClick={handleRegenerateCode}
                    title="Generate a new random code"
                    className="p-1 rounded text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {isEditingCode ? (
                <form onSubmit={handleSaveCustomCode} className="mt-2 flex items-center gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-mono">REF-</span>
                    <input
                      type="text"
                      maxLength={12}
                      value={customInput}
                      onChange={(e) => setCustomInput(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                      placeholder="YOURNAME20"
                      className="w-full pl-12 pr-3 py-2 text-sm font-mono font-bold bg-[#0B132B] border border-emerald-500/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-3.5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors cursor-pointer shrink-0"
                  >
                    Save
                  </button>
                </form>
              ) : (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl sm:text-3xl font-black font-mono tracking-wider text-emerald-300 bg-emerald-950/50 px-3 py-1 rounded-lg border border-emerald-500/30">
                      {profile.referralCode}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md hover:shadow-emerald-500/20 active:scale-95"
                  >
                    {copiedCode ? (
                      <>
                        <Check className="w-4 h-4 text-white" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Copy Code</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Shareable Link Display */}
              <div className="mt-4 pt-3 border-t border-[rgba(148,163,184,0.15)] flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
                <span className="text-slate-400 truncate max-w-full font-mono text-[11px] bg-slate-900/80 px-2.5 py-1.5 rounded border border-slate-800 w-full sm:w-auto flex-1">
                  {referralLink}
                </span>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="w-full sm:w-auto px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? 'Link Copied' : 'Copy Link'}</span>
                </button>
              </div>
            </div>

            {/* Quick Share Buttons */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Share Immediately:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {/* WhatsApp Share */}
                <a
                  href={whatsappShareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-xl bg-[#25D366]/20 hover:bg-[#25D366]/30 border border-[#25D366]/40 text-emerald-300 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Share2 className="w-4 h-4 text-[#25D366]" />
                  <span>WhatsApp</span>
                </a>

                {/* Email Share */}
                <a
                  href={emailShareUrl}
                  className="p-2.5 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/40 text-blue-300 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <ExternalLink className="w-4 h-4 text-blue-400" />
                  <span>Email</span>
                </a>

                {/* QR Code Tab switch */}
                <button
                  type="button"
                  onClick={() => setActiveTab('qr')}
                  className="p-2.5 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/40 text-indigo-300 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer col-span-2 sm:col-span-1"
                >
                  <QrCode className="w-4 h-4 text-indigo-400" />
                  <span>Show QR Code</span>
                </button>
              </div>
            </div>

            {/* 3 Steps Guide */}
            <div className="p-4 rounded-xl bg-[#07111F]/60 border border-[rgba(148,163,184,0.15)] space-y-3">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                How Refer-a-Friend Works
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                    1
                  </div>
                  <div>
                    <strong className="text-white block font-semibold">Share Your Link</strong>
                    <span className="text-slate-400 text-[11px]">Send to anyone buying or selling a car.</span>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                    2
                  </div>
                  <div>
                    <strong className="text-white block font-semibold">Friend Gets 20% OFF</strong>
                    <span className="text-slate-400 text-[11px]">Discount applies automatically at checkout.</span>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                    3
                  </div>
                  <div>
                    <strong className="text-white block font-semibold">You Earn Discounts</strong>
                    <span className="text-slate-400 text-[11px]">$5 reward credit credited per purchase.</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* Tab 2: QR Code In-Person Sharing */}
        {activeTab === 'qr' && (
          <div className="p-5 sm:p-6 text-center space-y-5">
            <div>
              <h3 className="text-base font-bold text-white">Scan to Claim 20% OFF</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Have your friend point their smartphone camera at this QR code. It will instantly open AutoAudit with your referral discount applied!
              </p>
            </div>

            <div className="inline-block p-4 bg-white rounded-2xl shadow-xl shadow-emerald-950/40 border-4 border-emerald-500/40">
              <QRCodeSVG
                value={referralLink}
                size={200}
                level="H"
                includeMargin={false}
              />
            </div>

            <div className="space-y-1">
              <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-500/30">
                Code: {profile.referralCode}
              </span>
              <p className="text-[11px] text-slate-400 pt-1">
                20% discount will be pre-filled at vehicle checkout.
              </p>
            </div>

            <div className="pt-2 flex justify-center gap-3">
              <button
                type="button"
                onClick={handleCopyLink}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Link Instead</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 3: My Rewards & Earnings Dashboard */}
        {activeTab === 'rewards' && (
          <div className="p-5 sm:p-6 space-y-6">
            
            {/* Stats Overview */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 rounded-xl bg-[#07111F] border border-[rgba(148,163,184,0.15)]">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Friends Referred</span>
                <p className="text-2xl font-black text-white mt-1">{profile.totalReferrals}</p>
              </div>

              <div className="p-3 rounded-xl bg-[#07111F] border border-emerald-500/30">
                <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block">Credits Balance</span>
                <p className="text-2xl font-black text-emerald-300 mt-1">${profile.availableCredits.toFixed(2)}</p>
              </div>

              <div className="p-3 rounded-xl bg-[#07111F] border border-[rgba(148,163,184,0.15)]">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total Earned</span>
                <p className="text-2xl font-black text-white mt-1">${profile.totalCreditsEarned.toFixed(2)}</p>
              </div>
            </div>

            {/* Reward Coupons List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-amber-400" />
                  Your Discount Vouchers
                </span>
                <span className="text-[11px] text-slate-400">
                  {profile.rewardCoupons.length} vouchers generated
                </span>
              </div>

              {profile.rewardCoupons.length === 0 ? (
                <div className="p-6 rounded-xl bg-[#07111F]/60 border border-dashed border-[rgba(148,163,184,0.25)] text-center space-y-2">
                  <div className="w-10 h-10 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                    <Gift className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-semibold text-slate-200">No Vouchers Earned Yet</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Share your referral code <strong className="text-emerald-400 font-mono">{profile.referralCode}</strong> with a friend. Once they complete a vehicle check, you will receive a $5.00 discount voucher right here!
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('share')}
                    className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 hover:text-emerald-300 cursor-pointer underline"
                  >
                    <span>Get Share Link →</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {profile.rewardCoupons.map((reward, idx) => (
                    <div
                      key={reward.code || idx}
                      className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 text-xs transition-colors ${
                        reward.used
                          ? 'bg-[#07111F]/40 border-slate-800 opacity-60'
                          : 'bg-[#07111F] border-emerald-500/30 shadow-xs'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm text-emerald-300">
                            {reward.code}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            reward.used
                              ? 'bg-slate-800 text-slate-400'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                          }`}>
                            {reward.used ? 'Redeemed' : `$${reward.amount.toFixed(2)} OFF`}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400">{reward.description}</p>
                      </div>

                      {!reward.used && (
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(reward.code);
                              setCopiedRewardIndex(idx);
                              showToast({
                                title: 'Reward Code Copied',
                                message: `Use ${reward.code} during checkout to save $${reward.amount.toFixed(2)}!`,
                                type: 'success'
                              });
                              setTimeout(() => setCopiedRewardIndex(null), 2500);
                            }}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
                            title="Copy voucher code"
                          >
                            {copiedRewardIndex === idx ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>

                          {onApplyRewardToCheckout && (
                            <button
                              type="button"
                              onClick={() => {
                                onApplyRewardToCheckout(reward.code);
                                onClose();
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] cursor-pointer transition-colors"
                            >
                              Apply
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Friend conversion history if any */}
            {profile.conversions && profile.conversions.length > 0 && (
              <div className="pt-2 border-t border-[rgba(148,163,184,0.15)] space-y-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Recent Referral Activity
                </span>
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {profile.conversions.map((conv) => (
                    <div
                      key={conv.id}
                      className="text-[11px] p-2 rounded-lg bg-[#07111F]/80 flex items-center justify-between text-slate-300"
                    >
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>{conv.friendName} completed {conv.serviceName}</span>
                      </div>
                      <span className="font-mono text-emerald-400 font-bold">
                        +${conv.rewardEarned.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}

        {/* Modal Footer */}
        <div className="p-4 bg-[#07111F] border-t border-[rgba(148,163,184,0.15)] flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
            <span>Discounts valid on all vehicle history reports</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold cursor-pointer transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
