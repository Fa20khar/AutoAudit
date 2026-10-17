import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  ArrowLeft, 
  FileCheck, 
  ExternalLink, 
  Lock, 
  HelpCircle, 
  CheckCircle2, 
  Loader2, 
  AlertCircle,
  Copy,
  Check,
  Table,
  FileSpreadsheet,
  Camera,
  Image as ImageIcon,
  Info,
  Car,
  CreditCard,
  Building,
  Wallet,
  QrCode,
  ArrowRight,
  Sparkles,
  Phone,
  Mail,
  Send,
  MessageSquare,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import confetti from 'canvas-confetti';
import { SocialProofTicker } from './SocialProofTicker';
import { ProgressStepper } from './ProgressStepper';
import { ActiveSafetyRecallsBanner } from './ActiveSafetyRecallsBanner';
import { ServicePlan, Coupon, Order } from '../types';
import { INITIAL_SERVICES, INITIAL_COUPONS } from '../data/initialData';
import { validateVinFormat } from '../utils/vinValidator';
import { validateCouponRealTime, calculateDiscount } from '../utils/couponValidator';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';

interface VehicleReportFormProps {
  onBackToHome?: () => void;
  onOpenSample?: () => void;
  onOpenPricing?: () => void;
  onOrderCompleted?: (order: Order) => void;
  services?: ServicePlan[];
  coupons?: Coupon[];
  onOpenTrack?: () => void;
}

const COUNTRIES = [
  'United States',
  'Canada',
  'Pakistan',
  'United Arab Emirates',
  'Saudi Arabia',
  'United Kingdom',
  'Australia',
  'Germany',
  'Other'
];

const MODEL_YEARS = Array.from({ length: 37 }, (_, i) => 2026 - i);

export const VehicleReportForm: React.FC<VehicleReportFormProps> = ({
  onBackToHome,
  onOpenSample,
  onOpenPricing,
  onOrderCompleted,
  services = INITIAL_SERVICES.filter(s => s.active),
  coupons = INITIAL_COUPONS,
  onOpenTrack,
}) => {
  const { showToast } = useToast();

  // Stepper state: 1 = Vehicle Info, 2 = Customer & Package, 3 = Payment & Confirmation
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Step 1: Vehicle Details
  const [vinOrPlate, setVinOrPlate] = useState<string>('');
  const [isVin, setIsVin] = useState<boolean>(true);
  const [make, setMake] = useState<string>('');
  const [model, setModel] = useState<string>('');
  const [year, setYear] = useState<number>(2021);
  const [color, setColor] = useState<string>('White');
  const [mileage, setMileage] = useState<string>('');
  const [country, setCountry] = useState<string>('United States');
  const [vehicleNotes, setVehicleNotes] = useState<string>('');
  const [vinError, setVinError] = useState<string>('');

  // Step 2: Customer Contact & Plan
  const [fullName, setFullName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [preferredContact, setPreferredContact] = useState<'WhatsApp' | 'Email' | 'Phone Call'>('WhatsApp');
  const [selectedPlanId, setSelectedPlanId] = useState<string>('comprehensive-vin');
  const [couponCode, setCouponCode] = useState<string>('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState<string>('');
  const [agreedToTerms, setAgreedToTerms] = useState<boolean>(true);

  // Step 3: Payment
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'qr_code' | 'bank_transfer'>('card');
  const [cardNumber, setCardNumber] = useState<string>('•••• •••• •••• 4242');
  const [cardExpiry, setCardExpiry] = useState<string>('08/28');
  const [cardCvc, setCardCvc] = useState<string>('•••');
  const [proofRef, setProofRef] = useState<string>('');
  const [isSubmittingOrder, setIsSubmittingOrder] = useState<boolean>(false);
  const [isSubmittingProof, setIsSubmittingProof] = useState<boolean>(false);
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
  const [paymentConfirmed, setPaymentConfirmed] = useState<boolean>(false);

  const currentPlan = services.find(s => s.id === selectedPlanId) || services[1] || services[0];
  const subtotal = currentPlan ? currentPlan.price : 28.99;
  const discountAmount = appliedCoupon ? calculateDiscount(appliedCoupon, subtotal) : 0;
  const total = Math.max(0, parseFloat((subtotal - discountAmount).toFixed(2)));

  const handleApplyCoupon = () => {
    const clean = couponCode.trim().toUpperCase();
    if (!clean) {
      setCouponError('Please enter a coupon code.');
      return;
    }
    const val = validateCouponRealTime(clean, subtotal, coupons);
    if (val.isValid && val.coupon) {
      setAppliedCoupon(val.coupon);
      setCouponError('');
      showToast({
        title: 'Coupon Applied!',
        message: `${val.coupon.code} applied successfully.`,
        type: 'success',
        duration: 3500
      });
    } else {
      setCouponError(val.message || 'Invalid coupon code.');
      setAppliedCoupon(null);
    }
  };

  // Step 1 Validation
  const validateStep1 = (): boolean => {
    setVinError('');
    const cleanId = vinOrPlate.trim().toUpperCase();
    if (!cleanId) {
      setVinError(isVin ? 'Please enter a 17-character VIN number.' : 'Please enter a vehicle license plate.');
      return false;
    }
    if (isVin) {
      const val = validateVinFormat(cleanId);
      if (!val.isValid) {
        setVinError(val.message);
        return false;
      }
    }
    if (!make.trim()) {
      showToast({ title: 'Vehicle Make Required', message: 'Please specify the vehicle manufacturer make (e.g. Toyota, Honda, Ford).', type: 'warning' });
      return false;
    }
    if (!model.trim()) {
      showToast({ title: 'Vehicle Model Required', message: 'Please enter the vehicle model (e.g. Camry, Accord, F-150).', type: 'warning' });
      return false;
    }
    return true;
  };

  // Step 2 Validation & Proceed to Payment
  const handleProceedToPayment = async () => {
    if (!fullName.trim() || fullName.trim().length < 2) {
      showToast({ title: 'Name Required', message: 'Please enter your full name.', type: 'warning' });
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      showToast({ title: 'Valid Email Required', message: 'Please enter a valid email address so we can deliver your report.', type: 'warning' });
      return;
    }
    if (!phone.trim() || phone.trim().length < 5) {
      showToast({ title: 'Phone / WhatsApp Required', message: 'Please provide a valid contact number for report delivery updates.', type: 'warning' });
      return;
    }
    if (!agreedToTerms) {
      showToast({ title: 'Terms Agreement Required', message: 'Please accept the service terms to continue.', type: 'warning' });
      return;
    }

    setIsSubmittingOrder(true);

    try {
      const cleanVin = vinOrPlate.trim().toUpperCase();
      const customerEmail = email.trim().toLowerCase();
      const customerName = fullName.trim();

      // Register order directly in backend and MongoDB database
      const orderPayload: Partial<Order> = {
        serviceId: currentPlan.id,
        serviceName: currentPlan.name,
        subtotal,
        discountAmount,
        total,
        couponCode: appliedCoupon ? appliedCoupon.code : undefined,
        customer: {
          fullName: customerName,
          email: customerEmail,
          phone: phone.trim(),
          smsNotifications: true
        },
        smsNotifications: true,
        vehicle: {
          vinOrReg: cleanVin,
          isVin,
          make: make.trim() || 'Verified Vehicle',
          model: model.trim() || 'Model',
          year: year || 2021,
          mileage: mileage.trim() || 'Pending verification',
          countryOrState: country,
          customerNotes: vehicleNotes.trim() ? `Color: ${color}. Notes: ${vehicleNotes.trim()}` : `Color: ${color}`
        },
        payment: {
          status: 'Pending',
          gatewayRef: `Awaiting_${paymentMethod === 'card' ? 'Card' : 'QR_WhatsApp'}`,
          method: paymentMethod === 'card' ? 'Secure Card Payment' : paymentMethod === 'qr_code' ? 'AutoAudit QR Code / WhatsApp Pay' : 'Direct Bank Transfer'
        }
      };

      const serverOrder = await api.createOrder(orderPayload);
      setCreatedOrder(serverOrder);

      if (onOrderCompleted) {
        onOrderCompleted(serverOrder);
      }

      // Store email for auto retrieval
      try {
        localStorage.setItem('autoaudit_customer_email', customerEmail);
      } catch {
        // ignore
      }

      setCurrentStep(3);
      showToast({
        title: 'Order Created in System',
        message: `Order #${serverOrder.orderNumber} recorded in database. Please complete payment below.`,
        type: 'success',
        duration: 5000
      });
    } catch (err: any) {
      showToast({
        title: 'Order Creation Issue',
        message: err?.message || 'Could not register order with backend. Please try again.',
        type: 'error',
        duration: 6000
      });
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  // Step 3 Payment Finalization (Card instant pay)
  const handleFinalizeCardPayment = async () => {
    if (!createdOrder) return;
    setIsSubmittingOrder(true);

    try {
      // Mark order as paid
      const updated = await api.updateOrderPaymentStatus(
        createdOrder.id,
        'Paid',
        `Client paid $${createdOrder.total.toFixed(2)} via instant card checkout.`
      );
      setCreatedOrder(updated);
      setPaymentConfirmed(true);

      if (onOrderCompleted) {
        onOrderCompleted(updated);
      }

      // Notify admin dashboard in real-time
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('autoaudit:payment-confirmed', {
          detail: { order: updated, amount: updated.total }
        }));
      }

      try {
        confetti({
          particleCount: 90,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#10B981', '#2563EB', '#F59E0B', '#FFFFFF']
        });
      } catch {
        // ignore
      }

      showToast({
        title: 'Payment Successful!',
        message: `Payment confirmed for Order #${createdOrder.orderNumber}. Vehicle intelligence audit initialized.`,
        type: 'success',
        duration: 6000
      });
    } catch (err: any) {
      showToast({
        title: 'Payment Error',
        message: err?.message || 'Failed to complete payment. Please try QR payment or WhatsApp.',
        type: 'error'
      });
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  // Step 3 Payment Proof Submission (QR Code or Bank Transfer)
  const handleSubmitProof = async () => {
    if (!createdOrder) return;
    if (!proofRef.trim()) {
      showToast({
        title: 'Transaction Reference Required',
        message: 'Please enter the transaction ID, bank reference, or payment slip number.',
        type: 'warning'
      });
      return;
    }

    setIsSubmittingProof(true);

    try {
      const updated = await api.submitPaymentProof(
        createdOrder.id,
        proofRef.trim(),
        `Customer preferred contact: ${preferredContact} (${phone})`
      );
      setCreatedOrder(updated);
      setPaymentConfirmed(true);

      if (onOrderCompleted) {
        onOrderCompleted(updated);
      }

      // Notify admin dashboard in real-time
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('autoaudit:payment-confirmed', {
          detail: { order: updated, amount: updated.total }
        }));
      }

      try {
        confetti({
          particleCount: 75,
          spread: 60,
          origin: { y: 0.6 }
        });
      } catch {
        // ignore
      }

      showToast({
        title: 'Payment Reference Queued for Verification',
        message: `Admin notified of payment ref: ${proofRef.trim()}. Your report will be released shortly.`,
        type: 'success',
        duration: 6500
      });
    } catch (err: any) {
      showToast({
        title: 'Submission Failed',
        message: err?.message || 'Could not submit payment reference.',
        type: 'error'
      });
    } finally {
      setIsSubmittingProof(false);
    }
  };

  const whatsappMessage = createdOrder
    ? encodeURIComponent(
        `Hi AutoAudit Admin, I just submitted Order #${createdOrder.orderNumber} for VIN: ${createdOrder.vehicle.vinOrReg} (${createdOrder.vehicle.make} ${createdOrder.vehicle.model}). I have sent payment of $${createdOrder.total.toFixed(2)} USD via ${paymentMethod === 'qr_code' ? 'QR Code' : 'Bank Transfer'}. ${proofRef.trim() ? `Transaction Ref: ${proofRef.trim()}` : 'Please confirm payment and dispatch my official report.'}`
      )
    : encodeURIComponent(
        `Hi AutoAudit Admin, I would like to request an official vehicle history report for VIN: ${vinOrPlate || '1HGCM82633A004352'}. Please provide payment instructions.`
      );

  return (
    <div className="min-h-screen bg-[#07111F] text-[#CBD5E1] py-8 sm:py-12 lg:py-16 px-4 sm:px-6 lg:px-8 flex flex-col justify-between selection:bg-[#2563EB] selection:text-white">
      
      {/* Background ambient lighting */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0" aria-hidden="true">
        <div className="absolute inset-0 bg-gradient-to-b from-[#07111F] via-[#0B132B] to-[#07111F]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-[radial-gradient(ellipse_70%_50%_at_50%_0%,rgba(16,185,129,0.12),transparent_70%)]" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto w-full">
        
        {/* Navigation Breadcrumb & Mode Switcher */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          {onBackToHome ? (
            <button
              type="button"
              onClick={onBackToHome}
              className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#CBD5E1] hover:text-white bg-[#0F1B2D] hover:bg-[#162740] px-3.5 py-2 rounded-[8px] border border-[rgba(148,163,184,0.20)] transition-all cursor-pointer group"
            >
              <ArrowLeft className="w-4 h-4 text-[#10B981] group-hover:-translate-x-0.5 transition-transform" />
              <span>Back to Homepage</span>
            </button>
          ) : (
            <a
              href="/"
              className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#CBD5E1] hover:text-white bg-[#0F1B2D] hover:bg-[#162740] px-3.5 py-2 rounded-[8px] border border-[rgba(148,163,184,0.20)] transition-all group"
            >
              <ArrowLeft className="w-4 h-4 text-[#10B981] group-hover:-translate-x-0.5 transition-transform" />
              <span>Back to Homepage</span>
            </a>
          )}

          {onOpenSample && (
            <button
              type="button"
              onClick={onOpenSample}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1.5 cursor-pointer ml-auto"
            >
              <FileCheck className="w-3.5 h-3.5" />
              <span>View Sample Report</span>
            </button>
          )}
        </div>

        {/* Active NHTSA Safety Recalls Banner */}
        <ActiveSafetyRecallsBanner />

        {/* Real-Time Social Proof Ticker */}
        <div className="mb-6">
          <SocialProofTicker />
        </div>

        {/* Branded Header Container */}
        <div className="text-center space-y-4 mb-6 sm:mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0F1B2D] border border-[rgba(148,163,184,0.20)] text-xs font-bold text-[#10B981] tracking-wider uppercase shadow-xs">
            <ShieldCheck className="w-3.5 h-3.5 text-[#10B981]" />
            <span>Direct Vehicle Intelligence & Payment Checkout</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-extrabold tracking-[-1.2px] text-white leading-tight">
            Request Your Certified Vehicle History Report
          </h1>

          <p className="text-sm sm:text-base text-[#CBD5E1] max-w-2xl mx-auto leading-relaxed">
            Enter your vehicle details, select your report package, and proceed directly to payment. Orders are instantly logged into our operations system for rapid delivery.
          </p>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs text-slate-400">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
              <span>Instant Database Order Log</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
              <span>QR Code & Card Payments</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-[#10B981]" />
              <span>256-Bit SSL Encrypted</span>
            </div>
          </div>
        </div>

        {/* Progress Stepper for Form */}
        <div className="mb-6">
          <div className="bg-[#0F1B2D] border border-slate-800 rounded-xl p-3 flex items-center justify-between text-xs sm:text-sm font-semibold">
              <button
                type="button"
                onClick={() => currentStep > 1 && !paymentConfirmed && setCurrentStep(1)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
                  currentStep === 1
                    ? 'bg-blue-600 text-white font-bold'
                    : currentStep > 1
                    ? 'text-emerald-400 hover:bg-slate-800 cursor-pointer'
                    : 'text-slate-500'
                }`}
              >
                <span className="w-5 h-5 rounded-full bg-black/30 flex items-center justify-center text-xs">1</span>
                <span>Vehicle Details</span>
              </button>
              <div className="w-8 sm:w-16 h-0.5 bg-slate-800 hidden sm:block" />
              <button
                type="button"
                onClick={() => currentStep > 2 && !paymentConfirmed && setCurrentStep(2)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
                  currentStep === 2
                    ? 'bg-blue-600 text-white font-bold'
                    : currentStep > 2
                    ? 'text-emerald-400 hover:bg-slate-800 cursor-pointer'
                    : 'text-slate-500'
                }`}
              >
                <span className="w-5 h-5 rounded-full bg-black/30 flex items-center justify-center text-xs">2</span>
                <span>Customer & Plan</span>
              </button>
              <div className="w-8 sm:w-16 h-0.5 bg-slate-800 hidden sm:block" />
              <div
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
                  currentStep === 3
                    ? 'bg-blue-600 text-white font-bold'
                    : 'text-slate-500'
                }`}
              >
                <span className="w-5 h-5 rounded-full bg-black/30 flex items-center justify-center text-xs">3</span>
                <span>Payment & Release</span>
              </div>
            </div>
          </div>
        </div>

        {/* NATIVE AUTOAUDIT VEHICLE FORM & PAYMENT CHECKOUT */}
        <div className="bg-[#0F1B2D] border border-[rgba(148,163,184,0.20)] rounded-[16px] shadow-2xl p-6 sm:p-8 space-y-6">
            
            {/* STEP 1: VEHICLE DETAILS */}
            {currentStep === 1 && (
              <div className="space-y-6 animate-fadeIn">
                <div className="border-b border-slate-800 pb-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <Car className="w-5 h-5 text-emerald-400" />
                      <span>Step 1: Vehicle Specifications</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Enter the 17-character VIN or registration plate to query federal NMVTIS and insurance records.
                    </p>
                  </div>
                  <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-1 rounded-full">
                    Step 1 of 3
                  </span>
                </div>

                {/* VIN vs Plate Toggle */}
                <div className="flex rounded-lg bg-[#0B132B] p-1 w-full max-w-xs border border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setIsVin(true);
                      setVinError('');
                    }}
                    className={`flex-1 py-1.5 rounded-md font-semibold text-xs transition-colors cursor-pointer ${
                      isVin ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    17-Digit VIN
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsVin(false);
                      setVinError('');
                    }}
                    className={`flex-1 py-1.5 rounded-md font-semibold text-xs transition-colors cursor-pointer ${
                      !isVin ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    License Plate
                  </button>
                </div>

                {/* VIN Input with validation */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-300">
                      {isVin ? '17-Character VIN Number *' : 'License / Registration Plate *'}
                    </label>
                    {isVin && vinOrPlate.trim().length > 0 && (
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                        vinOrPlate.trim().length === 17 && !/[IOQ]/i.test(vinOrPlate)
                          ? 'bg-emerald-950 text-emerald-400 border-emerald-600/50'
                          : 'bg-rose-950 text-rose-300 border-rose-800'
                      }`}>
                        {vinOrPlate.trim().length}/17 {vinOrPlate.trim().length === 17 && !/[IOQ]/i.test(vinOrPlate) ? '✓ Valid Length' : ''}
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    value={vinOrPlate}
                    onChange={(e) => {
                      setVinOrPlate(e.target.value.toUpperCase());
                      setVinError('');
                    }}
                    placeholder={isVin ? "e.g. 1HGCM82633A004352" : "e.g. LEA-21-4920"}
                    maxLength={isVin ? 17 : 20}
                    className="w-full h-12 px-4 bg-[#0B132B] border border-slate-700 rounded-xl text-white font-mono text-sm sm:text-base focus:outline-none focus:border-blue-500 transition-colors uppercase"
                  />
                  {vinError && (
                    <p className="text-xs text-rose-400 flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{vinError}</span>
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-slate-400">
                    <span>Quick Fill Examples:</span>
                    <button
                      type="button"
                      onClick={() => {
                        setVinOrPlate('1HGCR2F83HA029381');
                        setIsVin(true);
                        setMake('Honda');
                        setModel('Accord EX-L');
                        setYear(2017);
                      }}
                      className="text-blue-400 hover:underline font-mono"
                    >
                      Honda Accord (1HGCR2F8...)
                    </button>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={() => {
                        setVinOrPlate('4T1B11HK5JU192837');
                        setIsVin(true);
                        setMake('Toyota');
                        setModel('Camry SE');
                        setYear(2018);
                      }}
                      className="text-blue-400 hover:underline font-mono"
                    >
                      Toyota Camry (4T1B11HK...)
                    </button>
                  </div>
                </div>

                {/* Make, Model, Year Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">Vehicle Make *</label>
                    <input
                      type="text"
                      value={make}
                      onChange={(e) => setMake(e.target.value)}
                      placeholder="e.g. Toyota, Honda, BMW"
                      className="w-full h-11 px-3.5 bg-[#0B132B] border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">Vehicle Model *</label>
                    <input
                      type="text"
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      placeholder="e.g. Camry, Civic, 330i"
                      className="w-full h-11 px-3.5 bg-[#0B132B] border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">Model Year *</label>
                    <select
                      value={year}
                      onChange={(e) => setYear(Number(e.target.value))}
                      className="w-full h-11 px-3 bg-[#0B132B] border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500 cursor-pointer"
                    >
                      {MODEL_YEARS.map(yr => (
                        <option key={yr} value={yr}>{yr}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Mileage, Color, Country */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">Current Odometer Mileage</label>
                    <input
                      type="text"
                      value={mileage}
                      onChange={(e) => setMileage(e.target.value)}
                      placeholder="e.g. 54,000 miles"
                      className="w-full h-11 px-3.5 bg-[#0B132B] border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">Vehicle Color</label>
                    <input
                      type="text"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      placeholder="e.g. White, Black, Silver"
                      className="w-full h-11 px-3.5 bg-[#0B132B] border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">Registration Country</label>
                    <select
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="w-full h-11 px-3 bg-[#0B132B] border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500 cursor-pointer"
                    >
                      {COUNTRIES.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Additional Notes */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Additional Instructions / Notes (Optional)</label>
                  <textarea
                    rows={2}
                    value={vehicleNotes}
                    onChange={(e) => setVehicleNotes(e.target.value)}
                    placeholder="Specific items to verify (e.g. auction photos, salvage flood title, previous owner count)..."
                    className="w-full p-3 bg-[#0B132B] border border-slate-700 rounded-xl text-white text-xs sm:text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Proceed to Step 2 Button */}
                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      if (validateStep1()) {
                        setCurrentStep(2);
                        window.scrollTo({ top: 300, behavior: 'smooth' });
                      }
                    }}
                    className="w-full sm:w-auto px-8 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Next: Select Report Package & Contact</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: CUSTOMER CONTACT & PACKAGE SELECTION */}
            {currentStep === 2 && (
              <div className="space-y-6 animate-fadeIn">
                <div className="border-b border-slate-800 pb-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <Mail className="w-5 h-5 text-blue-400" />
                      <span>Step 2: Choose Report Plan & Customer Details</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Select your inspection depth. The completed report and NMVTIS verification will be dispatched to your contact details.
                    </p>
                  </div>
                  <span className="text-xs font-mono text-blue-400 bg-blue-950/60 border border-blue-500/30 px-2.5 py-1 rounded-full">
                    Step 2 of 3
                  </span>
                </div>

                {/* Report Package Selection Cards */}
                <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-300 block">Select Report Tier</label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {services.map(plan => {
                      const isSelected = plan.id === selectedPlanId;
                      return (
                        <div
                          key={plan.id}
                          onClick={() => setSelectedPlanId(plan.id)}
                          className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                            isSelected
                              ? 'border-blue-500 bg-blue-950/40 shadow-lg ring-1 ring-blue-500/40'
                              : 'border-slate-800 bg-[#0B132B] hover:border-slate-700'
                          }`}
                        >
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-sm text-white">{plan.name}</span>
                              {isSelected ? (
                                <div className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center">
                                  <Check className="w-3 h-3 stroke-[3]" />
                                </div>
                              ) : (
                                <div className="w-5 h-5 rounded-full border border-slate-700" />
                              )}
                            </div>
                            <div className="flex items-baseline gap-1">
                              <span className="text-2xl font-black text-white">${plan.price.toFixed(2)}</span>
                              <span className="text-xs text-slate-400">USD</span>
                            </div>
                            <p className="text-xs text-slate-400 leading-snug">{plan.tagline}</p>
                            <span className="inline-block text-[10px] font-semibold text-emerald-400 bg-emerald-950/50 border border-emerald-500/30 px-2 py-0.5 rounded">
                              {plan.deliveryTime}
                            </span>
                          </div>
                          <div className="pt-3 mt-3 border-t border-slate-800/80 text-[11px] text-slate-400 space-y-1">
                            {plan.includedItems.slice(0, 3).map((item, i) => (
                              <div key={i} className="flex items-center gap-1.5">
                                <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                                <span className="truncate">{item}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Customer Contact Details Grid */}
                <div className="space-y-4 pt-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300">Your Full Name *</label>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. Michael Smith"
                        className="w-full h-11 px-3.5 bg-[#0B132B] border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300">Delivery Email Address *</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@example.com"
                        className="w-full h-11 px-3.5 bg-[#0B132B] border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300">Mobile Phone / WhatsApp *</label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="e.g. +1 (555) 234-5678 or +92 300 1234567"
                        className="w-full h-11 px-3.5 bg-[#0B132B] border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300">Preferred Delivery & Update Method</label>
                      <select
                        value={preferredContact}
                        onChange={(e: any) => setPreferredContact(e.target.value)}
                        className="w-full h-11 px-3 bg-[#0B132B] border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500 cursor-pointer"
                      >
                        <option value="WhatsApp">WhatsApp (Fastest Delivery)</option>
                        <option value="Email">Email Only</option>
                        <option value="Phone Call">Phone Call</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Promo Code & Summary Bar */}
                <div className="p-4 bg-[#0B132B] rounded-xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      placeholder="Promo Code (e.g. FAKHAR20)"
                      className="h-10 px-3 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-white uppercase focus:outline-none focus:border-blue-500 w-full sm:w-48"
                    />
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      className="h-10 px-4 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer shrink-0"
                    >
                      Apply
                    </button>
                  </div>

                  <div className="text-right w-full sm:w-auto">
                    <div className="text-xs text-slate-400">
                      Subtotal: <span className="line-through">${subtotal.toFixed(2)}</span>
                      {discountAmount > 0 && (
                        <span className="text-emerald-400 ml-2 font-bold">-${discountAmount.toFixed(2)}</span>
                      )}
                    </div>
                    <div className="text-xl font-black text-white">
                      Total: <span className="text-emerald-400">${total.toFixed(2)} USD</span>
                    </div>
                  </div>
                </div>
                {couponError && <p className="text-xs text-rose-400">{couponError}</p>}

                {/* Terms checkbox */}
                <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-400">
                  <input
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 shrink-0"
                  />
                  <span>
                    I authorize AutoAudit to query NMVTIS clearinghouses and DMV title registries for vehicle VIN <strong>{vinOrPlate}</strong> and agree to terms of service.
                  </span>
                </label>

                {/* Buttons: Back and Proceed to Payment */}
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="w-full sm:w-auto px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
                  >
                    ← Back to Vehicle Details
                  </button>

                  <button
                    type="button"
                    disabled={isSubmittingOrder}
                    onClick={handleProceedToPayment}
                    className="w-full sm:w-auto px-8 py-3.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isSubmittingOrder ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Registering Order in System...</span>
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4" />
                        <span>Proceed Directly to Payment (${total.toFixed(2)}) →</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: DIRECT PAYMENT & CONFIRMATION */}
            {currentStep === 3 && createdOrder && (
              <div className="space-y-6 animate-fadeIn">
                
                {/* Order Registered Banner */}
                <div className="p-4 bg-emerald-950/60 border border-emerald-500/40 rounded-xl flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-sm">
                        Order #{createdOrder.orderNumber} Registered in AutoAudit Database
                      </h4>
                      <p className="text-xs text-slate-400">
                        {createdOrder.vehicle.year} {createdOrder.vehicle.make} {createdOrder.vehicle.model} (VIN: {createdOrder.vehicle.vinOrReg}) · {createdOrder.customer.fullName}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-400 block">Total Due:</span>
                    <span className="text-xl font-black text-emerald-400">${createdOrder.total.toFixed(2)} USD</span>
                  </div>
                </div>

                {!paymentConfirmed ? (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-base font-bold text-white">Select Your Payment Method</h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Choose your preferred payment method below. Your order has been placed in our admin system; once paid, the report will be generated and delivered.
                      </p>
                    </div>

                    {/* Payment Method Selector Tabs */}
                    <div className="grid grid-cols-3 gap-2.5">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('card')}
                        className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          paymentMethod === 'card'
                            ? 'bg-blue-600/20 border-blue-500 text-white font-bold ring-1 ring-blue-500'
                            : 'bg-[#0B132B] border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        <CreditCard className="w-5 h-5 text-blue-400" />
                        <span className="text-xs">Credit / Debit Card</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentMethod('qr_code')}
                        className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          paymentMethod === 'qr_code'
                            ? 'bg-emerald-600/20 border-emerald-500 text-white font-bold ring-1 ring-emerald-500'
                            : 'bg-[#0B132B] border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        <QrCode className="w-5 h-5 text-emerald-400" />
                        <span className="text-xs">QR Code / WhatsApp</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentMethod('bank_transfer')}
                        className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          paymentMethod === 'bank_transfer'
                            ? 'bg-purple-600/20 border-purple-500 text-white font-bold ring-1 ring-purple-500'
                            : 'bg-[#0B132B] border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        <Building className="w-5 h-5 text-purple-400" />
                        <span className="text-xs">Direct Bank Transfer</span>
                      </button>
                    </div>

                    {/* PAYMENT METHOD 1: CARD CHECKOUT */}
                    {paymentMethod === 'card' && (
                      <div className="bg-[#0B132B] p-5 rounded-xl border border-slate-800 space-y-4">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                          <span className="font-bold text-xs text-white">Instant Card Checkout</span>
                          <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                            <Lock className="w-3.5 h-3.5" /> 256-Bit SSL Encrypted
                          </span>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs text-slate-400 block">Card Number</label>
                          <input
                            type="text"
                            value={cardNumber}
                            onChange={(e) => setCardNumber(e.target.value)}
                            placeholder="•••• •••• •••• 4242"
                            className="w-full h-11 px-3.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-blue-500"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <label className="text-xs text-slate-400 block">Expiry (MM/YY)</label>
                            <input
                              type="text"
                              value={cardExpiry}
                              onChange={(e) => setCardExpiry(e.target.value)}
                              placeholder="08/28"
                              className="w-full h-11 px-3.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-blue-500"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs text-slate-400 block">Security CVC</label>
                            <input
                              type="text"
                              value={cardCvc}
                              onChange={(e) => setCardCvc(e.target.value)}
                              placeholder="•••"
                              maxLength={4}
                              className="w-full h-11 px-3.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-blue-500"
                            />
                          </div>
                        </div>

                        <button
                          type="button"
                          disabled={isSubmittingOrder}
                          onClick={handleFinalizeCardPayment}
                          className="w-full h-12 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                        >
                          {isSubmittingOrder ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Processing Secure Payment...</span>
                            </>
                          ) : (
                            <>
                              <Lock className="w-4 h-4" />
                              <span>Pay ${createdOrder.total.toFixed(2)} USD & Dispatch Report</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}

                    {/* PAYMENT METHOD 2: QR CODE & WHATSAPP DIRECT PAYMENT */}
                    {paymentMethod === 'qr_code' && (
                      <div className="bg-[#0B132B] p-5 sm:p-6 rounded-xl border border-emerald-500/30 space-y-5">
                        <div className="flex flex-col sm:flex-row items-center gap-5">
                          <div className="p-3 bg-white rounded-xl shadow-lg shrink-0">
                            <QRCodeSVG
                              value={`https://wa.me/923420617217?text=${whatsappMessage}`}
                              size={140}
                              level="H"
                              includeMargin={true}
                            />
                          </div>

                          <div className="space-y-2 text-center sm:text-left flex-1">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-500/40">
                              Official AutoAudit QR Code
                            </span>
                            <h4 className="text-base font-bold text-white">
                              Scan QR to Pay or Verify via WhatsApp
                            </h4>
                            <p className="text-xs text-slate-300 leading-relaxed">
                              Scan the QR code with your phone camera or banking app to open WhatsApp with your pre-filled Order Reference <strong>#{createdOrder.orderNumber}</strong>.
                            </p>
                            <div className="text-xs text-emerald-400 font-mono font-bold">
                              WhatsApp / Mobile: +92 342 0617217
                            </div>
                          </div>
                        </div>

                        {/* Transaction ID Submission */}
                        <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800 space-y-3">
                          <label className="text-xs font-bold text-white block">
                            Have you made the payment? Submit your transaction ID / payment reference:
                          </label>
                          <div className="flex flex-col sm:flex-row gap-2">
                            <input
                              type="text"
                              value={proofRef}
                              onChange={(e) => setProofRef(e.target.value)}
                              placeholder="e.g. TXN-948201 or Bank Transfer ID"
                              className="flex-1 h-11 px-3.5 bg-black/40 border border-slate-700 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-emerald-500"
                            />
                            <button
                              type="button"
                              disabled={isSubmittingProof}
                              onClick={handleSubmitProof}
                              className="h-11 px-6 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer shrink-0 flex items-center justify-center gap-2"
                            >
                              {isSubmittingProof ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                              <span>Submit Payment Reference</span>
                            </button>
                          </div>
                        </div>

                        {/* Direct WhatsApp Confirmation Button */}
                        <a
                          href={`https://wa.me/923420617217?text=${whatsappMessage}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full h-12 bg-[#25D366] hover:bg-[#20BA5A] text-slate-950 font-bold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
                        >
                          <MessageSquare className="w-4 h-4 fill-slate-950" />
                          <span>Open WhatsApp to Confirm Payment (+92 342 0617217)</span>
                        </a>
                      </div>
                    )}

                    {/* PAYMENT METHOD 3: DIRECT BANK TRANSFER */}
                    {paymentMethod === 'bank_transfer' && (
                      <div className="bg-[#0B132B] p-5 sm:p-6 rounded-xl border border-slate-800 space-y-4">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                          <span className="font-bold text-xs text-white">Bank Account Details</span>
                          <span className="text-xs text-purple-400 font-bold">AutoAudit Global Banking</span>
                        </div>

                        <div className="p-3 bg-slate-900 rounded-xl text-xs space-y-2 font-mono">
                          <div><span className="text-slate-400">Account Title:</span> <span className="text-white font-bold">AutoAudit Intelligence</span></div>
                          <div><span className="text-slate-400">Reference:</span> <span className="text-emerald-400 font-bold">#{createdOrder.orderNumber}</span></div>
                          <div><span className="text-slate-400">Direct Deposit / Raast / IBAN:</span> <span className="text-blue-400">PKR / USD Multi-Currency Wire Available</span></div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs font-bold text-white block">Enter Bank Deposit Slip / Reference Number:</label>
                          <div className="flex flex-col sm:flex-row gap-2">
                            <input
                              type="text"
                              value={proofRef}
                              onChange={(e) => setProofRef(e.target.value)}
                              placeholder="e.g. IBAN-TXN-83921"
                              className="flex-1 h-11 px-3.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-purple-500"
                            />
                            <button
                              type="button"
                              disabled={isSubmittingProof}
                              onClick={handleSubmitProof}
                              className="h-11 px-6 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer shrink-0"
                            >
                              Submit Slip Proof
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                  </div>
                ) : (
                  /* PAYMENT CONFIRMED / PROOF SUBMITTED SUCCESS STATE */
                  <div className="p-6 bg-[#0B132B] rounded-2xl border border-emerald-500/40 text-center space-y-4 animate-fadeIn">
                    <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500 text-emerald-400 flex items-center justify-center mx-auto">
                      <Check className="w-8 h-8 stroke-[3]" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-2xl font-black text-white">Thank You for Choosing AutoAudit!</h3>
                      <p className="text-sm text-slate-300 max-w-md mx-auto">
                        Your request has been successfully queued in our operations console.
                      </p>
                    </div>

                    <div className="inline-block px-4 py-2 bg-slate-900 border border-slate-800 rounded-full text-xs text-slate-300 font-mono">
                      Order Reference: <strong className="text-emerald-400">#{createdOrder.orderNumber}</strong> · VIN: <strong className="text-white">{createdOrder.vehicle.vinOrReg}</strong>
                    </div>

                    <div className="p-4 bg-slate-900/60 rounded-xl max-w-lg mx-auto text-left text-xs space-y-1.5 text-slate-300">
                      <div>• <strong>Customer:</strong> {createdOrder.customer.fullName} ({createdOrder.customer.email})</div>
                      <div>• <strong>Vehicle:</strong> {createdOrder.vehicle.year} {createdOrder.vehicle.make} {createdOrder.vehicle.model}</div>
                      <div>• <strong>Estimated Delivery:</strong> 15–30 minutes directly to your email & WhatsApp</div>
                      <div>• <strong>Payment Status:</strong> <span className="text-emerald-400 font-bold">{createdOrder.payment.status === 'Paid' ? 'Verified Paid' : 'Verification Queued'}</span></div>
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                      {onOpenTrack && (
                        <button
                          type="button"
                          onClick={onOpenTrack}
                          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl transition-colors cursor-pointer"
                        >
                          Track Order Status
                        </button>
                      )}

                      <a
                        href={`https://wa.me/923420617217?text=${whatsappMessage}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-6 py-2.5 bg-[#25D366] hover:bg-[#20BA5A] text-slate-950 font-bold text-xs rounded-xl transition-colors inline-flex items-center gap-1.5"
                      >
                        <MessageSquare className="w-3.5 h-3.5 fill-slate-950" />
                        <span>Chat with Specialist on WhatsApp</span>
                      </a>
                    </div>
                  </div>
                )}

              </div>
            )}

          </div>

        {/* Alternative Actions Bar */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-[12px] bg-[#0F1B2D]/60 border border-[rgba(148,163,184,0.15)] text-xs">
          <div className="text-slate-400 text-center sm:text-left">
            Have questions about vehicle records or need a fleet quote?
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            {onOpenPricing && (
              <button
                type="button"
                onClick={onOpenPricing}
                className="px-3.5 py-1.5 rounded-[8px] bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold transition-colors cursor-pointer"
              >
                View Report Packages
              </button>
            )}
            {onOpenSample && (
              <button
                type="button"
                onClick={onOpenSample}
                className="px-3.5 py-1.5 rounded-[8px] bg-[#0B132B] hover:bg-[#162740] text-[#CBD5E1] border border-[rgba(148,163,184,0.20)] font-medium transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <FileCheck className="w-3.5 h-3.5 text-[#10B981]" />
                <span>View Sample Report</span>
              </button>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
