import React, { useState, useEffect } from 'react';
import { Order } from '../types';
import { 
  X, Send, Mail, Paperclip, Eye, Edit3, ShieldCheck, 
  CheckCircle2, FileText, ExternalLink, AlertCircle 
} from 'lucide-react';
import { Logo } from './Logo';
import { downloadReportPdfBlob } from '../utils/pdfGenerator';

interface EmailPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order;
  onConfirmSend: (subject: string, body: string) => void;
  emailType?: 'report_ready' | 'processing' | 'order_confirmation';
}

export const EmailPreviewModal: React.FC<EmailPreviewModalProps> = ({
  isOpen,
  onClose,
  order,
  onConfirmSend,
  emailType = 'report_ready',
}) => {
  const defaultSubject = `[REPORT READY] AutoAudit Vehicle History Report for ${order.vehicle.make} (${order.vehicle.vinOrReg})`;
  
  const generateDefaultBody = () => {
    return `Dear ${order.customer.fullName},

Great news! The official vehicle history report for your ${order.vehicle.year} ${order.vehicle.make} ${order.vehicle.model} (VIN: ${order.vehicle.vinOrReg}) is compiled, verified, and ready for you to access.

Vehicle Summary:
- Order Reference: #${order.orderNumber}
- Vehicle: ${order.vehicle.year} ${order.vehicle.make} ${order.vehicle.model}
- Chassis VIN: ${order.vehicle.vinOrReg}
- Service Tier: ${order.serviceName}
- Status: NMVTIS & State Title Records Verified Clear

Attached Document:
${order.resultFile?.fileName || `${order.vehicle.make}-${order.vehicle.vinOrReg}-Report.pdf`}

Direct Secure Link:
${order.resultFile?.fileUrl || `https://reports.autoaudit.com/secure/${order.orderNumber}.pdf`}

You can also view this report in your customer portal anytime with your Order ID.

Thank you for choosing AutoAudit!
AutoAudit Fulfillment Team`;
  };

  const [subject, setSubject] = useState<string>(defaultSubject);
  const [body, setBody] = useState<string>(generateDefaultBody());
  const [viewMode, setViewMode] = useState<'preview' | 'edit'>('preview');

  useEffect(() => {
    if (isOpen) {
      setSubject(defaultSubject);
      setBody(generateDefaultBody());
      setViewMode('preview');
    }
  }, [isOpen, order]);

  if (!isOpen) return null;

  const handleSend = () => {
    onConfirmSend(subject.trim(), body.trim());
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-fade-in text-slate-900">
        
        {/* Top Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base">Email Preview</h3>
                <span className="text-[10px] bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded font-mono uppercase">
                  Before Sending
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Review and customize the notification before it is dispatched to the customer
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Email Metadata Header Bar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 text-xs space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-600">
              <span className="font-semibold text-slate-800 w-12">From:</span>
              <span className="font-mono text-slate-900 font-medium">AutoAudit Fulfillment &lt;reports@autoaudit.com&gt;</span>
            </div>

            {/* View Mode Toggle: Visual Preview vs Edit Text */}
            <div className="flex items-center bg-slate-200 p-0.5 rounded-lg">
              <button
                type="button"
                onClick={() => setViewMode('preview')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                  viewMode === 'preview'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Eye className="w-3 h-3" />
                <span>Visual Email</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('edit')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                  viewMode === 'edit'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Edit3 className="w-3 h-3" />
                <span>Edit Text</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 text-slate-600">
            <span className="font-semibold text-slate-800 w-12">To:</span>
            <span className="text-slate-900 font-medium">{order.customer.fullName} &lt;{order.customer.email}&gt;</span>
          </div>

          <div className="flex items-center gap-2 text-slate-600">
            <span className="font-semibold text-slate-800 w-12">Subject:</span>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="flex-1 px-2.5 py-1 bg-white border border-slate-300 rounded text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-600"
            />
          </div>
        </div>

        {/* Modal Center Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 bg-slate-100/70">
          {viewMode === 'preview' ? (
            /* Visual Email Template Preview */
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5 max-w-xl mx-auto">
              
              {/* Email Brand Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <Logo variant="navbar" size="sm" theme="light" />
                <span className="text-[11px] text-slate-400 font-mono font-bold">ORDER #{order.orderNumber}</span>
              </div>

              {/* Email Hero Greeting */}
              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-50 text-emerald-800 text-[11px] font-semibold border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Report Compilation Complete</span>
                </div>
                <h4 className="text-lg font-bold text-slate-900">
                  Your Vehicle History Report is Ready
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Hello <strong className="text-slate-800">{order.customer.fullName}</strong>, our team has completed the official title and historical records audit for your vehicle.
                </p>
              </div>

              {/* Vehicle Highlight Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2.5 text-xs">
                <div className="flex justify-between items-baseline">
                  <span className="text-slate-500 text-[11px] uppercase tracking-wider font-semibold">Verified Vehicle</span>
                  <span className="text-emerald-700 font-bold font-mono">NMVTIS & DMV Passed</span>
                </div>
                <p className="text-sm font-bold text-slate-900">
                  {order.vehicle.year} {order.vehicle.make} {order.vehicle.model}
                </p>
                <div className="grid grid-cols-2 gap-2 text-slate-600 pt-1 border-t border-slate-200 text-[11px]">
                  <div>
                    <span className="text-slate-400 block">Chassis VIN:</span>
                    <span className="font-mono font-bold text-slate-800">{order.vehicle.vinOrReg}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Service Plan:</span>
                    <span className="font-medium text-slate-800">{order.serviceName}</span>
                  </div>
                </div>
              </div>

              {/* Download CTA Button */}
              <div className="text-center py-2 space-y-2">
                <button
                  type="button"
                  onClick={() => downloadReportPdfBlob(order)}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl font-bold text-xs shadow-md cursor-pointer transition-colors"
                >
                  <FileText className="w-4 h-4" />
                  <span>Download Official Report PDF</span>
                </button>
                <p className="text-[11px] text-slate-400">
                  Instant certified PDF download. You can also view it anytime from your AutoAudit account.
                </p>
              </div>

              {/* Attached File Preview Card */}
              <button
                type="button"
                onClick={() => downloadReportPdfBlob(order)}
                className="w-full text-left p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-between text-xs cursor-pointer transition-colors"
                title="Click to download attached PDF report"
              >
                <div className="flex items-center gap-2.5 truncate">
                  <div className="w-8 h-8 rounded bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <span className="font-semibold text-slate-800 truncate block">
                      {order.resultFile?.fileName || `${order.vehicle.make}-${order.vehicle.vinOrReg}-Report.pdf`}
                    </span>
                    <span className="text-[10px] text-slate-400">Adobe PDF Document · Click to download</span>
                  </div>
                </div>
                <Paperclip className="w-4 h-4 text-slate-400 shrink-0 ml-2" />
              </button>

              {/* Email Footer */}
              <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-400 text-center space-y-1">
                <p>AutoAudit Technologies · Official Vehicle History & Title Verification</p>
                <p>Have questions regarding this report? Reply to this email or visit our Help Center.</p>
              </div>

            </div>
          ) : (
            /* Plain Text Editor Mode */
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-800 block">
                Edit Raw Message Text (will be formatted into the email template)
              </label>
              <textarea
                rows={14}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="w-full p-4 bg-white border border-slate-300 rounded-xl text-xs font-mono leading-relaxed focus:outline-none focus:border-blue-600"
              />
            </div>
          )}
        </div>

        {/* Modal Bottom Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Paperclip className="w-3.5 h-3.5 text-slate-400" />
            <span>Attachment: <strong>{order.resultFile?.fileName || 'AutoAudit-Report.pdf'}</strong></span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold text-xs rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSend}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-2 cursor-pointer shadow-sm active:scale-[0.99]"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Confirm & Send Email to Customer</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
