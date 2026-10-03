import React, { useState, useEffect } from 'react';
import { Order } from '../types';
import { 
  X, LayoutDashboard, FileText, ShoppingBag, User, HelpCircle, 
  LogOut, CheckCircle2, Clock, Download, Eye, Search, AlertCircle, 
  FileCheck, Mail, ShieldCheck, ArrowRight, Loader2
} from 'lucide-react';
import { OrderTrackingProgressBar } from './OrderTrackingProgressBar';
import { WhatsAppButton } from './WhatsAppButton';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';

interface MyOrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[];
  onOpenSampleReport: () => void;
  onDownloadReport: (vin: string, title: string, orderNumber: string) => void;
}

export const MyOrdersModal: React.FC<MyOrdersModalProps> = ({
  isOpen,
  onClose,
  orders,
  onOpenSampleReport,
  onDownloadReport,
}) => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'my-reports' | 'orders' | 'account' | 'support'>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [customerOrders, setCustomerOrders] = useState<Order[]>(orders);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(orders[0] || null);
  const [lookupEmail, setLookupEmail] = useState<string>(() => {
    return (typeof window !== 'undefined' && localStorage.getItem('autoaudit_customer_email')) || '';
  });
  const [isSearching, setIsSearching] = useState<boolean>(false);

  // Sync when parent orders change
  useEffect(() => {
    if (orders.length > 0) {
      setCustomerOrders(orders);
      if (!selectedOrder) setSelectedOrder(orders[0]);
    }
  }, [orders]);

  // If customer has a stored email, auto-fetch their orders on mount
  useEffect(() => {
    if (lookupEmail && customerOrders.length === 0) {
      handleLookup(lookupEmail);
    }
  }, [isOpen]);

  const handleLookup = async (queryTerm: string) => {
    if (!queryTerm.trim()) return;
    setIsSearching(true);
    try {
      const term = queryTerm.trim();
      let found: Order[] = [];

      if (term.includes('@')) {
        // Query by email
        found = await api.getOrders({ email: term });
        if (typeof window !== 'undefined') {
          localStorage.setItem('autoaudit_customer_email', term.toLowerCase());
        }
      } else {
        // Query by order number
        try {
          const single = await api.getOrderById(term);
          if (single) found = [single];
        } catch {
          found = [];
        }
      }

      if (found && found.length > 0) {
        setCustomerOrders(found);
        setSelectedOrder(found[0]);
        showToast({
          title: 'Reports Loaded',
          message: `Found ${found.length} vehicle report(s) for ${term}.`,
          type: 'success'
        });
      } else {
        showToast({
          title: 'No Reports Found',
          message: `No active orders found matching "${term}". Please check the spelling or order number.`,
          type: 'warning'
        });
      }
    } catch (err: any) {
      showToast({
        title: 'Lookup Error',
        message: err?.message || 'Could not retrieve orders at this time.',
        type: 'error'
      });
    } finally {
      setIsSearching(false);
    }
  };

  if (!isOpen) return null;

  // Stats
  const totalOrders = customerOrders.length;
  const reportsReady = customerOrders.filter((o) => o.status === 'Ready' || o.status === 'Delivered' || o.status === 'Completed').length;
  const reportsProcessing = customerOrders.filter((o) => o.status === 'Processing' || o.status === 'Paid / New' || o.status === 'NMVTIS Check').length;
  const reportsPurchased = totalOrders;

  const filteredOrders = customerOrders.filter((o) => {
    const q = searchQuery.toLowerCase();
    return (
      o.orderNumber.toLowerCase().includes(q) ||
      o.vehicle.vinOrReg.toLowerCase().includes(q) ||
      o.customer.email.toLowerCase().includes(q) ||
      o.serviceName.toLowerCase().includes(q)
    );
  });

  const getStatusBadge = (status: Order['status']) => {
    switch (status) {
      case 'Pending Payment':
        return <span className="text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full text-[11px] font-semibold">Pending</span>;
      case 'Paid / New':
      case 'Processing':
      case 'NMVTIS Check':
        return (
          <span className="text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full text-[11px] font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
            <span>Processing</span>
          </span>
        );
      case 'Ready':
        return <span className="text-[#059669] bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full text-[11px] font-bold">Ready</span>;
      case 'Delivered':
        return <span className="text-[#059669] bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full text-[11px] font-bold">Delivered</span>;
      case 'Completed':
        return <span className="text-slate-800 bg-slate-100 border border-slate-300 px-2.5 py-0.5 rounded-full text-[11px] font-bold">Completed</span>;
      default:
        return <span className="text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full text-[11px]">{status}</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-5">
      <div className="bg-white w-full max-w-6xl rounded-[14px] shadow-2xl border border-[#E2E8F0] overflow-hidden flex flex-col md:flex-row h-[88vh]">
        
        {/* Left Sidebar (Dark Navy per Section 16) */}
        <aside className="w-full md:w-64 bg-[#0B132B] text-slate-300 p-5 flex flex-col justify-between border-r border-[#1E293B] shrink-0">
          <div className="space-y-6">
            
            {/* User Greeting & Header */}
            <div className="pb-4 border-b border-[#1E293B] flex items-center justify-between md:block">
              <div>
                <span className="text-[11px] font-mono font-bold text-[#FB2C36] uppercase tracking-wider block">
                  Customer Portal
                </span>
                <h3 className="text-lg font-black text-white mt-0.5 tracking-[-0.35px]">
                  Welcome back
                </h3>
                <p className="text-xs text-slate-400 truncate max-w-[180px]">
                  {orders[0]?.customer.email || 'customer@autoaudit.com'}
                </p>
              </div>

              {/* Close Button on Mobile */}
              <button
                type="button"
                onClick={onClose}
                className="md:hidden p-1.5 rounded-[8px] text-slate-400 hover:text-white bg-[#0F172A]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Menu (8px radius) */}
            <nav className="space-y-1.5 text-xs font-medium">
              <button
                type="button"
                onClick={() => setActiveTab('dashboard')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-[8px] transition-colors cursor-pointer leading-[1.43] ${
                  activeTab === 'dashboard'
                    ? 'bg-[#FB2C36] text-white shadow-[0_1px_2px_rgba(0,0,0,0.05)]'
                    : 'text-slate-300 hover:bg-[#0F172A] hover:text-white'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Dashboard</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('my-reports')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-[8px] transition-colors cursor-pointer leading-[1.43] ${
                  activeTab === 'my-reports'
                    ? 'bg-[#FB2C36] text-white shadow-[0_1px_2px_rgba(0,0,0,0.05)]'
                    : 'text-slate-300 hover:bg-[#0F172A] hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-4 h-4" />
                  <span>My Reports</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                  {reportsReady}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('orders')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-[8px] transition-colors cursor-pointer leading-[1.43] ${
                  activeTab === 'orders'
                    ? 'bg-[#FB2C36] text-white shadow-[0_1px_2px_rgba(0,0,0,0.05)]'
                    : 'text-slate-300 hover:bg-[#0F172A] hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <ShoppingBag className="w-4 h-4" />
                  <span>Orders</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                  {totalOrders}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('account')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-[8px] transition-colors cursor-pointer leading-[1.43] ${
                  activeTab === 'account'
                    ? 'bg-[#FB2C36] text-white shadow-[0_1px_2px_rgba(0,0,0,0.05)]'
                    : 'text-slate-300 hover:bg-[#0F172A] hover:text-white'
                }`}
              >
                <User className="w-4 h-4" />
                <span>Account</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('support')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-[8px] transition-colors cursor-pointer leading-[1.43] ${
                  activeTab === 'support'
                    ? 'bg-[#FB2C36] text-white shadow-[0_1px_2px_rgba(0,0,0,0.05)]'
                    : 'text-slate-300 hover:bg-[#0F172A] hover:text-white'
                }`}
              >
                <HelpCircle className="w-4 h-4" />
                <span>Support</span>
              </button>
            </nav>
          </div>

          {/* Bottom Actions */}
          <div className="pt-4 border-t border-[#1E293B] space-y-2">
            <WhatsAppButton
              variant="secondary"
              label="Live WhatsApp Help"
              className="w-full justify-center bg-emerald-950/50 text-emerald-300 border-emerald-800/60 hover:bg-emerald-900/60 text-xs py-2"
            />
            <button
              type="button"
              onClick={onClose}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-400 hover:text-white hover:bg-[#0F172A] rounded-xl transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Back to Home</span>
            </button>
          </div>
        </aside>

        {/* Right Main Content */}
        <main className="flex-1 flex flex-col bg-[#F8FAFC] overflow-y-auto">
          
          {/* Top Bar */}
          <div className="bg-white border-b border-[#E2E8F0] px-6 py-4 flex items-center justify-between shrink-0">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {activeTab === 'dashboard' && 'Customer Dashboard'}
                {activeTab === 'my-reports' && 'My Verified Reports'}
                {activeTab === 'orders' && 'Order History & Receipts'}
                {activeTab === 'account' && 'Account Settings'}
                {activeTab === 'support' && 'Order Support & Inquiries'}
              </h2>
              <p className="text-xs text-slate-500">
                Track real-time records retrieval and download official PDF audits.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="hidden md:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            
            {/* Stats Cards (Section 16: Reports Purchased, Reports Ready, Reports Processing, Total Orders) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-xs">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Reports Purchased
                </span>
                <span className="text-2xl font-black text-slate-900 font-mono mt-1 block">
                  {reportsPurchased}
                </span>
              </div>

              <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-xs">
                <span className="text-[11px] font-bold text-[#059669] uppercase tracking-wider block">
                  Reports Ready
                </span>
                <span className="text-2xl font-black text-[#059669] font-mono mt-1 block">
                  {reportsReady}
                </span>
              </div>

              <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-xs">
                <span className="text-[11px] font-bold text-[#2563EB] uppercase tracking-wider block">
                  Reports Processing
                </span>
                <span className="text-2xl font-black text-[#2563EB] font-mono mt-1 block">
                  {reportsProcessing}
                </span>
              </div>

              <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-xs">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Total Orders
                </span>
                <span className="text-2xl font-black text-slate-900 font-mono mt-1 block">
                  {totalOrders}
                </span>
              </div>
            </div>

            {/* Selected Order Detail / Report Delivery Screen (Section 17) */}
            {selectedOrder && (
              <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-xs space-y-5">
                
                {/* Section 17: When report is ready with subtle CSS transition animations */}
                {(selectedOrder.status === 'Ready' || selectedOrder.status === 'Delivered' || selectedOrder.status === 'Completed' || selectedOrder.resultFile) ? (
                  <div key={`ready-${selectedOrder.id}`} className="space-y-4 report-ready-transition report-ready-glow">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                      <div>
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-[#059669] mb-1.5 report-checkmark-pop">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>READY</span>
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                          Your Vehicle Report Is Ready
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Report delivered to your registered email address (<strong className="text-slate-800">{selectedOrder.customer.email}</strong>).
                        </p>
                      </div>

                      {/* Primary & Secondary CTAs with staggered entrance */}
                      <div className="flex flex-wrap items-center gap-2 report-stagger-1">
                        <button
                          type="button"
                          onClick={onOpenSampleReport}
                          className="px-4 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-all active:scale-[0.98]"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Report</span>
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            onDownloadReport(
                              selectedOrder.vehicle.vinOrReg,
                              `${selectedOrder.vehicle.year} ${selectedOrder.vehicle.make} ${selectedOrder.vehicle.model}`,
                              selectedOrder.orderNumber
                            )
                          }
                          className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-all active:scale-[0.98]"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download Report</span>
                        </button>

                        <WhatsAppButton
                          variant="primary"
                          label="WhatsApp Help"
                          orderNumber={selectedOrder.orderNumber}
                          vin={selectedOrder.vehicle.vinOrReg}
                          className="px-3.5 py-2.5 rounded-xl font-bold"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#F8FAFC] p-4 rounded-xl border border-slate-200 text-xs report-stagger-2">
                      <div>
                        <span className="text-slate-400 block">Vehicle</span>
                        <span className="font-bold text-slate-900">
                          {selectedOrder.vehicle.year} {selectedOrder.vehicle.make} {selectedOrder.vehicle.model}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">VIN Identifier</span>
                        <span className="font-mono font-bold text-slate-900">{selectedOrder.vehicle.vinOrReg}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Report Tier</span>
                        <span className="font-semibold text-slate-900">{selectedOrder.serviceName}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Order Number</span>
                        <span className="font-mono font-bold text-slate-900">{selectedOrder.orderNumber}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Report in Progress View */
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                      <div>
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 mb-1.5">
                          <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
                          <span>Compiling Records</span>
                        </div>
                        <h3 className="text-xl font-bold text-slate-900">
                          Vehicle Report in Progress
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Your records are currently being assembled from official registries.
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono text-slate-400">
                          Placed {new Date(selectedOrder.createdAt).toLocaleDateString()}
                        </span>
                        <WhatsAppButton
                          variant="primary"
                          label="Ask on WhatsApp"
                          orderNumber={selectedOrder.orderNumber}
                          vin={selectedOrder.vehicle.vinOrReg}
                          className="px-3 py-1.5 rounded-xl font-semibold text-xs"
                        />
                      </div>
                    </div>

                    <OrderTrackingProgressBar
                      status={selectedOrder.status}
                      hasResultFile={!!selectedOrder.resultFile}
                      orderNumber={selectedOrder.orderNumber}
                      createdAt={selectedOrder.createdAt}
                      updatedAt={selectedOrder.updatedAt}
                    />
                  </div>
                )}

              </div>
            )}

            {/* Recent Orders Table (Section 16: Order ID, Vehicle, Report, Date, Status, Action) */}
            <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h3 className="text-base font-bold text-slate-900">Recent Orders</h3>
                
                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by order or VIN..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-[#2563EB]"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F8FAFC] text-slate-500 font-semibold border-y border-[#E2E8F0]">
                    <tr>
                      <th className="py-3 px-4">Order ID</th>
                      <th className="py-3 px-4">Vehicle</th>
                      <th className="py-3 px-4">Report</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredOrders.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-8 px-4 text-center">
                          <div className="max-w-md mx-auto space-y-3">
                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                              <Search className="w-5 h-5" />
                            </div>
                            <h4 className="text-sm font-bold text-slate-800">No Vehicle Reports Found</h4>
                            <p className="text-xs text-slate-500">
                              Enter your checkout email address or order number (e.g. AA-XXXXX) below to retrieve your official vehicle history report.
                            </p>
                            <form 
                              onSubmit={(e) => {
                                e.preventDefault();
                                handleLookup(lookupEmail);
                              }}
                              className="flex items-center gap-2 pt-1"
                            >
                              <input
                                type="text"
                                value={lookupEmail}
                                onChange={(e) => setLookupEmail(e.target.value)}
                                placeholder="name@example.com or AA-XXXXX"
                                className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
                              />
                              <button
                                type="submit"
                                disabled={isSearching}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer flex items-center gap-1 disabled:opacity-50"
                              >
                                {isSearching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                                <span>Look Up</span>
                              </button>
                            </form>
                          </div>
                        </td>
                      </tr>
                    )}
                    {filteredOrders.map((ord) => (
                      <tr
                        key={ord.id}
                        onClick={() => setSelectedOrder(ord)}
                        className={`hover:bg-slate-50 cursor-pointer transition-colors ${
                          selectedOrder?.id === ord.id ? 'bg-blue-50/50' : ''
                        }`}
                      >
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                          {ord.orderNumber}
                        </td>
                        <td className="py-3.5 px-4">
                          <p className="font-semibold text-slate-900">{ord.vehicle.year} {ord.vehicle.make} {ord.vehicle.model}</p>
                          <p className="text-[11px] text-slate-400 font-mono">{ord.vehicle.vinOrReg}</p>
                        </td>
                        <td className="py-3.5 px-4 font-medium text-slate-700">
                          {ord.serviceName}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 font-mono">
                          {new Date(ord.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3.5 px-4">
                          {getStatusBadge(ord.status)}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedOrder(ord);
                              if (ord.status === 'Ready' || ord.status === 'Delivered' || ord.status === 'Completed' || ord.resultFile) {
                                onOpenSampleReport();
                              }
                            }}
                            className="px-3 py-1 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-lg text-[11px] font-semibold transition-colors cursor-pointer"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            </div>

          </div>

        </main>

      </div>
    </div>
  );
};
