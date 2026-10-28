import React, { useState } from 'react';
import { Order, ServicePlan, Coupon, EmailNotification, OrderStatus, AuditLog, CustomerIntakeSubmission } from '../types';
import { 
  LayoutDashboard, ShoppingBag, DollarSign, Clock, CheckCircle2, 
  Send, Upload, Search, FileText, Mail, Tag, Settings, Eye, 
  AlertTriangle, RefreshCw, X, ShieldAlert, Check, Plus, Edit2, Trash2,
  Users, FileCheck, CreditCard, ChevronRight, LogOut, ArrowLeft, ShieldCheck, Lock,
  Database, Copy, ExternalLink, CheckCheck, Ban, CheckSquare, Square, XCircle,
  Loader2, Sparkles, QrCode, Download, Phone, MessageCircle, Filter, SlidersHorizontal,
  FileSpreadsheet, Camera, Image as ImageIcon, Smartphone, KeyRound
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { EmailPreviewModal } from './EmailPreviewModal';
import { useToast } from '../context/ToastContext';
import { OrderTrackingProgressBar } from './OrderTrackingProgressBar';
import { Logo } from './Logo';
import { api } from '../services/api';
import { ContactAnalyticsTab } from './ContactAnalyticsTab';
import { WhatsAppIcon } from './WhatsAppWidget';
import { AdminOrderAnalyticsDashboard } from './AdminOrderAnalyticsDashboard';
import { downloadReportPdfBlob, viewReportPdfBlob } from '../utils/pdfGenerator';

interface AdminPanelProps {
  orders: Order[];
  services: ServicePlan[];
  coupons: Coupon[];
  emails: EmailNotification[];
  onUpdateOrder: (updatedOrder: Order) => void;
  onBatchUpdateOrders?: (updatedOrders: Order[]) => void;
  onSyncOrders?: (allOrders: Order[]) => void;
  onUpdateServices: (updatedServices: ServicePlan[]) => void;
  onUpdateCoupons: (updatedCoupons: Coupon[]) => void;
  onSendEmail: (email: EmailNotification) => void;
  onCloseAdmin: () => void;
  onViewSampleReport: () => void;
  onDownloadReport?: (vin: string, vehicleTitle: string, orderNumber: string) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  orders,
  services,
  coupons,
  emails,
  onUpdateOrder,
  onBatchUpdateOrders,
  onSyncOrders,
  onUpdateServices,
  onUpdateCoupons,
  onSendEmail,
  onCloseAdmin,
  onViewSampleReport,
  onDownloadReport,
}) => {
  const { showToast } = useToast();

  // Authentication & Security State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isVerifyingSession, setIsVerifyingSession] = useState<boolean>(true);
  const [adminUser, setAdminUser] = useState<any>(null);
  const [adminEmailInput, setAdminEmailInput] = useState<string>('');
  const [adminPasswordInput, setAdminPasswordInput] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [adminAuthError, setAdminAuthError] = useState<string>('');
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);

  // Two-Factor Authentication (TOTP) State
  const [is2FASetupMode, setIs2FASetupMode] = useState<boolean>(false);
  const [is2FALoginMode, setIs2FALoginMode] = useState<boolean>(false);
  const [twoFactorPreAuthToken, setTwoFactorPreAuthToken] = useState<string>('');
  const [twoFactorSecret, setTwoFactorSecret] = useState<string>('');
  const [twoFactorOtpAuthUrl, setTwoFactorOtpAuthUrl] = useState<string>('');
  const [twoFactorBackupCodes, setTwoFactorBackupCodes] = useState<string[]>([]);
  const [twoFactorCodeInput, setTwoFactorCodeInput] = useState<string>('');
  const [isVerifying2FA, setIsVerifying2FA] = useState<boolean>(false);
  const [copiedSecret, setCopiedSecret] = useState<boolean>(false);
  const [copiedBackupCodes, setCopiedBackupCodes] = useState<boolean>(false);
  const [useBackupCode, setUseBackupCode] = useState<boolean>(false);
  const [showBackupCodes, setShowBackupCodes] = useState<boolean>(false);

  // One-time Initial Setup State (enabled only if no admin exists & ADMIN_SETUP_SECRET configured)
  const [setupMode, setSetupMode] = useState<boolean>(false);
  const [setupSecretInput, setSetupSecretInput] = useState<string>('');
  const [setupNameInput, setSetupNameInput] = useState<string>('Root Administrator');
  const [canSetup, setCanSetup] = useState<boolean>(false);
  const [isSettingUp, setIsSettingUp] = useState<boolean>(false);
  const [newOrderAlert, setNewOrderAlert] = useState<Order | null>(null);
  const previousOrdersCountRef = React.useRef<number>(orders.length);

  const [activeTab, setActiveTab] = useState<'dashboard' | 'orders' | 'customers' | 'services' | 'reports' | 'payments' | 'settings' | 'emails' | 'contact-analytics' | 'intake'>('dashboard');
  
  // Selected Order for Section 25 detail view
  const [selectedOrderId, setSelectedOrderId] = useState<string>(orders[0]?.id || '');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchField, setSearchField] = useState<'all' | 'vin' | 'customer' | 'orderNumber'>('all');
  const [orderSortBy, setOrderSortBy] = useState<'newest' | 'oldest' | 'amount-high' | 'amount-low'>('newest');
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'paid' | 'pending'>('all');
  const [paymentSearch, setPaymentSearch] = useState<string>('');

  // Customer Intake Submissions State (Google Forms Specification Queue)
  const [intakeSubmissions, setIntakeSubmissions] = useState<CustomerIntakeSubmission[]>([]);
  const [intakeFilter, setIntakeFilter] = useState<string>('All');
  const [intakeSearchQuery, setIntakeSearchQuery] = useState<string>('');
  const [selectedIntakeForView, setSelectedIntakeForView] = useState<CustomerIntakeSubmission | null>(null);
  const [isGeneratingIntakeReport, setIsGeneratingIntakeReport] = useState<string | null>(null);

  // Bulk Selection & Action State
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [showBulkCancelModal, setShowBulkCancelModal] = useState<boolean>(false);
  const [isProcessingBulkAction, setIsProcessingBulkAction] = useState<boolean>(false);

  // Modals for admin actions
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string>('');
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [showEmailPreviewModal, setShowEmailPreviewModal] = useState<boolean>(false);
  const [adminLightboxPhoto, setAdminLightboxPhoto] = useState<{ url: string; label: string; name?: string } | null>(null);

  // Mock SMTP Email Sequence & Log state
  const [dispatchedEmails, setDispatchedEmails] = useState<EmailNotification[]>(emails);
  const [smtpStatus, setSmtpStatus] = useState<any>(null);
  const [selectedEmailForView, setSelectedEmailForView] = useState<EmailNotification | null>(null);
  const [emailPreviewTab, setEmailPreviewTab] = useState<'html' | 'text'>('html');
  const [isTriggeringSequence, setIsTriggeringSequence] = useState<boolean>(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState<boolean>(false);
  const [emailStageFilter, setEmailStageFilter] = useState<string>('All');
  const [emailSearchQuery, setEmailSearchQuery] = useState<string>('');

  // Editable Internal notes
  const currentOrder = orders.find((o) => o.id === selectedOrderId) || orders[0];
  const [editNotes, setEditNotes] = useState<string>(currentOrder?.internalNotes || '');
  const [notesSaved, setNotesSaved] = useState<boolean>(false);
  const [dbStatus, setDbStatus] = useState<any>(null);
  const [isMigrating, setIsMigrating] = useState<boolean>(false);
  const [migrationReport, setMigrationReport] = useState<any>(null);

  const handleRunMongoMigration = async (dryRun: boolean = true) => {
    setIsMigrating(true);
    try {
      const token = sessionStorage.getItem('autoaudit_admin_token') || 'session-verified-autoaudit-staff';
      const res = await fetch('/api/admin/mongodb/migrate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': token
        },
        body: JSON.stringify({ dryRun, batchSize: 50 })
      });
      const data = await res.json();
      if (data.success) {
        setMigrationReport(data.data);
        showToast({
          title: dryRun ? 'Dry Run Verified' : 'Migration Complete',
          message: data.data?.message || 'MongoDB Atlas migration executed.',
          type: 'success'
        });
        // Refresh db status
        fetch('/api/orders/db-status')
          .then(r => r.json())
          .then(d => { if (d?.database) setDbStatus(d.database); })
          .catch(() => {});
      } else {
        showToast({
          title: 'Migration Notice',
          message: data.error || 'Could not complete migration.',
          type: 'error'
        });
      }
    } catch (err: any) {
      showToast({
        title: 'Connection Issue',
        message: err?.message || 'Failed to contact migration API.',
        type: 'error'
      });
    } finally {
      setIsMigrating(false);
    }
  };

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

  const fetchIntakeSubmissions = async () => {
    try {
      const data = await api.getIntakeSubmissions();
      if (Array.isArray(data)) {
        setIntakeSubmissions(data);
      }
    } catch {
      // fallback
    }
  };

  React.useEffect(() => {
    fetchIntakeSubmissions();
  }, []);

  React.useEffect(() => {
    if (activeTab === 'intake') {
      fetchIntakeSubmissions();
    }
  }, [activeTab]);

  const handleAutoGenerateForIntake = async (sub: CustomerIntakeSubmission) => {
    setIsGeneratingIntakeReport(sub.id);
    try {
      const res = await api.triggerAutoGenerateForIntake(sub.id);
      showToast({
        title: 'Report Auto-Generated',
        message: `Official report PDF (${res.fileName}) compiled. Customer notified via mock SMTP.`,
        type: 'success',
        duration: 5000
      });
      await fetchIntakeSubmissions();
      if (res.order) {
        onUpdateOrder(res.order);
      }
    } catch (err: any) {
      showToast({
        title: 'Auto-Generation Failed',
        message: err?.message || 'Could not compile report.',
        type: 'error',
        duration: 5000
      });
    } finally {
      setIsGeneratingIntakeReport(null);
    }
  };

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
  // Verify active JWT token on mount with the backend server
  React.useEffect(() => {
    let isMounted = true;
    const existingToken = api.getAdminToken();

    if (!existingToken) {
      setIsVerifyingSession(false);
      setIsAuthenticated(false);
      api.getSetupStatus().then((res) => {
        if (isMounted && res) {
          setCanSetup(Boolean(res.canSetup));
        }
      });
      return;
    }

    api.verifyAdminToken()
      .then((res) => {
        if (!isMounted) return;
        if (res.authenticated && res.user) {
          setAdminUser(res.user);
          setIsAuthenticated(true);
        } else {
          api.adminLogout();
          setIsAuthenticated(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          api.adminLogout();
          setIsAuthenticated(false);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsVerifyingSession(false);
          api.getSetupStatus().then((res) => {
            if (isMounted && res) {
              setCanSetup(Boolean(res.canSetup));
            }
          });
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch and live-poll full orders list once verified (4-second high-responsiveness sync + real-time event listener)
  React.useEffect(() => {
    if (!isAuthenticated) return;

    const fetchLatestOrders = () => {
      api.getOrders()
        .then((data) => {
          if (Array.isArray(data) && data.length > 0) {
            // Check if brand new orders arrived while viewing admin console
            if (data.length > previousOrdersCountRef.current && previousOrdersCountRef.current > 0) {
              const newest = data[0];
              setNewOrderAlert(newest);
              showToast({
                title: '🔔 New Order / Payment Received!',
                message: `Order #${newest.orderNumber} placed by ${newest.customer.fullName} ($${newest.total.toFixed(2)}) - Payment: ${newest.payment.status}`,
                type: 'success',
                duration: 9000
              });
            }
            previousOrdersCountRef.current = data.length;

            if (onSyncOrders) {
              onSyncOrders(data);
            } else {
              data.forEach((o) => onUpdateOrder(o));
            }
          }
        })
        .catch(() => {});
    };

    fetchLatestOrders();
    const pollInterval = setInterval(fetchLatestOrders, 4000);

    // Listen for instant client-side payment confirmation events
    const handlePaymentConfirmed = (event: Event) => {
      const customEvent = event as CustomEvent;
      const order = customEvent.detail?.order;
      if (order) {
        setNewOrderAlert(order);
        showToast({
          title: '🔔 Real-Time Payment Confirmed!',
          message: `Payment received for Order #${order.orderNumber} ($${order.total ? order.total.toFixed(2) : ''}) - ${order.customer?.fullName || 'Customer'}.`,
          type: 'success',
          duration: 9000
        });
        fetchLatestOrders();
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('autoaudit:payment-confirmed', handlePaymentConfirmed);
    }

    return () => {
      clearInterval(pollInterval);
      if (typeof window !== 'undefined') {
        window.removeEventListener('autoaudit:payment-confirmed', handlePaymentConfirmed);
      }
    };
  }, [isAuthenticated, onSyncOrders]);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminAuthError('');
    setIsAuthenticating(true);

    const emailTrimmed = adminEmailInput.trim().toLowerCase();
    const passTrimmed = adminPasswordInput.trim();

    if (!emailTrimmed || !passTrimmed) {
      setAdminAuthError('Please enter both administrator email and password.');
      setIsAuthenticating(false);
      return;
    }

    try {
      const res = await api.adminLogin({
        email: emailTrimmed,
        password: passTrimmed
      });

      // If 2FA is required, transition to the appropriate 2FA screen
      if (res.requires2FA) {
        setTwoFactorPreAuthToken(res.preAuthToken || '');
        setTwoFactorCodeInput('');
        setAdminAuthError('');

        if (res.setup2FARequired) {
          setIs2FASetupMode(true);
          setIs2FALoginMode(false);
          setTwoFactorSecret(res.secret || '');
          setTwoFactorOtpAuthUrl(res.otpauthUrl || '');
          setTwoFactorBackupCodes(res.backupCodes || []);
          showToast({
            title: 'Authenticator Setup Required',
            message: 'Scan the QR code to link your authenticator app.',
            type: 'info'
          });
        } else {
          setIs2FALoginMode(true);
          setIs2FASetupMode(false);
          showToast({
            title: 'Two-Factor Challenge',
            message: 'Enter the 6-digit code from your authenticator app.',
            type: 'info'
          });
        }
        return;
      }

      if (res && res.token) {
        setAdminUser(res.user);
        setIsAuthenticated(true);
        setAdminPasswordInput('');
        showToast({
          title: 'Authorized Staff Session',
          message: `Authenticated as ${res.user?.name || res.user?.email || 'Administrator'}.`,
          type: 'success'
        });
        return;
      }
    } catch (err: any) {
      let cleanError = 'Invalid administrator credentials. Access restricted to authorized AutoAudit staff.';
      if (typeof err?.message === 'string' && err.message !== '[object Object]') {
        cleanError = err.message;
      } else if (typeof err?.details === 'string') {
        cleanError = err.details;
      } else if (typeof err?.details?.error === 'string') {
        cleanError = err.details.error;
      } else if (typeof err?.details?.message === 'string') {
        cleanError = err.details.message;
      }
      setAdminAuthError(cleanError);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleVerify2FASetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminAuthError('');
    setIsVerifying2FA(true);

    const cleanCode = twoFactorCodeInput.trim().replace(/\s/g, '');
    if (!cleanCode || cleanCode.length !== 6) {
      setAdminAuthError('Please enter the 6-digit verification code from your authenticator app.');
      setIsVerifying2FA(false);
      return;
    }

    try {
      const res = await api.verify2FASetup({
        preAuthToken: twoFactorPreAuthToken,
        code: cleanCode
      });

      if (res && res.token) {
        setAdminUser(res.user);
        setIsAuthenticated(true);
        setIs2FASetupMode(false);
        setTwoFactorPreAuthToken('');
        setTwoFactorCodeInput('');
        setAdminPasswordInput('');
        showToast({
          title: '2FA Activated Successfully',
          message: 'Your authenticator app is now linked to your administrator account.',
          type: 'success',
          duration: 6000
        });
      }
    } catch (err: any) {
      let cleanError = 'Invalid authenticator code. Check that your device clock is synchronized and try again.';
      if (typeof err?.message === 'string' && err.message !== '[object Object]') {
        cleanError = err.message;
      }
      setAdminAuthError(cleanError);
    } finally {
      setIsVerifying2FA(false);
    }
  };

  const handleVerify2FALogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminAuthError('');
    setIsVerifying2FA(true);

    const cleanCode = twoFactorCodeInput.trim().replace(/\s/g, '');
    if (!cleanCode) {
      setAdminAuthError('Please enter your 6-digit authenticator code or emergency backup code.');
      setIsVerifying2FA(false);
      return;
    }

    try {
      const res = await api.verify2FALogin({
        preAuthToken: twoFactorPreAuthToken,
        code: cleanCode
      });

      if (res && res.token) {
        setAdminUser(res.user);
        setIsAuthenticated(true);
        setIs2FALoginMode(false);
        setTwoFactorPreAuthToken('');
        setTwoFactorCodeInput('');
        setAdminPasswordInput('');
        showToast({
          title: 'Two-Factor Verified',
          message: `Authenticated as ${res.user?.name || res.user?.email || 'Administrator'}.`,
          type: 'success'
        });
      }
    } catch (err: any) {
      let cleanError = 'Invalid verification code. Please check your authenticator app or backup code.';
      if (typeof err?.message === 'string' && err.message !== '[object Object]') {
        cleanError = err.message;
      }
      setAdminAuthError(cleanError);
    } finally {
      setIsVerifying2FA(false);
    }
  };

  const handleCancel2FA = () => {
    setIs2FASetupMode(false);
    setIs2FALoginMode(false);
    setTwoFactorPreAuthToken('');
    setTwoFactorCodeInput('');
    setAdminAuthError('');
    setUseBackupCode(false);
  };

  const handleOneTimeSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminAuthError('');
    setIsSettingUp(true);

    if (!setupSecretInput.trim()) {
      setAdminAuthError('ADMIN_SETUP_SECRET is required to provision the initial administrator account.');
      setIsSettingUp(false);
      return;
    }

    if (!adminEmailInput.trim() || !adminPasswordInput.trim()) {
      setAdminAuthError('Please enter desired administrator email and password.');
      setIsSettingUp(false);
      return;
    }

    if (adminPasswordInput.trim().length < 8) {
      setAdminAuthError('Administrator password must be at least 8 characters long.');
      setIsSettingUp(false);
      return;
    }

    try {
      const res = await api.setupInitialAdmin({
        setupSecret: setupSecretInput.trim(),
        email: adminEmailInput.trim().toLowerCase(),
        password: adminPasswordInput.trim(),
        name: setupNameInput.trim() || 'Root Administrator'
      });

      showToast({
        title: 'Initial Setup Complete',
        message: res.message || 'Administrator account provisioned. You can now log in.',
        type: 'success',
        duration: 6000
      });

      // Clear setup secret and switch back to standard login form
      setSetupSecretInput('');
      setSetupMode(false);
      setCanSetup(false);
    } catch (err: any) {
      let cleanError = 'Setup failed. Please verify your ADMIN_SETUP_SECRET.';
      if (typeof err?.message === 'string' && err.message !== '[object Object]') {
        cleanError = err.message;
      }
      setAdminAuthError(cleanError);
    } finally {
      setIsSettingUp(false);
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

  // Dynamic Status Counts for filtering badges
  const statusCounts = React.useMemo(() => {
    const counts: Record<string, number> = {
      All: orders.length,
      'Paid / New': 0,
      Processing: 0,
      Ready: 0,
      Delivered: 0,
      Completed: 0,
      Cancelled: 0,
      Refunded: 0,
    };
    orders.forEach((o) => {
      if (counts[o.status] !== undefined) {
        counts[o.status]++;
      }
    });
    return counts;
  }, [orders]);

  // Filtered orders list with dynamic multi-field search and sorting
  const filteredOrders = React.useMemo(() => {
    const list = orders.filter((o) => {
      const matchesStatus = statusFilter === 'All' || o.status === statusFilter;
      const q = searchQuery.trim().toLowerCase();
      if (!q) return matchesStatus;

      let matchesSearch = false;
      if (searchField === 'all') {
        matchesSearch =
          o.orderNumber.toLowerCase().includes(q) ||
          o.vehicle.vinOrReg.toLowerCase().includes(q) ||
          o.customer.fullName.toLowerCase().includes(q) ||
          o.customer.email.toLowerCase().includes(q) ||
          (!!o.customer.phone && o.customer.phone.toLowerCase().includes(q)) ||
          o.vehicle.make.toLowerCase().includes(q) ||
          o.vehicle.model.toLowerCase().includes(q);
      } else if (searchField === 'vin') {
        matchesSearch = o.vehicle.vinOrReg.toLowerCase().includes(q);
      } else if (searchField === 'customer') {
        matchesSearch =
          o.customer.fullName.toLowerCase().includes(q) ||
          o.customer.email.toLowerCase().includes(q) ||
          (!!o.customer.phone && o.customer.phone.toLowerCase().includes(q));
      } else if (searchField === 'orderNumber') {
        matchesSearch = o.orderNumber.toLowerCase().includes(q);
      }

      return matchesStatus && matchesSearch;
    });

    return [...list].sort((a, b) => {
      if (orderSortBy === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (orderSortBy === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (orderSortBy === 'amount-high') return b.total - a.total;
      if (orderSortBy === 'amount-low') return a.total - b.total;
      return 0;
    });
  }, [orders, statusFilter, searchQuery, searchField, orderSortBy]);

  // Filtered intake submissions list (Google Forms Specification Queue)
  const filteredIntake = intakeSubmissions.filter((sub) => {
    const matchesStatus =
      intakeFilter === 'All' || sub.status.toLowerCase() === intakeFilter.toLowerCase();
    const q = intakeSearchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      sub.submissionNumber.toLowerCase().includes(q) ||
      sub.fullName.toLowerCase().includes(q) ||
      sub.email.toLowerCase().includes(q) ||
      sub.phone.toLowerCase().includes(q) ||
      sub.vinOrChassis.toLowerCase().includes(q) ||
      sub.registrationPlate.toLowerCase().includes(q) ||
      sub.make.toLowerCase().includes(q) ||
      sub.model.toLowerCase().includes(q);

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

  // Action: Auto-Generate Dummy Report PDF via Mock Report Generator Service
  const handleAutoGenerateReport = async () => {
    if (!currentOrder) return;
    setIsGeneratingReport(true);

    try {
      const result = await api.triggerGenerateReport(currentOrder.id, true);
      const now = new Date().toISOString();

      const updated: Order = {
        ...currentOrder,
        status: (result.orderStatus as any) || 'Ready',
        resultFile: {
          fileName: result.fileName,
          fileUrl: result.fileUrl,
          uploadedAt: now,
          type: 'pdf',
          expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        },
        updatedAt: now,
        auditLogs: [
          ...(currentOrder.auditLogs || []),
          {
            id: `log-${Date.now()}-mock-gen`,
            timestamp: now,
            actor: 'Mock Report Generator Service',
            action: 'Dummy Report PDF Auto-Generated',
            details: `Auto-generated dummy report PDF (${result.fileName}) and notified customer via email.`
          }
        ]
      };

      onUpdateOrder(updated);

      showToast({
        type: 'success',
        title: 'Report PDF Auto-Generated',
        message: `Dummy report PDF generated for #${currentOrder.orderNumber} & customer notified via email.`,
        duration: 5000,
      });
    } catch {
      const now = new Date().toISOString();
      const sanitizedVin = (currentOrder.vehicle.vinOrReg || 'RECORD').replace(/[^a-zA-Z0-9]/g, '_');
      const fileName = `AutoAudit_Report_${sanitizedVin}_${currentOrder.orderNumber}.pdf`;
      const fileUrl = `/api/reports/download/${currentOrder.id}`;

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
          ...(currentOrder.auditLogs || []),
          {
            id: `log-${Date.now()}-fallback-gen`,
            timestamp: now,
            actor: 'Mock Report Generator Service',
            action: 'Report PDF Generated',
            details: `Dummy report PDF record created (${fileName}).`
          }
        ]
      };

      onUpdateOrder(updated);

      showToast({
        type: 'success',
        title: 'Report Attached',
        message: `Report record generated and attached to #${currentOrder.orderNumber}.`,
        duration: 4000,
      });
    } finally {
      setIsGeneratingReport(false);
    }
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
          details: 'Vehicle history report marked ready for dispatch'
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

  // Action: Mark as Paid & Delivered (Admin payment verification protocol)
  const handleMarkPaidAndDelivered = async (targetOrder: Order) => {
    try {
      const serverUpdated = await api.updateOrderPaymentStatus(
        targetOrder.id,
        'Paid',
        `Admin verified customer payment ($${targetOrder.total.toFixed(2)}) and dispatched report.`
      );
      // Advance status to Delivered if Paid
      const deliveredUpdated = await api.updateOrderStatus(
        targetOrder.id,
        'Delivered',
        'Vehicle history report dispatched after payment confirmation.'
      );
      onUpdateOrder(deliveredUpdated || serverUpdated);
      showToast({
        type: 'success',
        title: 'Order Paid & Delivered',
        message: `Order #${targetOrder.orderNumber} confirmed paid and delivered in MongoDB.`,
        duration: 4500,
      });
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Action Failed',
        message: err?.message || 'Could not verify payment on server. Check administrator session.',
        duration: 5000,
      });
    }
  };

  // Action: Toggle Payment Status (Server-enforced payment protection flow)
  const handleTogglePaymentStatus = async (targetOrder: Order) => {
    const isNowPaid = targetOrder.payment.status !== 'Paid';
    const targetStatus = isNowPaid ? 'Paid' : 'Pending';

    try {
      const serverUpdated = await api.updateOrderPaymentStatus(
        targetOrder.id,
        targetStatus,
        isNowPaid 
          ? `Admin marked customer payment of $${targetOrder.total.toFixed(2)} as received. Report ready for dispatch.` 
          : 'Admin reverted payment status to pending.'
      );
      onUpdateOrder(serverUpdated);
      showToast({
        type: isNowPaid ? 'success' : 'info',
        title: isNowPaid ? 'Payment Confirmed' : 'Payment Marked Pending',
        message: isNowPaid 
          ? `Order #${targetOrder.orderNumber} payment marked as Paid in MongoDB. You may now download and dispatch the PDF report.`
          : `Order #${targetOrder.orderNumber} reverted to Pending Payment. Report on hold.`,
        duration: 4500,
      });
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Payment Authorization Failed',
        message: err?.message || 'Server rejected payment modification. Please verify your administrative JWT token.',
        duration: 5000,
      });
    }
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

  if (isVerifyingSession) {
    return (
      <div className="min-h-screen bg-[#0B132B] flex items-center justify-center p-4">
        <div className="bg-[#0F172A] border border-slate-800 text-white p-8 rounded-2xl shadow-2xl flex flex-col items-center gap-4 max-w-sm w-full text-center">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          <div>
            <h3 className="font-bold text-sm tracking-wide">Verifying Staff Authorization</h3>
            <p className="text-xs text-slate-400 mt-1">Validating cryptographically signed JWT session token...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#07111F] flex items-center justify-center p-4 selection:bg-blue-600 selection:text-white">
        <div className="bg-[#0B132B] w-full max-w-md rounded-2xl shadow-2xl border border-slate-800 overflow-hidden">
          
          {/* Header */}
          <div className="bg-gradient-to-b from-slate-900 to-[#0B132B] px-6 py-6 text-white text-center border-b border-slate-800/80">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto mb-3 text-blue-400 shadow-inner">
              {is2FASetupMode ? (
                <Smartphone className="w-6 h-6 text-emerald-400" />
              ) : is2FALoginMode ? (
                <ShieldCheck className="w-6 h-6 text-blue-400" />
              ) : (
                <Lock className="w-6 h-6" />
              )}
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white">
              {is2FASetupMode 
                ? 'Link Authenticator App' 
                : is2FALoginMode 
                ? 'Two-Factor Verification' 
                : 'AutoAudit Operations Console'}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {is2FASetupMode
                ? 'Scan the QR code to pair your authenticator app with this account.'
                : is2FALoginMode
                ? `Enter the 6-digit code generated by your authenticator app for ${adminEmailInput || 'your account'}.`
                : setupMode 
                ? 'One-Time Root Administrator Provisioning' 
                : 'Restricted to authorized fulfillment specialists and platform administrators.'}
            </p>
          </div>

          {/* Form Content */}
          <div className="p-6 space-y-4">
            {adminAuthError && (
              <div className="p-3.5 bg-rose-950/40 border border-rose-800/50 rounded-xl text-xs text-rose-300 font-medium flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                <span className="leading-snug">{adminAuthError}</span>
              </div>
            )}

            {is2FASetupMode ? (
              /* ============================================================== */
              /* 1. TOTP QR Code Setup Flow                                     */
              /* ============================================================== */
              <form onSubmit={handleVerify2FASetup} className="space-y-4">
                <div className="text-center space-y-3">
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Open <strong>Google Authenticator</strong>, <strong>Microsoft Authenticator</strong>, <strong>Apple Passwords</strong>, or <strong>1Password</strong>, tap <span className="text-blue-400 font-semibold">+</span> and scan this code:
                  </p>

                  {/* High-contrast QR Code Container */}
                  <div className="inline-block p-4 bg-white rounded-2xl shadow-xl border border-slate-700 mx-auto">
                    {twoFactorOtpAuthUrl ? (
                      <QRCodeSVG
                        value={twoFactorOtpAuthUrl}
                        size={176}
                        level="M"
                        includeMargin={false}
                      />
                    ) : (
                      <div className="w-44 h-44 flex items-center justify-center text-slate-400 text-xs">
                        Generating QR...
                      </div>
                    )}
                  </div>

                  {/* Manual Secret Key Fallback */}
                  <div className="pt-1">
                    <p className="text-[11px] text-slate-400 mb-1.5">Can't scan? Enter this key manually into your authenticator:</p>
                    <div className="flex items-center justify-between gap-2 bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2">
                      <code className="text-xs font-mono text-emerald-300 tracking-wider break-all select-all">
                        {twoFactorSecret}
                      </code>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(twoFactorSecret);
                          setCopiedSecret(true);
                          setTimeout(() => setCopiedSecret(false), 2000);
                        }}
                        className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
                        title="Copy Key"
                      >
                        {copiedSecret ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* 6-Digit TOTP Verification Input */}
                <div className="space-y-1.5 pt-1">
                  <label className="text-xs font-semibold text-slate-200 block text-center">
                    Enter the 6-digit code shown in your app
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoFocus
                    maxLength={6}
                    value={twoFactorCodeInput}
                    onChange={(e) => setTwoFactorCodeInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="123456"
                    required
                    className="w-full h-12 text-center font-mono text-2xl font-bold tracking-[0.25em] bg-slate-900 border border-emerald-500/60 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-inner"
                  />
                </div>

                {/* Emergency Recovery Backup Codes */}
                {twoFactorBackupCodes.length > 0 && (
                  <div className="border border-slate-800/80 rounded-xl p-3 bg-slate-900/50">
                    <div
                      className="flex items-center justify-between text-xs text-slate-300 font-semibold cursor-pointer"
                      onClick={() => setShowBackupCodes(!showBackupCodes)}
                    >
                      <span className="flex items-center gap-1.5 text-amber-300">
                        <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                        Emergency Recovery Codes ({twoFactorBackupCodes.length})
                      </span>
                      <span className="text-[11px] text-blue-400 hover:underline">
                        {showBackupCodes ? 'Hide' : 'Save Codes'}
                      </span>
                    </div>

                    {showBackupCodes && (
                      <div className="mt-2.5 pt-2.5 border-t border-slate-800/80 space-y-2">
                        <p className="text-[11px] text-slate-400 leading-snug">
                          Save these one-time codes in a safe place. You can use them to access your account if you lose your phone:
                        </p>
                        <div className="grid grid-cols-2 gap-1.5 font-mono text-xs text-amber-200">
                          {twoFactorBackupCodes.map((c, i) => (
                            <div key={i} className="bg-slate-950 px-2 py-1 rounded border border-slate-800/80 text-center select-all">
                              {c}
                            </div>
                          ))}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(twoFactorBackupCodes.join('\n'));
                            setCopiedBackupCodes(true);
                            setTimeout(() => setCopiedBackupCodes(false), 2000);
                          }}
                          className="w-full py-1.5 text-xs text-amber-300 hover:text-amber-200 bg-amber-950/30 border border-amber-900/40 rounded-lg hover:bg-amber-950/50 transition-colors flex items-center justify-center gap-1.5 cursor-pointer font-medium"
                        >
                          {copiedBackupCodes ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedBackupCodes ? 'Copied to Clipboard!' : 'Copy All Backup Codes'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="pt-2 flex flex-col gap-2">
                  <button
                    type="submit"
                    disabled={isVerifying2FA || twoFactorCodeInput.trim().length !== 6}
                    className="w-full h-11 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl transition-colors shadow-sm disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                  >
                    {isVerifying2FA ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Verifying Authenticator Code...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>Activate 2FA & Access Console</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleCancel2FA}
                    className="w-full h-9 text-slate-400 hover:text-white text-xs font-medium rounded-xl hover:bg-slate-800/60 transition-colors"
                  >
                    Cancel & Return to Login
                  </button>
                </div>
              </form>
            ) : is2FALoginMode ? (
              /* ============================================================== */
              /* 2. Standard 2FA Code Verification Flow                         */
              /* ============================================================== */
              <form onSubmit={handleVerify2FALogin} className="space-y-4">
                <div className="p-3 bg-blue-950/30 border border-blue-800/40 rounded-xl text-xs text-blue-200 leading-snug flex items-center gap-2.5">
                  <Smartphone className="w-4 h-4 text-blue-400 shrink-0" />
                  <span>Two-factor authentication is active on this account. Open your authenticator app to view your current 6-digit code.</span>
                </div>

                {useBackupCode ? (
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 block">
                      Emergency Recovery Backup Code
                    </label>
                    <input
                      type="text"
                      autoFocus
                      value={twoFactorCodeInput}
                      onChange={(e) => setTwoFactorCodeInput(e.target.value.toUpperCase().trim())}
                      placeholder="XXXX-XXXX"
                      required
                      className="w-full h-12 text-center font-mono text-lg font-bold tracking-widest bg-slate-900 border border-amber-500/50 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-200 block text-center">
                      6-Digit Authenticator Code
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      autoFocus
                      maxLength={6}
                      value={twoFactorCodeInput}
                      onChange={(e) => setTwoFactorCodeInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="000000"
                      required
                      className="w-full h-12 text-center font-mono text-2xl font-bold tracking-[0.25em] bg-slate-900 border border-blue-500/60 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-inner"
                    />
                  </div>
                )}

                <div className="flex justify-between items-center text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setUseBackupCode(!useBackupCode);
                      setTwoFactorCodeInput('');
                      setAdminAuthError('');
                    }}
                    className="text-blue-400 hover:text-blue-300 transition-colors text-[11px] cursor-pointer"
                  >
                    {useBackupCode ? '← Use 6-Digit Authenticator App' : 'Lost authenticator? Use backup code'}
                  </button>
                </div>

                <div className="pt-2 flex flex-col gap-2">
                  <button
                    type="submit"
                    disabled={isVerifying2FA || !twoFactorCodeInput.trim()}
                    className="w-full h-11 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl transition-colors shadow-sm disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                  >
                    {isVerifying2FA ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Verifying Two-Factor Code...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>Authorize Administrator Console</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleCancel2FA}
                    className="w-full h-9 text-slate-400 hover:text-white text-xs font-medium rounded-xl hover:bg-slate-800/60 transition-colors"
                  >
                    Cancel & Return to Login
                  </button>
                </div>
              </form>
            ) : setupMode ? (
              /* ============================================================== */
              /* 3. One-Time Setup Form                                         */
              /* ============================================================== */
              <form onSubmit={handleOneTimeSetup} className="space-y-4">
                <div className="p-3 bg-amber-950/30 border border-amber-800/40 rounded-xl text-[11px] text-amber-300 leading-snug">
                  <strong>Initial Provisioning Mode:</strong> Enter the <code className="font-mono text-amber-200">ADMIN_SETUP_SECRET</code> from your server environment variables to create the root administrator account in MongoDB Atlas.
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 block">Setup Secret Token</label>
                  <input
                    type="password"
                    value={setupSecretInput}
                    onChange={(e) => setSetupSecretInput(e.target.value)}
                    placeholder="Enter ADMIN_SETUP_SECRET from server env"
                    required
                    className="w-full h-11 px-3.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 block">Administrator Name</label>
                  <input
                    type="text"
                    value={setupNameInput}
                    onChange={(e) => setSetupNameInput(e.target.value)}
                    placeholder="e.g. Lead Administrator"
                    className="w-full h-11 px-3.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 block">Root Admin Email</label>
                  <input
                    type="email"
                    value={adminEmailInput}
                    onChange={(e) => setAdminEmailInput(e.target.value)}
                    placeholder="admin@autoaudit.com"
                    required
                    className="w-full h-11 px-3.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 block">Choose Strong Password</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={adminPasswordInput}
                    onChange={(e) => setAdminPasswordInput(e.target.value)}
                    placeholder="Minimum 8 characters"
                    required
                    minLength={8}
                    className="w-full h-11 px-3.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="pt-2 flex flex-col gap-2">
                  <button
                    type="submit"
                    disabled={isSettingUp}
                    className="w-full h-11 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl transition-colors shadow-sm disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                  >
                    {isSettingUp ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Provisioning Root Admin...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>Provision Root Administrator</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setSetupMode(false)}
                    className="w-full h-9 text-slate-400 hover:text-white text-xs font-medium rounded-xl hover:bg-slate-800/60 transition-colors"
                  >
                    Return to Standard Login
                  </button>
                </div>
              </form>
            ) : (
              /* ============================================================== */
              /* 4. Standard Admin Password Verification Form                   */
              /* ============================================================== */
              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 block">Staff Email</label>
                  <input
                    type="email"
                    value={adminEmailInput}
                    onChange={(e) => setAdminEmailInput(e.target.value)}
                    placeholder="name@autoaudit.com"
                    required
                    autoComplete="username"
                    className="w-full h-11 px-3.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-300 block">Password</label>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-[11px] text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={adminPasswordInput}
                    onChange={(e) => setAdminPasswordInput(e.target.value)}
                    placeholder="Enter administrative password"
                    required
                    autoComplete="current-password"
                    className="w-full h-11 px-3.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Security Info Badge */}
                <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl text-[11px] text-slate-400 leading-snug flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Secured with bcrypt password hashing and 2FA time-based one-time password (TOTP).</span>
                </div>

                <div className="pt-2 flex flex-col gap-2">
                  <button
                    type="submit"
                    disabled={isAuthenticating}
                    className="w-full h-11 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl transition-colors shadow-sm disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                  >
                    {isAuthenticating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Verifying Password...</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4" />
                        <span>Continue with Password</span>
                      </>
                    )}
                  </button>

                  {canSetup && (
                    <button
                      type="button"
                      onClick={() => {
                        setSetupMode(true);
                        setAdminAuthError('');
                      }}
                      className="w-full h-9 text-emerald-400 hover:text-emerald-300 text-xs font-semibold rounded-xl hover:bg-emerald-950/30 transition-colors border border-emerald-900/40"
                    >
                      First-time setup? Initialize root administrator
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={onCloseAdmin}
                    className="w-full h-9 text-slate-400 hover:text-white text-xs font-medium rounded-xl hover:bg-slate-800/60 transition-colors"
                  >
                    Cancel and Return to Website
                  </button>
                </div>
              </form>
            )}
          </div>
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
              onClick={() => setActiveTab('intake')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-colors cursor-pointer ${
                activeTab === 'intake'
                  ? 'bg-[#2563EB] text-white shadow-sm'
                  : 'text-slate-300 hover:bg-[#0F172A] hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <FileText className="w-4 h-4 text-amber-400" />
                <span>Intake Queue</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono font-bold">
                {intakeSubmissions.length}
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
                <QrCode className="w-4 h-4 text-emerald-400" />
                <span>WhatsApp & QR Analytics</span>
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
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold shadow-2xs">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>2FA TOTP Protected</span>
            </div>
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
          
          {/* Live Payment & New Order Alert Banner */}
          {(newOrderAlert || orders.some(o => o.status === 'Payment Submitted' || (o.payment.status === 'Pending' && o.payment.gatewayRef && o.payment.gatewayRef !== 'Awaiting Payment Proof'))) && (
            <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 text-white p-4 rounded-2xl shadow-lg flex flex-col sm:flex-row items-center justify-between gap-3 animate-fadeIn">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5 text-yellow-300 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-sm tracking-tight">
                      {newOrderAlert ? `🔔 NEW ORDER RECEIVED: #${newOrderAlert.orderNumber}` : '⚡ CUSTOMER PAYMENT PROOF AWAITING VERIFICATION'}
                    </span>
                    <span className="bg-white text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase">
                      Action Required
                    </span>
                  </div>
                  <p className="text-xs text-emerald-100 mt-0.5">
                    {newOrderAlert
                      ? `${newOrderAlert.customer.fullName} placed an order for ${newOrderAlert.vehicle.year} ${newOrderAlert.vehicle.make} ${newOrderAlert.vehicle.model} (Total: $${newOrderAlert.total.toFixed(2)} USD). Payment: ${newOrderAlert.payment.status}`
                      : 'One or more customers have submitted payment transaction references via QR Code / Bank Transfer.'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('payments');
                    setNewOrderAlert(null);
                  }}
                  className="px-4 py-2 bg-white text-slate-900 font-bold text-xs rounded-xl hover:bg-slate-100 transition-colors cursor-pointer shadow-xs"
                >
                  View Payments Console
                </button>
                {newOrderAlert && (
                  <button
                    type="button"
                    onClick={() => setNewOrderAlert(null)}
                    className="text-white/80 hover:text-white p-2 rounded-lg cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          )}

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
              
              {/* Dynamic Filter & Search Control Panel */}
              <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-xs space-y-3.5">
                {/* Row 1: Search Input + Field Selector + Sorter + Quick Clear */}
                <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
                  {/* Left: Input with embedded search icon and clear button */}
                  <div className="relative flex-1 max-w-lg">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={
                        searchField === 'vin'
                          ? 'Search by VIN or Chassis Number (e.g. 1HECM82633...)'
                          : searchField === 'customer'
                          ? 'Search by Customer Name, Email, or Phone...'
                          : searchField === 'orderNumber'
                          ? 'Search by Order Number (e.g. AA-10025)...'
                          : 'Dynamic search by VIN, Customer name, email, or Order #...'
                      }
                      className="w-full pl-9 pr-9 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:border-[#2563EB] focus:bg-white transition-all shadow-inner"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200 transition-colors cursor-pointer"
                        title="Clear search query"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Right: Search Field Selector & Sorter */}
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Search Field Target */}
                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-[11px] border border-slate-200">
                      <span className="text-slate-400 px-1.5 font-semibold flex items-center gap-1">
                        <Filter className="w-3 h-3" />
                        <span className="hidden sm:inline">Filter in:</span>
                      </span>
                      {(
                        [
                          { id: 'all', label: 'All Fields' },
                          { id: 'vin', label: 'VIN' },
                          { id: 'customer', label: 'Customer' },
                          { id: 'orderNumber', label: 'Order #' },
                        ] as const
                      ).map((tab) => (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setSearchField(tab.id)}
                          className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                            searchField === tab.id
                              ? 'bg-white text-blue-700 shadow-xs border border-blue-200'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    {/* Sorter */}
                    <div className="flex items-center gap-1 text-[11px]">
                      <select
                        value={orderSortBy}
                        onChange={(e) => setOrderSortBy(e.target.value as any)}
                        className="py-1.5 px-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-700 font-semibold focus:outline-none focus:border-blue-600 cursor-pointer"
                      >
                        <option value="newest">Newest First</option>
                        <option value="oldest">Oldest First</option>
                        <option value="amount-high">Amount: High to Low</option>
                        <option value="amount-low">Amount: Low to High</option>
                      </select>
                    </div>

                    {/* Reset all filters */}
                    {(searchQuery || statusFilter !== 'All' || searchField !== 'all') && (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery('');
                          setStatusFilter('All');
                          setSearchField('all');
                        }}
                        className="px-2.5 py-1.5 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl font-bold transition-colors cursor-pointer flex items-center gap-1 border border-rose-200"
                        title="Reset all search filters"
                      >
                        <X className="w-3 h-3" />
                        <span>Reset</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Row 2: Status Filter Tabs with Live Dynamic Count Badges */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-100 text-xs">
                  {['All', 'Paid / New', 'Processing', 'Ready', 'Delivered', 'Completed', 'Cancelled', 'Refunded'].map((status) => {
                    const count = statusCounts[status] || 0;
                    const isActive = statusFilter === status;
                    return (
                      <button
                        key={status}
                        type="button"
                        onClick={() => setStatusFilter(status)}
                        className={`px-3 py-1.5 rounded-lg font-semibold cursor-pointer transition-all flex items-center gap-1.5 ${
                          isActive
                            ? 'bg-[#0B132B] text-white shadow-xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        <span>{status}</span>
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                            isActive
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Live Match Summary Strip */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 pt-0.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span>
                      Showing <strong className="text-slate-900 font-bold">{filteredOrders.length}</strong> of {orders.length} orders
                    </span>
                    {searchQuery && (
                      <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-md font-medium">
                        Matching &quot;{searchQuery}&quot; ({searchField === 'all' ? 'All Fields' : searchField.toUpperCase()})
                      </span>
                    )}
                    {statusFilter !== 'All' && (
                      <span className="bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded-md font-medium">
                        Status: {statusFilter}
                      </span>
                    )}
                  </div>
                  {filteredOrders.length === 0 && (
                    <span className="text-rose-600 font-semibold">
                      No matching orders found. Try adjusting your search term.
                    </span>
                  )}
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
                              <div className="flex items-center justify-end gap-1.5">
                                {/* Quick Admin Download PDF */}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    try {
                                      const fileName = downloadReportPdfBlob(ord);
                                      showToast({
                                        type: 'success',
                                        title: 'Report Downloaded by Admin',
                                        message: `Downloaded official certified PDF: ${fileName}`,
                                        duration: 4000,
                                      });
                                    } catch {
                                      showToast({
                                        type: 'error',
                                        title: 'Download Failed',
                                        message: 'Could not generate PDF. Please open order to preview.',
                                        duration: 4000,
                                      });
                                    }
                                  }}
                                  className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 cursor-pointer transition-colors"
                                  title="Download certified PDF report to admin computer"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                </button>

                                {/* Quick WhatsApp Customer */}
                                <a
                                  href={`https://wa.me/${(ord.customer.phone || '923420617217').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                                    `Hi ${ord.customer.fullName}, your AutoAudit vehicle history report for order #${ord.orderNumber} (${ord.vehicle.year} ${ord.vehicle.make} ${ord.vehicle.model}, VIN: ${ord.vehicle.vinOrReg}) is ready. Total amount: $${ord.total.toFixed(2)} USD. Please confirm payment to receive your PDF report.`
                                  )}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="p-1.5 rounded-lg bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#25D366] border border-[#25D366]/30 cursor-pointer transition-colors"
                                  title="Send WhatsApp payment invoice to customer"
                                >
                                  <MessageCircle className="w-3.5 h-3.5" />
                                </a>

                                {/* Manage Order */}
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
                              </div>
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
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 uppercase tracking-wider text-[11px] block">
                          Vehicle Details & Specs
                        </span>
                        {currentOrder.vehicle.titleStatus && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                            {currentOrder.vehicle.titleStatus}
                          </span>
                        )}
                      </div>
                      <div className="space-y-1 text-slate-700">
                        <p><strong>Identifier / VIN:</strong> <span className="font-mono font-bold text-slate-900">{currentOrder.vehicle.vinOrReg}</span></p>
                        <p><strong>Make / Model / Year:</strong> {currentOrder.vehicle.year} {currentOrder.vehicle.make} {currentOrder.vehicle.model} {currentOrder.vehicle.color ? `(${currentOrder.vehicle.color})` : ''}</p>
                        <p><strong>Mileage:</strong> {currentOrder.vehicle.mileage || 'Not provided'}</p>
                        <p><strong>Powertrain:</strong> {currentOrder.vehicle.transmission || 'Automatic'} • {currentOrder.vehicle.fuelType || 'Gasoline'}</p>
                        <p><strong>Region / Origin:</strong> {currentOrder.vehicle.countryOrState || 'Global / USA'}</p>
                        {currentOrder.vehicle.customerNotes && (
                          <p className="text-[11px] text-slate-600 bg-white p-2 rounded border border-slate-200 mt-1">
                            <strong>Customer Notes:</strong> {currentOrder.vehicle.customerNotes}
                          </p>
                        )}
                      </div>
                    </div>

                  </div>

                  {/* Customer Vehicle Photos & Inspection Review Gallery */}
                  <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200">
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                          <Camera className="w-4 h-4 text-emerald-600" />
                          <span>Customer-Provided Vehicle Photos & Verification Media</span>
                        </h4>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Inspect physical odometer, door-jamb VIN label, exterior condition, and flagged damage areas before finalizing report.
                        </p>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold self-start ${
                        currentOrder.vehicle.photos && currentOrder.vehicle.photos.length > 0
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : 'bg-slate-200 text-slate-600'
                      }`}>
                        {currentOrder.vehicle.photos?.length || 0} Photos Uploaded
                      </span>
                    </div>

                    {/* Customer Review Checklist */}
                    {currentOrder.vehicle.inspectionFocusAreas && currentOrder.vehicle.inspectionFocusAreas.length > 0 && (
                      <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1.5">
                        <span className="text-[11px] font-bold text-slate-800 block">Customer-Requested Review Priorities:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {currentOrder.vehicle.inspectionFocusAreas.map((area: string) => (
                            <span
                              key={area}
                              className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 font-semibold"
                            >
                              ✓ {area}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Photos Grid */}
                    {currentOrder.vehicle.photos && currentOrder.vehicle.photos.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 pt-1">
                        {currentOrder.vehicle.photos.map((photo, pIdx) => {
                          const isOdo = photo.angle === 'odometer';
                          const isVin = photo.angle === 'vin_plate';
                          return (
                            <div
                              key={photo.id || pIdx}
                              onClick={() => {
                                if (photo.dataUrl) {
                                  setAdminLightboxPhoto({
                                    url: photo.dataUrl,
                                    label: photo.label || photo.angle || `Photo #${pIdx + 1}`,
                                    name: photo.name
                                  });
                                }
                              }}
                              className="group relative bg-white border border-slate-200 rounded-lg overflow-hidden shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col"
                            >
                              <div className="relative h-24 w-full bg-slate-900 overflow-hidden">
                                {photo.dataUrl ? (
                                  <img
                                    src={photo.dataUrl}
                                    alt={photo.name}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-slate-400">
                                    <Camera className="w-6 h-6" />
                                  </div>
                                )}
                                <span className={`absolute top-1 left-1 text-[9px] font-bold px-1.5 py-0.2 rounded shadow-xs ${
                                  isOdo
                                    ? 'bg-emerald-600 text-white'
                                    : isVin
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-black/70 text-white'
                                }`}>
                                  {photo.angle === 'odometer' ? '⏱️ Odometer' : photo.angle === 'vin_plate' ? '🏷️ VIN' : photo.angle || 'Photo'}
                                </span>
                              </div>
                              <div className="p-1.5 bg-slate-50 text-[10px] text-slate-600 truncate flex items-center justify-between">
                                <span className="truncate" title={photo.name}>{photo.name}</span>
                                <Eye className="w-3 h-3 text-slate-400 shrink-0 group-hover:text-blue-600" />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-3 bg-white rounded-lg border border-dashed border-slate-300 text-center text-xs text-slate-500">
                        <span>No customer vehicle photos were attached to this order. Proceeding with electronic registry verification (NMVTIS, NICB, auction databases).</span>
                      </div>
                    )}
                  </div>

                  {/* Service, Payment Status & Report Result URL */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
                    
                    {/* Payment & Service Summary */}
                    <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 uppercase tracking-wider text-[11px] block">
                          Service & Payment Status
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          currentOrder.payment.status === 'Paid'
                            ? 'bg-emerald-50 text-[#059669] border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {currentOrder.payment.status === 'Paid' ? 'PAID / VERIFIED' : 'PENDING PAYMENT'}
                        </span>
                      </div>
                      <div className="space-y-1 text-slate-700">
                        <p><strong>Plan:</strong> {currentOrder.serviceName}</p>
                        <p><strong>Payment Status:</strong> <span className={currentOrder.payment.status === 'Paid' ? 'text-[#059669] font-bold' : 'text-amber-600 font-bold'}>{currentOrder.payment.status}</span></p>
                        <p><strong>Total Amount:</strong> <span className="font-mono font-bold text-slate-900">${currentOrder.total.toFixed(2)} USD</span></p>
                        <p><strong>Transaction Ref:</strong> <span className="font-mono text-slate-500">{currentOrder.payment.gatewayRef || 'None'}</span></p>
                      </div>

                      {/* Admin Payment Toggle Action */}
                      <div className="pt-2 border-t border-slate-200">
                        <button
                          type="button"
                          onClick={() => handleTogglePaymentStatus(currentOrder)}
                          className={`w-full py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs ${
                            currentOrder.payment.status === 'Paid'
                              ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300'
                              : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          }`}
                        >
                          {currentOrder.payment.status === 'Paid' ? (
                            <>
                              <Clock className="w-3.5 h-3.5" />
                              <span>Revert to Pending Payment</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Mark Payment Received & Verified (${currentOrder.total.toFixed(2)})</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Report File / Result URL & Admin Dispatch Actions */}
                    <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 uppercase tracking-wider text-[11px] block">
                          Report PDF & Admin Fulfillment
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
                          ADMIN ONLY DISPATCH
                        </span>
                      </div>

                      {/* Protection Notice */}
                      <div className="p-2.5 bg-blue-50/70 border border-blue-200 rounded-lg text-[11px] text-slate-600 flex items-start gap-2">
                        <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-slate-900">Payment Protection Policy:</strong> Client self-downloads on the public website are restricted to protect against unpaid report taking. As administrator, verify payment first, then download the PDF and dispatch directly to the customer.
                        </div>
                      </div>

                      {/* Payment Status Warning / Confirmation Banner */}
                      {currentOrder.payment.status !== 'Paid' ? (
                        <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-800 flex items-center gap-1.5 font-medium">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span>Hold Report: Customer has not paid ($${currentOrder.total.toFixed(2)} USD). Do not send until payment is received.</span>
                        </div>
                      ) : (
                        <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-lg text-[11px] text-emerald-800 flex items-center gap-1.5 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>Payment Confirmed: You may download and dispatch the report to the customer.</span>
                        </div>
                      )}

                      {currentOrder.resultFile ? (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <p className="text-[#059669] font-bold text-xs flex items-center gap-1.5">
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Vehicle Report PDF Ready</span>
                            </p>
                            <span className="font-mono text-[10px] text-slate-400">PDF-1.4 Encrypted</span>
                          </div>

                          <p className="font-mono text-[11px] text-slate-700 truncate bg-white p-2 rounded border border-slate-200">
                            {currentOrder.resultFile.fileName}
                          </p>

                          <div className="flex flex-wrap items-center gap-2 pt-1">
                            {/* 1. Admin Direct Download */}
                            <button
                              type="button"
                              onClick={() => {
                                try {
                                  const downloadedFile = downloadReportPdfBlob(currentOrder);
                                  showToast({
                                    type: 'success',
                                    title: 'Report Downloaded by Admin',
                                    message: `Downloaded PDF: ${downloadedFile}`,
                                    duration: 4000,
                                  });
                                } catch {
                                  showToast({
                                    type: 'error',
                                    title: 'Download Failed',
                                    message: 'Could not generate PDF. Opening print preview...',
                                    duration: 4000,
                                  });
                                  window.print();
                                }
                              }}
                              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px] inline-flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors active:scale-95"
                              title="Download PDF to admin computer"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>Download PDF (Admin)</span>
                            </button>

                            {/* 2. Dispatch via WhatsApp */}
                            <a
                              href={`https://wa.me/${(currentOrder.customer.phone || '923420617217').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                                `Hi ${currentOrder.customer.fullName}, your AutoAudit vehicle history report for order #${currentOrder.orderNumber} (${currentOrder.vehicle.year} ${currentOrder.vehicle.make} ${currentOrder.vehicle.model}) is ready. Total amount: $${currentOrder.total.toFixed(2)} USD. Please confirm payment to receive your PDF document.`
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1.5 rounded-lg bg-[#25D366] hover:bg-[#20ba59] text-white font-semibold text-[11px] inline-flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors active:scale-95"
                              title="Send report notification directly to customer on WhatsApp"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                              <span>Send on WhatsApp</span>
                            </a>

                            {/* 3. Mark as Paid & Delivered */}
                            {currentOrder.status !== 'Delivered' && currentOrder.status !== 'Completed' && (
                              <button
                                type="button"
                                onClick={() => handleMarkPaidAndDelivered(currentOrder)}
                                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-[11px] inline-flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors active:scale-95"
                                title="Verify payment received and mark order as Delivered"
                              >
                                <CheckCheck className="w-3.5 h-3.5" />
                                <span>Mark Paid & Delivered</span>
                              </button>
                            )}

                            {/* 4. View Report Modal */}
                            <button
                              type="button"
                              onClick={() => {
                                if (onDownloadReport) {
                                  onDownloadReport(
                                    currentOrder.vehicle.vinOrReg,
                                    `${currentOrder.vehicle.year} ${currentOrder.vehicle.make} ${currentOrder.vehicle.model}`.trim() || 'Vehicle Record',
                                    currentOrder.orderNumber
                                  );
                                } else {
                                  viewReportPdfBlob(currentOrder);
                                }
                              }}
                              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                              title="Preview report modal"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Preview</span>
                            </button>

                            {/* 5. Re-generate */}
                            <button
                              type="button"
                              disabled={isGeneratingReport}
                              onClick={handleAutoGenerateReport}
                              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                            >
                              {isGeneratingReport ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                              <span>Re-Generate</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2 text-slate-500">
                          <p className="text-xs">No report PDF attached yet.</p>
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              disabled={isGeneratingReport}
                              onClick={handleAutoGenerateReport}
                              className="px-3 py-1.5 bg-[#059669] hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
                            >
                              {isGeneratingReport ? (
                                <>
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  <span>Generating PDF…</span>
                                </>
                              ) : (
                                <>
                                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                                  <span>Auto-Generate Dummy PDF</span>
                                </>
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                try {
                                  const downloadedFile = downloadReportPdfBlob(currentOrder);
                                  showToast({
                                    type: 'success',
                                    title: 'Report Downloaded by Admin',
                                    message: `Downloaded PDF: ${downloadedFile}`,
                                    duration: 4000,
                                  });
                                } catch {
                                  showToast({
                                    type: 'error',
                                    title: 'Download Failed',
                                    message: 'Could not generate PDF. Please try Auto-Generate.',
                                    duration: 4000,
                                  });
                                }
                              }}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
                              title="Download PDF on the fly"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>Download PDF (Admin)</span>
                            </button>
                            <a
                              href={`https://wa.me/${(currentOrder.customer.phone || '923420617217').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                                `Hi ${currentOrder.customer.fullName}, your AutoAudit vehicle history report for order #${currentOrder.orderNumber} (${currentOrder.vehicle.year} ${currentOrder.vehicle.make} ${currentOrder.vehicle.model}) is ready. Total amount: $${currentOrder.total.toFixed(2)} USD. Please confirm payment so our admin can release your PDF report.`
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1.5 bg-[#25D366] hover:bg-[#20ba59] text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
                              title="Send WhatsApp payment message to customer"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                              <span>WhatsApp Customer</span>
                            </a>
                            <button
                              type="button"
                              onClick={() => setShowUploadModal(true)}
                              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
                            >
                              + Custom Upload
                            </button>
                          </div>
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

          {/* TAB 5: PAYMENTS OPERATIONS & VERIFICATION CONSOLE */}
          {activeTab === 'payments' && (
            <div className="space-y-6">
              
              {/* Header Card */}
              <div className="bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-xs space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                        <CreditCard className="w-5 h-5 text-emerald-600" />
                        <span>Payment Verification & Settlement Console</span>
                      </h3>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        ● Live Gateway Sync
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
                      Verify customer payments received via Direct Card checkout, AutoAudit Payment QR Code (+92 342 0617217), and Bank Transfers. Approving an order immediately releases the official vehicle intelligence report.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      api.getOrders().then(data => {
                        if (Array.isArray(data) && onSyncOrders) onSyncOrders(data);
                        showToast({ title: 'Payments Refreshed', message: 'Loaded latest transaction data.', type: 'info' });
                      }).catch(() => {});
                    }}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer self-start"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Refresh Transactions</span>
                  </button>
                </div>

                {/* 4 Financial Metric Tiles */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-slate-100 text-xs">
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Total Verified Revenue</span>
                    <span className="font-mono font-black text-xl text-emerald-600 mt-0.5 block">
                      ${orders.filter(o => o.payment.status === 'Paid').reduce((sum, o) => sum + o.total, 0).toFixed(2)} USD
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {orders.filter(o => o.payment.status === 'Paid').length} verified transactions
                    </span>
                  </div>

                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-amber-600 block">Awaiting Verification</span>
                    <span className="font-mono font-black text-xl text-amber-600 mt-0.5 block">
                      ${orders.filter(o => o.payment.status !== 'Paid').reduce((sum, o) => sum + o.total, 0).toFixed(2)} USD
                    </span>
                    <span className="text-[10px] text-amber-700 font-semibold">
                      {orders.filter(o => o.payment.status !== 'Paid').length} orders pending review
                    </span>
                  </div>

                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-blue-600 block">Card Checkouts</span>
                    <span className="font-mono font-bold text-slate-800 text-sm mt-0.5 block">
                      {orders.filter(o => o.payment.method?.toLowerCase().includes('card')).length} Transactions
                    </span>
                    <span className="text-[10px] text-slate-400">Direct SSL gateway</span>
                  </div>

                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-emerald-700 block">QR Code / WhatsApp Pay</span>
                    <span className="font-mono font-bold text-slate-800 text-sm mt-0.5 block">
                      {orders.filter(o => o.payment.method?.toLowerCase().includes('qr') || o.payment.method?.toLowerCase().includes('whatsapp') || o.payment.method?.toLowerCase().includes('transfer')).length} Transactions
                    </span>
                    <span className="text-[10px] text-slate-400">03420617217 channel</span>
                  </div>
                </div>
              </div>

              {/* Filters & Search Toolbar */}
              <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] flex flex-col sm:flex-row gap-3 items-center justify-between shadow-xs">
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  <button
                    type="button"
                    onClick={() => setPaymentFilter('all')}
                    className={`px-3 py-1.5 rounded-lg font-semibold cursor-pointer transition-colors ${
                      paymentFilter === 'all'
                        ? 'bg-[#0B132B] text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    All Transactions ({orders.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentFilter('pending')}
                    className={`px-3 py-1.5 rounded-lg font-semibold cursor-pointer transition-colors ${
                      paymentFilter === 'pending'
                        ? 'bg-amber-600 text-white'
                        : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
                    }`}
                  >
                    ⚡ Pending Review ({orders.filter(o => o.payment.status !== 'Paid').length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentFilter('paid')}
                    className={`px-3 py-1.5 rounded-lg font-semibold cursor-pointer transition-colors ${
                      paymentFilter === 'paid'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                    }`}
                  >
                    ✓ Verified Paid ({orders.filter(o => o.payment.status === 'Paid').length})
                  </button>
                </div>

                <div className="relative w-full sm:w-80">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={paymentSearch}
                    onChange={(e) => setPaymentSearch(e.target.value)}
                    placeholder="Search by order #, customer, or transaction ID..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-[#2563EB]"
                  />
                </div>
              </div>

              {/* Transactions Table */}
              <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-xs overflow-hidden">
                {(() => {
                  const filteredOrders = orders.filter(o => {
                    if (paymentFilter === 'paid' && o.payment.status !== 'Paid') return false;
                    if (paymentFilter === 'pending' && o.payment.status === 'Paid') return false;
                    if (paymentSearch.trim()) {
                      const q = paymentSearch.trim().toLowerCase();
                      const matchOrder = o.orderNumber.toLowerCase().includes(q);
                      const matchCust = o.customer.fullName.toLowerCase().includes(q) || o.customer.email.toLowerCase().includes(q) || (o.customer.phone && o.customer.phone.toLowerCase().includes(q));
                      const matchRef = o.payment.gatewayRef && o.payment.gatewayRef.toLowerCase().includes(q);
                      const matchVin = o.vehicle.vinOrReg.toLowerCase().includes(q);
                      return matchOrder || matchCust || matchRef || matchVin;
                    }
                    return true;
                  });

                  if (filteredOrders.length === 0) {
                    return (
                      <div className="p-8 text-center text-xs text-slate-400">
                        No transactions match the selected filters.
                      </div>
                    );
                  }

                  return (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-[#F8FAFC] text-slate-500 font-semibold border-b border-[#E2E8F0]">
                          <tr>
                            <th className="py-3 px-4">Order / Date</th>
                            <th className="py-3 px-4">Customer & Contact</th>
                            <th className="py-3 px-4">Vehicle & VIN</th>
                            <th className="py-3 px-4">Method & Transaction Ref</th>
                            <th className="py-3 px-4">Amount</th>
                            <th className="py-3 px-4">Status</th>
                            <th className="py-3 px-4 text-right">Verification Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredOrders.map((o) => {
                            const isPaid = o.payment.status === 'Paid';
                            const hasProof = o.status === 'Payment Submitted' || (o.payment.gatewayRef && !o.payment.gatewayRef.startsWith('Awaiting'));

                            return (
                              <tr key={o.id} className="hover:bg-slate-50 transition-colors">
                                <td className="py-3 px-4 whitespace-nowrap">
                                  <span className="font-mono font-bold text-slate-900 block">#{o.orderNumber}</span>
                                  <span className="text-[10px] text-slate-400">
                                    {new Date(o.createdAt).toLocaleDateString()} {new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </td>

                                <td className="py-3 px-4">
                                  <span className="font-bold text-slate-900 block">{o.customer.fullName}</span>
                                  <span className="text-[11px] text-slate-500 font-mono block">{o.customer.email}</span>
                                  {o.customer.phone && (
                                    <a
                                      href={`https://wa.me/${o.customer.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hi ${o.customer.fullName}, regarding your AutoAudit order #${o.orderNumber} for ${o.vehicle.year} ${o.vehicle.make} ${o.vehicle.model}...`)}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-[11px] text-emerald-600 hover:underline flex items-center gap-1 mt-0.5"
                                    >
                                      <MessageCircle className="w-3 h-3 text-emerald-500" />
                                      <span>{o.customer.phone}</span>
                                    </a>
                                  )}
                                </td>

                                <td className="py-3 px-4">
                                  <span className="font-semibold text-slate-800 block">
                                    {o.vehicle.year} {o.vehicle.make} {o.vehicle.model}
                                  </span>
                                  <span className="font-mono text-[11px] text-blue-700 block">
                                    {o.vehicle.vinOrReg}
                                  </span>
                                </td>

                                <td className="py-3 px-4">
                                  <span className="font-medium text-slate-800 block">{o.payment.method || 'Card'}</span>
                                  <div className="flex items-center gap-1.5 mt-0.5">
                                    <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded truncate max-w-[140px]">
                                      {o.payment.gatewayRef || 'None'}
                                    </span>
                                    {o.payment.gatewayRef && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          navigator.clipboard.writeText(o.payment.gatewayRef || '');
                                          showToast({ title: 'Copied Ref', message: o.payment.gatewayRef, type: 'info', duration: 2000 });
                                        }}
                                        className="text-slate-400 hover:text-slate-600"
                                        title="Copy Ref"
                                      >
                                        <Copy className="w-3 h-3" />
                                      </button>
                                    )}
                                  </div>
                                </td>

                                <td className="py-3 px-4 whitespace-nowrap">
                                  <span className="font-mono font-black text-slate-900 text-sm block">
                                    ${o.total.toFixed(2)}
                                  </span>
                                  <span className="text-[10px] text-slate-400">USD</span>
                                </td>

                                <td className="py-3 px-4 whitespace-nowrap">
                                  {isPaid ? (
                                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 inline-flex items-center gap-1">
                                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                      <span>VERIFIED PAID</span>
                                    </span>
                                  ) : hasProof ? (
                                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 inline-flex items-center gap-1 animate-pulse">
                                      <Sparkles className="w-3 h-3 text-amber-600" />
                                      <span>PROOF SUBMITTED</span>
                                    </span>
                                  ) : (
                                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-300 inline-flex items-center gap-1">
                                      <Clock className="w-3 h-3 text-slate-500" />
                                      <span>AWAITING PAYMENT</span>
                                    </span>
                                  )}
                                </td>

                                <td className="py-3 px-4 text-right whitespace-nowrap">
                                  <div className="flex items-center justify-end gap-1.5">
                                    {!isPaid ? (
                                      <>
                                        <button
                                          type="button"
                                          onClick={() => handleTogglePaymentStatus(o)}
                                          className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer shadow-xs inline-flex items-center gap-1"
                                          title="Verify payment and release report"
                                        >
                                          <Check className="w-3 h-3" />
                                          <span>Approve Payment</span>
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setSelectedOrderId(o.id);
                                            setActiveTab('orders');
                                          }}
                                          className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs transition-colors cursor-pointer"
                                          title="View Order Details"
                                        >
                                          Details
                                        </button>
                                      </>
                                    ) : (
                                      <>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setSelectedOrderId(o.id);
                                            setActiveTab('orders');
                                          }}
                                          className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs transition-colors cursor-pointer inline-flex items-center gap-1"
                                        >
                                          <Eye className="w-3 h-3" />
                                          <span>Manage Order</span>
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleTogglePaymentStatus(o)}
                                          className="px-2 py-1.5 text-slate-400 hover:text-slate-600 text-[11px]"
                                          title="Revert to Pending"
                                        >
                                          Revert
                                        </button>
                                      </>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  );
                })()}
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

              {/* Primary Database: MongoDB Atlas Card */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold">
                      <Database className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-sm text-slate-900 flex items-center gap-2">
                        MongoDB Atlas
                        <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.2 rounded font-medium">Primary Store</span>
                      </span>
                      <span className="text-[11px] text-slate-500 block">
                        {dbStatus?.isMongoConnected
                          ? `Connected to ${dbStatus?.mongoStatus?.databaseName || 'autoaudit_db'} (${dbStatus?.mongoStatus?.pingMs ? `${dbStatus.mongoStatus.pingMs}ms ping` : 'active'})`
                          : dbStatus?.isMongoConfigured
                          ? 'Configured but connection pending · Check Atlas Network Access (0.0.0.0/0)'
                          : 'Operating in local memory mode with client persistence · Set MONGODB_URI to connect Atlas'}
                      </span>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                    dbStatus?.isMongoConnected
                      ? 'bg-emerald-100 text-emerald-800'
                      : dbStatus?.isMongoConfigured
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {dbStatus?.isMongoConnected
                      ? '● Atlas Connected'
                      : dbStatus?.isMongoConfigured
                      ? 'Connecting...'
                      : 'Awaiting MONGODB_URI'}
                  </span>
                </div>

                {/* MongoDB Migration & Action Toolbar */}
                <div className="p-3 bg-white border border-slate-200 rounded-lg space-y-2">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div>
                      <span className="font-bold text-xs text-slate-800 block">Data Migration & Seed Utility</span>
                      <span className="text-[11px] text-slate-500">Safely sync orders, services, and coupons into MongoDB Atlas with zero data loss.</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleRunMongoMigration(true)}
                        disabled={isMigrating}
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {isMigrating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Eye className="w-3.5 h-3.5" />}
                        <span>Dry Run</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRunMongoMigration(false)}
                        disabled={isMigrating}
                        className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {isMigrating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                        <span>Execute Migration</span>
                      </button>
                    </div>
                  </div>

                  {migrationReport && (
                    <div className="mt-2 p-2.5 bg-slate-50 border border-slate-200 rounded text-[11px] font-mono space-y-1">
                      <div className="flex items-center justify-between text-slate-700 font-bold">
                        <span>Status: {migrationReport.dryRun ? 'Dry Run Simulated' : 'Applied to Atlas'}</span>
                        <span className={migrationReport.reconciled ? 'text-emerald-600' : 'text-amber-600'}>
                          Reconciled: {migrationReport.reconciled ? 'YES' : 'PARTIAL'}
                        </span>
                      </div>
                      <p className="text-slate-600">{migrationReport.message}</p>
                    </div>
                  )}
                </div>

                <div className="pt-1 flex flex-wrap gap-2 text-[11px] text-slate-600">
                  <span className="bg-white px-2.5 py-1 rounded border border-slate-200 font-mono">
                    Orders: <strong>{dbStatus?.orderCount ?? orders.length}</strong>
                  </span>
                  <span className="bg-white px-2.5 py-1 rounded border border-slate-200 font-mono">
                    Services: <strong>{dbStatus?.serviceCount ?? services.length}</strong>
                  </span>
                  <span className="bg-white px-2.5 py-1 rounded border border-slate-200 font-mono">
                    Coupons: <strong>{dbStatus?.couponCount ?? coupons.length}</strong>
                  </span>
                  <span className="bg-white px-2.5 py-1 rounded border border-slate-200 font-mono">
                    Intake: <strong>{dbStatus?.intakeCount ?? intakeSubmissions.length}</strong>
                  </span>
                  <span className="bg-white px-2.5 py-1 rounded border border-slate-200 font-mono">
                    Emails: <strong>{dbStatus?.emailCount ?? emails.length}</strong>
                  </span>
                </div>

                {/* Secondary Fallback Note */}
                <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-200">
                  <span>Secondary Fallback: {dbStatus?.fallbackDatabase || 'Local In-Memory Repository'}</span>
                  <a
                    href="/docs/MONGODB_ATLAS_SETUP.md"
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 hover:underline flex items-center gap-1 font-sans"
                  >
                    Setup Guide <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
              </div>

              {/* Two-Factor Authentication Security Card */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-sm text-slate-900 flex items-center gap-2">
                        Two-Factor Authentication (TOTP)
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-300 px-1.5 py-0.2 rounded font-semibold">Active & Enforced</span>
                      </span>
                      <span className="text-[11px] text-slate-500 block">
                        Linked with Authenticator App (Google Authenticator, Microsoft Authenticator, Apple Passwords, or 1Password)
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const resetRes = await api.request2FAReset();
                        if (resetRes.preAuthToken) {
                          setTwoFactorPreAuthToken(resetRes.preAuthToken);
                          setTwoFactorSecret(resetRes.secret);
                          setTwoFactorOtpAuthUrl(resetRes.otpauthUrl);
                          setTwoFactorBackupCodes(resetRes.backupCodes || []);
                          setTwoFactorCodeInput('');
                          setIs2FASetupMode(true);
                          setIsAuthenticated(false);
                          showToast({
                            title: 'Re-Link Authenticator',
                            message: 'Scan the new QR code to update your authenticator app.',
                            type: 'info'
                          });
                        }
                      } catch (err: any) {
                        showToast({
                          title: 'Error Resetting 2FA',
                          message: err?.message || 'Could not initiate 2FA reset.',
                          type: 'error'
                        });
                      }
                    }}
                    className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs self-start sm:self-auto"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                    <span>Re-link Authenticator App</span>
                  </button>
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

          {/* TAB 9: CONTACT ANALYTICS */}
          {activeTab === 'contact-analytics' && (
            <ContactAnalyticsTab />
          )}

          {/* TAB 10: CUSTOMER INTAKE QUEUE (Google Forms Specification) */}
          {activeTab === 'intake' && (
            <div className="space-y-6">
              
              {/* Header Card */}
              <div className="bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-xs space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-amber-500" />
                        <span>Customer Intake Queue (AutoAudit Direct Submissions)</span>
                      </h3>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5" /> Auto-Generate Active
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
                      Customer vehicle history requests received natively via the AutoAudit website intake layer and payment checkout pipeline. Includes complete 5-section data, certified customer consents, and automated report generation.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 self-start">
                    <a
                      href="/request-report"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                      title="View public vehicle report request page"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
                      <span>View Form on Website</span>
                    </a>

                    <button
                      type="button"
                      onClick={fetchIntakeSubmissions}
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Refresh</span>
                    </button>
                  </div>
                </div>

                {/* KPI Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-100 text-xs">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Total Requests</span>
                    <span className="font-mono font-bold text-slate-900 text-lg mt-0.5 block">{intakeSubmissions.length}</span>
                    <span className="text-[10px] text-slate-400">All intake submissions</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-emerald-600 block">Reports Generated</span>
                    <span className="font-mono font-bold text-emerald-700 text-lg mt-0.5 block">
                      {intakeSubmissions.filter(s => s.status === 'Report Generated' || s.status === 'Delivered').length}
                    </span>
                    <span className="text-[10px] text-emerald-600 font-medium">Ready for instant download</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-amber-600 block">Pending Queue</span>
                    <span className="font-mono font-bold text-amber-700 text-lg mt-0.5 block">
                      {intakeSubmissions.filter(s => s.status === 'Received' || s.status === 'Processing').length}
                    </span>
                    <span className="text-[10px] text-amber-600 font-medium">Awaiting fulfillment / review</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-blue-600 block">Top Method</span>
                    <span className="font-bold text-slate-900 text-sm mt-0.5 block flex items-center gap-1">
                      <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                      <span>WhatsApp (75%)</span>
                    </span>
                    <span className="text-[10px] text-slate-400">Preferred customer delivery</span>
                  </div>
                </div>
              </div>

              {/* Filters & Search */}
              <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] flex flex-col sm:flex-row gap-3 items-center justify-between shadow-xs">
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  {['All', 'Received', 'Report Generated', 'Delivered', 'Contacted'].map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setIntakeFilter(st)}
                      className={`px-3 py-1.5 rounded-lg font-semibold cursor-pointer transition-colors ${
                        intakeFilter === st
                          ? 'bg-[#0B132B] text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>

                <div className="relative w-full sm:w-72">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={intakeSearchQuery}
                    onChange={(e) => setIntakeSearchQuery(e.target.value)}
                    placeholder="Search by name, VIN, plate, ref..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-[#2563EB]"
                  />
                </div>
              </div>

              {/* Intake Submissions Table */}
              <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-xs overflow-hidden">
                <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900">
                    Submissions Queue ({filteredIntake.length})
                  </h4>
                  <span className="text-xs text-slate-400">
                    Matches Google Forms 5-section customer intake specification
                  </span>
                </div>

                {filteredIntake.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400">
                    No intake requests matching filter criteria. Submissions from the customer form will appear here automatically.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#F8FAFC] text-slate-500 font-semibold border-b border-[#E2E8F0]">
                        <tr>
                          <th className="py-3 px-4">Ref #</th>
                          <th className="py-3 px-4">Customer & Contact</th>
                          <th className="py-3 px-4">Vehicle Details</th>
                          <th className="py-3 px-4">Report Scope</th>
                          <th className="py-3 px-4">Consents</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4 text-right">Fulfillment Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredIntake.map((sub) => {
                          const isAutoGenerating = isGeneratingIntakeReport === sub.id;
                          return (
                            <tr key={sub.id} className="hover:bg-slate-50 transition-colors">
                              <td className="py-3 px-4 whitespace-nowrap">
                                <span className="font-mono font-bold text-slate-800 block">
                                  {sub.submissionNumber}
                                </span>
                                <span className="text-[10px] text-slate-400">
                                  {new Date(sub.timestamp).toLocaleDateString()}
                                </span>
                              </td>

                              <td className="py-3 px-4">
                                <div className="font-semibold text-slate-900">{sub.fullName}</div>
                                <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                                  <span>{sub.country}</span>
                                  <span>•</span>
                                  {sub.preferredContactMethod === 'WhatsApp' ? (
                                    <a
                                      href={`https://wa.me/${sub.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hi ${sub.fullName}, AutoAudit is reviewing your vehicle history report request #${sub.submissionNumber}.`)}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-700 font-semibold"
                                    >
                                      <MessageCircle className="w-3 h-3" />
                                      <span>WhatsApp</span>
                                    </a>
                                  ) : (
                                    <a href={`mailto:${sub.email}`} className="text-blue-600 hover:underline">
                                      {sub.email}
                                    </a>
                                  )}
                                </div>
                              </td>

                              <td className="py-3 px-4">
                                <div className="font-semibold text-slate-800">
                                  {sub.modelYear} {sub.make} {sub.model}
                                </div>
                                <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                                  VIN: <span className="text-slate-800 font-semibold">{sub.vinOrChassis}</span>
                                </div>
                                <div className="text-[10px] text-slate-400">
                                  Plate: {sub.registrationPlate} • {sub.vehicleColor || 'Color N/A'}
                                </div>
                              </td>

                              <td className="py-3 px-4 max-w-xs">
                                <div className="font-medium text-slate-800">{sub.reportType}</div>
                                <div className="text-[10px] text-slate-500 truncate mt-0.5">
                                  Why: {sub.reasonForRequest}
                                </div>
                              </td>

                              <td className="py-3 px-4 whitespace-nowrap">
                                <div className="flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-flex">
                                  <Check className="w-3 h-3" />
                                  <span>All 3 Consents</span>
                                </div>
                              </td>

                              <td className="py-3 px-4 whitespace-nowrap">
                                <span className={`px-2.5 py-0.5 rounded text-[11px] font-bold ${
                                  sub.status === 'Report Generated'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : sub.status === 'Received'
                                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                    : sub.status === 'Processing'
                                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                    : 'bg-slate-100 text-slate-700 border border-slate-200'
                                }`}>
                                  {sub.status}
                                </span>
                              </td>

                              <td className="py-3 px-4 text-right whitespace-nowrap space-x-1.5">
                                {/* Auto-Generate Action Button */}
                                {sub.status !== 'Report Generated' && sub.status !== 'Delivered' ? (
                                  <button
                                    type="button"
                                    disabled={isAutoGenerating}
                                    onClick={() => handleAutoGenerateForIntake(sub)}
                                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer inline-flex items-center gap-1 shadow-xs disabled:opacity-50"
                                  >
                                    {isAutoGenerating ? (
                                      <>
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                        <span>Compiling...</span>
                                      </>
                                    ) : (
                                      <>
                                        <Sparkles className="w-3 h-3" />
                                        <span>Auto-Generate</span>
                                      </>
                                    )}
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const fileName = downloadReportPdfBlob({
                                        orderNumber: sub.autoGeneratedOrderId || sub.submissionNumber || `AA-INTAKE-${sub.id.slice(-4)}`,
                                        vehicle: {
                                          vinOrReg: sub.vinOrChassis,
                                          year: sub.modelYear,
                                          make: sub.make,
                                          model: sub.model,
                                          mileage: sub.currentMileage
                                        },
                                        customer: {
                                          fullName: sub.fullName,
                                          email: sub.email
                                        },
                                        serviceName: 'AutoAudit Certified Intake Report'
                                      });
                                      showToast({
                                        type: 'success',
                                        title: 'PDF Downloaded',
                                        message: `Downloaded official report: ${fileName}`,
                                        duration: 4000,
                                      });
                                    }}
                                    className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer inline-flex items-center gap-1"
                                  >
                                    <Download className="w-3 h-3" />
                                    <span>Download PDF</span>
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={() => setSelectedIntakeForView(sub)}
                                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer inline-flex items-center gap-1"
                                >
                                  <Eye className="w-3 h-3" />
                                  <span>Details</span>
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Native AutoAudit Intake Webhook Pipeline */}
              <div className="bg-gradient-to-r from-blue-50 via-slate-50 to-indigo-50 p-5 rounded-2xl border border-blue-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                      AA
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">
                        AutoAudit Native Vehicle Intake Pipeline
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Direct REST API ingestion and automated report generation engine.
                      </p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                    Endpoint: POST /api/intake
                  </span>
                </div>
                <div className="text-[11px] text-slate-600 leading-relaxed space-y-1">
                  <p>
                    <strong>Automatic Intake Webhook:</strong> Send JSON vehicle requests directly to <code className="bg-white px-1.5 py-0.5 rounded border border-slate-200 font-mono text-blue-700">POST /api/intake</code> with <code className="bg-white px-1 py-0.5 rounded border border-slate-200 font-mono text-slate-800">autoGenerateReport: true</code>. AutoAudit automatically generates the official PDF-1.4 report, persists order records to MongoDB Atlas, and dispatches customer notification emails via SMTP transporter!
                  </p>
                </div>
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

      {/* Modal: View Full Intake Submission Details */}
      {selectedIntakeForView && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="bg-[#0B132B] px-6 py-4 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <FileText className="w-5 h-5 text-amber-400" />
                <div>
                  <h4 className="text-base font-bold text-white flex items-center gap-2">
                    <span>Intake Request: {selectedIntakeForView.submissionNumber}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      {selectedIntakeForView.status}
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Received on {new Date(selectedIntakeForView.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedIntakeForView(null)}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs">
              
              {/* Section 1: Customer Information */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <span className="font-bold text-slate-900 block text-xs uppercase tracking-wider">
                  Section 1 — Customer Information
                </span>
                <div className="grid grid-cols-2 gap-2 text-slate-700">
                  <div><strong className="text-slate-500">Full Name:</strong> {selectedIntakeForView.fullName}</div>
                  <div><strong className="text-slate-500">Email:</strong> {selectedIntakeForView.email}</div>
                  <div><strong className="text-slate-500">Phone:</strong> {selectedIntakeForView.phone}</div>
                  <div><strong className="text-slate-500">Country:</strong> {selectedIntakeForView.country}</div>
                  <div className="col-span-2">
                    <strong className="text-slate-500">Preferred Contact Method:</strong>{' '}
                    <span className="font-semibold text-blue-700">{selectedIntakeForView.preferredContactMethod}</span>
                  </div>
                </div>
              </div>

              {/* Section 2: Vehicle Information */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <span className="font-bold text-slate-900 block text-xs uppercase tracking-wider">
                  Section 2 — Vehicle Information
                </span>
                <div className="grid grid-cols-2 gap-2 text-slate-700">
                  <div>
                    <strong className="text-slate-500">Vehicle:</strong> {selectedIntakeForView.modelYear} {selectedIntakeForView.make} {selectedIntakeForView.model}
                  </div>
                  <div>
                    <strong className="text-slate-500">VIN / Chassis:</strong>{' '}
                    <span className="font-mono font-bold text-slate-900">{selectedIntakeForView.vinOrChassis}</span>
                  </div>
                  <div>
                    <strong className="text-slate-500">Registration Plate:</strong>{' '}
                    <span className="font-mono font-bold text-slate-900">{selectedIntakeForView.registrationPlate}</span>
                  </div>
                  <div><strong className="text-slate-500">Color:</strong> {selectedIntakeForView.vehicleColor || 'N/A'}</div>
                  <div><strong className="text-slate-500">Mileage:</strong> {selectedIntakeForView.currentMileage || 'N/A'}</div>
                  <div><strong className="text-slate-500">Reg. Country:</strong> {selectedIntakeForView.countryOfRegistration}</div>
                </div>
              </div>

              {/* Section 3: Report Scope */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <span className="font-bold text-slate-900 block text-xs uppercase tracking-wider">
                  Section 3 — Report Request Scope
                </span>
                <div className="space-y-1 text-slate-700">
                  <div><strong className="text-slate-500">Report Type:</strong> {selectedIntakeForView.reportType}</div>
                  <div><strong className="text-slate-500">Reason:</strong> {selectedIntakeForView.reasonForRequest}</div>
                  <div><strong className="text-slate-500">Purchase Status:</strong> {selectedIntakeForView.purchaseStatus || 'N/A'}</div>
                </div>
              </div>

              {/* Section 4: Notes & Document */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <span className="font-bold text-slate-900 block text-xs uppercase tracking-wider">
                  Section 4 — Additional Notes & Document
                </span>
                <p className="text-slate-700 italic bg-white p-2.5 rounded border border-slate-200">
                  {selectedIntakeForView.additionalNotes || 'No additional notes entered by customer.'}
                </p>
                {selectedIntakeForView.documentFileName && (
                  <div className="text-slate-700 flex items-center gap-2 pt-1 font-mono text-[11px]">
                    <span className="text-slate-500">Attached File:</span>
                    <span className="font-bold text-blue-700">{selectedIntakeForView.documentFileName}</span>
                    <span>({selectedIntakeForView.documentFileSize || 'Verified'})</span>
                  </div>
                )}

                {/* Customer Vehicle Photographs (Google Forms Question Specification) */}
                {selectedIntakeForView.vehiclePhotos && selectedIntakeForView.vehiclePhotos.length > 0 && (
                  <div className="pt-2 border-t border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                        <Camera className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Submitted Vehicle Photographs ({selectedIntakeForView.vehiclePhotos.length}):</span>
                      </span>
                      <span className="text-[10px] text-slate-500">Stored via Google Drive / Forms sync</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {selectedIntakeForView.vehiclePhotos.map((photo, pIdx) => (
                        <div key={pIdx} className="bg-white p-2 rounded-lg border border-slate-200 space-y-1">
                          {photo.previewUrl ? (
                            <img
                              src={photo.previewUrl}
                              alt={`Vehicle Photo ${pIdx + 1}`}
                              className="w-full h-20 object-cover rounded"
                            />
                          ) : (
                            <div className="w-full h-16 bg-slate-100 rounded flex items-center justify-center text-slate-400">
                              <ImageIcon className="w-6 h-6" />
                            </div>
                          )}
                          <div className="text-[10px] truncate text-slate-700 font-medium" title={photo.name}>
                            {photo.name}
                          </div>
                          <div className="text-[9px] text-slate-400">{photo.size}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Section 5: Customer Consent Record */}
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-[11px] text-emerald-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Customer Consents Verified:</span>
                </div>
                <div className="pl-5 space-y-0.5 text-emerald-800">
                  <div>✓ Information Accuracy Confirmed</div>
                  <div>✓ Data Usage & Contact Permission Granted ({selectedIntakeForView.preferredContactMethod})</div>
                  <div>✓ Terms of Service and Privacy Policy Accepted</div>
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="px-6 py-3 bg-slate-100 border-t border-slate-200 flex items-center justify-between">
              <div>
                {selectedIntakeForView.preferredContactMethod === 'WhatsApp' ? (
                  <a
                    href={`https://wa.me/${selectedIntakeForView.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hi ${selectedIntakeForView.fullName}, AutoAudit has received your report request #${selectedIntakeForView.submissionNumber} for ${selectedIntakeForView.make} ${selectedIntakeForView.model}.`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-[#25D366] hover:bg-[#20ba59] text-white rounded-lg text-xs font-bold inline-flex items-center gap-1.5"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>Contact via WhatsApp</span>
                  </a>
                ) : (
                  <a
                    href={`mailto:${selectedIntakeForView.email}?subject=${encodeURIComponent(`AutoAudit Report Update #${selectedIntakeForView.submissionNumber}`)}`}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1.5"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Email Customer</span>
                  </a>
                )}
              </div>

              <div className="flex items-center gap-2">
                {selectedIntakeForView.status !== 'Report Generated' && selectedIntakeForView.status !== 'Delivered' ? (
                  <button
                    type="button"
                    onClick={() => {
                      handleAutoGenerateForIntake(selectedIntakeForView);
                      setSelectedIntakeForView(null);
                    }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Auto-Generate Report Now</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      const fileName = downloadReportPdfBlob({
                        orderNumber: selectedIntakeForView.autoGeneratedOrderId || selectedIntakeForView.submissionNumber || `AA-INTAKE-${selectedIntakeForView.id.slice(-4)}`,
                        vehicle: {
                          vinOrReg: selectedIntakeForView.vinOrChassis,
                          year: selectedIntakeForView.modelYear,
                          make: selectedIntakeForView.make,
                          model: selectedIntakeForView.model,
                          mileage: selectedIntakeForView.currentMileage
                        },
                        customer: {
                          fullName: selectedIntakeForView.fullName,
                          email: selectedIntakeForView.email
                        },
                        serviceName: 'AutoAudit Certified Intake Report'
                      });
                      showToast({
                        type: 'success',
                        title: 'PDF Downloaded',
                        message: `Downloaded official report: ${fileName}`,
                        duration: 4000,
                      });
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Report PDF</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setSelectedIntakeForView(null)}
                  className="px-4 py-2 bg-white hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold border border-slate-300"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Admin Photo Inspection Lightbox Modal */}
      {adminLightboxPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setAdminLightboxPhoto(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-slate-900 rounded-2xl border border-slate-700 overflow-hidden flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 py-3 bg-[#0B132B] border-b border-slate-800 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-emerald-600 text-white">
                  {adminLightboxPhoto.label}
                </span>
                <span className="text-xs text-slate-300 truncate max-w-md">
                  {adminLightboxPhoto.name || 'Customer Vehicle Photo'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setAdminLightboxPhoto(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-2 flex items-center justify-center bg-black overflow-auto max-h-[75vh]">
              <img
                src={adminLightboxPhoto.url}
                alt={adminLightboxPhoto.name || 'Vehicle Photo Inspection'}
                className="max-h-[72vh] w-auto object-contain rounded shadow-lg"
              />
            </div>

            <div className="px-4 py-2.5 bg-[#0B132B] border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>AutoAudit Certified Odometer & VIN Verification Console</span>
              </span>
              <button
                type="button"
                onClick={() => setAdminLightboxPhoto(null)}
                className="px-3.5 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
