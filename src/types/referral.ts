export interface ReferralRewardCoupon {
  code: string;
  amount: number;
  type: 'fixed' | 'percent';
  description: string;
  createdAt: string;
  used: boolean;
  usedInOrder?: string;
}

export interface ReferralConversion {
  id: string;
  friendName: string;
  friendEmail?: string;
  orderNumber: string;
  serviceName: string;
  timestamp: string;
  rewardEarned: number;
}

export interface ReferralProfile {
  referralCode: string;
  userName: string;
  userEmail: string;
  referralLink: string;
  discountPercentForFriend: number;
  rewardCreditPerFriend: number;
  totalReferrals: number;
  successfulOrders: number;
  totalCreditsEarned: number;
  availableCredits: number;
  rewardCoupons: ReferralRewardCoupon[];
  conversions: ReferralConversion[];
  createdAt: string;
}
