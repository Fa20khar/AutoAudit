import React, { useState } from 'react';
import { Order, ServicePlan, Coupon, EmailNotification, OrderStatus, AuditLog } from '../types';
import { 
  LayoutDashboard, ShoppingBag, DollarSign, Clock, CheckCircle2, 
  Send, Upload, Search, FileText, Mail, Tag, Settings, Eye, 
  AlertTriangle, RefreshCw, X, ShieldAlert, Check, Plus, Edit2, Trash2,
  Users, FileCheck, CreditCard, ChevronRight, LogOut, ArrowLeft, ShieldCheck, Lock,
  Database, Copy, ExternalLink, CheckCheck, Ban, CheckSquare, Square, XCircle
} from 'lucide-react';
import { EmailPreviewModal } from './EmailPreviewModal';
import { useToast } from '../context/ToastContext';
import { OrderTrackingProgressBar } from './OrderTrackingProgressBar';
import { Logo } from './Logo';
import { api } from '../services/api';
import { ContactAnalyticsTab } from './ContactAnalyticsTab';
import { WhatsAppIcon } from './WhatsAppWidget';
import { AdminOrderAnalyticsDashboard } from './AdminOrderAnalyticsDashboard';

interface AdminPanelProps {
  orders: Order[];
  services: ServicePlan[];
  coupons: Coupon[];
  emails: EmailNotification[];
  onUpdateOrder: (updatedOrder: Order) => void;
  onBatchUpdateOrders?: (updatedOrders: Order[]) => void;
  onUpdateServices: (updatedServices: ServicePlan[]) => void;
  onUpdateCoupons: (updatedCoupons: Coupon[]) => void;
  onSendEmail: (email: EmailNotification) => void;
  onCloseAdmin: () => void;
  onViewSampleReport: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  orders,
  services,
  coupons,
  emails,
  onUpdateOrder,
  onBatchUpdateOrders,
  onUpdateServices,
  onUpdateCoupons,
  onSendEmail,
  onCloseAdmin,
  onViewSampleReport,
}) => {
  const { showToast } = useToast();

  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return Boolean(typeof window !== 'undefined' && sessionStorage.getItem('autoaudit_admin_token'));
  });
  const [adminEmailInput, setAdminEmailInput] = useState<string>('admin@autoaudit.com');
  const [adminPasswordInput, setAdminPasswordInput] = useState<string>('AutoAudit2026!');
  const [adminAuthError, setAdminAuthError] = useState<string>('');
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);

  const [activeTab, setActiveTab] = useState<'dashboard' | 'orders' | 'customers' | 'services' | 'reports' | 'payments' | 'settings' | 'emails' | 'contact-analytics'>('dashboard');
  
  // Selected Order for Section 25 detail view
  const [selectedOrderId, setSelectedOrderId] = useState<string>(orders[0]?.id || '');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Bulk Selection & Action State
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [showBulkCancelModal, setShowBulkCancelModal] = useState<boolean>(false);
  const [isProcessingBulkAction, setIsProcessingBulkAction] = useState<boolean>(false);

  // Modals for admin actions
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string>('');
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [showEmailPreviewModal, setShowEmailPreviewModal] = useState<boolean>(false);

  // Mock SMTP Email Sequence & Log state
  const [dispatchedEmails, setDispatchedEmails] = useState<EmailNotification[]>(emails);
  const [smtpStatus, setSmtpStatus] = useState<any>(null);
  const [selectedEmailForView, setSelectedEmailForView] = useState<EmailNotification | null>(null);
  const [emailPreviewTab, setEmailPreviewTab] = useState<'html' | 'text'>('html');
  const [isTriggeringSequence, setIsTriggeringSequence] = useState<boolean>(false);
  const [emailStageFilter, setEmailStageFilter] = useState<string>('All');
  const [emailSearchQuery, setEmailSearchQuery] = useState<string>('');

  // Editable Internal notes
  const currentOrder = orders.find((o) => o.id === selectedOrderId) || orders[0];
  const [editNotes, setEditNotes] = useState<string>(currentOrder?.internalNotes || '');
  const [notesSaved, setNotesSaved] = useState<boolean>(false);
  const [dbStatus, setDbStatus] = useState<any>(null);
  const [copiedSql, setCopiedSql] = useState<boolean>(false);

  const fetchEmailLogs = async () => {
    try {
      const data = await api.getEmails();
      if (Array.isArray(data)) {
        setDispatchedEmails(data);
      }
      const status = await api.getSmtpStatus();
      if (status) {
        setSmtpStatus(status);
      }
    } catch {
      // fallback
    }
  };

  React.useEffect(() => {
    if (activeTab === 'emails') {
      fetchEmailLogs();
    }
  }, [activeTab]);

  React.useEffect(() => {
    if (emails && emails.length > 0) {
      setDispatchedEmails(emails);
    }
  }, [emails]);

  const handleTriggerEmailSequence = async (orderId: string) => {
    setIsTriggeringSequence(true);
    try {
      await api.triggerEmailSequence(orderId);
      showToast({
        title: 'Mock SMTP Sequence Started',
        message: `Automated lifecycle initiated for ${currentOrder?.customer?.email || 'customer'}: Stage 1 sent; Stages 2 & 3 scheduled.`,
        type: 'success'
      });
      // Refresh order list and email logs
      const updatedOrders = await api.getOrders();
      if (Array.isArray(updatedOrders)) {
        const found = updatedOrders.find(o => o.id === orderId);
        if (found) onUpdateOrder(found);
      }
      await fetchEmailLogs();
    } catch (err: any) {
      showToast({
        title: 'Sequence Trigger Failed',
        message: err?.message || 'SMTP Handler Error',
        type: 'error'
      });
    } finally {
      setIsTriggeringSequence(false);
    }
  };

  // Hydrate full orders once authorized
  React.useEffect(() => {
    if (isAuthenticated) {
      api.getOrders()
        .then((data) => {
          if (data && data.length > 0) {
            data.forEach((o) => onUpdateOrder(o));
          }
        })
        .catch(() => {});
    }
  }, [isAuthenticated]);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminAuthError('');
    setIsAuthenticating(true);
    try {
      const res = await api.adminLogin({
        email: adminEmailInput,
        password: adminPasswordInput,
        accessKey: adminPasswordInput
      });
      if (res.success && res.token) {
        setIsAuthenticated(true);
        showToast({
          title: 'Authorized',
          message: 'Staff session verified. Welcome to the Operations Console.',
          type: 'success'
        });
      }
    } catch (err: any) {
      setAdminAuthError(err?.message || 'Invalid administrator credentials. Access restricted.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleAdminLogout = () => {
    api.adminLogout();
    setIsAuthenticated(false);
    showToast({
      title: 'Session Ended',
      message: 'Logged out of administrator console.',
      type: 'info'
    });
    onCloseAdmin();
  };

  React.useEffect(() => {
    fetch('/api/orders/db-status')
      .then(res => res.json())
      .then(data => {
        if (data?.database) {
          setDbStatus(data.database);
        }
      })
      .catch(() => {});
  }, [activeTab]);

  const handleCopySchemaSql = async () => {
    try {
      const res = await fetch('/api/orders/schema-sql');
      const text = await res.text();
      await navigator.clipboard.writeText(text);
      setCopiedSql(true);
      showToast({
        title: 'Schema Copied',
        message: 'Supabase PostgreSQL schema copied! Paste it into your Supabase SQL editor.',
        type: 'success'
      });
      setTimeout(() => setCopiedSql(false), 3000);
    } catch {
      showToast({
        title: 'Copy Failed',
        message: 'Please copy directly from supabase/schema.sql in your workspace.',
        type: 'error'
      });
    }
  };

  // Sync internal notes when current order changes
  React.useEffect(() => {
    if (currentOrder) {
      setEditNotes(currentOrder.internalNotes || '');
    }
  }, [currentOrder?.id]);

  // Section 25 Dashboard Cards Metrics
  const totalOrders = orders.length;
  const paidOrders = orders.filter((o) => o.payment.status === 'Paid').length;
  const processingCount = orders.filter((o) => o.status === 'Processing' || o.status === 'NMVTIS Check').length;
  const readyCount = orders.filter((o) => o.status === 'Ready').length;
  const completedRevenue = orders
    .filter((o) => o.status !== 'Refunded' && o.status !== 'Cancelled')
    .reduce((sum, o) => sum + o.total, 0);

  // Filtered orders list
  const filteredOrders = orders.filter((o) => {
    const matchesStatus = statusFilter === 'All' || o.status === statusFilter;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      o.orderNumber.toLowerCase().includes(q) ||
      o.vehicle.vinOrReg.toLowerCase().includes(q) ||
      o.customer.fullName.toLowerCase().includes(q) ||
      o.customer.email.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  // Master checkbox selection helpers
  const allFilteredSelected = filteredOrders.length > 0 && filteredOrders.every((o) => selectedOrderIds.includes(o.id));
  const someFilteredSelected = filteredOrders.some((o) => selectedOrderIds.includes(o.id)) && !allFilteredSelected;

  const handleToggleSelectAll = () => {
    if (allFilteredSelected) {
      const filteredIds = new Set(filteredOrders.map((o) => o.id));
      setSelectedOrderIds((prev) => prev.filter((id) => !filteredIds.has(id)));
    } else {
      const newIds = new Set([...selectedOrderIds, ...filteredOrders.map((o) => o.id)]);
      setSelectedOrderIds(Array.from(newIds));
    }
  };

  const handleToggleSelectOrder = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedOrderIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleClearSelection = () => {
    setSelectedOrderIds([]);
  };

  // Bulk Status Update Action ('Delivered' | 'Cancelled')
  const handleExecuteBulkUpdate = (targetStatus: 'Delivered' | 'Cancelled') => {
    if (selectedOrderIds.length === 0) return;
    setIsProcessingBulkAction(true);
    const now = new Date().toISOString();
    const count = selectedOrderIds.length;

    const ordersToUpdate = orders.filter((o) => selectedOrderIds.includes(o.id));
    const updatedList: Order[] = ordersToUpdate.map((ord, idx) => ({
      ...ord,
      status: targetStatus,
      updatedAt: now,
      auditLogs: [
        ...(ord.auditLogs || []),
        {
          id: `log-${Date.now()}-${idx}`,
          timestamp: now,
          actor: 'Admin Specialist (Bulk Action)',
          action: `Bulk Status: ${targetStatus}`,
          details: `Order status set to ${targetStatus} via bulk operations toolbar`
        }
      ]
    }));

    if (onBatchUpdateOrders) {
      onBatchUpdateOrders(updatedList);
    } else {
      updatedList.forEach((uo) => onUpdateOrder(uo));
    }

    setSelectedOrderIds([]);
    setShowBulkCancelModal(false);
    setIsProcessingBulkAction(false);

    showToast({
      type: targetStatus === 'Delivered' ? 'success' : 'warning',
      title: 'Bulk Status Updated',
      message: `Successfully marked ${count} ${count === 1 ? 'order' : 'orders'} as '${targetStatus}'.`,
      duration: 4000
    });
  };

  // Filtered dispatched emails list
  const filteredEmails = dispatchedEmails.filter((em) => {
    const matchesStage =
      emailStageFilter === 'All'
        ? true
        : emailStageFilter === 'Confirmation'
        ? em.type === 'order_confirmation'
        : emailStageFilter === 'In-Progress'
        ? em.type === 'processing'
        : em.type === 'report_ready';

    const q = emailSearchQuery.toLowerCase();
    const matchesSearch =
      !emailSearchQuery.trim() ||
      em.recipientEmail.toLowerCase().includes(q) ||
      em.subject.toLowerCase().includes(q) ||
      em.orderNumber.toLowerCase().includes(q);

    return matchesStage && matchesSearch;
  });

  // Action: Save Internal Notes
  const handleSaveNotes = () => {
    if (!currentOrder) return;
    const now = new Date().toISOString();
    const updated: Order = {
      ...currentOrder,
      internalNotes: editNotes,
      updatedAt: now,
      auditLogs: [
        ...currentOrder.auditLogs,
        {
          id: `log-${Date.now()}`,
          timestamp: now,
          actor: 'Admin Specialist',
          action: 'Updated Internal Notes',
          details: 'Internal fulfillment comments updated'
        }
      ]
    };
    onUpdateOrder(updated);
    setNotesSaved(true);
    setTimeout(() => setNotesSaved(false), 2500);
  };

  // Action: Mark Processing (Section 25)
  const handleMarkProcessing = () => {
    if (!currentOrder) return;
    const now = new Date().toISOString();
    const updated: Order = {
      ...currentOrder,
      status: 'Processing',
      updatedAt: now,
      auditLogs: [
        ...currentOrder.auditLogs,
        {
          id: `log-${Date.now()}`,
          timestamp: now,
          actor: 'Admin Specialist',
          action: 'Status -> Processing',
          details: 'Order queued with authorized verification sources'
        }
      ]
    };
    onUpdateOrder(updated);

    showToast({
      type: 'info',
      title: 'Status Updated',
      message: `Order #${currentOrder.orderNumber} is now Processing.`,
      duration: 3500,
    });
  };

  // Action: Attach Report / Confirm Upload (Section 25)
  const handleConfirmUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOrder) return;
    const now = new Date().toISOString();
    const fileName = uploadedFileName.trim() || `${currentOrder.vehicle.make}-${currentOrder.vehicle.vinOrReg}-Report.pdf`;
    const fileUrl = uploadedFileUrl.trim() || `https://reports.autoaudit.com/secure/${currentOrder.orderNumber}.pdf`;

    const updated: Order = {
      ...currentOrder,
      status: 'Ready',
      resultFile: {
        fileName,
        fileUrl,
        uploadedAt: now,
        type: 'pdf',
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      },
      updatedAt: now,
      auditLogs: [
        ...currentOrder.auditLogs,
        {
          id: `log-${Date.now()}`,
          timestamp: now,
          actor: 'Admin Specialist',
          action: 'Report Attached',
          details: `Attached report file: ${fileName}`
        }
      ]
    };
    onUpdateOrder(updated);
    setShowUploadModal(false);
    setUploadedFileName('');
    setUploadedFileUrl('');

    showToast({
      type: 'success',
      title: 'Report Attached',
      message: `Report file attached to Order #${currentOrder.orderNumber}. Status set to Ready.`,
      duration: 4000,
    });
  };

  // Action: Mark Ready directly
  const handleMarkReady = () => {
    if (!currentOrder) return;
    const now = new Date().toISOString();
    const updated: Order = {
      ...currentOrder,
      status: 'Ready',
      resultFile: currentOrder.resultFile || {
        fileName: `${currentOrder.vehicle.make}-${currentOrder.vehicle.vinOrReg}-Report.pdf`,
        fileUrl: `https://reports.autoaudit.com/secure/${currentOrder.orderNumber}.pdf`,
        uploadedAt: now,
        type: 'pdf'
      },
      updatedAt: now,
      auditLogs: [
        ...currentOrder.auditLogs,
        {
          id: `log-${Date.now()}`,
          timestamp: now,
          actor: 'Admin Specialist',
          action: 'Marked Ready',
          details: 'Official report verified and marked ready for dispatch'
        }
      ]
    };
    onUpdateOrder(updated);

    showToast({
      type: 'success',
      title: 'Order Ready',
      message: `Order #${currentOrder.orderNumber} is ready for customer delivery.`,
      duration: 3500,
    });
  };

  // Action: Mark Delivered / Send Email (Section 25)
  const handleConfirmSendEmail = (subject: string, body: string) => {
    if (!currentOrder) return;
    const now = new Date().toISOString();
    const updated: Order = {
      ...currentOrder,
      status: 'Delivered',
      updatedAt: now,
      auditLogs: [
        ...currentOrder.auditLogs,
        {
          id: `log-${Date.now()}`,
          timestamp: now,
          actor: 'Admin Specialist',
          action: 'Result Dispatched',
          details: `Dispatched "Report Ready" email to ${currentOrder.customer.email}`
        }
      ]
    };
    onUpdateOrder(updated);

    const readyEmail: EmailNotification = {
      id: `em-${Date.now()}`,
      orderId: currentOrder.id,
      orderNumber: currentOrder.orderNumber,
      recipientEmail: currentOrder.customer.email,
      recipientType: 'customer',
      subject,
      type: 'report_ready',
      body,
      sentAt: now
    };
    onSendEmail(readyEmail);
    setShowEmailPreviewModal(false);

    showToast({
      type: 'success',
      title: 'Email Dispatched',
      message: `Report sent to ${currentOrder.customer.email}.`,
      duration: 4000,
    });
  };

  // Action: Complete Order (Section 25)
  const handleCompleteOrder = () => {
    if (!currentOrder) return;
    const now = new Date().toISOString();
    const updated: Order = {
      ...currentOrder,
      status: 'Completed',
      updatedAt: now,
      auditLogs: [
        ...currentOrder.auditLogs,
        {
          id: `log-${Date.now()}`,
          timestamp: now,
          actor: 'Admin Specialist',
          action: 'Order Completed',
          details: 'Fulfillment successfully closed'
        }
      ]
    };
    onUpdateOrder(updated);

    showToast({
      type: 'success',
      title: 'Order Completed',
      message: `Order #${currentOrder.orderNumber} closed as completed.`,
      duration: 3500,
    });
  };

  // Action: Issue Refund
  const handleIssueRefund = () => {
    if (!currentOrder) return;
    if (!confirm(`Are you sure you want to issue a full refund of $${currentOrder.total.toFixed(2)} to ${currentOrder.customer.fullName}?`)) {
      return;
    }

    const now = new Date().toISOString();
    const updated: Order = {
      ...currentOrder,
      status: 'Refunded',
      payment: {
        ...currentOrder.payment,
        status: 'Refunded'
      },
      updatedAt: now,
      auditLogs: [
        ...currentOrder.auditLogs,
        {
          id: `log-${Date.now()}`,
          timestamp: now,
          actor: 'Admin Specialist',
          action: 'Refund Issued',
          details: `Processed $${currentOrder.total.toFixed(2)} full refund`
        }
      ]
    };
    onUpdateOrder(updated);

    showToast({
      type: 'warning',
      title: 'Refund Processed',
      message: `$${currentOrder.total.toFixed(2)} refunded for Order #${currentOrder.orderNumber}.`,
      duration: 5000,
    });
  };

  const getStatusBadge = (status: Order['status']) => {
    switch (status) {
      case 'Pending Payment':
        return <span className="text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded text-[11px] font-semibold">Pending</span>;
      case 'Paid / New':
        return <span className="text-blue-800 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded text-[11px] font-semibold">Paid / New</span>;
      case 'Processing':
      case 'NMVTIS Check':
        return <span className="text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded text-[11px] font-semibold">Processing</span>;
      case 'Ready':
        return <span className="text-[#059669] bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded text-[11px] font-bold">Ready</span>;
      case 'Delivered':
        return <span className="text-[#059669] bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded text-[11px] font-bold">Delivered</span>;
      case 'Completed':
        return <span className="text-slate-700 bg-slate-100 border border-slate-300 px-2.5 py-0.5 rounded text-[11px] font-bold">Completed</span>;
      case 'Refunded':
        return <span className="text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded text-[11px] font-semibold">Refunded</span>;
      case 'Cancelled':
        return <span className="text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded text-[11px] font-semibold">Cancelled</span>;
      default:
        return <span className="text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded text-[11px]">{status}</span>;
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0B132B] flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-700/50 overflow-hidden">
          <div className="bg-slate-900 px-6 py-6 text-white text-center border-b border-slate-800">
            <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center mx-auto mb-3 text-blue-400">
              <Lock className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold tracking-tight">AutoAudit Staff Console</h2>
            <p className="text-xs text-slate-400 mt-1">
              Restricted to authorized fulfillment specialists and platform administrators.
            </p>
          </div>

          <form onSubmit={handleAdminLogin} className="p-6 space-y-4">
            {adminAuthError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{adminAuthError}</span>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">Staff Email</label>
              <input
                type="email"
                value={adminEmailInput}
                onChange={(e) => setAdminEmailInput(e.target.value)}
                placeholder="admin@autoaudit.com"
                required
                className="w-full h-11 px-3.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-blue-600"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">Access Key / Password</label>
              <input
                type="password"
                value={adminPasswordInput}
                onChange={(e) => setAdminPasswordInput(e.target.value)}
                placeholder="Enter access passphrase"
                required
                className="w-full h-11 px-3.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-blue-600"
              />
            </div>

            <div className="p-3 bg-blue-50/80 border border-blue-100 rounded-xl text-[11px] text-blue-900 leading-snug">
              <strong>Pre-configured staff credentials:</strong><br />
              Email: <code className="font-mono text-blue-800">admin@autoaudit.com</code><br />
              Access Key: <code className="font-mono text-blue-800">AutoAudit2026!</code>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <button
                type="submit"
                disabled={isAuthenticating}
                className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition-colors shadow-sm disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
              >
                {isAuthenticating ? (
                  <span>Verifying Authorization...</span>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Authorize Session</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onCloseAdmin}
                className="w-full h-10 text-slate-600 hover:text-slate-900 text-xs font-semibold rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancel and Return to Website
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col md:flex-row font-sans">
      
      {/* Dark Navy Sidebar (Section 25: #0B132B) */}
      <aside className="w-full md:w-64 bg-[#0B132B] text-slate-300 flex flex-col justify-between border-r border-[#1E293B] shrink-0">
        <div className="p-5 space-y-6">
          
          {/* Logo & Brand */}
          <div className="pb-4 border-b border-[#1E293B] flex items-center justify-between">
            <Logo variant="navbar" size="sm" theme="dark" />
            <span className="text-[10px] bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded font-mono font-bold">
              ADMIN
            </span>
          </div>

          {/* Menu Items (Section 25: Dashboard, Orders, Customers, Services, Reports, Payments, Settings) */}
          <nav className="space-y-1 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-colors cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-[#2563EB] text-white shadow-sm'
                  : 'text-slate-300 hover:bg-[#0F172A] hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('orders')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-colors cursor-pointer ${
                activeTab === 'orders'
                  ? 'bg-[#2563EB] text-white shadow-sm'
                  : 'text-slate-300 hover:bg-[#0F172A] hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <ShoppingBag className="w-4 h-4" />
                <span>Orders</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                {orders.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('customers')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-colors cursor-pointer ${
                activeTab === 'customers'
                  ? 'bg-[#2563EB] text-white shadow-sm'
                  : 'text-slate-300 hover:bg-[#0F172A] hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Customers</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('services')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-colors cursor-pointer ${
                activeTab === 'services'
                  ? 'bg-[#2563EB] text-white shadow-sm'
                  : 'text-slate-300 hover:bg-[#0F172A] hover:text-white'
              }`}
            >
              <Tag className="w-4 h-4" />
              <span>Services</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('reports')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-colors cursor-pointer ${
                activeTab === 'reports'
                  ? 'bg-[#2563EB] text-white shadow-sm'
                  : 'text-slate-300 hover:bg-[#0F172A] hover:text-white'
              }`}
            >
              <FileCheck className="w-4 h-4" />
              <span>Reports</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('payments')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-colors cursor-pointer ${
                activeTab === 'payments'
                  ? 'bg-[#2563EB] text-white shadow-sm'
                  : 'text-slate-300 hover:bg-[#0F172A] hover:text-white'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>Payments</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('emails')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-colors cursor-pointer ${
                activeTab === 'emails'
                  ? 'bg-[#2563EB] text-white shadow-sm'
                  : 'text-slate-300 hover:bg-[#0F172A] hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4" />
                <span>Mock SMTP</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                {dispatchedEmails.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('contact-analytics')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-colors cursor-pointer ${
                activeTab === 'contact-analytics'
                  ? 'bg-[#2563EB] text-white shadow-sm'
                  : 'text-slate-300 hover:bg-[#0F172A] hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <WhatsAppIcon className="w-4 h-4 text-[#25D366]" />
                <span>Contact Analytics</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                LIVE
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-colors cursor-pointer ${
                activeTab === 'settings'
                  ? 'bg-[#2563EB] text-white shadow-sm'
                  : 'text-slate-300 hover:bg-[#0F172A] hover:text-white'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </button>
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-5 border-t border-[#1E293B] space-y-2">
          <button
            type="button"
            onClick={handleAdminLogout}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-rose-300 hover:text-white hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer"
          >
            <Lock className="w-4 h-4 text-rose-400" />
            <span>Lock & Sign Out</span>
          </button>

          <button
            type="button"
            onClick={onCloseAdmin}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-slate-300 hover:text-white hover:bg-[#0F172A] rounded-xl transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Exit to Website</span>
          </button>
        </div>
      </aside>

      {/* Main Admin Content Area */}
      <main className="flex-1 flex flex-col overflow-y-auto">
        
        {/* Top Navbar */}
        <header className="bg-white border-b border-[#E2E8F0] px-6 py-4 flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-lg font-bold text-slate-900 capitalize">
              {activeTab} Management
            </h1>
            <p className="text-xs text-slate-500">
              Manage fulfillment queues, inspect audit logs, and dispatch customer reports.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onViewSampleReport}
              className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
            >
              Preview Sample PDF
            </button>
            <button
              type="button"
              onClick={onCloseAdmin}
              className="px-3.5 py-1.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              Back to Site
            </button>
          </div>
        </header>

        <div className="p-6 space-y-6 flex-1">
          
          {/* TAB 1: DASHBOARD (Section 25 Cards: Total Orders, Paid Orders, Processing, Ready, Completed Revenue) */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              
              {/* The 5 Cards */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-xs space-y-1">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    Total Orders
                  </span>
                  <p className="text-2xl font-black text-slate-900 font-mono">{totalOrders}</p>
                  <span className="text-[10px] text-slate-400">All registered</span>
                </div>

                <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-xs space-y-1">
                  <span className="text-[11px] font-bold text-[#059669] uppercase tracking-wider block">
                    Paid Orders
                  </span>
                  <p className="text-2xl font-black text-[#059669] font-mono">{paidOrders}</p>
                  <span className="text-[10px] text-slate-400">Verified payment</span>
                </div>

                <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-xs space-y-1">
                  <span className="text-[11px] font-bold text-[#2563EB] uppercase tracking-wider block">
                    Processing
                  </span>
                  <p className="text-2xl font-black text-[#2563EB] font-mono">{processingCount}</p>
                  <span className="text-[10px] text-slate-400">In records queue</span>
                </div>

                <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-xs space-y-1">
                  <span className="text-[11px] font-bold text-purple-600 uppercase tracking-wider block">
                    Ready
                  </span>
                  <p className="text-2xl font-black text-purple-600 font-mono">{readyCount}</p>
                  <span className="text-[10px] text-slate-400">Ready to dispatch</span>
                </div>

                <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-xs space-y-1 col-span-2 md:col-span-1">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    Completed Revenue
                  </span>
                  <p className="text-2xl font-black text-slate-900 font-mono">${completedRevenue.toFixed(2)}</p>
                  <span className="text-[10px] text-slate-400">Gross processed</span>
                </div>
              </div>

              {/* Recharts Daily Order Volume & Traffic Pattern Line Chart Dashboard */}
              <AdminOrderAnalyticsDashboard
                orders={orders}
                onSelectOrder={(id) => {
                  setSelectedOrderId(id);
                  setActiveTab('orders');
                }}
              />

              {/* Quick Jump to Orders */}
              <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-xs flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Active Fulfillment Queue</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    There are {processingCount} orders in the data retrieval queue requiring admin report compilation.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('orders')}
                  className="px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Open Orders Table →
                </button>
              </div>

            </div>
          )}

          {/* TAB 2: ORDERS (Section 25: Orders Table + One-Screen Order Detail) */}
          {(activeTab === 'orders' || activeTab === 'reports') && (
            <div className="space-y-6">
              
              {/* Filter & Search Bar */}
              <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] flex flex-col sm:flex-row gap-3 items-center justify-between shadow-xs">
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  {['All', 'Paid / New', 'Processing', 'Ready', 'Delivered', 'Completed', 'Cancelled', 'Refunded'].map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setStatusFilter(status)}
                      className={`px-3 py-1.5 rounded-lg font-semibold cursor-pointer transition-colors ${
                        statusFilter === status
                          ? 'bg-[#0B132B] text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>

                <div className="relative w-full sm:w-72">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search order, VIN, customer..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-[#2563EB]"
                  />
                </div>
              </div>

              {/* Bulk Selection Action Bar */}
              {selectedOrderIds.length > 0 && (
                <div className="bg-[#0B132B] text-white p-3.5 sm:p-4 rounded-xl border border-blue-500/40 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-blue-600/30 border border-blue-500/50 flex items-center justify-center text-blue-400 shrink-0">
                      <CheckCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-bold text-white">
                          {selectedOrderIds.length} {selectedOrderIds.length === 1 ? 'order' : 'orders'} selected
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                          Bulk Mode Active
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 block mt-0.5">
                        Select an action below to update all chosen orders in a single operation.
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Bulk Action 1: Mark as Delivered */}
                    <button
                      type="button"
                      disabled={isProcessingBulkAction}
                      onClick={() => handleExecuteBulkUpdate('Delivered')}
                      className="px-3.5 py-2 bg-[#059669] hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
                      title="Mark all selected orders as Delivered"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Mark as Delivered ({selectedOrderIds.length})</span>
                    </button>

                    {/* Bulk Action 2: Mark as Cancelled */}
                    <button
                      type="button"
                      disabled={isProcessingBulkAction}
                      onClick={() => setShowBulkCancelModal(true)}
                      className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
                      title="Mark all selected orders as Cancelled"
                    >
                      <Ban className="w-3.5 h-3.5" />
                      <span>Mark as Cancelled ({selectedOrderIds.length})</span>
                    </button>

                    {/* Deselect All */}
                    <button
                      type="button"
                      onClick={handleClearSelection}
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Deselect All</span>
                    </button>
                  </div>
                </div>
              )}

              {/* SECTION 25: Orders Table (Columns: Checkbox, Order ID, Customer, Vehicle, Service, Amount, Payment, Status, Created, Actions) */}
              <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-xs overflow-hidden">
                <div className="px-6 py-4 border-b border-[#E2E8F0] flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <h3 className="text-sm font-bold text-slate-900">
                      Orders List ({filteredOrders.length})
                    </h3>
                    {selectedOrderIds.length > 0 && (
                      <span className="text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                        {selectedOrderIds.length} selected
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {filteredOrders.length > 0 && (
                      <button
                        type="button"
                        onClick={handleToggleSelectAll}
                        className="text-xs font-semibold text-[#2563EB] hover:underline cursor-pointer"
                      >
                        {allFilteredSelected ? 'Deselect All Visible' : 'Select All Visible'}
                      </button>
                    )}
                    <span className="text-xs text-slate-400">
                      · Click row to view fulfillment details
                    </span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#F8FAFC] text-slate-500 font-semibold border-b border-[#E2E8F0]">
                      <tr>
                        <th className="py-3 px-3 w-10 text-center">
                          <input
                            type="checkbox"
                            checked={allFilteredSelected}
                            ref={(el) => {
                              if (el) el.indeterminate = someFilteredSelected;
                            }}
                            onChange={handleToggleSelectAll}
                            className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer accent-[#2563EB]"
                            title={allFilteredSelected ? 'Deselect all visible' : 'Select all visible'}
                            aria-label="Select all orders in current view"
                          />
                        </th>
                        <th className="py-3 px-4">Order ID</th>
                        <th className="py-3 px-4">Customer</th>
                        <th className="py-3 px-4">Vehicle</th>
                        <th className="py-3 px-4">Service</th>
                        <th className="py-3 px-4">Amount</th>
                        <th className="py-3 px-4">Payment</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Created</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredOrders.map((ord) => {
                        const isSelected = selectedOrderIds.includes(ord.id);
                        return (
                          <tr
                            key={ord.id}
                            onClick={() => setSelectedOrderId(ord.id)}
                            className={`hover:bg-slate-50 cursor-pointer transition-colors ${
                              isSelected
                                ? 'bg-blue-50/70 border-l-4 border-l-[#2563EB]'
                                : currentOrder?.id === ord.id
                                ? 'bg-blue-50/40'
                                : ''
                            }`}
                          >
                            <td className="py-3 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleToggleSelectOrder(ord.id)}
                                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer accent-[#2563EB]"
                                aria-label={`Select order ${ord.orderNumber}`}
                              />
                            </td>
                            <td className="py-3 px-4 font-mono font-bold text-slate-900">
                              {ord.orderNumber}
                            </td>
                            <td className="py-3 px-4">
                              <span className="font-semibold text-slate-900 block">{ord.customer.fullName}</span>
                              <span className="text-[11px] text-slate-400 truncate max-w-[140px] block">{ord.customer.email}</span>
                            </td>
                            <td className="py-3 px-4">
                              <span className="font-semibold text-slate-800 block">
                                {ord.vehicle.year} {ord.vehicle.make} {ord.vehicle.model}
                              </span>
                              <span className="text-[11px] text-slate-400 font-mono block">
                                {ord.vehicle.vinOrReg}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-medium text-slate-700">
                              {ord.serviceName}
                            </td>
                            <td className="py-3 px-4 font-mono font-bold text-slate-900">
                              ${ord.total.toFixed(2)}
                            </td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                ord.payment.status === 'Paid'
                                  ? 'bg-emerald-50 text-[#059669] border border-emerald-200'
                                  : 'bg-slate-100 text-slate-600'
                              }`}>
                                {ord.payment.status}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              {getStatusBadge(ord.status)}
                            </td>
                            <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                              {new Date(ord.createdAt).toLocaleDateString()}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedOrderId(ord.id);
                                }}
                                className="px-2.5 py-1 rounded bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-[11px] font-semibold cursor-pointer"
                              >
                                Manage
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* SECTION 25: Admin Order Detail Page (Customer details, Vehicle details, Service, Payment status, Order status, Internal notes, Report URL, Workflow actions) */}
              {currentOrder && (
                <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-xs space-y-6">
                  
                  {/* Header & Status */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E2E8F0]">
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
                          Order {currentOrder.orderNumber}
                        </h3>
                        {getStatusBadge(currentOrder.status)}
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Service: <strong className="text-slate-900">{currentOrder.serviceName}</strong> · Placed on {new Date(currentOrder.createdAt).toLocaleString()}
                      </p>
                    </div>

                    {/* Section 25 Workflow Actions: Mark Processing, Attach Report, Mark Ready, Mark Delivered, Complete Order */}
                    <div className="flex flex-wrap items-center gap-2">
                      {currentOrder.status === 'Paid / New' && (
                        <button
                          type="button"
                          onClick={handleMarkProcessing}
                          className="px-3.5 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <Clock className="w-3.5 h-3.5" />
                          <span>Mark Processing</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setShowUploadModal(true)}
                        className="px-3.5 py-2 bg-[#0B132B] hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>{currentOrder.resultFile ? 'Update Report File' : 'Attach Report'}</span>
                      </button>

                      {currentOrder.status === 'Processing' && (
                        <button
                          type="button"
                          onClick={handleMarkReady}
                          className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Mark Ready</span>
                        </button>
                      )}

                      {currentOrder.resultFile && currentOrder.status !== 'Completed' && (
                        <button
                          type="button"
                          onClick={() => setShowEmailPreviewModal(true)}
                          className="px-3.5 py-2 bg-[#059669] hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Mark Delivered (Send Email)</span>
                        </button>
                      )}

                      {currentOrder.status === 'Delivered' && (
                        <button
                          type="button"
                          onClick={handleCompleteOrder}
                          className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Complete Order</span>
                        </button>
                      )}

                      {currentOrder.status !== 'Refunded' && (
                        <button
                          type="button"
                          onClick={handleIssueRefund}
                          className="px-2.5 py-2 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                          title="Cancel & Refund"
                        >
                          Refund
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 4-Stage Fulfillment Progress Bar */}
                  <OrderTrackingProgressBar
                    status={currentOrder.status}
                    hasResultFile={!!currentOrder.resultFile}
                    orderNumber={currentOrder.orderNumber}
                    createdAt={currentOrder.createdAt}
                    updatedAt={currentOrder.updatedAt}
                  />

                  {/* Customer Details & Vehicle Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
                    
                    {/* Customer Details */}
                    <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4 space-y-2">
                      <span className="font-bold text-slate-900 uppercase tracking-wider text-[11px] block">
                        Customer Details
                      </span>
                      <div className="space-y-1 text-slate-700">
                        <p><strong>Name:</strong> {currentOrder.customer.fullName}</p>
                        <p><strong>Email:</strong> <span className="text-blue-700 font-mono">{currentOrder.customer.email}</span></p>
                        <p><strong>Phone:</strong> {currentOrder.customer.phone || 'Not provided'}</p>
                      </div>
                    </div>

                    {/* Vehicle Details */}
                    <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4 space-y-2">
                      <span className="font-bold text-slate-900 uppercase tracking-wider text-[11px] block">
                        Vehicle Details
                      </span>
                      <div className="space-y-1 text-slate-700">
                        <p><strong>Identifier / VIN:</strong> <span className="font-mono font-bold text-slate-900">{currentOrder.vehicle.vinOrReg}</span></p>
                        <p><strong>Make / Model / Year:</strong> {currentOrder.vehicle.year} {currentOrder.vehicle.make} {currentOrder.vehicle.model}</p>
                        <p><strong>Mileage:</strong> {currentOrder.vehicle.mileage || 'Not provided'}</p>
                        <p><strong>Region:</strong> {currentOrder.vehicle.countryOrState || 'Global / USA'}</p>
                      </div>
                    </div>

                  </div>

                  {/* Service, Payment Status & Report Result URL */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
                    
                    {/* Payment & Service Summary */}
                    <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4 space-y-2">
                      <span className="font-bold text-slate-900 uppercase tracking-wider text-[11px] block">
                        Service & Payment Status
                      </span>
                      <div className="space-y-1 text-slate-700">
                        <p><strong>Plan:</strong> {currentOrder.serviceName}</p>
                        <p><strong>Payment Status:</strong> <span className="text-[#059669] font-bold">{currentOrder.payment.status}</span></p>
                        <p><strong>Total Amount:</strong> <span className="font-mono font-bold text-slate-900">${currentOrder.total.toFixed(2)} USD</span></p>
                        <p><strong>Transaction Ref:</strong> <span className="font-mono text-slate-500">{currentOrder.payment.gatewayRef || 'None'}</span></p>
                      </div>
                    </div>

                    {/* Report File / Result URL */}
                    <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4 space-y-2">
                      <span className="font-bold text-slate-900 uppercase tracking-wider text-[11px] block">
                        Report / Result URL
                      </span>
                      {currentOrder.resultFile ? (
                        <div className="space-y-1.5">
                          <p className="text-[#059669] font-bold flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>File Attached & Sealed</span>
                          </p>
                          <p className="font-mono text-[11px] text-slate-600 truncate">
                            {currentOrder.resultFile.fileName}
                          </p>
                          <a
                            href={currentOrder.resultFile.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[#2563EB] hover:underline font-semibold text-[11px]"
                          >
                            <span>Open Direct Report URL</span>
                            <Eye className="w-3 h-3" />
                          </a>
                        </div>
                      ) : (
                        <div className="space-y-1 text-slate-500">
                          <p>No report file attached yet.</p>
                          <button
                            type="button"
                            onClick={() => setShowUploadModal(true)}
                            className="text-xs text-[#2563EB] hover:underline font-semibold cursor-pointer"
                          >
                            + Attach Report PDF
                          </button>
                        </div>
                      )}
                    </div>

                  </div>

                  {/* Automated SMTP Email Sequence & Notification Action Bar */}
                  <div className="bg-blue-50/60 border border-blue-200/80 rounded-xl p-4 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 uppercase tracking-wider text-[11px] block">
                            Automated Email Sequence (Mock SMTP)
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] bg-blue-100 text-blue-700 font-semibold font-mono">
                            Nodemailer Engine
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Dispatches 3-stage lifecycle to <strong>{currentOrder.customer.email}</strong>: Confirmation → In-Progress (4s) → Report Ready (8s)
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          disabled={isTriggeringSequence}
                          onClick={() => handleTriggerEmailSequence(currentOrder.id)}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>{isTriggeringSequence ? 'Triggering...' : 'Trigger 3-Stage Sequence'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowEmailPreviewModal(true)}
                          className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <Mail className="w-3.5 h-3.5" />
                          <span>Compose One-Off</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Section 25: Internal Notes */}
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                        Internal Fulfillment Notes
                      </label>
                      {notesSaved && (
                        <span className="text-[11px] text-[#059669] font-bold">✓ Notes saved</span>
                      )}
                    </div>
                    <textarea
                      rows={3}
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      placeholder="Add private investigation findings, Copart auction lot numbers, or NMVTIS lookup notes..."
                      className="w-full p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs text-slate-800 focus:outline-none focus:border-[#2563EB]"
                    />
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={handleSaveNotes}
                        className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                      >
                        Save Internal Notes
                      </button>
                    </div>
                  </div>

                </div>
              )}

            </div>
          )}

          {/* TAB 3: CUSTOMERS */}
          {activeTab === 'customers' && (
            <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-xs space-y-4">
              <h3 className="text-base font-bold text-slate-900">Registered Customer Accounts</h3>
              <p className="text-xs text-slate-500">
                Customers who have placed orders or created accounts on AutoAudit.
              </p>
              <div className="divide-y divide-slate-100 text-xs">
                {orders.map((o) => (
                  <div key={o.id} className="py-3 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900 block">{o.customer.fullName}</span>
                      <span className="text-slate-500 font-mono">{o.customer.email}</span>
                    </div>
                    <span className="text-xs font-semibold text-slate-600">
                      Order: {o.orderNumber}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: SERVICES */}
          {activeTab === 'services' && (
            <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-xs space-y-4">
              <h3 className="text-base font-bold text-slate-900">Configured Report Plans</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {services.map((s) => (
                  <div key={s.id} className="p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
                    <h4 className="font-bold text-sm text-slate-900">{s.name}</h4>
                    <p className="text-2xl font-black text-slate-900 font-mono">${s.price.toFixed(2)}</p>
                    <p className="text-slate-600">{s.tagline}</p>
                    <span className="text-[11px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded font-semibold block w-fit">
                      {s.deliveryTime}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: PAYMENTS */}
          {activeTab === 'payments' && (
            <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-xs space-y-4">
              <h3 className="text-base font-bold text-slate-900">Payment Transactions</h3>
              <div className="divide-y divide-slate-100 text-xs">
                {orders.map((o) => (
                  <div key={o.id} className="py-3 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900 block font-mono">{o.payment.gatewayRef || `TXN-${o.orderNumber}`}</span>
                      <span className="text-slate-500">{o.customer.fullName} · {o.payment.method || 'Card'}</span>
                    </div>
                    <span className="font-mono font-bold text-[#059669] text-sm">
                      +${o.total.toFixed(2)} USD
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: CONTACT & WHATSAPP ANALYTICS */}
          {activeTab === 'contact-analytics' && (
            <ContactAnalyticsTab />
          )}

          {/* TAB 6: SETTINGS */}
          {activeTab === 'settings' && (
            <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-xs space-y-5 text-xs">
              <div>
                <h3 className="text-base font-bold text-slate-900">Platform Settings & Integrations</h3>
                <p className="text-slate-500 text-xs mt-0.5">Manage live database connections, clearinghouse gateways, and dispatch services.</p>
              </div>

              {/* Database Status Card */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600">
                      <Database className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-sm text-slate-900 block">
                        {dbStatus?.type || 'PostgreSQL / In-Memory Engine'}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {dbStatus?.isSupabaseConnected 
                          ? (dbStatus?.tablesReady ? 'PostgreSQL cloud database connected & synchronized' : 'Cloud project connected · Table initialization pending')
                          : 'Running in high-speed local memory mode with client persistence'}
                      </span>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                    dbStatus?.isSupabaseConnected && dbStatus?.tablesReady
                      ? 'bg-emerald-100 text-emerald-800'
                      : dbStatus?.isSupabaseConnected
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {dbStatus?.isSupabaseConnected 
                      ? (dbStatus?.tablesReady ? 'Supabase Active' : 'Setup Schema') 
                      : 'Local Memory Active'}
                  </span>
                </div>

                {dbStatus?.isSupabaseConnected && !dbStatus?.tablesReady && (
                  <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg space-y-2 text-amber-900">
                    <p className="text-[11px] leading-relaxed">
                      <strong>Next Step:</strong> Your Supabase credentials are valid, but the <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">orders</code> table does not exist in PostgreSQL yet. Copy the SQL schema below and run it once in your Supabase SQL Editor.
                    </p>
                    <button
                      type="button"
                      onClick={handleCopySchemaSql}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-md font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      {copiedSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedSql ? 'SQL Copied!' : 'Copy SQL Schema for Supabase'}</span>
                    </button>
                  </div>
                )}

                <div className="pt-1 flex flex-wrap gap-2 text-[11px] text-slate-600">
                  <span className="bg-white px-2.5 py-1 rounded border border-slate-200 font-mono">
                    Orders in Memory: <strong>{dbStatus?.orderCount ?? orders.length}</strong>
                  </span>
                  <span className="bg-white px-2.5 py-1 rounded border border-slate-200 font-mono">
                    Coupons: <strong>{dbStatus?.couponCount ?? coupons.length}</strong>
                  </span>
                  <span className="bg-white px-2.5 py-1 rounded border border-slate-200 font-mono">
                    Emails Logged: <strong>{dbStatus?.emailCount ?? emails.length}</strong>
                  </span>
                </div>
              </div>

              <div className="space-y-3 max-w-md">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="font-bold block text-slate-800">NMVTIS Clearing Gateway</span>
                  <span className="text-slate-500 text-[11px]">Authorized state title brand clearing API connection (Active)</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="font-bold block text-slate-800">Email Notification Dispatcher</span>
                  <span className="text-slate-500 text-[11px]">Automated dispatch to customer registered email addresses</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 8: MOCK SMTP & EMAIL NOTIFICATIONS */}
          {activeTab === 'emails' && (
            <div className="space-y-6">
              
              {/* Header Card with Nodemailer SMTP Status */}
              <div className="bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-xs space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h3 className="text-base font-bold text-slate-900">
                        Mock SMTP Service & Automated Email Sequences
                      </h3>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        ● Nodemailer Active
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Automated 3-stage lifecycle dispatch (Confirmation → In-Progress → Ready) via mock SMTP JSON transporter with zero network latency.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={fetchEmailLogs}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer self-start"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Refresh Logs</span>
                  </button>
                </div>

                {/* SMTP Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-slate-100 text-xs">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Transport Driver</span>
                    <span className="font-bold text-slate-900 mt-0.5 block">{smtpStatus?.mode || 'Nodemailer JSON Transporter'}</span>
                    <span className="text-[10px] text-slate-400">Zero-Timeout Mock Pipeline</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Lifecycle Sequence</span>
                    <span className="font-bold text-blue-700 mt-0.5 block">3 Stages Automated</span>
                    <span className="text-[10px] text-slate-400">Confirmation → In-Progress → Ready</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">System Sender</span>
                    <span className="font-mono text-slate-800 text-[11px] mt-0.5 block truncate">{smtpStatus?.sender || 'noreply@autoaudit.intelligence'}</span>
                    <span className="text-[10px] text-slate-400">DKIM & SPF Sealed</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Dispatched Outbox</span>
                    <span className="font-mono font-bold text-slate-900 text-sm mt-0.5 block">{dispatchedEmails.length} Emails</span>
                    <span className="text-[10px] text-emerald-600 font-semibold">100% Mock Delivery</span>
                  </div>
                </div>
              </div>

              {/* Filters & Search */}
              <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] flex flex-col sm:flex-row gap-3 items-center justify-between shadow-xs">
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  {['All', 'Confirmation', 'In-Progress', 'Report Ready'].map((stage) => (
                    <button
                      key={stage}
                      type="button"
                      onClick={() => setEmailStageFilter(stage)}
                      className={`px-3 py-1.5 rounded-lg font-semibold cursor-pointer transition-colors ${
                        emailStageFilter === stage
                          ? 'bg-[#0B132B] text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {stage}
                    </button>
                  ))}
                </div>

                <div className="relative w-full sm:w-72">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={emailSearchQuery}
                    onChange={(e) => setEmailSearchQuery(e.target.value)}
                    placeholder="Search by recipient or order #..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-[#2563EB]"
                  />
                </div>
              </div>

              {/* Dispatched Emails Table */}
              <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-xs overflow-hidden">
                <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900">
                    Dispatched Email Outbox ({filteredEmails.length})
                  </h4>
                  <span className="text-xs text-slate-400">
                    Click "Preview" to inspect rendered HTML template & message headers
                  </span>
                </div>

                {filteredEmails.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400">
                    No emails matching filter criteria. Place an order or trigger a lifecycle sequence from the Orders tab.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#F8FAFC] text-slate-500 font-semibold border-b border-[#E2E8F0]">
                        <tr>
                          <th className="py-3 px-4">Stage / Type</th>
                          <th className="py-3 px-4">Subject</th>
                          <th className="py-3 px-4">Recipient</th>
                          <th className="py-3 px-4">Order Ref</th>
                          <th className="py-3 px-4">Nodemailer Message ID</th>
                          <th className="py-3 px-4">Sent At</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredEmails.map((em) => (
                          <tr key={em.id} className="hover:bg-slate-50 transition-colors">
                            <td className="py-3 px-4 whitespace-nowrap">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                em.type === 'order_confirmation'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : em.type === 'processing'
                                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                  : 'bg-purple-50 text-purple-700 border border-purple-200'
                              }`}>
                                {em.type === 'order_confirmation' ? '1. Confirmation' : em.type === 'processing' ? '2. In-Progress' : '3. Ready'}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-semibold text-slate-900 max-w-xs truncate">
                              {em.subject}
                            </td>
                            <td className="py-3 px-4 font-mono text-slate-700">
                              {em.recipientEmail}
                            </td>
                            <td className="py-3 px-4 font-mono font-bold text-slate-800">
                              {em.orderNumber}
                            </td>
                            <td className="py-3 px-4 font-mono text-[10px] text-slate-400 truncate max-w-[120px]">
                              {em.messageId || em.id}
                            </td>
                            <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                              {new Date(em.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </td>
                            <td className="py-3 px-4 text-right whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => setSelectedEmailForView(em)}
                                className="px-2.5 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer inline-flex items-center gap-1"
                              >
                                <Eye className="w-3 h-3" />
                                <span>Preview</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

            </div>
          )}

        </div>
      </main>

      {/* Modal: Attach Report File (Section 25) */}
      {showUploadModal && currentOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 text-xs border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h4 className="font-bold text-sm text-slate-900">Attach Vehicle History Report</h4>
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmUpload} className="space-y-3">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">PDF File Name</label>
                <input
                  type="text"
                  value={uploadedFileName}
                  onChange={(e) => setUploadedFileName(e.target.value)}
                  placeholder={`${currentOrder.vehicle.make}-${currentOrder.vehicle.vinOrReg}-Report.pdf`}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Secure Storage URL</label>
                <input
                  type="text"
                  value={uploadedFileUrl}
                  onChange={(e) => setUploadedFileUrl(e.target.value)}
                  placeholder={`https://reports.autoaudit.com/secure/${currentOrder.orderNumber}.pdf`}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-lg font-semibold"
                >
                  Attach & Mark Ready
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Preview & Send Email Modal */}
      {showEmailPreviewModal && currentOrder && (
        <EmailPreviewModal
          isOpen={showEmailPreviewModal}
          onClose={() => setShowEmailPreviewModal(false)}
          order={currentOrder}
          onConfirmSend={handleConfirmSendEmail}
        />
      )}

      {/* Modal: View Dispatched Mock SMTP Email (HTML + Plain Text Inspector) */}
      {selectedEmailForView && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fade-in">
          <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-base">Mock SMTP Message Inspector</span>
                  <span className="text-[10px] bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded font-mono">
                    Nodemailer Delivered
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Message ID: <span className="font-mono text-slate-300">{selectedEmailForView.messageId || selectedEmailForView.id}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEmailForView(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Email Meta Ribbon */}
            <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 text-xs space-y-1">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <div>
                  <span className="text-slate-500 font-semibold">Subject: </span>
                  <strong className="text-slate-900">{selectedEmailForView.subject}</strong>
                </div>
                <div className="text-slate-500 font-mono text-[11px]">
                  {new Date(selectedEmailForView.sentAt).toLocaleString()}
                </div>
              </div>
              <div className="flex flex-wrap gap-4 text-slate-600">
                <div>
                  <span className="text-slate-400">To: </span>
                  <strong className="text-blue-700 font-mono">{selectedEmailForView.recipientEmail}</strong>
                </div>
                <div>
                  <span className="text-slate-400">Order: </span>
                  <strong className="text-slate-800 font-mono">{selectedEmailForView.orderNumber}</strong>
                </div>
                <div>
                  <span className="text-slate-400">Transport: </span>
                  <strong className="text-emerald-700">{selectedEmailForView.smtpTransport || 'Nodemailer Mock SMTP'}</strong>
                </div>
              </div>
            </div>

            {/* Tab Selector */}
            <div className="px-6 pt-3 border-b border-slate-200 flex gap-2">
              <button
                type="button"
                onClick={() => setEmailPreviewTab('html')}
                className={`pb-2 px-3 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
                  emailPreviewTab === 'html'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Rendered HTML Email
              </button>
              <button
                type="button"
                onClick={() => setEmailPreviewTab('text')}
                className={`pb-2 px-3 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
                  emailPreviewTab === 'text'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Plain Text Version
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto flex-1 bg-slate-100/50">
              {emailPreviewTab === 'html' && selectedEmailForView.htmlBody ? (
                <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                  <iframe
                    title="Rendered Email HTML"
                    srcDoc={selectedEmailForView.htmlBody}
                    className="w-full h-[460px] border-0"
                    sandbox="allow-same-origin"
                  />
                </div>
              ) : (
                <pre className="bg-white p-4 rounded-xl border border-slate-200 text-xs font-mono text-slate-800 whitespace-pre-wrap leading-relaxed">
                  {selectedEmailForView.body}
                </pre>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-3 bg-white border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedEmailForView(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold cursor-pointer"
              >
                Close Inspector
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Bulk Cancel Confirmation Modal */}
      {showBulkCancelModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-6 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
                <Ban className="w-6 h-6" />
              </div>

              <div className="space-y-1">
                <h3 className="text-base sm:text-lg font-bold text-slate-900">Confirm Bulk Cancellation</h3>
                <p className="text-xs text-slate-500">
                  Are you sure you want to mark <strong className="text-slate-900">{selectedOrderIds.length} {selectedOrderIds.length === 1 ? 'order' : 'orders'}</strong> as <strong className="text-rose-600">'Cancelled'</strong>?
                </p>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-left text-xs max-h-36 overflow-y-auto space-y-1.5">
                <span className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Selected Orders ({selectedOrderIds.length}):
                </span>
                {orders
                  .filter((o) => selectedOrderIds.includes(o.id))
                  .map((o) => (
                    <div key={o.id} className="flex items-center justify-between text-slate-700 font-mono text-[11px] pb-1 border-b border-slate-200/50 last:border-0 last:pb-0">
                      <span>{o.orderNumber} ({o.customer.fullName})</span>
                      <span className="font-bold text-slate-900">${o.total.toFixed(2)}</span>
                    </div>
                  ))}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBulkCancelModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  No, Keep Orders
                </button>
                <button
                  type="button"
                  disabled={isProcessingBulkAction}
                  onClick={() => handleExecuteBulkUpdate('Cancelled')}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Ban className="w-3.5 h-3.5" />
                  <span>Yes, Cancel {selectedOrderIds.length} Orders</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
