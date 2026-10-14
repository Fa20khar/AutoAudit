import { Coupon } from '../types';
import { ReferralProfile, ReferralRewardCoupon, ReferralConversion } from '../types/referral';

const REFERRAL_STORAGE_KEY = 'autoaudit_referral_profile';
const INCOMING_REF_KEY = 'autoaudit_incoming_ref_code';

export const DEFAULT_FRIEND_DISCOUNT_PERCENT = 20; // 20% OFF for friends
export const DEFAULT_REWARD_CREDIT = 5.0; // $5 USD credit for the referrer

/**
 * Generate a clean, memorable referral code
 */
export function generateUniqueReferralCode(customName?: string): string {
  const cleanName = (customName || '').trim().replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  const randomSuffix = Math.floor(100 + Math.random() * 900);
  
  if (cleanName && cleanName.length >= 3) {
    const prefix = cleanName.slice(0, 8);
    return `REF-${prefix}-${randomSuffix}`;
  }
  
  const autoWords = ['AUDIT', 'DRIVE', 'VIN', 'SAFE', 'SPEED', 'CAR', 'ROAD'];
  const chosenWord = autoWords[Math.floor(Math.random() * autoWords.length)];
  return `REF-${chosenWord}-${randomSuffix}`;
}

/**
 * Build shareable referral link
 */
export function buildReferralLink(code: string): string {
  if (typeof window === 'undefined') return `https://autoaudit.com/?ref=${code}`;
  const origin = window.location.origin;
  return `${origin}/?ref=${encodeURIComponent(code)}`;
}

/**
 * Retrieve current user's referral profile from localStorage or initialize
 */
export function getReferralProfile(): ReferralProfile {
  if (typeof window === 'undefined') {
    return createInitialReferralProfile();
  }

  try {
    const saved = localStorage.getItem(REFERRAL_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Ensure referralLink is up to date
      parsed.referralLink = buildReferralLink(parsed.referralCode);
      return parsed;
    }
  } catch (e) {
    console.error('Error loading referral profile from localStorage', e);
  }

  const newProfile = createInitialReferralProfile();
  saveReferralProfile(newProfile);
  return newProfile;
}

function createInitialReferralProfile(): ReferralProfile {
  const code = generateUniqueReferralCode();
  return {
    referralCode: code,
    userName: 'AutoAudit Member',
    userEmail: '',
    referralLink: buildReferralLink(code),
    discountPercentForFriend: DEFAULT_FRIEND_DISCOUNT_PERCENT,
    rewardCreditPerFriend: DEFAULT_REWARD_CREDIT,
    totalReferrals: 0,
    successfulOrders: 0,
    totalCreditsEarned: 0,
    availableCredits: 0,
    rewardCoupons: [],
    conversions: [],
    createdAt: new Date().toISOString(),
  };
}

/**
 * Save referral profile to localStorage
 */
export function saveReferralProfile(profile: ReferralProfile): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(REFERRAL_STORAGE_KEY, JSON.stringify(profile));
  } catch (e) {
    console.error('Error saving referral profile', e);
  }
}

/**
 * Update user's referral code or custom alias
 */
export function updateReferralCode(newCode: string, name?: string): ReferralProfile {
  const profile = getReferralProfile();
  const cleanCode = newCode.trim().toUpperCase().replace(/[^A-Z0-9-]/g, '');
  profile.referralCode = cleanCode.startsWith('REF-') ? cleanCode : `REF-${cleanCode}`;
  if (name) profile.userName = name;
  profile.referralLink = buildReferralLink(profile.referralCode);
  saveReferralProfile(profile);
  return profile;
}

/**
 * Check URL query parameter for ?ref=CODE and save to incoming storage
 */
export function captureIncomingReferralCode(): string | null {
  if (typeof window === 'undefined') return null;

  try {
    const params = new URLSearchParams(window.location.search);
    const refParam = params.get('ref') || params.get('referral');
    if (refParam) {
      const clean = refParam.trim().toUpperCase();
      sessionStorage.setItem(INCOMING_REF_KEY, clean);
      localStorage.setItem(INCOMING_REF_KEY, clean);
      return clean;
    }

    // Check hash for #ref=CODE
    if (window.location.hash.includes('ref=')) {
      const match = window.location.hash.match(/ref=([A-Za-z0-9-]+)/);
      if (match && match[1]) {
        const clean = match[1].trim().toUpperCase();
        sessionStorage.setItem(INCOMING_REF_KEY, clean);
        localStorage.setItem(INCOMING_REF_KEY, clean);
        return clean;
      }
    }

    // Otherwise check session / local storage
    return sessionStorage.getItem(INCOMING_REF_KEY) || localStorage.getItem(INCOMING_REF_KEY);
  } catch {
    return null;
  }
}

/**
 * Get active incoming referral code for new customer discount
 */
export function getActiveIncomingReferralCode(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem(INCOMING_REF_KEY) || localStorage.getItem(INCOMING_REF_KEY);
}

/**
 * Convert user's referral code into a valid active Coupon object
 * for the system order pricing & discount engine
 */
export function createCouponFromReferralCode(
  referralCode: string,
  discountPercent: number = DEFAULT_FRIEND_DISCOUNT_PERCENT
): Coupon {
  return {
    code: referralCode.toUpperCase(),
    discountPercent: discountPercent,
    usageCount: 0,
    maxUsage: 1000,
    expiryDate: '2028-12-31',
    active: true,
  };
}

/**
 * Create a coupon object from an earned reward voucher
 */
export function createCouponFromReward(reward: ReferralRewardCoupon): Coupon {
  return {
    code: reward.code,
    discountFixed: reward.type === 'fixed' ? reward.amount : undefined,
    discountPercent: reward.type === 'percent' ? reward.amount : undefined,
    usageCount: 0,
    maxUsage: 1,
    expiryDate: '2028-12-31',
    active: !reward.used,
  };
}

/**
 * Record a successful referral order completion.
 * Awards $5 credit and creates a unique discount reward coupon for future vehicle reports!
 */
export function recordReferralConversion(
  usedCode: string,
  friendName: string,
  orderNumber: string,
  serviceName: string
): { profile: ReferralProfile; rewardCoupon: ReferralRewardCoupon } {
  const profile = getReferralProfile();
  const rewardAmount = profile.rewardCreditPerFriend || DEFAULT_REWARD_CREDIT;
  
  // Generate a distinct reward coupon for the referrer
  const rewardCode = `REWARD-${Math.floor(1000 + Math.random() * 9000)}-${orderNumber.replace(/[^0-9]/g, '').slice(-3) || 'AA'}`;
  
  const newReward: ReferralRewardCoupon = {
    code: rewardCode,
    amount: rewardAmount,
    type: 'fixed',
    description: `$${rewardAmount.toFixed(2)} Off on your next vehicle report (Referred ${friendName})`,
    createdAt: new Date().toISOString(),
    used: false,
  };

  const conversion: ReferralConversion = {
    id: `conv-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    friendName: friendName || 'Friend',
    orderNumber: orderNumber,
    serviceName: serviceName,
    timestamp: new Date().toISOString(),
    rewardEarned: rewardAmount,
  };

  profile.totalReferrals += 1;
  profile.successfulOrders += 1;
  profile.totalCreditsEarned += rewardAmount;
  profile.availableCredits += rewardAmount;
  profile.rewardCoupons = [newReward, ...profile.rewardCoupons];
  profile.conversions = [conversion, ...profile.conversions];

  saveReferralProfile(profile);

  return { profile, rewardCoupon: newReward };
}

/**
 * Redeem an earned reward coupon
 */
export function markRewardAsUsed(rewardCode: string, orderNumber: string): ReferralProfile {
  const profile = getReferralProfile();
  let foundReward: ReferralRewardCoupon | undefined;

  profile.rewardCoupons = profile.rewardCoupons.map((r) => {
    if (r.code === rewardCode && !r.used) {
      foundReward = r;
      return { ...r, used: true, usedInOrder: orderNumber };
    }
    return r;
  });

  if (foundReward) {
    profile.availableCredits = Math.max(0, profile.availableCredits - foundReward.amount);
  }

  saveReferralProfile(profile);
  return profile;
}
