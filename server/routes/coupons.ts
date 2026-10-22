import { Router, Request, Response } from 'express';
import { db } from '../db';
import { requireAdminAuth } from '../middleware/auth';

export const couponsRouter = Router();

// GET /api/coupons (Admin only - public checkout validates single codes via POST /validate)
couponsRouter.get('/', requireAdminAuth, async (_req: Request, res: Response) => {
  const coupons = await db.getCouponsAsync();
  res.json({
    success: true,
    data: coupons
  });
});

// Admin-only coupon mutations
couponsRouter.post('/', requireAdminAuth, (req: Request, res: Response) => {
  res.status(501).json({ success: false, error: 'Direct coupon creation via API is not enabled.' });
});

couponsRouter.put('/:code', requireAdminAuth, (req: Request, res: Response) => {
  res.status(501).json({ success: false, error: 'Coupon modification via API is not enabled.' });
});

couponsRouter.delete('/:code', requireAdminAuth, (req: Request, res: Response) => {
  res.status(501).json({ success: false, error: 'Coupon deletion via API is not enabled.' });
});

// In-memory per-IP rate limiter: 10 requests / minute
interface RateLimitEntry {
  count: number;
  resetAt: number;
}

export const couponValidateRateLimitMap = new Map<string, RateLimitEntry>();

export function checkCouponValidateRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = couponValidateRateLimitMap.get(ip);
  if (!record || now > record.resetAt) {
    couponValidateRateLimitMap.set(ip, { count: 1, resetAt: now + 60000 });
    return true;
  }
  if (record.count >= 10) {
    return false;
  }
  record.count += 1;
  return true;
}

// Periodic cleanup of expired entries every 5 minutes
const cleanupTimer = setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of couponValidateRateLimitMap.entries()) {
    if (now > entry.resetAt) {
      couponValidateRateLimitMap.delete(ip);
    }
  }
}, 5 * 60 * 1000);
if (cleanupTimer.unref) {
  cleanupTimer.unref();
}

// POST /api/coupons/validate
couponsRouter.post('/validate', (req: Request, res: Response) => {
  const clientIp = req.ip || 'unknown';
  if (!checkCouponValidateRateLimit(clientIp)) {
    res.status(429).json({
      success: false,
      error: 'Too many coupon validation attempts. Please wait one minute before trying again.'
    });
    return;
  }

  const { code, subtotal } = req.body;

  if (!code) {
    res.status(400).json({ success: false, error: 'Promo code is required.' });
    return;
  }

  const result = db.validateCoupon(code);

  if (!result.valid || !result.coupon) {
    res.status(400).json({
      success: false,
      error: result.error || 'Invalid promotional code'
    });
    return;
  }

  const basePrice = typeof subtotal === 'number' ? subtotal : 28.99;
  let discountAmount = 0;

  if (result.coupon.discountPercent) {
    discountAmount = parseFloat(((basePrice * result.coupon.discountPercent) / 100).toFixed(2));
  } else if (result.coupon.discountFixed) {
    discountAmount = Math.min(result.coupon.discountFixed, basePrice);
  }

  const newTotal = parseFloat(Math.max(0, basePrice - discountAmount).toFixed(2));

  res.json({
    success: true,
    code: result.coupon.code,
    discountAmount,
    discountPercent: result.coupon.discountPercent,
    discountFixed: result.coupon.discountFixed,
    newTotal
  });
});
