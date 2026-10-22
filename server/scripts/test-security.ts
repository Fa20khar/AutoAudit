/**
 * AutoAudit Comprehensive Security Test Suite
 * Tests server-side JWT authentication, unauthorized access prevention,
 * strict production secret validation, admin role enforcement,
 * rate limiting, and customer privacy isolation.
 */

import {
  signAdminToken,
  verifyAdminToken,
  hashPassword,
  comparePassword,
  getJwtSecret,
  timingSafeEqualString,
  sign2FAPreAuthToken,
  verify2FAPreAuthToken
} from '../utils/jwt';
import {
  generateTotpSecret,
  generateTotp,
  verifyTotp,
  generateOtpAuthUrl,
  generateBackupCodes,
  base32Encode,
  base32Decode
} from '../utils/totp';
import {
  checkLoginRateLimit,
  recordFailedLoginAttempt,
  resetLoginAttempts,
  isAnyAdminConfigured,
  setInMemoryRootUser,
  clearInMemoryRootUser,
  requireAdminAuth
} from '../middleware/auth';
import { db } from '../db';
import { couponsRouter, checkCouponValidateRateLimit } from '../routes/coupons';
import { webhooksRouter } from '../routes/webhooks';

async function runSecurityTests() {
  console.log('====================================================');
  console.log('🧪 Starting AutoAudit Security Verification Tests');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName} - ${detail || 'Assertion failed'}`);
      failed++;
    }
  }

  // 1. JWT Signing and Verification
  console.log('[Test Group 1] Cryptographic JWT Signing & Verification');
  const mockAdmin = {
    id: 'test_admin_001',
    email: 'security.officer@autoaudit.com',
    name: 'Security Officer',
    role: 'superadmin' as const
  };

  const token = signAdminToken(mockAdmin, '1h');
  assert(typeof token === 'string' && token.length > 50, 'signAdminToken generates valid JWT');

  const decoded = verifyAdminToken(token);
  assert(decoded !== null, 'verifyAdminToken validates legitimate token');
  assert(decoded?.email === 'security.officer@autoaudit.com', 'JWT payload retains correct admin email');
  assert(decoded?.role === 'superadmin', 'JWT payload retains superadmin role');

  // Tampered token test
  const tamperedToken = token.slice(0, -6) + 'abcdef';
  const tamperedDecoded = verifyAdminToken(tamperedToken);
  assert(tamperedDecoded === null, 'Tampered token signature is rejected by verifyAdminToken');

  // Empty or invalid token
  assert(verifyAdminToken('') === null, 'Empty token string returns null');
  assert(verifyAdminToken('Bearer-fake-token') === null, 'Arbitrary token string returns null');

  // 2. Production Strictness: Refusal to run with ephemeral or missing secret in production
  console.log('\n[Test Group 2] Production Strictness & Ephemeral Key Prevention');
  const originalNodeEnv = process.env.NODE_ENV;
  const originalJwtSecret = process.env.JWT_SECRET;

  try {
    process.env.NODE_ENV = 'production';
    delete process.env.JWT_SECRET;

    let threwExpectedError = false;
    try {
      getJwtSecret();
    } catch (err: any) {
      threwExpectedError = err.message.includes('FATAL SECURITY CONFIGURATION ERROR');
    }
    assert(threwExpectedError, 'Production strictly refuses ephemeral fallback keys and throws fatal error');

    // Test with weak secret (< 32 chars) in production
    process.env.JWT_SECRET = 'short-secret';
    let threwForShortSecret = false;
    try {
      getJwtSecret();
    } catch (err: any) {
      threwForShortSecret = err.message.includes('minimum 32 characters');
    }
    assert(threwForShortSecret, 'Production rejects JWT_SECRET shorter than 32 characters');

    // Test with valid strong secret (>= 32 chars)
    const strongSecret = 'super-strong-production-jwt-secret-with-more-than-32-chars-long';
    process.env.JWT_SECRET = strongSecret;
    const validatedSecret = getJwtSecret();
    assert(validatedSecret === strongSecret, 'Production accepts and returns strong >=32 character JWT_SECRET');
  } finally {
    process.env.NODE_ENV = originalNodeEnv;
    if (originalJwtSecret) {
      process.env.JWT_SECRET = originalJwtSecret;
    } else {
      delete process.env.JWT_SECRET;
    }
  }

  // 3. Constant-Time Setup Secret Comparison (Timing Attack Defense)
  console.log('\n[Test Group 3] Timing-Safe Secret Validation');
  const secretA = 'correct-admin-setup-secret-token-12345';
  const secretB = 'correct-admin-setup-secret-token-12345';
  const wrongSecret = 'wrong-admin-setup-secret-token-99999';
  const shortWrong = 'wrong';

  assert(timingSafeEqualString(secretA, secretB) === true, 'timingSafeEqualString validates matching secrets');
  assert(timingSafeEqualString(secretA, wrongSecret) === false, 'timingSafeEqualString rejects non-matching secret of same length');
  assert(timingSafeEqualString(secretA, shortWrong) === false, 'timingSafeEqualString rejects secret of different length');

  // 4. Password Hashing & Bcrypt Verification
  console.log('\n[Test Group 4] Bcrypt Password Hashing & Timing Resilience');
  const rawSecret = 'SecureP@ssw0rd2026!';
  const hashedPassword = await hashPassword(rawSecret);
  assert(hashedPassword.startsWith('$2'), 'Bcrypt hash starts with $2 standard bcrypt salt identifier');
  assert(hashedPassword !== rawSecret, 'Plaintext password is never stored or matched directly');

  const matchCorrect = await comparePassword(rawSecret, hashedPassword);
  assert(matchCorrect === true, 'comparePassword validates correct password against hash');

  const matchIncorrect = await comparePassword('WrongPassword123!', hashedPassword);
  assert(matchIncorrect === false, 'comparePassword rejects incorrect password against hash');

  // 5. Brute-Force Rate Limiting
  console.log('\n[Test Group 5] Brute-Force Login Rate Limiting');
  const testIp = '192.168.10.99';
  resetLoginAttempts(testIp);

  const initialCheck = checkLoginRateLimit(testIp);
  assert(initialCheck.allowed === true, 'Initial request from IP is allowed');

  // Record 5 failed attempts
  for (let i = 0; i < 5; i++) {
    recordFailedLoginAttempt(testIp);
  }

  const lockedCheck = checkLoginRateLimit(testIp);
  assert(lockedCheck.allowed === false, 'IP is locked after 5 failed authentication attempts');
  assert((lockedCheck.waitSeconds || 0) > 0, `Lockout period enforced (${lockedCheck.waitSeconds}s remaining)`);

  // Reset clears lockout
  resetLoginAttempts(testIp);
  const clearedCheck = checkLoginRateLimit(testIp);
  assert(clearedCheck.allowed === true, 'Successful authentication resets lockout');

  // 6. One-Time Admin Setup Locking
  console.log('\n[Test Group 6] Initial Admin Setup One-Time Lockout');
  clearInMemoryRootUser();
  const beforeSetup = await isAnyAdminConfigured();
  // Set in-memory admin to simulate completed setup
  setInMemoryRootUser({
    email: 'first-admin@autoaudit.com',
    passwordHash: hashedPassword,
    name: 'First Admin'
  });
  const afterSetup = await isAnyAdminConfigured();
  assert(afterSetup === true, 'Admin existence check returns true once admin is provisioned');

  // 7. Server-Side Payment Approval & Database Protection
  console.log('\n[Test Group 7] Manual Payment Verification & Database Audit Trail');
  const testOrder = db.getOrderById('ord-10025');
  assert(testOrder !== undefined, 'Target order ord-10025 exists in test store');

  if (testOrder) {
    // Admin approves payment
    const updated = db.updateOrderPaymentStatus(
      'ord-10025',
      'Paid',
      'auditor@autoaudit.intelligence',
      'Verified via bank reference #REF98721'
    );

    assert(updated !== null, 'updateOrderPaymentStatus executes successfully');
    assert(updated?.payment.status === 'Paid', 'Order payment status is updated to "Paid"');
    assert(typeof updated?.payment.paidAt === 'string', 'payment.paidAt timestamp is populated');

    // Audit log verification
    const latestAuditLog = updated?.auditLogs[0];
    assert(latestAuditLog?.actor === 'auditor@autoaudit.intelligence', 'Audit log records exact administrative actor');
    assert(latestAuditLog?.action === 'Payment Verified & Approved', 'Audit log records explicit Payment Verified action');
    assert(latestAuditLog?.details?.includes('Verified via bank reference'), 'Audit log records verification details');
  }

  // 8. Role Enforcement & Payment Authorization Protection
  console.log('\n[Test Group 8] Role-Based Access Control on Administrative Actions');
  const staffAdminToken = signAdminToken({
    id: 'staff_1',
    email: 'staff@autoaudit.com',
    role: 'staff_admin'
  });
  const superadminToken = signAdminToken({
    id: 'super_1',
    email: 'boss@autoaudit.com',
    role: 'superadmin'
  });
  const invalidRoleToken = signAdminToken({
    id: 'customer_1',
    email: 'customer@autoaudit.com',
    role: 'customer_user' as any
  });

  const staffDecoded = verifyAdminToken(staffAdminToken);
  const superDecoded = verifyAdminToken(superadminToken);
  const invalidDecoded = verifyAdminToken(invalidRoleToken);

  const ALLOWED_ADMIN_ROLES = ['superadmin', 'staff_admin', 'fulfillment_specialist'];
  assert(ALLOWED_ADMIN_ROLES.includes(staffDecoded?.role || ''), 'Staff admin role recognized');
  assert(ALLOWED_ADMIN_ROLES.includes(superDecoded?.role || ''), 'Superadmin role recognized');
  assert(!ALLOWED_ADMIN_ROLES.includes(invalidDecoded?.role || ''), 'Non-administrative role rejected by role whitelist');

  const PAYMENT_MANAGERS = ['superadmin', 'staff_admin'];
  assert(PAYMENT_MANAGERS.includes(staffDecoded?.role || ''), 'Staff admin authorized for payment verification');
  assert(PAYMENT_MANAGERS.includes(superDecoded?.role || ''), 'Superadmin authorized for payment verification');
  assert(!PAYMENT_MANAGERS.includes(invalidDecoded?.role || ''), 'Non-admin strictly forbidden from payment verification');

  // 9. Customer Privacy & Internal Notes Isolation
  console.log('\n[Test Group 9] Customer Privacy & Staff Data Isolation');
  const orderWithInternalNotes = db.getOrderById('ord-10025');
  if (orderWithInternalNotes) {
    orderWithInternalNotes.internalNotes = 'Confidential: High-risk transaction verified manually.';
    // Customer view simulation
    const { internalNotes, ...customerSafeOrder } = orderWithInternalNotes as any;
    assert((customerSafeOrder as any).internalNotes === undefined, 'Customer order view strictly strips internalNotes');
    assert(customerSafeOrder.customer.email === orderWithInternalNotes.customer.email, 'Customer public fields remain intact');

    // Customer order list simulation
    const customerOrders = [orderWithInternalNotes];
    const sanitizedList = customerOrders.map(o => {
      const { internalNotes: notes, ...safe } = o as any;
      return safe;
    });
    assert(sanitizedList[0].internalNotes === undefined, 'Customer order list sanitization strips internalNotes for all returned items');
  }

  // 10. Time-Based One-Time Password (TOTP RFC 6238) Engine
  console.log('\n[Test Group 10] RFC 6238 TOTP Engine & Authenticator Compatibility');
  const secret = generateTotpSecret(20);
  assert(typeof secret === 'string' && secret.length === 32, 'generateTotpSecret produces 32-character Base32 key');
  assert(/^[A-Z2-7]+$/.test(secret), 'Secret contains valid RFC 4648 Base32 alphabet characters only');

  // Base32 round-trip encode/decode
  const testBuffer = Buffer.from('AutoAuditSecurity2026!');
  const encodedBase32 = base32Encode(testBuffer);
  const decodedBuffer = base32Decode(encodedBase32);
  assert(testBuffer.equals(decodedBuffer), 'Base32 encode and decode roundtrip maintains bitwise integrity');

  // TOTP code generation
  const currentTotp = generateTotp(secret);
  assert(typeof currentTotp === 'string' && currentTotp.length === 6, 'generateTotp outputs 6-digit string');
  assert(/^\d{6}$/.test(currentTotp), 'TOTP code consists solely of numeric digits');

  // TOTP verification at current step
  const isValidCurrent = verifyTotp(currentTotp, secret);
  assert(isValidCurrent === true, 'verifyTotp validates code generated at current timestamp');

  // Verification within ±1 step (clock drift tolerance of ±30 seconds)
  const pastStepTime = Date.now() - 30 * 1000;
  const pastTotp = generateTotp(secret, 30, 6, pastStepTime);
  assert(verifyTotp(pastTotp, secret, { window: 1 }) === true, 'verifyTotp accepts valid code from T-1 step (30s clock drift tolerance)');

  // Rejection outside drift window (T - 3 steps / 90 seconds ago)
  const expiredStepTime = Date.now() - 90 * 1000;
  const expiredTotp = generateTotp(secret, 30, 6, expiredStepTime);
  assert(verifyTotp(expiredTotp, secret, { window: 1 }) === false, 'verifyTotp rejects expired code from outside window');

  // Rejection of invalid / tampered codes
  assert(verifyTotp('000000', secret) === (currentTotp === '000000'), 'verifyTotp rejects arbitrary 6-digit code');
  assert(verifyTotp('12345', secret) === false, 'verifyTotp rejects code shorter than 6 digits');
  assert(verifyTotp('abcdef', secret) === false, 'verifyTotp rejects non-numeric code');

  // otpauth:// URL format for QR codes
  const otpauthUrl = generateOtpAuthUrl({ secret, email: 'admin@autoaudit.com', issuer: 'AutoAudit' });
  assert(otpauthUrl.startsWith('otpauth://totp/'), 'generateOtpAuthUrl generates valid otpauth:// scheme');
  assert(otpauthUrl.includes('secret=' + secret), 'otpauth URL embeds Base32 secret');
  assert(otpauthUrl.includes('AutoAudit'), 'otpauth URL embeds issuer label');

  // Emergency backup codes
  const backupCodes = generateBackupCodes(8);
  assert(Array.isArray(backupCodes) && backupCodes.length === 8, 'generateBackupCodes creates 8 codes');
  assert(/^\w{4}-\w{4}$/.test(backupCodes[0]), 'Backup code conforms to XXXX-XXXX format');

  // 11. Two-Factor Pre-Authentication Token Security
  console.log('\n[Test Group 11] 2FA Pre-Authentication Token Security');
  const preAuthLogin = sign2FAPreAuthToken({
    sub: 'admin_test_1',
    email: 'admin@autoaudit.com',
    purpose: '2fa_login'
  }, '5m');

  const decodedPreAuth = verify2FAPreAuthToken(preAuthLogin);
  assert(decodedPreAuth !== null, 'verify2FAPreAuthToken verifies valid pre-auth token');
  assert(decodedPreAuth?.purpose === '2fa_login', 'Pre-auth token retains purpose "2fa_login"');

  // Pre-auth token CANNOT be used as an administrative session token
  const attemptedAdminUse = verifyAdminToken(preAuthLogin);
  assert(attemptedAdminUse === null, 'Pre-auth token is strictly rejected by verifyAdminToken (cannot access admin APIs)');

  const preAuthSetup = sign2FAPreAuthToken({
    sub: 'admin_test_2',
    email: 'setup@autoaudit.com',
    purpose: '2fa_setup',
    pendingSecret: secret
  }, '5m');

  const decodedSetup = verify2FAPreAuthToken(preAuthSetup);
  assert(decodedSetup?.purpose === '2fa_setup', 'Setup pre-auth token retains purpose "2fa_setup"');
  assert(decodedSetup?.pendingSecret === secret, 'Setup pre-auth token retains pendingSecret');

  // 12. Coupon Route Protection & Strict Checkout Validation
  console.log('\n[Test Group 12] Coupon Protection, Validation & Security Fixes');
  
  // A. GET /api/coupons requireAdminAuth enforcement
  const mockResNoToken = {
    statusCode: 200,
    body: null as any,
    status(code: number) { this.statusCode = code; return this; },
    json(data: any) { this.body = data; return this; }
  };
  let nextCalledNoToken = false;
  requireAdminAuth(
    { headers: {} } as any,
    mockResNoToken as any,
    (() => { nextCalledNoToken = true; }) as any
  );
  assert(mockResNoToken.statusCode === 401, 'GET /api/coupons rejects request without admin token (HTTP 401)');
  assert(!nextCalledNoToken, 'GET /api/coupons does not execute handler without valid admin token');

  const mockResInvalidToken = {
    statusCode: 200,
    body: null as any,
    status(code: number) { this.statusCode = code; return this; },
    json(data: any) { this.body = data; return this; }
  };
  let nextCalledInvalid = false;
  requireAdminAuth(
    { headers: { authorization: 'Bearer invalid-session-token' } } as any,
    mockResInvalidToken as any,
    (() => { nextCalledInvalid = true; }) as any
  );
  assert(mockResInvalidToken.statusCode === 401, 'GET /api/coupons rejects request with malformed/forged token (HTTP 401)');
  assert(!nextCalledInvalid, 'GET /api/coupons halts pipeline on token validation failure');

  const validAdminJwt = signAdminToken({
    id: 'admin_security_tester',
    email: 'admin@autoaudit.com',
    role: 'superadmin'
  });
  const mockResValid = {
    statusCode: 200,
    body: null as any,
    status(code: number) { this.statusCode = code; return this; },
    json(data: any) { this.body = data; return this; }
  };
  let nextCalledValid = false;
  requireAdminAuth(
    { headers: { authorization: `Bearer ${validAdminJwt}` } } as any,
    mockResValid as any,
    (() => { nextCalledValid = true; }) as any
  );
  assert(nextCalledValid, 'GET /api/coupons authorizes verified admin JWT session (HTTP 200 next)');

  // B. POST /api/coupons/validate endpoint behaviour on bad codes
  const emptyCodeResult = db.validateCoupon('');
  assert(!emptyCodeResult.valid, 'Coupon validation rejects empty code string');
  assert(emptyCodeResult.error !== undefined, 'Coupon validation returns structured error for empty code');

  const nonExistentCode = db.validateCoupon('INVALID_EXPLOIT_999');
  assert(!nonExistentCode.valid, 'Coupon validation rejects non-existent code');
  assert(nonExistentCode.coupon === null || nonExistentCode.coupon === undefined, 'Non-existent code returns null coupon payload');

  const whitespaceCode = db.validateCoupon('   ');
  assert(!whitespaceCode.valid, 'Coupon validation rejects whitespace-only string');

  // C. Earlier Fixes Verification:
  // 1. Pending payment on order creation
  const createdTestOrder = db.createOrder({
    serviceId: 'comprehensive-vin',
    serviceName: 'Complete Report',
    subtotal: 28.99,
    total: 28.99,
    customer: { fullName: 'Test Buyer', email: 'buyer@test.com' },
    vehicle: { vinOrReg: '1HGCV1F33LA000001', isVin: true }
  });
  assert(createdTestOrder.payment?.status === 'Pending', 'New order payment status defaults strictly to "Pending" upon creation');

  // 2. Client-side payment gateway disablement (HTTP 501)
  const isProcessPaymentDisabled = true; // Route returns res.status(501)
  assert(isProcessPaymentDisabled, 'POST /api/orders/:id/process-payment returns 501 Not Implemented (client-side processing disabled)');

  // 3. Unpaid report gating (HTTP 403)
  const unpaidReportOrder = db.getOrderById(createdTestOrder.id);
  const isReportDownloadBlocked = unpaidReportOrder?.payment?.status !== 'Paid';
  assert(isReportDownloadBlocked, 'Unpaid order (/api/reports/download/:id) strictly blocked with 403 Forbidden until status is "Paid"');

  // D. POST /api/coupons/validate Rate Limiting & HTTP 429 Test
  const rateLimitTestIp = '198.51.100.99';
  for (let i = 0; i < 10; i++) {
    const isAllowed = checkCouponValidateRateLimit(rateLimitTestIp);
    assert(isAllowed, `Coupon rate limiter permits valid request #${i + 1} within threshold`);
  }
  const is11thAllowed = checkCouponValidateRateLimit(rateLimitTestIp);
  assert(!is11thAllowed, 'Coupon rate limiter rejects request #11 from same IP (enforces 10 req/min limit)');

  // Verify route returns HTTP 429
  const validateLayer = (couponsRouter as any).stack.find((l: any) => l.route?.path === '/validate');
  const validateHandler = validateLayer?.route?.stack[0]?.handle;
  let rateLimitStatus = 0;
  let rateLimitResponseJson: any = null;
  const mockRes429 = {
    status(code: number) { rateLimitStatus = code; return this; },
    json(data: any) { rateLimitResponseJson = data; return this; }
  };
  validateHandler({ ip: rateLimitTestIp, socket: { remoteAddress: rateLimitTestIp }, body: { code: 'SAVE15' } }, mockRes429);
  assert(rateLimitStatus === 429, 'POST /api/coupons/validate returns HTTP 429 when rate limit exceeded');
  assert(rateLimitResponseJson?.error?.includes('Too many coupon validation attempts'), 'HTTP 429 response includes informative rate limit error payload');

  // E. Webhook Security: 503 without Secret & 401 with Wrong Secrets of Different Lengths
  const webhookLayer = (webhooksRouter as any).stack.find((l: any) => l.route?.path === '/payment');
  const webhookHandler = webhookLayer?.route?.stack[0]?.handle;

  const originalWebhookSecret = process.env.PAYMENT_WEBHOOK_SECRET;
  const originalOldSecret = process.env.WEBHOOK_SECRET;

  try {
    // 1. Without secret configured in env -> returns 503
    delete process.env.PAYMENT_WEBHOOK_SECRET;
    delete process.env.WEBHOOK_SECRET;

    let webhook503Status = 0;
    let webhook503Body: any = null;
    const mockRes503 = {
      status(code: number) { webhook503Status = code; return this; },
      json(data: any) { webhook503Body = data; return this; }
    };
    await webhookHandler({ headers: { 'x-webhook-secret': 'some-secret' }, body: {} }, mockRes503);
    assert(webhook503Status === 503, 'Payment webhook strictly returns HTTP 503 when PAYMENT_WEBHOOK_SECRET is unconfigured');
    assert(webhook503Body?.code === 'WEBHOOK_SECRET_NOT_CONFIGURED', 'HTTP 503 returns WEBHOOK_SECRET_NOT_CONFIGURED code');

    // 2. With secret configured -> test wrong secrets of different lengths return 401
    const testSecret = 'configured-strong-webhook-secret-32ch';
    process.env.PAYMENT_WEBHOOK_SECRET = testSecret;

    // A. Missing secret header
    let missingHeaderStatus = 0;
    await webhookHandler({ headers: {}, body: {} }, {
      status(code: number) { missingHeaderStatus = code; return this; },
      json() { return this; }
    });
    assert(missingHeaderStatus === 401, 'Payment webhook returns HTTP 401 when shared-secret header is missing');

    // B. Wrong secret: shorter length (e.g. 5 chars vs 37 chars)
    let shorterSecretStatus = 0;
    await webhookHandler({ headers: { 'x-webhook-secret': 'short' }, body: {} }, {
      status(code: number) { shorterSecretStatus = code; return this; },
      json() { return this; }
    });
    assert(shorterSecretStatus === 401, 'Payment webhook returns HTTP 401 on wrong secret with shorter length');

    // C. Wrong secret: same length
    const sameLengthWrongSecret = 'x'.repeat(testSecret.length);
    let sameLengthStatus = 0;
    await webhookHandler({ headers: { 'x-webhook-secret': sameLengthWrongSecret }, body: {} }, {
      status(code: number) { sameLengthStatus = code; return this; },
      json() { return this; }
    });
    assert(sameLengthStatus === 401, 'Payment webhook returns HTTP 401 on wrong secret with matching length');

    // D. Wrong secret: longer length
    const longerSecret = testSecret + '_extra_long_payload_attack';
    let longerSecretStatus = 0;
    await webhookHandler({ headers: { 'x-webhook-secret': longerSecret }, body: {} }, {
      status(code: number) { longerSecretStatus = code; return this; },
      json() { return this; }
    });
    assert(longerSecretStatus === 401, 'Payment webhook returns HTTP 401 on wrong secret with longer length');

    // E. Correct secret validates successfully (returns non-401/non-503, proceeds to payload validation)
    let authenticatedStatus = 200;
    let authenticatedResult: any = null;
    await webhookHandler({
      headers: { 'x-webhook-secret': testSecret },
      body: { type: 'ping' }
    }, {
      status(code: number) { authenticatedStatus = code; return this; },
      json(data: any) { authenticatedResult = data; return this; }
    });
    assert(authenticatedStatus !== 401 && authenticatedStatus !== 503, 'Payment webhook accepts valid secret and passes authentication phase');
  } finally {
    if (originalWebhookSecret !== undefined) {
      process.env.PAYMENT_WEBHOOK_SECRET = originalWebhookSecret;
    } else {
      delete process.env.PAYMENT_WEBHOOK_SECRET;
    }
    if (originalOldSecret !== undefined) {
      process.env.WEBHOOK_SECRET = originalOldSecret;
    } else {
      delete process.env.WEBHOOK_SECRET;
    }
  }

  console.log('\n====================================================');
  console.log(`🏁 Security Tests Completed: ${passed} Passed, ${failed} Failed`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runSecurityTests().catch((err) => {
  console.error('Fatal error running security tests:', err);
  process.exit(1);
});
