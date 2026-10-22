import { Coupon } from '../types';

export interface CouponValidationResult {
  isValid: boolean;
  status: 'empty' | 'typing' | 'valid' | 'invalid' | 'expired' | 'max_usage' | 'min_order';
  coupon: Coupon | null;
  discountAmount: number;
  newTotal: number;
  message: string;
  savingsText: string;
}

/**
 * Calculates the numeric discount amount for a given coupon and order subtotal.
 */
export function calculateDiscount(coupon: Coupon, subtotal: number): number {
  if (!coupon || !coupon.active || subtotal <= 0) return 0;

  let discount = 0;
  if (coupon.discountPercent && coupon.discountPercent > 0) {
    discount = (subtotal * coupon.discountPercent) / 100;
  } else if (coupon.discountFixed && coupon.discountFixed > 0) {
    discount = coupon.discountFixed;
  }

  // Ensure discount never exceeds the subtotal itself
  return Math.min(subtotal, Number(discount.toFixed(2)));
}

/**
 * Real-time coupon validation helper.
 * Validates dynamic passed coupons and referral discount vouchers without client-side fallback lists.
 */
export function validateCouponRealTime(
  code: string,
  subtotal: number,
  availableCoupons: Coupon[] = []
): CouponValidationResult {
  const cleanCode = (code || '').trim().toUpperCase();

  if (!cleanCode) {
    return {
      isValid: false,
      status: 'empty',
      coupon: null,
      discountAmount: 0,
      newTotal: subtotal,
      message: '',
      savingsText: ''
    };
  }

  const combinedCoupons = [...(availableCoupons || [])];
  const uniqueCouponsMap = new Map<string, Coupon>();
  combinedCoupons.forEach(c => {
    if (c && c.code) {
      uniqueCouponsMap.set(c.code.toUpperCase(), c);
    }
  });

  let matchingCoupon = uniqueCouponsMap.get(cleanCode);

  // If not found in standard coupons, check if it is a Referral Code or Referral Reward Voucher
  if (!matchingCoupon) {
    if (cleanCode.startsWith('REF-') && cleanCode.length >= 6) {
      const discountPercent = 20;
      const discountAmount = Number(((subtotal * discountPercent) / 100).toFixed(2));
      const newTotal = Math.max(0, Number((subtotal - discountAmount).toFixed(2)));
      return {
        isValid: true,
        status: 'valid',
        coupon: {
          code: cleanCode,
          discountPercent,
          usageCount: 0,
          expiryDate: '2028-12-31',
          active: true,
        },
        discountAmount,
        newTotal,
        message: `Referral code '${cleanCode}' applied: 20% OFF (-$${discountAmount.toFixed(2)})!`,
        savingsText: `Saved $${discountAmount.toFixed(2)} with Referral Discount`
      };
    }

    if (cleanCode.startsWith('REWARD-') && cleanCode.length >= 8) {
      const discountFixed = 5.0;
      const discountAmount = Math.min(subtotal, discountFixed);
      const newTotal = Math.max(0, Number((subtotal - discountAmount).toFixed(2)));
      return {
        isValid: true,
        status: 'valid',
        coupon: {
          code: cleanCode,
          discountFixed,
          usageCount: 0,
          expiryDate: '2028-12-31',
          active: true,
        },
        discountAmount,
        newTotal,
        message: `Referral Reward Voucher '${cleanCode}' applied: $${discountFixed.toFixed(2)} OFF (-$${discountAmount.toFixed(2)})!`,
        savingsText: `Saved $${discountAmount.toFixed(2)} with Referral Reward Voucher`
      };
    }

    // If fewer than 3 characters, user is still typing
    if (cleanCode.length < 3) {
      return {
        isValid: false,
        status: 'typing',
        coupon: null,
        discountAmount: 0,
        newTotal: subtotal,
        message: '',
        savingsText: ''
      };
    }

    return {
      isValid: false,
      status: 'invalid',
      coupon: null,
      discountAmount: 0,
      newTotal: subtotal,
      message: `Coupon code '${cleanCode}' is invalid or does not exist.`,
      savingsText: ''
    };
  }

  // Check if coupon is active
  if (matchingCoupon.active === false) {
    return {
      isValid: false,
      status: 'invalid',
      coupon: null,
      discountAmount: 0,
      newTotal: subtotal,
      message: `Coupon code '${cleanCode}' is currently deactivated.`,
      savingsText: ''
    };
  }

  // Check expiration date
  if (matchingCoupon.expiryDate) {
    const expiry = new Date(matchingCoupon.expiryDate);
    const today = new Date();
    // Compare YYYY-MM-DD
    if (expiry.getTime() < today.setHours(0, 0, 0, 0)) {
      return {
        isValid: false,
        status: 'expired',
        coupon: null,
        discountAmount: 0,
        newTotal: subtotal,
        message: `Coupon code '${cleanCode}' expired on ${matchingCoupon.expiryDate}.`,
        savingsText: ''
      };
    }
  }

  // Check maximum usage count
  if (
    matchingCoupon.maxUsage &&
    matchingCoupon.usageCount !== undefined &&
    matchingCoupon.usageCount >= matchingCoupon.maxUsage
  ) {
    return {
      isValid: false,
      status: 'max_usage',
      coupon: null,
      discountAmount: 0,
      newTotal: subtotal,
      message: `Coupon code '${cleanCode}' has reached its maximum redemption limit.`,
      savingsText: ''
    };
  }

  // Check minimum order requirement
  if (matchingCoupon.minOrder && subtotal < matchingCoupon.minOrder) {
    return {
      isValid: false,
      status: 'min_order',
      coupon: null,
      discountAmount: 0,
      newTotal: subtotal,
      message: `Coupon code '${cleanCode}' requires a minimum order of $${matchingCoupon.minOrder.toFixed(2)}.`,
      savingsText: ''
    };
  }

  // Valid coupon: Calculate discount and new total
  const discountAmount = calculateDiscount(matchingCoupon, subtotal);
  const newTotal = Math.max(0, Number((subtotal - discountAmount).toFixed(2)));

  const savingsText = matchingCoupon.discountPercent
    ? `${matchingCoupon.discountPercent}% OFF (-$${discountAmount.toFixed(2)})`
    : `-$${discountAmount.toFixed(2)} FIXED SAVINGS`;

  return {
    isValid: true,
    status: 'valid',
    coupon: matchingCoupon,
    discountAmount,
    newTotal,
    message: `Promo applied: ${savingsText}`,
    savingsText
  };
}
