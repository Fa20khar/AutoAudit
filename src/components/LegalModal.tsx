import React, { useState } from 'react';
import { X, ShieldCheck, FileText, RefreshCw, AlertCircle } from 'lucide-react';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'terms' | 'privacy' | 'refund' | 'compliance';
}

export const LegalModal: React.FC<LegalModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'terms',
}) => {
  const [activeTab, setActiveTab] = useState<'terms' | 'privacy' | 'refund' | 'compliance'>(defaultTab);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-base">Legal, Policies & Compliance Disclosures</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="px-6 pt-3 bg-slate-50 border-b border-slate-200 flex gap-2 overflow-x-auto text-xs font-semibold">
          <button
            onClick={() => setActiveTab('terms')}
            className={`pb-3 px-3 border-b-2 cursor-pointer transition-colors ${
              activeTab === 'terms'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Terms of Service
          </button>
          <button
            onClick={() => setActiveTab('refund')}
            className={`pb-3 px-3 border-b-2 cursor-pointer transition-colors ${
              activeTab === 'refund'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            100% Refund Policy
          </button>
          <button
            onClick={() => setActiveTab('compliance')}
            className={`pb-3 px-3 border-b-2 cursor-pointer transition-colors ${
              activeTab === 'compliance'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Compliance & Sourcing Note
          </button>
          <button
            onClick={() => setActiveTab('privacy')}
            className={`pb-3 px-3 border-b-2 cursor-pointer transition-colors ${
              activeTab === 'privacy'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Privacy Policy
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 text-xs sm:text-sm text-slate-600 space-y-4 leading-relaxed">
          
          {activeTab === 'terms' && (
            <div className="space-y-3">
              <h4 className="font-bold text-slate-900 text-base">Terms of Service</h4>
              <p>
                Welcome to AutoAudit. By ordering a vehicle history report through our website, you agree to these Terms of Service.
              </p>
              <h5 className="font-bold text-slate-800">1. Nature of the Service</h5>
              <p>
                AutoAudit operates strictly as an online ordering and digital fulfillment platform for vehicle records and history data. AutoAudit is not a physical vehicle inspection facility, does not dispatch mechanics or inspectors to the field, and does not provide live mechanical warranties or road-test diagnostics.
              </p>
              <h5 className="font-bold text-slate-800">2. Accuracy and Data Limitations</h5>
              <p>
                Reports compile historical records provided by government DMV departments, the National Motor Vehicle Title Information System (NMVTIS), insurance carriers, and automotive salvage registries. While we endeavor to compile all available historical documents, AutoAudit cannot guarantee records of private collision repairs conducted without an insurance claim or outside registered facilities.
              </p>
              <h5 className="font-bold text-slate-800">3. Non-Commercial Personal Use</h5>
              <p>
                Vehicle reports are provided for the purchaser's evaluation purposes in connection with a vehicle purchase or sale. Unauthorized mass resale or systematic scraping is prohibited.
              </p>
            </div>
          )}

          {activeTab === 'refund' && (
            <div className="space-y-3">
              <h4 className="font-bold text-slate-900 text-base">100% Money-Back Refund Guarantee</h4>
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 space-y-2">
                <p className="font-bold">Our Promise to Every Buyer</p>
                <p>
                  If our team is unable to retrieve records for your entered VIN from our authorized sources, or if your report cannot be delivered within our stated turnaround period, you will receive an unconditional 100% refund.
                </p>
              </div>
              <h5 className="font-bold text-slate-800">Refund Processing Timeline</h5>
              <p>
                Refunds are initiated immediately via our administrative billing gateway upon order cancellation or upon request within 24 hours of purchase if records were unavailable. Funds typically post to the original payment method within 3 to 5 business days depending on your financial institution.
              </p>
            </div>
          )}

          {activeTab === 'compliance' && (
            <div className="space-y-3">
              <h4 className="font-bold text-slate-900 text-base">Compliance & Authorized Sourcing (PDF Section 17 & 24)</h4>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 space-y-2">
                <p className="font-bold text-slate-900">Compliance Statement</p>
                <p>
                  Where vehicle reports or data are sourced from third-party providers, all use complies with that provider’s terms, license, or API agreement, and with applicable law.
                </p>
                <p>
                  No scraping, unauthorized copying, or unauthorized redistribution is implemented. The website clearly states what the customer is purchasing and any limitations that apply.
                </p>
              </div>
              <p>
                AutoAudit adheres strictly to the Driver's Privacy Protection Act (DPPA) and applicable consumer reporting laws. No private personal owner contact data (such as home addresses or phone numbers) is disclosed in history reports.
              </p>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="space-y-3">
              <h4 className="font-bold text-slate-900 text-base">Privacy & Data Protection</h4>
              <p>
                We value your privacy. Customer contact details entered during checkout (name, email, phone) are used exclusively for sending order confirmations, receipts, and report delivery links. We never sell or rent your contact details to third-party marketing affiliates.
              </p>
              <h5 className="font-bold text-slate-800">Payment Security</h5>
              <p>
                Raw credit card details are never stored on AutoAudit servers. All transactions are processed through tokenized, PCI-DSS compliant secure payment gateways using 256-bit SSL encryption.
              </p>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold cursor-pointer"
          >
            Close Disclosures
          </button>
        </div>

      </div>
    </div>
  );
};
