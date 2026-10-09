import React, { useState } from 'react';
import { 
  X, 
  FileText, 
  CheckCircle2, 
  Car, 
  User, 
  FileCheck, 
  ShieldCheck, 
  Upload, 
  Download, 
  Sparkles, 
  Loader2, 
  AlertCircle,
  ExternalLink,
  QrCode,
  Clock,
  Send,
  HelpCircle,
  Check
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import confetti from 'canvas-confetti';
import { CustomerIntakeSubmission } from '../types';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';

interface CustomerIntakeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenReportDownload?: (vin: string, vehicleTitle: string, orderNumber: string) => void;
  onOpenLegal?: (tab: 'terms' | 'privacy') => void;
  initialVin?: string;
}

const COUNTRIES = [
  'Pakistan',
  'United Arab Emirates',
  'Saudi Arabia',
  'United Kingdom',
  'United States',
  'Canada',
  'Australia',
  'Other'
];

const COLORS = [
  'Black',
  'White',
  'Silver',
  'Grey',
  'Blue',
  'Red',
  'Green',
  'Brown',
  'Gold',
  'Other',
  'Unknown'
];

const REPORT_TYPES = [
  'Complete Vehicle History Report',
  'Accident / Damage History',
  'Ownership History',
  'Mileage Verification',
  'Theft / Stolen Vehicle Check',
  'Registration History',
  'Import / Export History',
  'Other'
];

const REASONS = [
  'Considering purchasing a vehicle',
  'Verifying a vehicle I already own',
  'Selling a vehicle',
  'Dealer / Business Verification',
  'Insurance / Documentation',
  'Personal Records',
  'Other'
];

const PURCHASE_STATUSES = [
  'Planning to purchase',
  'Already purchased',
  'Currently selling',
  'Already owned',
  'Just checking vehicle history',
  'Other'
];

// Model years from 2026 down to 1990
const MODEL_YEARS = Array.from({ length: 37 }, (_, i) => 2026 - i);

export const CustomerIntakeModal: React.FC<CustomerIntakeModalProps> = ({
  isOpen,
  onClose,
  onOpenReportDownload,
  onOpenLegal,
  initialVin = ''
}) => {
  const { showToast } = useToast();

  // Active section tab for clean stepper navigation
  const [activeTab, setActiveTab] = useState<number>(1);

  // Form fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('Pakistan');
  const [preferredContactMethod, setPreferredContactMethod] = useState<'Email' | 'Phone Call' | 'WhatsApp'>('WhatsApp');

  const [vinOrChassis, setVinOrChassis] = useState(initialVin);
  const [registrationPlate, setRegistrationPlate] = useState('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [modelYear, setModelYear] = useState<number>(2022);
  const [vehicleColor, setVehicleColor] = useState('White');
  const [currentMileage, setCurrentMileage] = useState('');
  const [countryOfRegistration, setCountryOfRegistration] = useState('United States');

  const [reportType, setReportType] = useState('Complete Vehicle History Report');
  const [reasonForRequest, setReasonForRequest] = useState('Considering purchasing a vehicle');
  const [purchaseStatus, setPurchaseStatus] = useState('Planning to purchase');

  const [additionalNotes, setAdditionalNotes] = useState('');
  const [uploadedFile, setUploadedFile] = useState<{ name: string; size: string } | null>(null);

  const [accuracyConfirmed, setAccuracyConfirmed] = useState(false);
  const [dataUsageConsent, setDataUsageConsent] = useState(false);
  const [termsAgreed, setTermsAgreed] = useState(false);

  // Auto-generate feature toggle (Recommended by default)
  const [autoGenerateReport, setAutoGenerateReport] = useState(true);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedData, setSubmittedData] = useState<{
    submission: CustomerIntakeSubmission;
    reportDownloadUrl?: string;
    orderNumber?: string;
  } | null>(null);

  // Sync initial VIN when modal opens
  React.useEffect(() => {
    if (initialVin) {
      setVinOrChassis(initialVin.toUpperCase());
    }
  }, [initialVin]);

  if (!isOpen) return null;

  const triggerCelebration = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FB2C36', '#2563EB', '#059669', '#F59E0B', '#0B132B']
      });
    } catch {
      // fallback
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      showToast({
        type: 'warning',
        title: 'File Too Large',
        message: 'Maximum allowed file size is 10 MB.',
        duration: 4000
      });
      return;
    }

    const sizeFormatted = (file.size / (1024 * 1024)).toFixed(1) + ' MB';
    setUploadedFile({ name: file.name, size: sizeFormatted });
    showToast({
      type: 'success',
      title: 'Document Attached',
      message: `${file.name} (${sizeFormatted}) ready for submission.`,
      duration: 3500
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Client validation
    if (!fullName.trim() || !email.trim() || !phone.trim() || !country) {
      setActiveTab(1);
      showToast({
        type: 'warning',
        title: 'Customer Information Incomplete',
        message: 'Please complete all required fields in Section 1.',
        duration: 4000
      });
      return;
    }

    if (!vinOrChassis.trim() || !registrationPlate.trim() || !make.trim() || !model.trim()) {
      setActiveTab(2);
      showToast({
        type: 'warning',
        title: 'Vehicle Information Incomplete',
        message: 'Please provide VIN, Registration Plate, Make, and Model in Section 2.',
        duration: 4000
      });
      return;
    }

    if (!accuracyConfirmed || !dataUsageConsent || !termsAgreed) {
      setActiveTab(5);
      showToast({
        type: 'warning',
        title: 'Customer Consent Required',
        message: 'Please review and accept all 3 consent items in Section 5.',
        duration: 4500
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        country,
        preferredContactMethod,
        vinOrChassis: vinOrChassis.trim().toUpperCase(),
        registrationPlate: registrationPlate.trim().toUpperCase(),
        make: make.trim(),
        model: model.trim(),
        modelYear,
        vehicleColor,
        currentMileage: currentMileage.trim() || 'Pending verification',
        countryOfRegistration,
        reportType,
        reasonForRequest,
        purchaseStatus,
        additionalNotes: additionalNotes.trim(),
        documentFileName: uploadedFile?.name,
        documentFileSize: uploadedFile?.size,
        accuracyConfirmed,
        dataUsageConsent,
        termsAgreed,
        autoGenerateReport
      };

      const res = await api.submitIntakeForm(payload);

      if (res.success && res.data) {
        setSubmittedData({
          submission: res.data.submission,
          reportDownloadUrl: res.data.reportDownloadUrl,
          orderNumber: res.data.order?.orderNumber
        });

        triggerCelebration();

        showToast({
          type: 'success',
          title: 'Request Submitted Successfully!',
          message: autoGenerateReport 
            ? 'Official dummy report PDF generated and ready for instant download.' 
            : 'Our verification team has received your vehicle details.',
          duration: 6000
        });
      }
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Submission Failed',
        message: err?.message || 'Could not submit intake form. Please check your connection.',
        duration: 5000
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setSubmittedData(null);
    setActiveTab(1);
    setFullName('');
    setEmail('');
    setPhone('');
    setVinOrChassis('');
    setRegistrationPlate('');
    setMake('');
    setModel('');
    setUploadedFile(null);
    setAccuracyConfirmed(false);
    setDataUsageConsent(false);
    setTermsAgreed(false);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
      <div 
        className="relative bg-white rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden border border-slate-200 flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#0B132B] px-6 py-5 text-white flex items-start justify-between relative border-b border-slate-800">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                Official Customer Data Form
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" /> Auto-Generate Supported
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
              AutoAudit Customer Data Form
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-xl">
              Customer-ready intake form for vehicle history report requests and certified NMVTIS record verification.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800/80 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/50">

          {/* SUCCESS STATE */}
          {submittedData ? (
            <div className="space-y-6 py-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center space-y-3">
                <div className="w-16 h-16 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto shadow-md">
                  <Check className="w-8 h-8 stroke-[3]" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900">
                  Thank You for Choosing AutoAudit!
                </h3>
                <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                  Your vehicle history report request has been successfully submitted. Our team will review the information provided and contact you using your preferred contact method.
                </p>
                <div className="inline-block px-4 py-1.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold">
                  Reference ID: <span className="font-mono font-bold">{submittedData.submission.submissionNumber}</span>
                  {submittedData.orderNumber && (
                    <span className="ml-2 pl-2 border-l border-emerald-300">
                      Order: <span className="font-mono font-bold">{submittedData.orderNumber}</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Vehicle & Customer Summary */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 space-y-3 shadow-xs">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Request Summary
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500">Customer:</span>{' '}
                    <span className="font-semibold text-slate-800">{submittedData.submission.fullName}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Preferred Contact:</span>{' '}
                    <span className="font-semibold text-slate-800">{submittedData.submission.preferredContactMethod} ({submittedData.submission.phone})</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Vehicle:</span>{' '}
                    <span className="font-semibold text-slate-800">
                      {submittedData.submission.modelYear} {submittedData.submission.make} {submittedData.submission.model}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">VIN / Chassis:</span>{' '}
                    <span className="font-mono font-semibold text-slate-800">{submittedData.submission.vinOrChassis}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Registration Plate:</span>{' '}
                    <span className="font-mono font-semibold text-slate-800">{submittedData.submission.registrationPlate}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Report Type:</span>{' '}
                    <span className="font-semibold text-slate-800">{submittedData.submission.reportType}</span>
                  </div>
                </div>
              </div>

              {/* Admin Fulfillment & Payment Verification Notice */}
              <div className="space-y-3 pt-2 text-left">
                <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-blue-900">
                    <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Admin Fulfillment & Payment Protection Notice</span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    Your request has been forwarded directly to the <strong>AutoAudit Admin Operations Console</strong>. To protect records integrity, complete official vehicle history reports are compiled and dispatched directly by AutoAudit Administration upon payment confirmation.
                  </p>
                  <div className="flex items-center gap-1.5 text-[11px] text-blue-800 bg-blue-100/60 px-2.5 py-1.5 rounded-lg font-medium">
                    <span>Reference ID:</span>
                    <span className="font-mono font-bold text-slate-900">#{submittedData.orderNumber || submittedData.submission.submissionNumber}</span>
                    <span className="mx-1">•</span>
                    <span>Status: Pending Admin Payment Verification</span>
                  </div>
                </div>

                <a
                  href={`https://wa.me/923420617217?text=${encodeURIComponent(`Hi AutoAudit Admin, I submitted report request #${submittedData.submission.submissionNumber} for VIN: ${submittedData.submission.vinOrChassis} (${submittedData.submission.make} ${submittedData.submission.model}). Please send payment details so I can receive my official certified report.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer text-xs sm:text-sm"
                >
                  <QrCode className="w-5 h-5 shrink-0" />
                  <span>Chat with Admin on WhatsApp to Pay & Receive Report</span>
                </a>
              </div>

                {/* WhatsApp QR Code Card */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
                  <div className="p-2.5 bg-white rounded-xl shadow-xs border border-slate-200 shrink-0">
                    <QRCodeSVG
                      value={`https://wa.me/923420617217?text=${encodeURIComponent(`Hi AutoAudit, I just submitted an intake report request #${submittedData.submission.submissionNumber} for VIN: ${submittedData.submission.vinOrChassis}.`)}`}
                      size={120}
                      level="H"
                      includeMargin={true}
                    />
                  </div>
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs font-bold text-slate-900">
                      <QrCode className="w-4 h-4 text-emerald-600" />
                      <span>WhatsApp QR Code: 03420617217</span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Scan with your mobile camera or WhatsApp to track your submission or chat with our auditors immediately.
                    </p>
                    <div className="pt-0.5">
                      <span className="text-[10px] font-mono text-emerald-800 bg-emerald-100/60 py-0.5 px-2 rounded font-semibold inline-block">
                        Helpline: 03420617217 (+92 342 0617217)
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <a
                    href={`https://wa.me/923420617217?text=${encodeURIComponent(`Hi AutoAudit, I just submitted an intake report request #${submittedData.submission.submissionNumber} for VIN: ${submittedData.submission.vinOrChassis}.`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-sm"
                  >
                    <QrCode className="w-4 h-4" />
                    Open WhatsApp Chat (03420617217)
                  </a>
                  <button
                    type="button"
                    onClick={handleResetForm}
                    className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Submit Another Vehicle Request
                  </button>
                </div>

                <div className="text-center pt-2">
                  <p className="text-xs text-slate-500 font-medium italic">
                    AutoAudit — Know the History. Drive with Confidence.
                  </p>
                </div>
              </div>
          ) : (
            /* ACTIVE FORM STATE */
            <form onSubmit={handleSubmit} className="space-y-6">

              {/* Form Overview Banner */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-xs text-blue-900 leading-relaxed">
                <span className="font-bold">Form Overview:</span> Welcome to AutoAudit — your trusted vehicle history verification service. Please complete this form with accurate information about yourself and the vehicle you want us to verify. Please double-check your VIN/Chassis Number and Registration Number before submitting.
              </div>

              {/* Section Stepper / Nav Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200">
                {[
                  { step: 1, label: '1. Customer Info' },
                  { step: 2, label: '2. Vehicle Details' },
                  { step: 3, label: '3. Report Scope' },
                  { step: 4, label: '4. Documents' },
                  { step: 5, label: '5. Consent & Submit' }
                ].map((item) => (
                  <button
                    key={item.step}
                    type="button"
                    onClick={() => setActiveTab(item.step)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
                      activeTab === item.step
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>

              {/* SECTION 1: Customer Information */}
              {activeTab === 1 && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="border-b border-slate-200 pb-2">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <User className="w-4 h-4 text-blue-600" />
                      Section 1 — Customer Information
                    </h3>
                    <p className="text-xs text-slate-500">Provide your contact details so we can deliver your report.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Full Name */}
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                        Full Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. John Doe or Muhammad Ali"
                        className="w-full text-xs px-3 py-2.5 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
                      />
                      <span className="text-[10px] text-slate-400">Please enter your first and last name.</span>
                    </div>

                    {/* Email */}
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                        Email Address <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@example.com"
                        className="w-full text-xs px-3 py-2.5 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
                      />
                      <span className="text-[10px] text-slate-400">Enter an active email address where we can send your report.</span>
                    </div>

                    {/* Phone / WhatsApp */}
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                        Phone / WhatsApp Number <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="e.g. +92 300 1234567 or +1 555 123 4567"
                        className="w-full text-xs px-3 py-2.5 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
                      />
                      <span className="text-[10px] text-slate-400">Include your country code, e.g. +92 300 1234567.</span>
                    </div>

                    {/* Country */}
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                        Country <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        className="w-full text-xs px-3 py-2.5 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
                      >
                        {COUNTRIES.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                      <span className="text-[10px] text-slate-400">Your primary residence or billing country.</span>
                    </div>
                  </div>

                  {/* Preferred Contact Method */}
                  <div className="space-y-1.5 pt-2">
                    <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                      Preferred Contact Method <span className="text-rose-500">*</span>
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['Email', 'Phone Call', 'WhatsApp'] as const).map((method) => (
                        <button
                          key={method}
                          type="button"
                          onClick={() => setPreferredContactMethod(method)}
                          className={`py-2 px-3 rounded-lg text-xs font-bold border transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                            preferredContactMethod === method
                              ? 'bg-blue-50 border-blue-500 text-blue-700'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          {method === 'WhatsApp' && <QrCode className="w-3.5 h-3.5 text-emerald-600" />}
                          <span>{method === 'WhatsApp' ? 'WhatsApp (QR)' : method}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end pt-3">
                    <button
                      type="button"
                      onClick={() => setActiveTab(2)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                    >
                      Next: Vehicle Details →
                    </button>
                  </div>
                </div>
              )}

              {/* SECTION 2: Vehicle Information */}
              {activeTab === 2 && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="border-b border-slate-200 pb-2">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Car className="w-4 h-4 text-blue-600" />
                      Section 2 — Vehicle Information
                    </h3>
                    <p className="text-xs text-slate-500">
                      Please provide the vehicle details exactly as they appear on the vehicle documents.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* VIN / Chassis Number */}
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                        <span>VIN / Chassis Number <span className="text-rose-500">*</span></span>
                        <span className="text-[10px] text-slate-400 font-mono">[{vinOrChassis.length}/17]</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={vinOrChassis}
                        onChange={(e) => setVinOrChassis(e.target.value.toUpperCase())}
                        placeholder="17-character VIN (e.g. 1HGCR2F83HA...)"
                        className="w-full text-xs px-3 py-2.5 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white font-mono"
                      />
                      <span className="text-[10px] text-slate-400">Enter the complete VIN or chassis number carefully.</span>
                    </div>

                    {/* Registration / License Plate */}
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                        Registration / License Plate <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={registrationPlate}
                        onChange={(e) => setRegistrationPlate(e.target.value.toUpperCase())}
                        placeholder="e.g. LEA-21-4920 or 7XYZ890"
                        className="w-full text-xs px-3 py-2.5 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white font-mono"
                      />
                      <span className="text-[10px] text-slate-400">Current registration or license plate number.</span>
                    </div>

                    {/* Make */}
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                        Vehicle Make <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={make}
                        onChange={(e) => setMake(e.target.value)}
                        placeholder="Toyota, Honda, BMW, Mercedes-Benz"
                        className="w-full text-xs px-3 py-2.5 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
                      />
                      <span className="text-[10px] text-slate-400">Manufacturer brand name.</span>
                    </div>

                    {/* Model */}
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                        Vehicle Model <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={model}
                        onChange={(e) => setModel(e.target.value)}
                        placeholder="Corolla, Civic, X5, C-Class"
                        className="w-full text-xs px-3 py-2.5 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
                      />
                      <span className="text-[10px] text-slate-400">Vehicle model or trim series.</span>
                    </div>

                    {/* Model Year */}
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                        Model Year <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={modelYear}
                        onChange={(e) => setModelYear(Number(e.target.value))}
                        className="w-full text-xs px-3 py-2.5 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
                      >
                        {MODEL_YEARS.map((yr) => (
                          <option key={yr} value={yr}>{yr}</option>
                        ))}
                      </select>
                      <span className="text-[10px] text-slate-400">Model years 1990 through 2026.</span>
                    </div>

                    {/* Color */}
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700">
                        Vehicle Color <span className="text-slate-400 font-normal">(Optional)</span>
                      </label>
                      <select
                        value={vehicleColor}
                        onChange={(e) => setVehicleColor(e.target.value)}
                        className="w-full text-xs px-3 py-2.5 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
                      >
                        {COLORS.map((col) => (
                          <option key={col} value={col}>{col}</option>
                        ))}
                      </select>
                    </div>

                    {/* Mileage */}
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700">
                        Current Mileage <span className="text-slate-400 font-normal">(Optional)</span>
                      </label>
                      <input
                        type="text"
                        value={currentMileage}
                        onChange={(e) => setCurrentMileage(e.target.value)}
                        placeholder="e.g. 45,000 km or 28,000 mi"
                        className="w-full text-xs px-3 py-2.5 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
                      />
                      <span className="text-[10px] text-slate-400">Current odometer mileage.</span>
                    </div>

                    {/* Country of Registration */}
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                        Country of Registration <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={countryOfRegistration}
                        onChange={(e) => setCountryOfRegistration(e.target.value)}
                        className="w-full text-xs px-3 py-2.5 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
                      >
                        {COUNTRIES.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                      <span className="text-[10px] text-slate-400">Jurisdiction where the car is registered.</span>
                    </div>
                  </div>

                  <div className="flex justify-between pt-3">
                    <button
                      type="button"
                      onClick={() => setActiveTab(1)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                    >
                      ← Back
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab(3)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                    >
                      Next: Report Scope →
                    </button>
                  </div>
                </div>
              )}

              {/* SECTION 3: Report Request */}
              {activeTab === 3 && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="border-b border-slate-200 pb-2">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-600" />
                      Section 3 — Report Request
                    </h3>
                    <p className="text-xs text-slate-500">Tell us what information you would like AutoAudit to verify.</p>
                  </div>

                  {/* 14. Report Type */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                      14. What type of vehicle history report do you need? <span className="text-rose-500">*</span>
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {REPORT_TYPES.map((rt) => (
                        <label
                          key={rt}
                          className={`p-2.5 rounded-lg border text-xs flex items-center gap-2 cursor-pointer transition-colors ${
                            reportType === rt
                              ? 'bg-blue-50 border-blue-500 text-blue-900 font-semibold'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <input
                            type="radio"
                            name="reportType"
                            value={rt}
                            checked={reportType === rt}
                            onChange={(e) => setReportType(e.target.value)}
                            className="text-blue-600 focus:ring-blue-500"
                          />
                          <span>{rt}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* 15. Reason for Request */}
                  <div className="space-y-1.5 pt-2">
                    <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                      15. Why are you requesting this report? <span className="text-rose-500">*</span>
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {REASONS.map((rs) => (
                        <label
                          key={rs}
                          className={`p-2.5 rounded-lg border text-xs flex items-center gap-2 cursor-pointer transition-colors ${
                            reasonForRequest === rs
                              ? 'bg-blue-50 border-blue-500 text-blue-900 font-semibold'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <input
                            type="radio"
                            name="reasonForRequest"
                            value={rs}
                            checked={reasonForRequest === rs}
                            onChange={(e) => setReasonForRequest(e.target.value)}
                            className="text-blue-600 focus:ring-blue-500"
                          />
                          <span>{rs}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* 16. Purchase Status */}
                  <div className="space-y-1.5 pt-2">
                    <label className="text-xs font-semibold text-slate-700">
                      16. Vehicle Purchase Status <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {PURCHASE_STATUSES.map((ps) => (
                        <button
                          key={ps}
                          type="button"
                          onClick={() => setPurchaseStatus(ps)}
                          className={`py-2 px-2.5 rounded-lg text-xs font-medium border text-center transition-colors cursor-pointer ${
                            purchaseStatus === ps
                              ? 'bg-blue-50 border-blue-500 text-blue-700 font-bold'
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {ps}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-between pt-3">
                    <button
                      type="button"
                      onClick={() => setActiveTab(2)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                    >
                      ← Back
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab(4)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                    >
                      Next: Documents →
                    </button>
                  </div>
                </div>
              )}

              {/* SECTION 4: Additional Information */}
              {activeTab === 4 && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="border-b border-slate-200 pb-2">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Upload className="w-4 h-4 text-blue-600" />
                      Section 4 — Additional Information & Documents
                    </h3>
                    <p className="text-xs text-slate-500">Provide any specific questions or upload supporting vehicle records.</p>
                  </div>

                  {/* 17. Additional Info */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">
                      17. Additional Information <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <textarea
                      rows={3}
                      value={additionalNotes}
                      onChange={(e) => setAdditionalNotes(e.target.value)}
                      placeholder="Please provide any additional details, concerns, or questions about the vehicle."
                      className="w-full text-xs p-3 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                    <span className="text-[10px] text-slate-400">e.g. Any known prior accidents, suspected odometer rollbacks, or auction slips.</span>
                  </div>

                  {/* 18. File Upload */}
                  <div className="space-y-1 pt-2">
                    <label className="text-xs font-semibold text-slate-700">
                      18. Upload Vehicle Document or Supporting Image <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center hover:border-blue-500 transition-colors bg-white">
                      <input
                        type="file"
                        id="intake-doc-upload"
                        className="hidden"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={handleFileUpload}
                      />
                      <label htmlFor="intake-doc-upload" className="cursor-pointer block space-y-2">
                        <Upload className="w-6 h-6 text-slate-400 mx-auto" />
                        <div className="text-xs text-slate-700 font-semibold">
                          {uploadedFile ? (
                            <span className="text-emerald-700 flex items-center justify-center gap-1">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              {uploadedFile.name} ({uploadedFile.size})
                            </span>
                          ) : (
                            <span>Click to upload or drag & drop</span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400">
                          Recommended: PDF, JPG, JPEG, PNG • Maximum 10 MB per file
                        </p>
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-between pt-3">
                    <button
                      type="button"
                      onClick={() => setActiveTab(3)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                    >
                      ← Back
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab(5)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                    >
                      Next: Consent & Submit →
                    </button>
                  </div>
                </div>
              )}

              {/* SECTION 5: Customer Consent & Submit */}
              {activeTab === 5 && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="border-b border-slate-200 pb-2">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      Section 5 — Customer Consent & Verification
                    </h3>
                    <p className="text-xs text-slate-500">Please confirm your consents to authorize report processing.</p>
                  </div>

                  {/* Consents */}
                  <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                    {/* 19. Accuracy */}
                    <label className="flex items-start gap-2.5 text-xs text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={accuracyConfirmed}
                        onChange={(e) => setAccuracyConfirmed(e.target.checked)}
                        className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                      />
                      <span>
                        <strong className="text-slate-900">Information Accuracy Confirmation:</strong> I confirm that the information I have provided is accurate and complete.
                      </span>
                    </label>

                    {/* 20. Data Usage */}
                    <label className="flex items-start gap-2.5 text-xs text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={dataUsageConsent}
                        onChange={(e) => setDataUsageConsent(e.target.checked)}
                        className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                      />
                      <span>
                        <strong className="text-slate-900">Data Usage & Communication Consent:</strong> I agree that AutoAudit may use the information provided in this form to process my vehicle history report request and contact me regarding my request.
                      </span>
                    </label>

                    {/* 21. Terms & Privacy */}
                    <label className="flex items-start gap-2.5 text-xs text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={termsAgreed}
                        onChange={(e) => setTermsAgreed(e.target.checked)}
                        className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                      />
                      <span>
                        <strong className="text-slate-900">Terms & Privacy Policy:</strong> I have read and agree to AutoAudit's{' '}
                        <button
                          type="button"
                          onClick={() => onOpenLegal?.('terms')}
                          className="text-blue-600 underline hover:text-blue-800"
                        >
                          Terms of Service
                        </button>{' '}
                        and{' '}
                        <button
                          type="button"
                          onClick={() => onOpenLegal?.('privacy')}
                          className="text-blue-600 underline hover:text-blue-800"
                        >
                          Privacy Policy
                        </button>.
                      </span>
                    </label>
                  </div>

                  {/* Admin Priority Verification Callout */}
                  <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-emerald-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                        <ShieldCheck className="w-4 h-4 text-blue-600" />
                        <span>Direct Admin Fulfillment Queue</span>
                        <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded text-[9px] font-bold">SECURE</span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-tight">
                        Submits vehicle records directly into the Admin Operations Console for verification. Official PDF report will be delivered by AutoAudit Admin upon payment confirmation.
                      </p>
                    </div>
                    <div className="px-2.5 py-1 bg-white border border-blue-200 rounded-lg text-[10px] font-bold text-blue-700 shrink-0 font-mono">
                      ADMIN DISPATCH
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3">
                    <button
                      type="button"
                      onClick={() => setActiveTab(4)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                    >
                      ← Back
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting || !accuracyConfirmed || !dataUsageConsent || !termsAgreed}
                      className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Processing Request & Generating Report...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>Submit Vehicle Report Request</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

            </form>
          )}

        </div>

        {/* Footer info strip */}
        <div className="px-6 py-3 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            <span>256-Bit SSL Encrypted • Zero Spam Guarantee</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline">AutoAudit Global Intake Protocol</span>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-600 hover:text-slate-900 font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
