import React, { useState, useEffect } from 'react';
import { ServicePlan, Order, Coupon, AuditLog } from '../types';
import { 
  X, Check, ArrowRight, ArrowLeft, ShieldCheck, Lock, CreditCard, 
  Sparkles, AlertCircle, FileCheck, CheckCircle2, Building, Wallet, CheckCircle,
  Clock, AlertTriangle, ShieldAlert, RotateCcw, MessageSquare, Loader2
} from 'lucide-react';
import { OrderTrackingProgressBar } from './OrderTrackingProgressBar';
import { WhatsAppButton } from './WhatsAppButton';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';

interface OrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  services: ServicePlan[];
  selectedServiceId?: string;
  initialVin?: string;
  initialIsVin?: boolean;
  coupons: Coupon[];
  onOrderCompleted: (order: Order) => void;
  onOpenTrack: () => void;
}

export const OrderModal: React.FC<OrderModalProps> = ({
  isOpen,
  onClose,
  services,
  selectedServiceId,
  initialVin = '',
  initialIsVin = true,
  coupons,
  onOrderCompleted,
  onOpenTrack,
}) => {
  // 5 Step Flow: 1: Service -> 2: Vehicle -> 3: Customer -> 4: Payment -> 5: Confirmation
  const [step, setStep] = useState<number>(1);
  const [serviceId, setServiceId] = useState<string>(selectedServiceId || 'comprehensive-vin');
  
  // Session Security Timer (10 minutes / 600s with 2-minute warning threshold)
  const SESSION_DURATION = 600; // 10 minutes
  const WARNING_THRESHOLD = 120; // 2 minutes
  const [secondsLeft, setSecondsLeft] = useState<number>(SESSION_DURATION);
  const [isSessionExpired, setIsSessionExpired] = useState<boolean>(false);

  // Vehicle details
  const [vinOrReg, setVinOrReg] = useState<string>(initialVin);
  const [isVin, setIsVin] = useState<boolean>(initialIsVin);
  const [make, setMake] = useState<string>('');
  const [model, setModel] = useState<string>('');
  const [year, setYear] = useState<number>(2020);
  const [mileage, setMileage] = useState<string>('');
  const [countryOrState, setCountryOrState] = useState<string>('');
  const [customerNotes, setCustomerNotes] = useState<string>('');
  const [vinError, setVinError] = useState<string>('');

  // Customer details
  const [fullName, setFullName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [smsNotifications, setSmsNotifications] = useState<boolean>(true);
  const [createAccount, setCreateAccount] = useState<boolean>(true);

  // Coupon & agreement
  const [couponCode, setCouponCode] = useState<string>('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState<string>('');
  const [agreedToTerms, setAgreedToTerms] = useState<boolean>(true);

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'bank_transfer' | 'digital_wallet'>('card');
  const [cardNumber, setCardNumber] = useState<string>('•••• •••• •••• 4242');
  const [cardExpiry, setCardExpiry] = useState<string>('08/28');
  const [cardCvc, setCardCvc] = useState<string>('•••');
  const [isProcessingPayment, setIsProcessingPayment] = useState<boolean>(false);
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainderSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainderSecs.toString().padStart(2, '0')}`;
  };

  // Clear all sensitive order details to ensure data security
  const clearOrderDetails = () => {
    setVinOrReg('');
    setMake('');
    setModel('');
    setYear(2020);
    setMileage('');
    setCountryOrState('');
    setCustomerNotes('');
    setVinError('');
    setFullName('');
    setEmail('');
    setPhone('');
    setSmsNotifications(true);
    setCouponCode('');
    setAppliedCoupon(null);
    setCouponError('');
    setPaymentMethod('card');
    setCardNumber('•••• •••• •••• 4242');
    setCardExpiry('08/28');
    setCardCvc('•••');
    setStep(1);
  };

  const handleExtendSession = () => {
    setSecondsLeft(SESSION_DURATION);
  };

  const handleRestartAfterExpiry = () => {
    clearOrderDetails();
    setIsSessionExpired(false);
    setSecondsLeft(SESSION_DURATION);
    setStep(1);
  };

  // Session timer countdown effect
  useEffect(() => {
    if (!isOpen || step === 5 || isSessionExpired) {
      return;
    }

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          clearOrderDetails();
          setIsSessionExpired(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, step, isSessionExpired]);

  // Reset timer whenever modal is opened
  useEffect(() => {
    if (isOpen) {
      setSecondsLeft(SESSION_DURATION);
      setIsSessionExpired(false);
    }
  }, [isOpen]);

  // Sync props
  useEffect(() => {
    if (selectedServiceId) {
      setServiceId(selectedServiceId);
    }
  }, [selectedServiceId]);

  useEffect(() => {
    if (initialVin) {
      setVinOrReg(initialVin);
      setIsVin(initialIsVin);
      if (initialVin.includes('1HGCM82633A') || initialVin.includes('1HGCR2F83')) {
        setMake('Honda');
        setModel('Accord Touring 2.0T');
        setYear(2020);
        setMileage('41,800 mi');
      } else if (initialVin.includes('WAUZZZF45LA')) {
        setMake('Audi');
        setModel('A4 45 TFSI quattro');
        setYear(2021);
        setMileage('34,200 mi');
      }
    }
  }, [initialVin, initialIsVin]);

  if (!isOpen) return null;

  const currentPlan = services.find((s) => s.id === serviceId) || services[1] || services[0];
  const subtotal = currentPlan ? currentPlan.price : 28.99;
  
  // Calculate discount
  let discountAmount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.discountPercent) {
      discountAmount = (subtotal * appliedCoupon.discountPercent) / 100;
    } else if (appliedCoupon.discountFixed) {
      discountAmount = appliedCoupon.discountFixed;
    }
  }
  const total = Math.max(0, subtotal - discountAmount);

  // Apply Coupon Code via Backend API with local fallback
  const handleApplyCoupon = async () => {
    setCouponError('');
    if (!couponCode.trim()) {
      setCouponError('Please enter a coupon code.');
      return;
    }

    try {
      const res = await api.validateCoupon(couponCode, subtotal);
      setAppliedCoupon({
        code: res.code,
        discountPercent: res.discountPercent,
        discountFixed: res.discountFixed,
        usageCount: 1,
        expiryDate: '2026-12-31',
        active: true
      });
    } catch (err: any) {
      // Check local coupons fallback if offline
      const found = coupons.find(
        (c) => c.code.toUpperCase() === couponCode.trim().toUpperCase() && c.active
      );
      if (found) {
        setAppliedCoupon(found);
      } else {
        setCouponError(err?.message || 'Invalid coupon code or expired.');
      }
    }
  };

  const validateStep2 = () => {
    setVinError('');
    const clean = vinOrReg.trim().toUpperCase();
    if (!clean) {
      setVinError(isVin ? 'Please enter a 17-digit VIN.' : 'Please enter a registration plate number.');
      return false;
    }
    if (isVin) {
      if (/[IOQ]/i.test(clean)) {
        setVinError('Invalid VIN: Letters I, O, and Q are never used in 17-character VINs.');
        return false;
      }
      if (clean.length !== 17) {
        setVinError(`VIN must be exactly 17 characters (currently ${clean.length}/17).`);
        return false;
      }
    }
    return true;
  };

  const { showToast } = useToast();

  const handleProcessPayment = () => {
    // Prevent duplicate submissions while an order is processing
    if (isProcessingPayment) return;

    if (!agreedToTerms) {
      showToast({
        title: 'Agreement Required',
        message: 'Please review and accept the Terms of Service to proceed with payment.',
        type: 'warning'
      });
      return;
    }

    setIsProcessingPayment(true);

    setTimeout(() => {
      const now = new Date().toISOString();
      const orderNum = `AA-2026-${Math.floor(1000 + Math.random() * 9000)}`;

      const newAuditLog: AuditLog[] = [
        {
          id: `log-${Date.now()}-1`,
          timestamp: now,
          actor: `Customer (${fullName || 'Guest'})`,
          action: 'Order Placed',
          details: `Service: ${currentPlan.name}, Total: $${total.toFixed(2)}`
        },
        {
          id: `log-${Date.now()}-2`,
          timestamp: now,
          actor: 'Payment Gateway',
          action: 'Payment Confirmed',
          details: `Verified $${total.toFixed(2)} USD via encrypted checkout.`
        }
      ];

      const newOrder: Order = {
        id: `ord-${Date.now()}`,
        orderNumber: orderNum,
        serviceId: currentPlan.id,
        serviceName: currentPlan.name,
        status: 'Processing',
        subtotal: Number(subtotal.toFixed(2)),
        discountAmount: Number(discountAmount.toFixed(2)),
        total: Number(total.toFixed(2)),
        couponCode: appliedCoupon ? appliedCoupon.code : undefined,
        customer: {
          fullName: fullName.trim() || 'Verified Customer',
          email: email.trim() || 'customer@example.com',
          phone: phone.trim() || '+1 (555) 019-2834',
          smsNotifications
        },
        smsNotifications,
        vehicle: {
          vinOrReg: vinOrReg.trim().toUpperCase() || '1HGCM82633A004352',
          isVin,
          make: make.trim() || 'Honda',
          model: model.trim() || 'Accord Touring',
          year: year || 2020,
          mileage: mileage.trim() || '41,800 mi',
          countryOrState: countryOrState.trim() || 'California, USA',
          customerNotes: customerNotes.trim() || undefined
        },
        payment: {
          status: 'Paid',
          gatewayRef: `PAY-TXN-${Math.floor(10000000 + Math.random() * 90000000)}`,
          paidAt: now,
          method: paymentMethod === 'card' ? 'Secure Card Payment' : paymentMethod === 'bank_transfer' ? 'Direct Bank Transfer' : 'Digital Wallet'
        },
        internalNotes: 'Order received via online checkout. Processing report compilation.',
        createdAt: now,
        updatedAt: now,
        auditLogs: newAuditLog
      };

      setCreatedOrder(newOrder);
      setIsProcessingPayment(false);
      if (newOrder.customer?.email) {
        try {
          localStorage.setItem('autoaudit_customer_email', newOrder.customer.email.toLowerCase().trim());
        } catch {
          // ignore
        }
      }
      onOrderCompleted(newOrder);
      setStep(5); // Step 5: Payment Success / Confirmation
    }, 1200);
  };

  const stepLabels = [
    '01 Service',
    '02 Vehicle',
    '03 Customer',
    '04 Payment',
    '05 Confirmation'
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 md:p-6">
      <div className="bg-white w-full max-w-3xl rounded-[14px] shadow-2xl border border-[#E2E8F0] overflow-hidden flex flex-col max-h-[96vh] sm:max-h-[94vh]">
        
        {/* Header with Title, Session Security Timer and Close Button */}
        <div className="px-3.5 py-3 sm:px-6 sm:py-4 bg-[#0B132B] text-white flex items-center justify-between border-b border-[#1E293B]">
          <div className="min-w-0 pr-2">
            <span className="text-[10px] sm:text-[11px] text-[#FB2C36] font-bold tracking-wider uppercase block">
              {isSessionExpired ? 'SECURITY TIMEOUT' : step === 5 ? 'ORDER CONFIRMED' : `CHECKOUT · ${stepLabels[step - 1]}`}
            </span>
            <h3 className="text-sm sm:text-base md:text-lg font-bold truncate">
              {isSessionExpired && 'Session Timed Out'}
              {!isSessionExpired && step === 1 && 'Select Your Vehicle Report Plan'}
              {!isSessionExpired && step === 2 && 'Enter Vehicle Details'}
              {!isSessionExpired && step === 3 && 'Where Should We Send Your Report?'}
              {!isSessionExpired && step === 4 && 'Checkout & Secure Payment'}
              {!isSessionExpired && step === 5 && 'Order Confirmed'}
            </h3>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Session Security Timer Indicator */}
            {step <= 4 && !isSessionExpired && (
              <div
                className={`flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-[8px] text-[10px] sm:text-[11px] font-mono font-medium transition-colors ${
                  secondsLeft <= WARNING_THRESHOLD
                    ? 'bg-amber-500/25 text-amber-300 border border-amber-500/50 animate-pulse'
                    : 'bg-[#1E293B] text-slate-300 border border-[#334155]'
                }`}
                title="Active session timer: temporary vehicle details & payment inputs are cleared automatically after 10 minutes to protect data security."
              >
                <Clock className={`w-3 h-3 ${secondsLeft <= WARNING_THRESHOLD ? 'text-amber-400' : 'text-slate-400'}`} />
                <span>{formatTime(secondsLeft)}</span>
                {secondsLeft <= WARNING_THRESHOLD && (
                  <button
                    type="button"
                    onClick={handleExtendSession}
                    className="ml-1 text-[10px] text-amber-300 hover:text-white underline cursor-pointer font-sans font-bold"
                  >
                    Extend
                  </button>
                )}
              </div>
            )}

            <button
              onClick={() => {
                if (isSessionExpired) {
                  setIsSessionExpired(false);
                  clearOrderDetails();
                }
                onClose();
              }}
              className="p-1.5 rounded-[8px] text-slate-400 hover:text-white hover:bg-[#1E293B] min-h-[36px] min-w-[36px] flex items-center justify-center transition-colors cursor-pointer shrink-0"
              aria-label="Close Checkout"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Impending Expiry Warning Banner (< 2 mins) */}
        {step <= 4 && !isSessionExpired && secondsLeft <= WARNING_THRESHOLD && (
          <div className="bg-amber-950/90 border-b border-amber-600/40 px-3.5 sm:px-6 py-2 flex items-center justify-between text-xs text-amber-200">
            <div className="flex items-center gap-2 min-w-0">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 animate-bounce" />
              <span className="truncate">
                Session expiring in <strong className="font-mono text-white">{formatTime(secondsLeft)}</strong>. Details will be cleared for security.
              </span>
            </div>
            <button
              type="button"
              onClick={handleExtendSession}
              className="ml-2 px-2.5 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-[11px] rounded-[8px] transition-colors cursor-pointer shrink-0"
            >
              Extend Session
            </button>
          </div>
        )}

        {/* 5-Step Stepper Progress Bar */}
        {!isSessionExpired && step <= 4 && (
          <div className="bg-[#0F172A] px-2.5 sm:px-6 py-2 sm:py-2.5 border-b border-[#1E293B] flex items-center justify-between text-[10px] sm:text-[11px] font-mono font-medium text-slate-400">
            {stepLabels.map((lbl, idx) => {
              const num = idx + 1;
              const isPast = step > num;
              const isCurrent = step === num;
              return (
                <div
                  key={idx}
                  className={`flex items-center gap-1 sm:gap-1.5 ${
                    isCurrent
                      ? 'text-[#FB2C36] font-bold'
                      : isPast
                      ? 'text-[#10B981]'
                      : 'text-slate-500'
                  }`}
                >
                  <span
                    className={`w-4.5 h-4.5 sm:w-5 sm:h-5 rounded-full flex items-center justify-center text-[9px] sm:text-[10px] font-bold ${
                      isPast
                        ? 'bg-[#059669] text-white'
                        : isCurrent
                        ? 'bg-[#FB2C36] text-white'
                        : 'bg-[#1E293B] text-slate-400'
                    }`}
                  >
                    {isPast ? '✓' : num}
                  </span>
                  <span className="hidden sm:inline">{lbl.split(' ')[1]}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* Step Content */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-5 md:p-6">
          
          {/* Session Expired Screen */}
          {isSessionExpired && (
            <div className="py-8 px-4 text-center space-y-5 max-w-md mx-auto my-auto">
              <div className="w-14 h-14 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-600 flex items-center justify-center mx-auto shadow-xs">
                <ShieldAlert className="w-8 h-8" />
              </div>

              <div className="space-y-1.5">
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Session Expired for Security
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  To protect your vehicle identifiers and payment information from unauthorized access, your checkout session timed out after inactivity. All entered details were safely erased.
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-left space-y-1.5 text-xs text-slate-600">
                <div className="flex items-center gap-2 text-emerald-700 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#059669] shrink-0" />
                  <span>VIN and vehicle specifications cleared</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-700 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#059669] shrink-0" />
                  <span>Customer contact & payment details purged</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-700 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#059669] shrink-0" />
                  <span>Zero cached inputs remaining in browser</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={handleRestartAfterExpiry}
                  className="w-full sm:w-auto px-6 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-xs sm:text-sm rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2 min-h-[44px]"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Start Fresh Order</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsSessionExpired(false);
                    clearOrderDetails();
                    onClose();
                  }}
                  className="w-full sm:w-auto px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs sm:text-sm rounded-xl transition-colors cursor-pointer min-h-[44px]"
                >
                  Close
                </button>
              </div>
            </div>
          )}

          {/* STEP 1: Select Service (Section 11) */}
          {!isSessionExpired && step === 1 && (
            <div className="space-y-3.5 sm:space-y-4">
              <p className="text-xs text-slate-600">
                Choose the vehicle report plan that fits your needs. Single one-time payment with clear pricing.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 sm:gap-4 pt-1">
                {services.map((plan) => {
                  const isSelected = plan.id === serviceId;
                  return (
                    <div
                      key={plan.id}
                      onClick={() => setServiceId(plan.id)}
                      className={`p-3 sm:p-4 rounded-[8px] border-2 transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'border-[#FB2C36] bg-red-50/25 shadow-[0_1px_2px_rgba(0,0,0,0.05)]'
                          : 'border-[#E2E8F0] hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="space-y-1.5 sm:space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs sm:text-sm text-slate-900 tracking-[-0.35px]">{plan.name}</span>
                          {isSelected && (
                            <div className="w-4.5 h-4.5 sm:w-5 sm:h-5 rounded-full bg-[#FB2C36] text-white flex items-center justify-center shrink-0">
                              <Check className="w-3 h-3 stroke-[3]" />
                            </div>
                          )}
                        </div>

                        <div className="flex items-baseline gap-1">
                          <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-[-0.35px]">${plan.price.toFixed(2)}</span>
                          <span className="text-[10px] text-slate-400">USD</span>
                        </div>

                        <p className="text-[11px] text-slate-600 leading-snug">
                          {plan.tagline}
                        </p>

                        <div className="text-[10px] text-[#FB2C36] font-semibold bg-red-50 px-2 py-0.5 sm:py-1 rounded-[8px] inline-block border border-red-100">
                          {plan.deliveryTime}
                        </div>
                      </div>

                      <div className="pt-2.5 sm:pt-3 mt-2.5 sm:mt-3 border-t border-slate-100 text-[10.5px] sm:text-[11px] text-slate-500">
                        {plan.includedItems.slice(0, 3).map((inc, i) => (
                          <div key={i} className="flex items-center gap-1.5 py-0.5">
                            <Check className="w-3 h-3 text-[#059669] shrink-0" />
                            <span className="truncate">{inc}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 2: Vehicle Details (Section 12) */}
          {step === 2 && (
            <div className="space-y-3.5 sm:space-y-5 text-xs">
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-slate-900">Enter Vehicle Details</h4>
                <p className="text-slate-500 text-[11px] sm:text-xs mt-0.5">
                  Provide the 17-character VIN or registration number to identify the vehicle record.
                </p>
              </div>

              {/* Toggle VIN vs Registration (8px radius) */}
              <div className="flex rounded-[8px] bg-slate-100 p-1 w-full sm:max-w-xs">
                <button
                  type="button"
                  onClick={() => setIsVin(true)}
                  className={`flex-1 py-1.5 rounded-[8px] font-medium text-xs transition-colors cursor-pointer leading-[1.43] ${
                    isVin ? 'bg-white text-slate-900 shadow-[0_1px_2px_rgba(0,0,0,0.05)]' : 'text-slate-600'
                  }`}
                >
                  VIN Number
                </button>
                <button
                  type="button"
                  onClick={() => setIsVin(false)}
                  className={`flex-1 py-1.5 rounded-[8px] font-medium text-xs transition-colors cursor-pointer leading-[1.43] ${
                    !isVin ? 'bg-white text-slate-900 shadow-[0_1px_2px_rgba(0,0,0,0.05)]' : 'text-slate-600'
                  }`}
                >
                  Registration Plate
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-4">
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-[11px] sm:text-xs font-bold text-slate-800">
                    {isVin ? '17-Character VIN *' : 'License / Registration Plate *'}
                  </label>
                  <input
                    type="text"
                    value={vinOrReg}
                    onChange={(e) => {
                      setVinOrReg(e.target.value.toUpperCase());
                      setVinError('');
                    }}
                    placeholder={isVin ? 'e.g. 1HGCM82633A004352' : 'e.g. ABC-1234'}
                    maxLength={isVin ? 17 : 20}
                    className="w-full px-3 py-2 sm:px-3.5 sm:py-2.5 bg-slate-50 border border-slate-300 rounded-[8px] font-mono text-xs sm:text-sm tracking-wider uppercase focus:outline-none focus:border-[#FB2C36]"
                  />
                  {vinError ? (
                    <p className="text-rose-600 text-[11px] font-semibold">{vinError}</p>
                  ) : (
                    <p className="text-slate-500 text-[10px] sm:text-[11px] leading-tight">
                      {isVin
                        ? 'Standard 17-character serial found on your registration slip, title, or dashboard.'
                        : 'Official registration plate number with state or province.'}
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] sm:text-xs font-bold text-slate-800">Vehicle Make</label>
                  <input
                    type="text"
                    value={make}
                    onChange={(e) => setMake(e.target.value)}
                    placeholder="e.g. Honda, Audi, Toyota"
                    className="w-full px-3 py-1.5 sm:px-3.5 sm:py-2 bg-slate-50 border border-slate-300 rounded-[8px] text-xs sm:text-sm focus:outline-none focus:border-[#FB2C36]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] sm:text-xs font-bold text-slate-800">Vehicle Model</label>
                  <input
                    type="text"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder="e.g. Accord, A4, Camry"
                    className="w-full px-3 py-1.5 sm:px-3.5 sm:py-2 bg-slate-50 border border-slate-300 rounded-[8px] text-xs sm:text-sm focus:outline-none focus:border-[#FB2C36]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] sm:text-xs font-bold text-slate-800">Vehicle Year</label>
                  <input
                    type="number"
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                    min={1981}
                    max={2026}
                    className="w-full px-3 py-1.5 sm:px-3.5 sm:py-2 bg-slate-50 border border-slate-300 rounded-[8px] text-xs sm:text-sm focus:outline-none focus:border-[#FB2C36]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] sm:text-xs font-bold text-slate-800">State / Region (Optional)</label>
                  <input
                    type="text"
                    value={countryOrState}
                    onChange={(e) => setCountryOrState(e.target.value)}
                    placeholder="e.g. California, Ontario, Texas"
                    className="w-full px-3 py-1.5 sm:px-3.5 sm:py-2 bg-slate-50 border border-slate-300 rounded-[8px] text-xs sm:text-sm focus:outline-none focus:border-[#FB2C36]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Customer Details (Section 13) */}
          {step === 3 && (
            <div className="space-y-3.5 sm:space-y-5 text-xs">
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-slate-900">Where Should We Send Your Report?</h4>
                <p className="text-slate-500 text-[11px] sm:text-xs mt-0.5">
                  Your report will be delivered securely to your email.
                </p>
              </div>

              <div className="space-y-3 sm:space-y-4">
                <div className="space-y-1">
                  <label className="text-[11px] sm:text-xs font-bold text-slate-800">Full Name *</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Sarah Jenkins"
                    className="w-full px-3 py-2 sm:px-3.5 sm:py-2.5 bg-slate-50 border border-slate-300 rounded-[8px] text-xs sm:text-sm focus:outline-none focus:border-[#FB2C36]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] sm:text-xs font-bold text-slate-800">Email Address (For PDF Delivery) *</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. sjenkins.auto@outlook.com"
                    className="w-full px-3 py-2 sm:px-3.5 sm:py-2.5 bg-slate-50 border border-slate-300 rounded-[8px] text-xs sm:text-sm focus:outline-none focus:border-[#FB2C36]"
                  />
                  <p className="text-slate-500 text-[10px] sm:text-[11px] leading-tight">
                    The completed history report and download link will be dispatched to this address.
                  </p>
                </div>

                {/* Phone Number Input */}
                <div className="space-y-1">
                  <label className="text-[11px] sm:text-xs font-bold text-slate-800">
                    Mobile Phone Number {smsNotifications ? '*' : '(Optional)'}
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +1 (415) 555-0192"
                    className="w-full px-3 py-2 sm:px-3.5 sm:py-2.5 bg-slate-50 border border-slate-300 rounded-[8px] text-xs sm:text-sm focus:outline-none focus:border-[#FB2C36]"
                  />
                </div>

                {/* SMS Notification Toggle Card */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-[8px] space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                        <MessageSquare className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-800 block">Instant SMS Status Alerts</span>
                        <span className="text-[10px] text-slate-500 block">Receive live text alerts alongside email</span>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={smsNotifications}
                        onChange={(e) => setSmsNotifications(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-snug">
                    {smsNotifications
                      ? 'You will receive immediate SMS updates on your mobile device when your report is generated, verified, and ready for download.'
                      : 'SMS notifications disabled. You will only receive order receipts and your vehicle history report via email.'}
                  </p>
                </div>

                <div className="pt-1">
                  <label className="flex items-start gap-2 cursor-pointer text-slate-700 text-[11px] sm:text-xs leading-snug">
                    <input
                      type="checkbox"
                      checked={createAccount}
                      onChange={(e) => setCreateAccount(e.target.checked)}
                      className="mt-0.5 rounded text-[#FB2C36] focus:ring-red-500 shrink-0"
                    />
                    <span>Create a secure AutoAudit account to access past reports anytime</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Checkout & Fintech Payment (Section 14) */}
          {step === 4 && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 sm:gap-6 text-xs">
              
              {/* Left Column: Payment Form (7 Cols) */}
              <div className="md:col-span-7 space-y-3 sm:space-y-4">
                <div className="flex items-center justify-between pb-1.5 sm:pb-2 border-b border-slate-200">
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900">Payment Information</h4>
                  <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-[#059669]">
                    <Lock className="w-3.5 h-3.5" />
                    <span>256-Bit SSL Encrypted</span>
                  </div>
                </div>

                {/* Generic Payment Method Tabs (8px radius) */}
                <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    className={`p-1.5 sm:p-2.5 rounded-[8px] border text-center cursor-pointer flex flex-col items-center justify-center gap-0.5 sm:gap-1 min-h-[44px] ${
                      paymentMethod === 'card'
                        ? 'border-[#FB2C36] bg-red-50/25 text-[#FB2C36] font-bold shadow-[0_1px_2px_rgba(0,0,0,0.05)]'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <CreditCard className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span className="text-[10px] sm:text-[11px] leading-tight">Card</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('bank_transfer')}
                    className={`p-1.5 sm:p-2.5 rounded-[8px] border text-center cursor-pointer flex flex-col items-center justify-center gap-0.5 sm:gap-1 min-h-[44px] ${
                      paymentMethod === 'bank_transfer'
                        ? 'border-[#FB2C36] bg-red-50/25 text-[#FB2C36] font-bold shadow-[0_1px_2px_rgba(0,0,0,0.05)]'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Building className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span className="text-[10px] sm:text-[11px] leading-tight">Bank Transfer</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('digital_wallet')}
                    className={`p-1.5 sm:p-2.5 rounded-[8px] border text-center cursor-pointer flex flex-col items-center justify-center gap-0.5 sm:gap-1 min-h-[44px] ${
                      paymentMethod === 'digital_wallet'
                        ? 'border-[#FB2C36] bg-red-50/25 text-[#FB2C36] font-bold shadow-[0_1px_2px_rgba(0,0,0,0.05)]'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span className="text-[10px] sm:text-[11px] leading-tight">Wallet</span>
                  </button>
                </div>

                {/* Generic Card Form */}
                {paymentMethod === 'card' && (
                  <div className="p-3 sm:p-4 bg-slate-50 rounded-[8px] border border-slate-200 space-y-2.5 sm:space-y-3">
                    <div className="space-y-1">
                      <label className="text-[11px] sm:text-xs font-bold text-slate-700">Card Number</label>
                      <input
                        type="text"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        placeholder="•••• •••• •••• 4242"
                        className="w-full px-2.5 py-1.5 sm:px-3 sm:py-2 bg-white border border-slate-300 rounded-[8px] font-mono text-xs sm:text-sm focus:outline-none focus:border-[#FB2C36]"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2 sm:gap-3">
                      <div className="space-y-1">
                        <label className="text-[11px] sm:text-xs font-bold text-slate-700">Expiry (MM/YY)</label>
                        <input
                          type="text"
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value)}
                          placeholder="08/28"
                          className="w-full px-2.5 py-1.5 sm:px-3 sm:py-2 bg-white border border-slate-300 rounded-[8px] font-mono text-xs sm:text-sm focus:outline-none focus:border-[#FB2C36]"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] sm:text-xs font-bold text-slate-700">Security CVC</label>
                        <input
                          type="text"
                          value={cardCvc}
                          onChange={(e) => setCardCvc(e.target.value)}
                          placeholder="•••"
                          maxLength={4}
                          className="w-full px-2.5 py-1.5 sm:px-3 sm:py-2 bg-white border border-slate-300 rounded-[8px] font-mono text-xs sm:text-sm focus:outline-none focus:border-[#FB2C36]"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Terms Agreement */}
                <div className="p-2.5 sm:p-3 bg-slate-50 rounded-[8px] border border-slate-200">
                  <label className="flex items-start gap-2 cursor-pointer text-[10px] sm:text-[11px] text-slate-600 leading-snug">
                    <input
                      type="checkbox"
                      checked={agreedToTerms}
                      onChange={(e) => setAgreedToTerms(e.target.checked)}
                      className="mt-0.5 rounded text-[#FB2C36] focus:ring-red-500 shrink-0"
                    />
                    <span>
                      I acknowledge AutoAudit terms and verify that I am ordering an official online vehicle records compilation.
                    </span>
                  </label>
                </div>

                <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-slate-500">
                  <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#059669] shrink-0" />
                  <span>Your payment information is securely processed.</span>
                </div>
              </div>

              {/* Right Column: Order Summary (5 Cols) (Container radius = 14px) */}
              <div className="md:col-span-5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[14px] p-3.5 sm:p-4 md:p-5 space-y-2.5 sm:space-y-4">
                <h4 className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-800 pb-1.5 sm:pb-2 border-b border-slate-200">
                  Order Summary
                </h4>

                <div className="space-y-1.5 sm:space-y-2 text-[11px] sm:text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Report:</span>
                    <span className="font-semibold text-slate-900 text-right">{currentPlan.name}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Vehicle:</span>
                    <span className="font-mono font-bold text-slate-900 text-right">{vinOrReg || '1HGCM82633A004352'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Recipient:</span>
                    <span className="text-[#FB2C36] font-semibold truncate max-w-[130px] xs:max-w-[160px] sm:max-w-[180px] text-right">{email || 'customer@example.com'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Subtotal:</span>
                    <span className="font-mono text-slate-800">${subtotal.toFixed(2)}</span>
                  </div>

                  {appliedCoupon && (
                    <div className="flex justify-between items-center text-[#059669] font-semibold">
                      <span>Discount ({appliedCoupon.code}):</span>
                      <span>-${discountAmount.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center text-xs sm:text-sm font-black text-slate-900 pt-2 sm:pt-3 border-t border-slate-200">
                    <span>Total:</span>
                    <span className="text-[#FB2C36] font-mono text-sm sm:text-base">${total.toFixed(2)} USD</span>
                  </div>
                </div>

                {/* Coupon Code Input */}
                <div className="space-y-1 pt-1">
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      placeholder="Promo Code"
                      className="flex-1 px-2.5 py-1.5 bg-white border border-slate-300 rounded-[8px] text-xs font-mono uppercase focus:outline-none focus:border-[#FB2C36]"
                    />
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      className="px-3 py-1.5 bg-[#000000] hover:bg-slate-800 text-white rounded-[8px] text-xs font-medium cursor-pointer min-h-[36px]"
                    >
                      Apply
                    </button>
                  </div>
                  {appliedCoupon && (
                    <p className="text-[10px] sm:text-[11px] text-[#059669] font-medium">✓ Coupon applied</p>
                  )}
                  {couponError && (
                    <p className="text-[10px] sm:text-[11px] text-rose-600">{couponError}</p>
                  )}
                </div>

                {/* Primary Button: Submit Order (#FB2C36 accent, 8px radius, micro-shadow) */}
                <button
                  type="button"
                  disabled={isProcessingPayment}
                  onClick={handleProcessPayment}
                  aria-busy={isProcessingPayment}
                  aria-label={isProcessingPayment ? 'Submitting order, please wait' : `Submit Order and Pay Securely $${total.toFixed(2)} USD`}
                  className="w-full py-2.5 sm:py-3 bg-[#FB2C36] hover:bg-[#E0242E] text-white rounded-[8px] text-xs sm:text-sm font-medium shadow-[0_1px_2px_rgba(0,0,0,0.05)] transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed min-h-[44px] leading-[1.43]"
                >
                  {isProcessingPayment ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white shrink-0" />
                      <span className="font-semibold">Submitting Order…</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>Submit Order · Pay Securely (${total.toFixed(2)})</span>
                    </>
                  )}
                </button>
              </div>

            </div>
          )}

          {/* STEP 5: Payment Success / Order Confirmed (Section 15) */}
          {step === 5 && createdOrder && (
            <div className="text-center space-y-3.5 sm:space-y-5 py-2 sm:py-4 max-w-lg mx-auto report-ready-transition report-ready-glow">
              {/* Large Emerald Check Icon */}
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-emerald-100 border border-emerald-200 text-[#059669] flex items-center justify-center mx-auto shadow-xs report-checkmark-pop">
                <CheckCircle2 className="w-7 h-7 sm:w-10 sm:h-10 stroke-[2.2]" />
              </div>

              <div className="space-y-0.5 sm:space-y-1">
                <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
                  Order Confirmed
                </h3>
                <p className="text-xs sm:text-sm text-slate-600">
                  Your vehicle report order has been received successfully.
                </p>
              </div>

              {/* Order Details Box */}
              <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl sm:rounded-2xl p-3.5 sm:p-5 text-[11px] sm:text-xs text-left space-y-2 sm:space-y-2.5 shadow-xs report-stagger-1">
                <div className="flex justify-between pb-1.5 sm:pb-2 border-b border-slate-200">
                  <span className="text-slate-500">Order Number:</span>
                  <span className="font-mono font-bold text-slate-900 text-xs sm:text-sm">{createdOrder.orderNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Vehicle:</span>
                  <span className="font-mono font-semibold text-slate-900">{createdOrder.vehicle.vinOrReg}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Report:</span>
                  <span className="font-semibold text-slate-900">{createdOrder.serviceName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Status:</span>
                  <span className="inline-flex items-center gap-1 font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                    <span>Processing</span>
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Estimated Delivery:</span>
                  <span className="font-semibold text-[#059669]">{currentPlan.deliveryTime}</span>
                </div>
              </div>

              {/* 4-Stage Fulfillment Progress Bar */}
              <div className="report-stagger-2">
                <OrderTrackingProgressBar
                  status="Processing"
                  orderNumber={createdOrder.orderNumber}
                  compact={true}
                />
              </div>

              <div className="p-2.5 sm:p-3 bg-blue-50/70 border border-blue-100 rounded-xl text-[11px] sm:text-xs text-blue-900 leading-snug report-stagger-3">
                A confirmation has been dispatched to <strong>{createdOrder.customer.email}</strong>. You will receive your PDF report as soon as records are verified.
              </div>

              {/* Action Buttons: View Order, WhatsApp Help, Back to Home */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 sm:gap-3 pt-1 report-stagger-3">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenTrack();
                  }}
                  className="w-full sm:w-auto px-5 sm:px-6 py-2.5 bg-[#FB2C36] hover:bg-[#E0242E] text-white font-medium text-xs rounded-[8px] shadow-[0_1px_2px_rgba(0,0,0,0.05)] transition-colors cursor-pointer min-h-[44px] flex items-center justify-center leading-[1.43]"
                >
                  View Order
                </button>
                <WhatsAppButton
                  variant="primary"
                  source="order_modal"
                  intent="order_tracking"
                  orderNumber={createdOrder.orderNumber}
                  vin={createdOrder.vehicle.vinOrReg}
                  label="Chat on WhatsApp"
                  className="w-full sm:w-auto px-5 py-2.5 rounded-[8px] min-h-[44px]"
                />
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto px-5 sm:px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs rounded-[8px] transition-colors cursor-pointer min-h-[44px] flex items-center justify-center leading-[1.43]"
                >
                  Back to Home
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Modal Bottom Controls for Steps 1-3 */}
        {!isSessionExpired && step <= 3 && (
          <div className="px-3.5 py-2.5 sm:px-6 sm:py-4 bg-[#F8FAFC] border-t border-[#E2E8F0] flex items-center justify-between gap-2">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep((s) => s - 1)}
                className="px-3 py-2 text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-200 rounded-[8px] transition-colors flex items-center gap-1 cursor-pointer min-h-[40px] shrink-0 leading-[1.43]"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            ) : (
              <div />
            )}

            <button
              type="button"
              onClick={() => {
                if (step === 2 && !validateStep2()) {
                  return;
                }
                if (step === 3 && (!email.trim() || !email.includes('@'))) {
                  showToast({
                    title: 'Email Required',
                    message: 'Please enter a valid email address to receive your completed vehicle report.',
                    type: 'warning'
                  });
                  return;
                }
                setStep((s) => s + 1);
              }}
              className="px-3.5 py-2 sm:px-5 sm:py-2.5 bg-[#FB2C36] hover:bg-[#E0242E] text-white font-medium text-xs sm:text-sm rounded-[8px] transition-colors flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer shadow-[0_1px_2px_rgba(0,0,0,0.05)] active:scale-95 min-h-[40px] sm:min-h-[42px] leading-[1.43]"
            >
              <span>
                {step === 1 ? (
                  <>
                    <span>Continue</span>
                    <span className="hidden xs:inline">&nbsp;to Vehicle</span>
                  </>
                ) : step === 2 ? (
                  <>
                    <span>Continue</span>
                    <span className="hidden xs:inline">&nbsp;to Customer</span>
                  </>
                ) : (
                  <>
                    <span>Continue</span>
                    <span className="hidden xs:inline">&nbsp;to Payment</span>
                  </>
                )}
              </span>
              <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
