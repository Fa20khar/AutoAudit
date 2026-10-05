import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { ServicePlan, Order, Coupon, AuditLog, EmailNotification } from '../types';
import { 
  X, Check, ArrowRight, ArrowLeft, ShieldCheck, Lock, CreditCard, 
  Sparkles, AlertCircle, FileCheck, CheckCircle2, Building, Wallet, CheckCircle,
  Clock, AlertTriangle, ShieldAlert, RotateCcw, MessageSquare, Loader2,
  Mail, Eye, EyeOff, Send, ExternalLink, Tag, Percent
} from 'lucide-react';
import { OrderTrackingProgressBar } from './OrderTrackingProgressBar';
import { WhatsAppButton } from './WhatsAppButton';
import { CheckoutStepper } from './CheckoutStepper';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { validateVinFormat, VinValidationResult } from '../utils/vinValidator';
import { validateCouponRealTime, calculateDiscount } from '../utils/couponValidator';
import { INITIAL_COUPONS } from '../data/initialData';

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
  onDownloadReport?: (vin: string, vehicleTitle: string, orderNumber: string) => void;
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
  onDownloadReport,
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
  const [confirmationEmail, setConfirmationEmail] = useState<EmailNotification | null>(null);
  const [showEmailDetails, setShowEmailDetails] = useState<boolean>(false);

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

  // Celebration Confetti Trigger for Successful Order Placement
  const celebrationFiredRef = useRef<boolean>(false);

  const triggerCelebration = () => {
    try {
      if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return;
      }

      // AutoAudit Brand Color Palette: Accent Red (#FB2C36), Electric Blue (#2563EB), Emerald (#059669), Gold (#F59E0B), Navy (#0B132B), White
      const brandColors = ['#FB2C36', '#2563EB', '#059669', '#F59E0B', '#0B132B', '#FFFFFF'];

      // Burst 1: High-energy center explosion
      confetti({
        particleCount: 70,
        spread: 75,
        origin: { y: 0.52 },
        colors: brandColors,
        ticks: 260,
        gravity: 1.1,
        scalar: 1.1,
        zIndex: 9999
      });

      // Burst 2: Left cannon
      setTimeout(() => {
        confetti({
          particleCount: 45,
          angle: 60,
          spread: 55,
          origin: { x: 0.15, y: 0.65 },
          colors: brandColors,
          ticks: 240,
          zIndex: 9999
        });
      }, 160);

      // Burst 3: Right cannon
      setTimeout(() => {
        confetti({
          particleCount: 45,
          angle: 120,
          spread: 55,
          origin: { x: 0.85, y: 0.65 },
          colors: brandColors,
          ticks: 240,
          zIndex: 9999
        });
      }, 320);
    } catch (e) {
      console.warn('Confetti effect unavailable:', e);
    }
  };

  // Trigger celebration animation when arriving at Step 5
  useEffect(() => {
    if (step === 5 && isOpen && createdOrder) {
      if (!celebrationFiredRef.current) {
        celebrationFiredRef.current = true;
        triggerCelebration();
      }
    } else if (step !== 5) {
      celebrationFiredRef.current = false;
    }
  }, [step, isOpen, createdOrder?.id]);

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
  
  // Calculate real-time discount and total order amount
  const discountAmount = appliedCoupon ? calculateDiscount(appliedCoupon, subtotal) : 0;
  const total = Math.max(0, Number((subtotal - discountAmount).toFixed(2)));

  // Real-time coupon validation helper: validates input code as user types or pastes
  const handleCouponInputChange = (inputCode: string) => {
    const cleanCode = inputCode.toUpperCase();
    setCouponCode(cleanCode);

    if (!cleanCode.trim()) {
      setAppliedCoupon(null);
      setCouponError('');
      return;
    }

    // Evaluate real-time against INITIAL_COUPONS and passed coupons
    const validation = validateCouponRealTime(cleanCode, subtotal, coupons || INITIAL_COUPONS);

    if (validation.isValid && validation.coupon) {
      setAppliedCoupon(validation.coupon);
      setCouponError('');
    } else if (
      validation.status === 'invalid' ||
      validation.status === 'expired' ||
      validation.status === 'max_usage' ||
      validation.status === 'min_order'
    ) {
      setAppliedCoupon(null);
      setCouponError(validation.message);
    } else {
      // User is still typing (< 3 characters)
      setAppliedCoupon(null);
      setCouponError('');
    }
  };

  const handleApplyCouponChip = (code: string) => {
    handleCouponInputChange(code);
  };

  const handleRemoveCoupon = () => {
    setCouponCode('');
    setAppliedCoupon(null);
    setCouponError('');
  };

  // Explicit apply button fallback
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError('Please enter a coupon code.');
      return;
    }
    handleCouponInputChange(couponCode);
  };

  const validateStep2 = () => {
    setVinError('');
    const clean = vinOrReg.trim().toUpperCase();
    if (!clean) {
      setVinError(isVin ? 'Please enter your 17-character VIN number.' : 'Please enter a registration plate number.');
      return false;
    }
    if (isVin) {
      const validation = validateVinFormat(clean);
      if (!validation.isValid) {
        setVinError(validation.message);
        return false;
      }
    }
    return true;
  };

  const { showToast } = useToast();

  const handleProcessPayment = async () => {
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

    try {
      const cleanVin = vinOrReg.trim().toUpperCase() || '1HGCM82633A004352';
      const customerEmail = email.trim().toLowerCase() || 'customer@example.com';
      const customerName = fullName.trim() || 'Verified Customer';

      const orderPayload: Partial<Order> = {
        serviceId: currentPlan.id,
        serviceName: currentPlan.name,
        subtotal: Number(subtotal.toFixed(2)),
        discountAmount: Number(discountAmount.toFixed(2)),
        total: Number(total.toFixed(2)),
        couponCode: appliedCoupon ? appliedCoupon.code : undefined,
        customer: {
          fullName: customerName,
          email: customerEmail,
          phone: phone.trim() || '+1 (555) 019-2834',
          smsNotifications
        },
        smsNotifications,
        vehicle: {
          vinOrReg: cleanVin,
          isVin,
          make: make.trim() || 'Verified Vehicle',
          model: model.trim() || 'Series',
          year: year || 2021,
          mileage: mileage.trim() || 'Actual Certified',
          countryOrState: countryOrState.trim() || 'US',
          customerNotes: customerNotes.trim() || undefined
        },
        payment: {
          status: 'Paid',
          gatewayRef: `PAY-TXN-${Math.floor(10000000 + Math.random() * 90000000)}`,
          paidAt: new Date().toISOString(),
          method: paymentMethod === 'card' ? 'Secure Card Payment' : paymentMethod === 'bank_transfer' ? 'Direct Bank Transfer' : 'Digital Wallet'
        }
      };

      // Call backend REST endpoint: saves order and fires automated mock SMTP email sequence to customer's address
      const serverOrder = await api.createOrder(orderPayload);
      setCreatedOrder(serverOrder);

      // Save customer email for instant dashboard retrieval
      if (serverOrder.customer?.email) {
        try {
          localStorage.setItem('autoaudit_customer_email', serverOrder.customer.email.toLowerCase().trim());
        } catch {
          // ignore
        }
      }

      // Query the dispatched confirmation email from Mock SMTP service
      try {
        const emails = await api.getEmails({ orderNumber: serverOrder.orderNumber });
        const conf = emails.find(e => e.type === 'order_confirmation');
        if (conf) {
          setConfirmationEmail(conf);
        } else {
          setConfirmationEmail({
            id: `em-${Date.now()}-mock`,
            orderId: serverOrder.id,
            orderNumber: serverOrder.orderNumber,
            recipientEmail: customerEmail,
            recipientType: 'customer',
            subject: `Order Confirmed: AutoAudit Report for ${cleanVin} (${serverOrder.orderNumber})`,
            type: 'order_confirmation',
            body: `Hello ${customerName},\n\nThank you for choosing AutoAudit! Your order #${serverOrder.orderNumber} for ${serverOrder.vehicle.year} ${serverOrder.vehicle.make} ${serverOrder.vehicle.model} (VIN: ${cleanVin}) has been confirmed and payment has been processed successfully ($${serverOrder.total.toFixed(2)} USD).\n\nOur automated systems are now querying the NMVTIS federal title clearinghouse, 50-state DMV registries, and salvage auto auctions.`,
            smtpTransport: 'Nodemailer Mock SMTP (JSON Transporter)',
            sentAt: new Date().toISOString(),
            read: false
          });
        }
      } catch {
        // Fallback email object
      }

      showToast({
        title: 'Order Confirmed & Email Dispatched',
        message: `Order confirmation email sent to ${customerEmail} via AutoAudit Mock SMTP service.`,
        type: 'success',
        duration: 5000
      });

      onOrderCompleted(serverOrder);
      setStep(5); // Advance to Step 5: Confirmation screen
    } catch (err: any) {
      console.warn('Backend order processing fallback:', err);
      // Client-side fallback if server is temporarily unreachable
      const now = new Date().toISOString();
      const fallbackOrderNum = `AA-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      const fallbackOrder: Order = {
        id: `ord-${Date.now()}`,
        orderNumber: fallbackOrderNum,
        serviceId: currentPlan.id,
        serviceName: currentPlan.name,
        status: 'Processing',
        subtotal: Number(subtotal.toFixed(2)),
        discountAmount: Number(discountAmount.toFixed(2)),
        total: Number(total.toFixed(2)),
        couponCode: appliedCoupon ? appliedCoupon.code : undefined,
        customer: {
          fullName: fullName.trim() || 'Verified Customer',
          email: email.trim().toLowerCase() || 'customer@example.com',
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
        auditLogs: [
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
        ]
      };

      setCreatedOrder(fallbackOrder);
      setConfirmationEmail({
        id: `em-${Date.now()}-fallback`,
        orderId: fallbackOrder.id,
        orderNumber: fallbackOrder.orderNumber,
        recipientEmail: fallbackOrder.customer.email,
        recipientType: 'customer',
        subject: `Order Confirmed: AutoAudit Report for ${fallbackOrder.vehicle.vinOrReg} (${fallbackOrder.orderNumber})`,
        type: 'order_confirmation',
        body: `Hello ${fallbackOrder.customer.fullName},\n\nYour order #${fallbackOrder.orderNumber} has been received and confirmed.`,
        smtpTransport: 'Nodemailer Mock SMTP (JSON Transporter)',
        sentAt: now,
        read: false
      });

      showToast({
        title: 'Order Confirmed',
        message: `Order confirmation recorded for ${fallbackOrder.customer.email}.`,
        type: 'success'
      });

      onOrderCompleted(fallbackOrder);
      setStep(5);
    } finally {
      setIsProcessingPayment(false);
    }
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

        {/* Multi-Step Stepper Component: Plan -> VIN Entry -> Customer Info -> Payment Details -> Confirmation */}
        {!isSessionExpired && (
          <CheckoutStepper
            currentStep={step}
            onStepClick={(targetStep) => {
              if (targetStep < step && step !== 5) {
                setStep(targetStep);
              }
            }}
          />
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
                <div className="sm:col-span-2 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] sm:text-xs font-bold text-slate-800">
                      {isVin ? '17-Character VIN *' : 'License / Registration Plate *'}
                    </label>
                    {isVin && (
                      <div className="flex items-center gap-1.5">
                        {(() => {
                          const val = validateVinFormat(vinOrReg);
                          return (
                            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-[6px] border transition-all duration-200 ${
                              val.status === 'valid'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                : val.status === 'invalid_chars' || val.status === 'invalid_length'
                                ? 'bg-rose-50 text-rose-700 border-rose-300'
                                : val.charCount > 0
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : 'bg-slate-100 text-slate-500 border-slate-200'
                            }`}>
                              {val.charCount}/17 {val.status === 'valid' ? '✓ VALID' : val.status === 'invalid_chars' ? '✕ INVALID' : ''}
                            </span>
                          );
                        })()}
                      </div>
                    )}
                  </div>

                  {(() => {
                    const val = isVin ? validateVinFormat(vinOrReg) : null;
                    return (
                      <div className="space-y-1.5">
                        <div className="relative">
                          <input
                            type="text"
                            value={vinOrReg}
                            onChange={(e) => {
                              setVinOrReg(e.target.value.toUpperCase());
                              setVinError('');
                            }}
                            placeholder={isVin ? 'e.g. 1HGCM82633A004352' : 'e.g. ABC-1234'}
                            maxLength={isVin ? 17 : 20}
                            className={`w-full px-3 py-2 sm:px-3.5 sm:py-2.5 pr-10 bg-slate-50 border rounded-[8px] font-mono text-xs sm:text-sm tracking-wider uppercase transition-all duration-150 focus:outline-none ${
                              !isVin
                                ? 'border-slate-300 focus:border-[#FB2C36]'
                                : val?.status === 'valid'
                                ? 'border-emerald-500 bg-emerald-50/20 text-slate-900 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500/30'
                                : val?.status === 'invalid_chars' || val?.status === 'invalid_length'
                                ? 'border-rose-500 bg-rose-50/20 text-rose-950 focus:border-rose-600 focus:ring-1 focus:ring-rose-500/30'
                                : val && val.charCount > 0
                                ? 'border-blue-400 bg-blue-50/15 text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30'
                                : 'border-slate-300 focus:border-[#FB2C36]'
                            }`}
                          />
                          {/* Real-time Trailing Status Icon */}
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none flex items-center">
                            {isVin && val?.status === 'valid' && (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 animate-in fade-in zoom-in-75 duration-200" />
                            )}
                            {isVin && (val?.status === 'invalid_chars' || val?.status === 'invalid_length') && (
                              <AlertCircle className="w-4 h-4 text-rose-600 animate-in fade-in zoom-in-75 duration-200" />
                            )}
                            {isVin && val?.status === 'incomplete' && (
                              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                            )}
                          </div>
                        </div>

                        {/* 17-character segmented progress indicator */}
                        {isVin && (
                          <div className="space-y-1 pt-0.5">
                            <div className="grid grid-cols-17 gap-0.5 sm:gap-1 h-1.5 w-full bg-slate-100 rounded-full p-0.5">
                              {Array.from({ length: 17 }).map((_, i) => {
                                const char = vinOrReg[i];
                                const isFilled = i < (val?.charCount || 0);
                                const isForbidden = char && /[IOQ]/i.test(char);
                                return (
                                  <div
                                    key={i}
                                    className={`h-full rounded-xs transition-all duration-150 ${
                                      isForbidden
                                        ? 'bg-rose-500'
                                        : isFilled
                                        ? val?.status === 'valid'
                                          ? 'bg-emerald-500'
                                          : 'bg-blue-500'
                                        : 'bg-slate-200'
                                    }`}
                                    title={`Pos ${i + 1}: ${char || 'empty'}`}
                                  />
                                );
                              })}
                            </div>

                            {/* Real-Time Diagnostic Message */}
                            {val && val.status === 'valid' && (
                              <div className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50/80 border border-emerald-200 rounded-[8px] p-2 text-[11px] font-semibold animate-in fade-in duration-150">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                <span>
                                  Valid 17-character VIN verified (WMI: <span className="font-mono">{val.wmi}</span>, VDS: <span className="font-mono">{val.vds}</span>, Year: <span className="font-mono">{val.modelYear}</span>).
                                </span>
                              </div>
                            )}

                            {val && (val.status === 'invalid_chars' || val.status === 'invalid_length') && (
                              <div className="flex items-start gap-1.5 text-rose-700 bg-rose-50/90 border border-rose-200 rounded-[8px] p-2 text-[11px] font-medium animate-in fade-in duration-150">
                                <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                                <div className="space-y-0.5">
                                  <p className="font-semibold">{val.message}</p>
                                  {val.forbiddenLetters.length > 0 && (
                                    <p className="text-[10.5px] text-rose-600">
                                      Tip: Letters <strong>I</strong> (replaced by 1), <strong>O</strong> (replaced by 0), and <strong>Q</strong> are excluded from ISO 3779 VINs to prevent reading confusion.
                                    </p>
                                  )}
                                </div>
                              </div>
                            )}

                            {val && val.status === 'incomplete' && (
                              <div className="flex items-center justify-between text-slate-500 text-[10.5px]">
                                <span>{val.message}</span>
                                <span className="font-mono text-slate-400">NHTSA Standard</span>
                              </div>
                            )}

                            {val && val.status === 'empty' && (
                              <p className="text-slate-500 text-[10px] sm:text-[11px] leading-tight">
                                Standard 17-character serial found on your registration slip, title, or dashboard.
                              </p>
                            )}
                          </div>
                        )}

                        {!isVin && (
                          vinError ? (
                            <p className="text-rose-600 text-[11px] font-semibold">{vinError}</p>
                          ) : (
                            <p className="text-slate-500 text-[10px] sm:text-[11px] leading-tight">
                              Official registration plate number with state or province.
                            </p>
                          )
                        )}

                        {vinError && isVin && val?.status === 'empty' && (
                          <p className="text-rose-600 text-[11px] font-semibold">{vinError}</p>
                        )}
                      </div>
                    );
                  })()}
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
                    <span className={`font-mono ${appliedCoupon ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                      ${subtotal.toFixed(2)}
                    </span>
                  </div>

                  {appliedCoupon && (
                    <div className="flex justify-between items-center text-[#059669] font-bold bg-emerald-50/80 px-2 py-1 rounded-md border border-emerald-200 text-[11px]">
                      <span className="flex items-center gap-1">
                        <Tag className="w-3 h-3 text-[#059669]" />
                        <span>Discount ({appliedCoupon.code}):</span>
                      </span>
                      <span className="font-mono">-${discountAmount.toFixed(2)} USD</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center text-xs sm:text-sm font-black text-slate-900 pt-2 sm:pt-3 border-t border-slate-200">
                    <div className="flex items-center gap-1.5">
                      <span>Total:</span>
                      {appliedCoupon && (
                        <span className="text-[10px] font-normal text-[#059669] bg-emerald-100/60 px-1.5 py-0.5 rounded">
                          Save ${discountAmount.toFixed(2)}
                        </span>
                      )}
                    </div>
                    <span className="text-[#FB2C36] font-mono text-sm sm:text-base">${total.toFixed(2)} USD</span>
                  </div>
                </div>

                {/* Coupon Code Input & Real-Time Helper */}
                <div className="space-y-2 pt-1 border-t border-slate-200">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] sm:text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Tag className="w-3 h-3 text-[#2563EB]" />
                      <span>Promo / Coupon Code</span>
                    </label>
                    {appliedCoupon && (
                      <button
                        type="button"
                        onClick={handleRemoveCoupon}
                        className="text-[10px] text-rose-600 hover:text-rose-800 font-semibold cursor-pointer underline transition-colors"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="relative">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => handleCouponInputChange(e.target.value)}
                      placeholder="e.g. FAKHAR20 or WELCOME10"
                      className={`w-full pl-8 pr-8 py-2 bg-white border rounded-[8px] text-xs font-mono uppercase tracking-wider transition-all focus:outline-none ${
                        appliedCoupon
                          ? 'border-emerald-500 bg-emerald-50/20 text-emerald-950 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500/30'
                          : couponError
                          ? 'border-rose-400 bg-rose-50/20 text-rose-950 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/30'
                          : 'border-slate-300 focus:border-[#FB2C36]'
                      }`}
                    />
                    <Tag className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />

                    {/* Right Trailing Status Indicator */}
                    <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none flex items-center">
                      {appliedCoupon && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 animate-in zoom-in-75 duration-150" />
                      )}
                      {couponError && (
                        <AlertCircle className="w-4 h-4 text-rose-500 animate-in zoom-in-75 duration-150" />
                      )}
                    </div>
                  </div>

                  {/* Real-time Applied Success Badge */}
                  {appliedCoupon && (
                    <div className="p-2 bg-emerald-50/90 border border-emerald-200 rounded-[8px] flex items-center justify-between text-[11px] text-emerald-800 animate-in fade-in duration-150">
                      <div className="flex items-center gap-1.5 font-medium truncate">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 stroke-[3]" />
                        <span>
                          <strong>{appliedCoupon.code}</strong> applied: {appliedCoupon.discountPercent ? `${appliedCoupon.discountPercent}% OFF` : `$${appliedCoupon.discountFixed?.toFixed(2)} OFF`} (-${discountAmount.toFixed(2)})
                        </span>
                      </div>
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-200/70 text-emerald-900 shrink-0">
                        SAVED
                      </span>
                    </div>
                  )}

                  {/* Real-time Validation Error */}
                  {couponError && (
                    <p className="text-[10.5px] text-rose-600 font-medium flex items-center gap-1 animate-in fade-in duration-150">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      <span>{couponError}</span>
                    </p>
                  )}

                  {/* Quick-Apply Promo Chips from INITIAL_COUPONS */}
                  <div className="pt-0.5">
                    <span className="text-[10px] text-slate-400 block mb-1">Available Promotions:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {INITIAL_COUPONS.filter(c => c.active).map(c => {
                        const isThisApplied = appliedCoupon?.code === c.code;
                        return (
                          <button
                            key={c.code}
                            type="button"
                            onClick={() => handleApplyCouponChip(c.code)}
                            className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold transition-all cursor-pointer flex items-center gap-1 ${
                              isThisApplied
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                            }`}
                          >
                            <span>{c.code}</span>
                            <span className={isThisApplied ? 'text-emerald-100' : 'text-[#FB2C36]'}>
                              ({c.discountPercent ? `${c.discountPercent}% OFF` : `$${c.discountFixed} OFF`})
                            </span>
                            {isThisApplied && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
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
            <div className="text-center space-y-3.5 sm:space-y-4 py-2 sm:py-3 max-w-lg mx-auto report-ready-transition report-ready-glow">
              
              {/* Celebration Pill with Sparkles & Replay */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold tracking-wide shadow-xs report-stagger-1 mx-auto">
                <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                <span>🎉 Order Placed Successfully!</span>
                <button
                  type="button"
                  onClick={triggerCelebration}
                  className="ml-1 text-[11px] text-emerald-700 hover:text-emerald-950 underline font-bold cursor-pointer"
                  title="Replay Celebration Confetti"
                >
                  Replay
                </button>
              </div>

              {/* Large Celebratory Emerald Check Icon with Pulsing Halo */}
              <div className="relative w-14 h-14 sm:w-16 sm:h-16 mx-auto flex items-center justify-center my-0.5">
                <div className="absolute inset-0 rounded-full bg-emerald-400/30 animate-ping opacity-60 pointer-events-none" style={{ animationDuration: '2.5s' }} />
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-400 text-white flex items-center justify-center shadow-lg report-checkmark-pop">
                  <CheckCircle2 className="w-8 h-8 sm:w-10 sm:h-10 stroke-[2.4]" />
                </div>
              </div>

              <div className="space-y-0.5 sm:space-y-1">
                <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
                  Order Confirmed
                </h3>
                <p className="text-xs sm:text-sm text-slate-600">
                  Your vehicle report order has been received and verified.
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

              {/* Automated Mock SMTP Confirmation Email Dispatch Card */}
              <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl sm:rounded-2xl p-3.5 sm:p-4 text-left space-y-2.5 shadow-xs report-stagger-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-emerald-950">
                        Confirmation Email Dispatched
                      </h4>
                      <p className="text-[11px] text-emerald-800">
                        Sent to: <strong className="font-semibold">{createdOrder.customer.email}</strong>
                      </p>
                    </div>
                  </div>

                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 shrink-0">
                    MOCK SMTP (JSON)
                  </span>
                </div>

                <div className="text-[11px] text-slate-600 bg-white/80 border border-emerald-100 rounded-lg p-2.5 space-y-1">
                  <div className="flex justify-between items-center text-[10.5px]">
                    <span className="text-slate-500 font-medium">Service:</span>
                    <span className="font-mono text-slate-800">AutoAudit Mock SMTP Integration</span>
                  </div>
                  <div className="flex justify-between items-center text-[10.5px]">
                    <span className="text-slate-500 font-medium">Subject:</span>
                    <span className="font-semibold text-slate-800 truncate max-w-[240px]">
                      {confirmationEmail?.subject || `Order Confirmed: AutoAudit Report for ${createdOrder.vehicle.vinOrReg} (${createdOrder.orderNumber})`}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[10.5px]">
                    <span className="text-slate-500 font-medium">Delivery Status:</span>
                    <span className="inline-flex items-center gap-1 font-bold text-emerald-700">
                      <Check className="w-3 h-3 stroke-[3]" />
                      <span>Instant Zero-Latency Mock Delivery</span>
                    </span>
                  </div>
                </div>

                {/* Email Preview Toggle */}
                <div className="pt-0.5">
                  <button
                    type="button"
                    onClick={() => setShowEmailDetails(!showEmailDetails)}
                    className="w-full py-1.5 px-3 rounded-lg bg-emerald-100/70 hover:bg-emerald-200/80 text-emerald-900 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {showEmailDetails ? (
                      <>
                        <EyeOff className="w-3.5 h-3.5" />
                        <span>Hide Dispatched Email</span>
                      </>
                    ) : (
                      <>
                        <Eye className="w-3.5 h-3.5" />
                        <span>Preview Dispatched Confirmation Email</span>
                      </>
                    )}
                  </button>

                  {/* Expandable Email Content Drawer */}
                  {showEmailDetails && (
                    <div className="mt-2.5 p-3.5 bg-slate-900 text-slate-100 rounded-xl border border-slate-800 text-[11px] font-mono space-y-2.5 animate-in fade-in duration-200 shadow-inner">
                      <div className="border-b border-slate-800 pb-2 space-y-1 text-[10.5px] text-slate-400">
                        <div><strong className="text-slate-200">From:</strong> AutoAudit Notifications &lt;noreply@autoaudit.intelligence&gt;</div>
                        <div><strong className="text-slate-200">To:</strong> {createdOrder.customer.email}</div>
                        <div><strong className="text-slate-200">Subject:</strong> {confirmationEmail?.subject || `Order Confirmed: AutoAudit Report for ${createdOrder.vehicle.vinOrReg}`}</div>
                        <div><strong className="text-slate-200">Transport:</strong> Nodemailer Mock SMTP JSON Transporter</div>
                      </div>

                      <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-[10.5px] text-slate-300 font-sans leading-relaxed whitespace-pre-line max-h-48 overflow-y-auto">
                        {confirmationEmail?.body || `Hello ${createdOrder.customer.fullName},

Thank you for choosing AutoAudit! Your order #${createdOrder.orderNumber} for ${createdOrder.vehicle.year} ${createdOrder.vehicle.make} ${createdOrder.vehicle.model} (VIN: ${createdOrder.vehicle.vinOrReg}) has been confirmed and payment has been processed successfully ($${createdOrder.total.toFixed(2)} USD).

Our automated systems are now querying the NMVTIS federal title clearinghouse, 50-state DMV registries, and salvage auto auctions.

We will notify you the moment your report advances to processing.`}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons: Auto-Generate Report, View Order, WhatsApp Help, Back to Home */}
              <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-2.5 sm:gap-3 pt-1 report-stagger-3">
                {onDownloadReport && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onDownloadReport(
                        createdOrder.vehicle.vinOrReg,
                        `${createdOrder.vehicle.year} ${createdOrder.vehicle.make} ${createdOrder.vehicle.model}`,
                        createdOrder.orderNumber
                      );
                    }}
                    className="w-full sm:w-auto px-5 sm:px-6 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-xs rounded-[8px] shadow-[0_1px_2px_rgba(0,0,0,0.05)] transition-colors cursor-pointer min-h-[44px] flex items-center justify-center gap-1.5 leading-[1.43]"
                  >
                    <FileCheck className="w-4 h-4" />
                    <span>Auto-Generate & Download Report</span>
                  </button>
                )}

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

              {/* Celebration Replay Link */}
              <div className="pt-0.5">
                <button
                  type="button"
                  onClick={triggerCelebration}
                  className="text-[11px] text-slate-400 hover:text-slate-600 font-medium inline-flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  <span>Replay celebration confetti</span>
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
