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
  Check,
  Table,
  FileSpreadsheet,
  Camera,
  Image as ImageIcon,
  Trash2,
  Info
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import confetti from 'canvas-confetti';
import { CustomerIntakeSubmission } from '../types';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { IntakeProgressBar, IntakeProgressStats } from './IntakeProgressBar';

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
  const [vehiclePhotos, setVehiclePhotos] = useState<Array<{ name: string; size: string; previewUrl?: string }>>([]);

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

  // Dynamic Progress Bar statistics based on filled fields
  const contactFilled = Boolean(fullName.trim() && email.trim() && phone.trim());
  const vehicleFilled = Boolean(vinOrChassis.trim() && make.trim() && model.trim());
  const scopeFilled = Boolean(reportType && reasonForRequest);
  const consentFilled = Boolean(accuracyConfirmed && dataUsageConsent && termsAgreed);

  let calculatedPercentage = 0;
  if (fullName.trim()) calculatedPercentage += 10;
  if (email.trim()) calculatedPercentage += 10;
  if (phone.trim()) calculatedPercentage += 10;
  if (vinOrChassis.trim()) calculatedPercentage += 15;
  if (make.trim()) calculatedPercentage += 10;
  if (model.trim()) calculatedPercentage += 10;
  if (registrationPlate.trim() || modelYear) calculatedPercentage += 5;
  if (reportType && reasonForRequest) calculatedPercentage += 10;
  if (uploadedFile || additionalNotes.trim()) calculatedPercentage += 10;
  if (accuracyConfirmed && dataUsageConsent && termsAgreed) calculatedPercentage += 10;
  if (calculatedPercentage > 100) calculatedPercentage = 100;

  let currentStepMessage = 'Enter customer contact information to get started';
  if (activeTab === 1) {
    currentStepMessage = contactFilled
      ? 'Contact details complete! Click Step 2 for vehicle details.'
      : 'Please provide full name, email, and phone number.';
  } else if (activeTab === 2) {
    currentStepMessage = vehicleFilled
      ? 'Vehicle details verified! Continue to Step 3 for report scope.'
      : 'Provide VIN / Chassis, make, and model to look up history.';
  } else if (activeTab === 3) {
    currentStepMessage = scopeFilled
      ? 'Report scope specified! Click Step 4 or 5 to finalize.'
      : 'Select report type and your primary purpose.';
  } else if (activeTab === 4) {
    currentStepMessage = 'Attach any registration papers or notes (optional).';
  } else if (activeTab === 5) {
    currentStepMessage = consentFilled
      ? 'Ready to submit! Click Submit Request below.'
      : 'Please review and accept terms & accuracy confirmations.';
  }

  const progressStats: IntakeProgressStats = {
    percentage: calculatedPercentage,
    contactFilled,
    vehicleFilled,
    scopeFilled,
    consentFilled,
    currentStepMessage
  };

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

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = 5 - vehiclePhotos.length;
    if (remainingSlots <= 0) {
      showToast({
        type: 'warning',
        title: 'Photo Limit Reached',
        message: 'Maximum 5 vehicle photos allowed per intake request.',
        duration: 4000
      });
      return;
    }

    const filesToProcess = Array.from(files).slice(0, remainingSlots);
    const newPhotos: Array<{ name: string; size: string; previewUrl?: string }> = [];

    for (const file of filesToProcess) {
      if (file.size > 10 * 1024 * 1024) {
        showToast({
          type: 'warning',
          title: 'Photo Too Large',
          message: `${file.name} exceeds the 10 MB limit.`,
          duration: 3500
        });
        continue;
      }

      const sizeFormatted = (file.size / (1024 * 1024)).toFixed(1) + ' MB';
      const previewUrl = URL.createObjectURL(file);
      newPhotos.push({
        name: file.name,
        size: sizeFormatted,
        previewUrl
      });
    }

    if (newPhotos.length > 0) {
      setVehiclePhotos(prev => [...prev, ...newPhotos]);
      showToast({
        type: 'success',
        title: 'Vehicle Photos Added',
        message: `Added ${newPhotos.length} photo(s) for vehicle review.`,
        duration: 3500
      });
    }
  };

  const handleRemovePhoto = (index: number) => {
    setVehiclePhotos(prev => {
      const removed = prev[index];
      if (removed?.previewUrl) {
        URL.revokeObjectURL(removed.previewUrl);
      }
      return prev.filter((_, i) => i !== index);
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
        vehiclePhotos: vehiclePhotos.length > 0 ? vehiclePhotos : undefined,
        vehiclePhotoCount: vehiclePhotos.length,
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
            ? 'Sample report PDF generated and ready for instant download.' 
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
                Vehicle Intake Form
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" /> Auto-Generate Supported
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
              AutoAudit Customer Data Form
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-xl">
              Customer intake form for vehicle history report requests.
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
                    Your request has been forwarded directly to the <strong>AutoAudit Admin Operations Console</strong>. Vehicle history reports are compiled and dispatched directly by AutoAudit Administration upon payment confirmation.
                  </p>
                  <div className="flex items-center gap-1.5 text-[11px] text-blue-800 bg-blue-100/60 px-2.5 py-1.5 rounded-lg font-medium">
                    <span>Reference ID:</span>
                    <span className="font-mono font-bold text-slate-900">#{submittedData.orderNumber || submittedData.submission.submissionNumber}</span>
                    <span className="mx-1">•</span>
                    <span>Status: Pending Admin Payment Verification</span>
                  </div>
                </div>

                <a
                  href={`https://wa.me/923420617217?text=${encodeURIComponent(`Hi AutoAudit Admin, I submitted report request #${submittedData.submission.submissionNumber} for VIN: ${submittedData.submission.vinOrChassis} (${submittedData.submission.make} ${submittedData.submission.model}). Please send payment details so I can receive my vehicle history report.`)}`}
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

              {/* Dynamic Intake Progress Bar with Real-Time Feedback */}
              <IntakeProgressBar
                stats={progressStats}
                currentStep={activeTab}
                onSelectStep={(step) => setActiveTab(step)}
              />

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

                  {/* 18. Customer Vehicle Photo Uploads (Matching Google Forms Question Specification) */}
                  <div className="space-y-3 pt-3 border-t border-slate-200">
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                          <Camera className="w-4 h-4 text-emerald-600" />
                          <span>Upload Vehicle Photos</span>
                          <span className="text-slate-400 font-normal text-[11px]">(Optional • Up to 5 photos)</span>
                        </label>
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                          {vehiclePhotos.length} / 5 photos added
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                        Upload clear photographs of your vehicle to help our team review your request and improve the vehicle report. Please upload only photographs you are authorized to share.
                      </p>
                    </div>

                    {/* Recommended Photo Angle Guide */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs space-y-2">
                      <div className="flex items-center gap-1.5 text-slate-800 font-semibold text-[11px]">
                        <Info className="w-3.5 h-3.5 text-blue-600" />
                        <span>Recommended angles for highest report accuracy:</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[10px] text-slate-600">
                        <span className="bg-white px-2 py-1 rounded border border-slate-200">1. Front view</span>
                        <span className="bg-white px-2 py-1 rounded border border-slate-200">2. Rear view</span>
                        <span className="bg-white px-2 py-1 rounded border border-slate-200">3. Left & Right sides</span>
                        <span className="bg-white px-2 py-1 rounded border border-slate-200">4. Dash & Odometer</span>
                        <span className="bg-white px-2 py-1 rounded border border-slate-200">5. VIN plate / label</span>
                        <span className="bg-white px-2 py-1 rounded border border-slate-200">6. Known visible damage</span>
                        <span className="bg-white px-2 py-1 rounded border border-slate-200 col-span-2 text-slate-500 italic">
                          JPG, PNG, WebP up to 10 MB
                        </span>
                      </div>
                    </div>

                    {/* Upload Dropzone */}
                    {vehiclePhotos.length < 5 && (
                      <div className="border-2 border-dashed border-emerald-300 hover:border-emerald-500 rounded-xl p-4 text-center transition-colors bg-emerald-50/20">
                        <input
                          type="file"
                          id="intake-vehicle-photos"
                          className="hidden"
                          accept="image/jpeg,image/png,image/webp"
                          multiple
                          onChange={handlePhotoUpload}
                        />
                        <label htmlFor="intake-vehicle-photos" className="cursor-pointer block space-y-2">
                          <Camera className="w-7 h-7 text-emerald-600 mx-auto" />
                          <div className="text-xs text-slate-800 font-semibold">
                            Click to select vehicle photos or drag & drop here
                          </div>
                          <p className="text-[10px] text-slate-400">
                            JPEG, PNG or WebP • Max 10 MB per photo • Stored safely and encrypted in AutoAudit cloud database
                          </p>
                        </label>
                      </div>
                    )}

                    {/* Photo Previews Grid */}
                    {vehiclePhotos.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
                        {vehiclePhotos.map((photo, idx) => (
                          <div
                            key={idx}
                            className="relative group rounded-lg overflow-hidden border border-slate-200 bg-white p-1.5 shadow-xs flex flex-col justify-between"
                          >
                            <div className="w-full h-20 bg-slate-100 rounded overflow-hidden flex items-center justify-center">
                              {photo.previewUrl ? (
                                <img
                                  src={photo.previewUrl}
                                  alt={`Vehicle preview ${idx + 1}`}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <ImageIcon className="w-6 h-6 text-slate-400" />
                              )}
                            </div>
                            <div className="pt-1.5 flex items-center justify-between text-[10px]">
                              <span className="truncate max-w-[90px] text-slate-700 font-medium" title={photo.name}>
                                {photo.name}
                              </span>
                              <span className="text-slate-400">{photo.size}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemovePhoto(idx)}
                              className="absolute top-2 right-2 bg-rose-600 hover:bg-rose-700 text-white p-1 rounded-full shadow-md transition-colors cursor-pointer opacity-90 hover:opacity-100"
                              title="Remove photo"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Disclaimer */}
                    <p className="text-[10px] text-slate-400 leading-relaxed italic">
                      Note: Photographs support our team's manual review process but do not independently verify a vehicle's complete title branding or complete historical records.
                    </p>
                  </div>

                  {/* 19. Additional Document Upload */}
                  <div className="space-y-1 pt-3 border-t border-slate-200">
                    <label className="text-xs font-semibold text-slate-700">
                      19. Upload Registration Papers or Additional PDF <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <div className="border border-slate-200 rounded-xl p-3 text-center hover:border-slate-300 transition-colors bg-white">
                      <input
                        type="file"
                        id="intake-doc-upload"
                        className="hidden"
                        accept=".pdf,.doc,.docx"
                        onChange={handleFileUpload}
                      />
                      <label htmlFor="intake-doc-upload" className="cursor-pointer block space-y-1">
                        <Upload className="w-5 h-5 text-slate-400 mx-auto" />
                        <div className="text-xs text-slate-700 font-medium">
                          {uploadedFile ? (
                            <span className="text-emerald-700 flex items-center justify-center gap-1 font-semibold">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              {uploadedFile.name} ({uploadedFile.size})
                            </span>
                          ) : (
                            <span>Click to attach PDF or registration document (up to 10 MB)</span>
                          )}
                        </div>
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
                      Section 5 — Customer Authorization & Submission
                    </h3>
                    <p className="text-xs text-slate-500">Please authorize processing the entered vehicle and contact details to prepare the report.</p>
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
                        Submits vehicle records directly into the Admin Operations Console. The PDF report will be delivered by AutoAudit Admin upon payment confirmation.
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
