import { Router, Request, Response } from 'express';
import { db } from '../db';

export const couponsRouter = Router();

// GET /api/coupons
couponsRouter.get('/', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: db.getCoupons()
  });
});

// POST /api/coupons/validate
couponsRouter.post('/validate', (req: Request, res: Response) => {
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
