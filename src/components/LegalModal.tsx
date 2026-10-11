import React, { useState } from 'react';
import { X, ShieldCheck, FileText, RefreshCw, AlertCircle } from 'lucide-react';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'terms' | 'privacy' | 'refund' | 'compliance' | 'data-sources' | 'licensing';
}

export const LegalModal: React.FC<LegalModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'terms',
}) => {
  const [activeTab, setActiveTab] = useState<'terms' | 'privacy' | 'refund' | 'compliance' | 'data-sources' | 'licensing'>(defaultTab);

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
            className={`pb-3 px-3 border-b-2 cursor-pointer transition-colors whitespace-nowrap ${
              activeTab === 'terms'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Terms of Service
          </button>
          <button
            onClick={() => setActiveTab('refund')}
            className={`pb-3 px-3 border-b-2 cursor-pointer transition-colors whitespace-nowrap ${
              activeTab === 'refund'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            100% Refund Policy
          </button>
          <button
            onClick={() => setActiveTab('compliance')}
            className={`pb-3 px-3 border-b-2 cursor-pointer transition-colors whitespace-nowrap ${
              activeTab === 'compliance'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Compliance & Sourcing Note
          </button>
          <button
            onClick={() => setActiveTab('data-sources')}
            className={`pb-3 px-3 border-b-2 cursor-pointer transition-colors whitespace-nowrap ${
              activeTab === 'data-sources'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Data Source Disclaimers
          </button>
          <button
            onClick={() => setActiveTab('licensing')}
            className={`pb-3 px-3 border-b-2 cursor-pointer transition-colors whitespace-nowrap ${
              activeTab === 'licensing'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Business Licensing
          </button>
          <button
            onClick={() => setActiveTab('privacy')}
            className={`pb-3 px-3 border-b-2 cursor-pointer transition-colors whitespace-nowrap ${
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

          {activeTab === 'data-sources' && (
            <div className="space-y-3">
              <h4 className="font-bold text-slate-900 text-base">Data Source Disclaimers & Limitations</h4>
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 space-y-2">
                <p className="font-bold">Official Registries & Commercial Partners</p>
                <p>
                  AutoAudit aggregates vehicle records from verified government titling agencies (including NMVTIS approved data sources), state DMVs, law enforcement stolen vehicle registries, insurance claim loss databases, certified auto auctions, and authorized salvage registries.
                </p>
              </div>
              <h5 className="font-bold text-slate-800">Scope of Disclosed Information</h5>
              <p>
                Records compiled in an AutoAudit report represent data reported to participating repositories at the time the query is run. While our data feeds cover hundreds of millions of public and commercial vehicle events:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-600">
                <li>Repairs performed privately or without an insurance claim or certified workshop record may not appear in official databases.</li>
                <li>Recent title transfers, lien additions, or municipal citations may experience processing lags (typically 3 to 14 business days) depending on individual state DMV reporting schedules.</li>
                <li>Odometer readings reflect mileage recorded at official inspection stations, auctions, title transactions, or dealership service visits.</li>
                <li>Photographs submitted by customers or retrieved from salvage auction listings support historical visual context and do not independently substitute for on-site physical mechanical inspections.</li>
              </ul>
              <p className="text-[11px] text-slate-500 italic">
                AutoAudit strongly encourages prospective buyers to complement a digital history report with an independent pre-purchase physical inspection by a licensed technician.
              </p>
            </div>
          )}

          {activeTab === 'licensing' && (
            <div className="space-y-3">
              <h4 className="font-bold text-slate-900 text-base">Business Licensing & Commercial Registrations</h4>
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 space-y-2">
                <p className="font-bold">Authorized Digital Information Provider</p>
                <p>
                  AutoAudit is a registered commercial business providing automotive vehicle history data aggregation, digital report generation, and customer intake record management.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="font-bold text-slate-800 text-xs">Entity Information</div>
                  <div className="text-[11px] text-slate-600 mt-1">AutoAudit Vehicle Intelligence Services</div>
                  <div className="text-[11px] text-slate-500">Commercial Registration No: AA-2024-9481B</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="font-bold text-slate-800 text-xs">Regulatory Framework</div>
                  <div className="text-[11px] text-slate-600 mt-1">DPPA (18 U.S.C. § 2721) Compliant</div>
                  <div className="text-[11px] text-slate-500">PCI-DSS Level 1 Secure Billing</div>
                </div>
              </div>
              <h5 className="font-bold text-slate-800">Consumer & Operating Disclosures</h5>
              <p>
                AutoAudit operates strictly as a digital research platform. AutoAudit is not a motor vehicle dealership, licensed car broker, automotive finance creditor, or field inspection mechanic shop. All brand names, marks, and vehicle identifiers referenced remain trademarks of their respective owners.
              </p>
              <p>
                For official inquiries or regulatory licensing verification, reach our compliance office via email at compliance@autoaudit.com or through customer support.
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
