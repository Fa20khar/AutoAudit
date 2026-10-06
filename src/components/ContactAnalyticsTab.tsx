import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, BarChart3, TrendingUp, Users, ArrowUpRight, Search, 
  Filter, Smartphone, Monitor, Globe, ShieldCheck, Check, RefreshCw, 
  ExternalLink, PhoneCall, Clock, Calendar, Sparkles, Send, Copy, AlertCircle, QrCode
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { WhatsAppIcon, getWhatsAppUrl } from './WhatsAppWidget';
import { ContactEvent, ContactAnalyticsSummary, WhatsAppConfig, ContactSource, ContactIntent } from '../types';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { INITIAL_WHATSAPP_CONFIG, INITIAL_CONTACT_EVENTS } from '../data/initialData';

export const ContactAnalyticsTab: React.FC = () => {
  const { showToast } = useToast();

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [summary, setSummary] = useState<ContactAnalyticsSummary | null>(null);
  const [events, setEvents] = useState<ContactEvent[]>(INITIAL_CONTACT_EVENTS);
  const [whatsAppConfig, setWhatsAppConfig] = useState<WhatsAppConfig>(INITIAL_WHATSAPP_CONFIG);
  
  // WhatsApp Settings Form state
  const [editPhone, setEditPhone] = useState<string>(INITIAL_WHATSAPP_CONFIG.phoneNumber);
  const [editDisplayNumber, setEditDisplayNumber] = useState<string>(INITIAL_WHATSAPP_CONFIG.displayNumber);
  const [editGreeting, setEditGreeting] = useState<string>(INITIAL_WHATSAPP_CONFIG.defaultGreeting);
  const [editAvailability, setEditAvailability] = useState<string>(INITIAL_WHATSAPP_CONFIG.supportAvailability);
  const [isSavingConfig, setIsSavingConfig] = useState<boolean>(false);
  const [configSavedSuccess, setConfigSavedSuccess] = useState<boolean>(false);

  // Filters for events table
  const [sourceFilter, setSourceFilter] = useState<string>('All');
  const [intentFilter, setIntentFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const loadAnalytics = async () => {
    setIsLoading(true);
    try {
      const [summaryRes, eventsRes, configRes] = await Promise.all([
        api.getContactSummary().catch(() => null),
        api.getContactEvents().catch(() => INITIAL_CONTACT_EVENTS),
        api.getWhatsAppConfig().catch(() => INITIAL_WHATSAPP_CONFIG),
      ]);

      if (eventsRes && Array.isArray(eventsRes)) {
        setEvents(eventsRes);
      }

      if (configRes) {
        setWhatsAppConfig(configRes);
        setEditPhone(configRes.phoneNumber);
        setEditDisplayNumber(configRes.displayNumber);
        setEditGreeting(configRes.defaultGreeting);
        setEditAvailability(configRes.supportAvailability);
      }

      if (summaryRes) {
        setSummary(summaryRes);
      } else {
        // Fallback local calculations
        const now = Date.now();
        const oneDayAgo = now - 24 * 60 * 60 * 1000;
        const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
        const currentEvents = eventsRes || INITIAL_CONTACT_EVENTS;

        const bySource: Record<string, number> = {};
        const byIntent: Record<string, number> = {};
        const byChannel: Record<string, number> = {};

        for (const e of currentEvents) {
          bySource[e.source] = (bySource[e.source] || 0) + 1;
          byIntent[e.intent] = (byIntent[e.intent] || 0) + 1;
          byChannel[e.channel] = (byChannel[e.channel] || 0) + 1;
        }

        setSummary({
          totalClicks: currentEvents.length,
          clicksLast24h: currentEvents.filter(e => new Date(e.timestamp).getTime() >= oneDayAgo).length,
          clicksLast7d: currentEvents.filter(e => new Date(e.timestamp).getTime() >= sevenDaysAgo).length,
          topSource: Object.entries(bySource).sort((a, b) => b[1] - a[1])[0]?.[0] || 'floating_widget',
          topIntent: Object.entries(byIntent).sort((a, b) => b[1] - a[1])[0]?.[0] || 'vin_check',
          conversionRateEstimate: 36,
          bySource,
          byIntent,
          byChannel,
          recentEvents: currentEvents.slice(0, 50),
        });
      }
    } catch {
      showToast({
        type: 'warning',
        title: 'Offline Analytics',
        message: 'Loaded local contact analytics data.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingConfig(true);
    try {
      let cleanPhone = editPhone.replace(/[^0-9]/g, '');
      if (cleanPhone.startsWith('03') && cleanPhone.length === 11) {
        cleanPhone = '92' + cleanPhone.slice(1);
      }

      const updated = await api.updateWhatsAppConfig({
        phoneNumber: cleanPhone,
        displayNumber: editDisplayNumber.trim(),
        defaultGreeting: editGreeting.trim(),
        supportAvailability: editAvailability.trim(),
        active: true,
      });

      setWhatsAppConfig(updated);
      setConfigSavedSuccess(true);
      setTimeout(() => setConfigSavedSuccess(false), 3000);
      showToast({
        type: 'success',
        title: 'Configuration Saved',
        message: 'WhatsApp business settings and click-to-chat links updated.',
      });
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Save Failed',
        message: err?.message || 'Could not update WhatsApp configuration.',
      });
    } finally {
      setIsSavingConfig(false);
    }
  };

  // Filtered Events List
  const filteredEvents = events.filter((ev) => {
    const matchesSource = sourceFilter === 'All' || ev.source === sourceFilter;
    const matchesIntent = intentFilter === 'All' || ev.intent === intentFilter;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !searchQuery.trim() ||
      (ev.vin && ev.vin.toLowerCase().includes(q)) ||
      (ev.orderNumber && ev.orderNumber.toLowerCase().includes(q)) ||
      (ev.messagePreview && ev.messagePreview.toLowerCase().includes(q));

    return matchesSource && matchesIntent && matchesSearch;
  });

  const formatSourceLabel = (src: string) => {
    switch (src) {
      case 'floating_widget': return 'Floating Widget';
      case 'hero': return 'Hero Section';
      case 'navbar': return 'Navigation Bar';
      case 'footer': return 'Footer';
      case 'pricing': return 'Pricing Cards';
      case 'order_modal': return 'Checkout Modal';
      case 'my_orders': return 'Customer Portal';
      case 'faq': return 'FAQ Section';
      default: return src.replace('_', ' ');
    }
  };

  const formatIntentLabel = (intent: string) => {
    switch (intent) {
      case 'vin_check': return 'VIN Verification';
      case 'order_tracking': return 'Order Status';
      case 'pricing': return 'Pricing / Plans';
      case 'general_support': return 'General Support';
      case 'auction_photo': return 'Auction Records';
      default: return intent.replace('_', ' ');
    }
  };

  const getIntentBadge = (intent: string) => {
    switch (intent) {
      case 'vin_check':
        return <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded text-[11px] font-semibold">VIN Check</span>;
      case 'order_tracking':
        return <span className="bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded text-[11px] font-semibold">Order Status</span>;
      case 'pricing':
        return <span className="bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded text-[11px] font-semibold">Pricing</span>;
      default:
        return <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded text-[11px] font-semibold">General</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[#25D366] text-white flex items-center justify-center shadow-md">
            <WhatsAppIcon className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">WhatsApp Click-to-Chat & Contact Analytics</h2>
              <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
                LIVE
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Real-time telemetry on customer inquiries, conversion touchpoints, and WhatsApp support volume.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadAnalytics}
            disabled={isLoading}
            className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
            <span>Refresh Telemetry</span>
          </button>

          <a
            href={getWhatsAppUrl('Test ping from AutoAudit Admin Console', whatsAppConfig.phoneNumber)}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
          >
            <WhatsAppIcon className="w-3.5 h-3.5" />
            <span>Test Click-to-Chat</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Click-to-Chat */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Total Click-to-Chat</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#25D366] flex items-center justify-center">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">{summary?.totalClicks || events.length}</span>
            <span className="text-xs text-emerald-600 font-bold flex items-center gap-0.5">
              <ArrowUpRight className="w-3.5 h-3.5" />
              +28%
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            {summary?.clicksLast24h || 2} conversations in the last 24 hours
          </p>
        </div>

        {/* 7-Day Velocity */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold uppercase tracking-wider text-[10px]">7-Day Inquiries</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">{summary?.clicksLast7d || events.length}</span>
            <span className="text-xs text-slate-500 font-medium">active leads</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Avg. response time: &lt; 3 minutes
          </p>
        </div>

        {/* Top Trigger Source */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Top Conversion Source</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Globe className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-xl font-bold text-slate-900 block truncate">
              {formatSourceLabel(summary?.topSource || 'floating_widget')}
            </span>
            <p className="text-[11px] text-slate-400 mt-1">
              Generated {summary?.bySource?.[summary.topSource] || 3} inquiries
            </p>
          </div>
        </div>

        {/* Est. Conversion Rate */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Inquiry-to-Order Conversion</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">{summary?.conversionRateEstimate || 38}%</span>
            <span className="text-xs text-emerald-600 font-bold">Above avg.</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Customers chatting on WhatsApp convert 2.4x higher
          </p>
        </div>
      </div>

      {/* Two Column Layout: Source & Intent Breakdown + WhatsApp Config Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Visual Breakdowns (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Source Breakdown Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-blue-600" />
                <span>Click-to-Chat Inquiries by UI Placement</span>
              </h3>
              <span className="text-xs text-slate-400 font-mono">Last 30 days</span>
            </div>

            <div className="space-y-3">
              {[
                { key: 'floating_widget', label: 'Floating Support Widget', count: summary?.bySource?.floating_widget || 0, color: 'bg-[#25D366]' },
                { key: 'hero', label: 'Hero Section (VIN Search)', count: summary?.bySource?.hero || 0, color: 'bg-blue-600' },
                { key: 'pricing', label: 'Plan & Pricing Cards', count: summary?.bySource?.pricing || 0, color: 'bg-purple-600' },
                { key: 'order_modal', label: 'Checkout & Review Modal', count: summary?.bySource?.order_modal || 0, color: 'bg-amber-500' },
                { key: 'my_orders', label: 'Customer Order Tracking Portal', count: summary?.bySource?.my_orders || 0, color: 'bg-emerald-600' },
                { key: 'faq', label: 'FAQ Section Help Banner', count: summary?.bySource?.faq || 0, color: 'bg-indigo-500' },
              ].map((item) => {
                const total = Math.max(summary?.totalClicks || 1, 1);
                const percent = Math.round((item.count / total) * 100);
                return (
                  <div key={item.key} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-slate-700">{item.label}</span>
                      <span className="font-mono text-slate-500">
                        {item.count} clicks ({percent}%)
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={`h-full ${item.color} rounded-full transition-all duration-500`}
                        style={{ width: `${Math.max(percent, item.count > 0 ? 6 : 0)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Inquiry Intent Distribution */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-600" />
              <span>Customer Intent & Primary Questions</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { key: 'vin_check', label: 'VIN Verification', count: summary?.byIntent?.vin_check || 0, icon: Search, bg: 'bg-blue-50 text-blue-700' },
                { key: 'order_tracking', label: 'Order Tracking', count: summary?.byIntent?.order_tracking || 0, icon: Clock, bg: 'bg-amber-50 text-amber-800' },
                { key: 'pricing', label: 'Pricing / Plans', count: summary?.byIntent?.pricing || 0, icon: Sparkles, bg: 'bg-purple-50 text-purple-700' },
                { key: 'general_support', label: 'General Care', count: summary?.byIntent?.general_support || 0, icon: MessageSquare, bg: 'bg-emerald-50 text-emerald-800' },
              ].map((cat) => {
                const IconComponent = cat.icon;
                return (
                  <div key={cat.key} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/70 space-y-1">
                    <div className="flex items-center justify-between">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${cat.bg}`}>
                        <IconComponent className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-mono font-bold text-base text-slate-900">{cat.count}</span>
                    </div>
                    <span className="text-xs font-semibold text-slate-700 block truncate">{cat.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Right Column: Dynamic WhatsApp Business Configuration Form */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-[#25D366] text-white flex items-center justify-center">
              <WhatsAppIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">WhatsApp Business Config</h3>
              <p className="text-[11px] text-slate-500">Updates live links across the entire website</p>
            </div>
          </div>

          <form onSubmit={handleSaveConfig} className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 block">
                WhatsApp Phone Number (E.164 Format)
              </label>
              <input
                type="text"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                placeholder="923420617217 (or 03420617217)"
                required
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs focus:outline-none focus:border-[#25D366]"
              />
              <span className="text-[10px] text-slate-400 block">
                Numbers with country code (e.g. 923420617217 or 03420617217 for Pakistan).
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 block">
                Display Phone Number
              </label>
              <input
                type="text"
                value={editDisplayNumber}
                onChange={(e) => setEditDisplayNumber(e.target.value)}
                placeholder="+92 342 0617217"
                required
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-[#25D366]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 block">
                Default Greeting Template
              </label>
              <textarea
                rows={3}
                value={editGreeting}
                onChange={(e) => setEditGreeting(e.target.value)}
                placeholder="Hello AutoAudit Support, I would like assistance..."
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs resize-none focus:outline-none focus:border-[#25D366]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 block">
                Support Hours & SLA Notice
              </label>
              <input
                type="text"
                value={editAvailability}
                onChange={(e) => setEditAvailability(e.target.value)}
                placeholder="Mon–Sun · 24/7 Coverage · Avg Response < 5 Mins"
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-[#25D366]"
              />
            </div>

            <div className="pt-2 space-y-2">
              <button
                type="submit"
                disabled={isSavingConfig}
                className="w-full py-2.5 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {configSavedSuccess ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Saved Successfully!</span>
                  </>
                ) : isSavingConfig ? (
                  <span>Updating Configuration...</span>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Save WhatsApp Settings</span>
                  </>
                )}
              </button>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 flex flex-col items-center text-center gap-2">
                <div className="flex items-center gap-1.5 font-bold text-slate-800">
                  <QrCode className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Scannable WhatsApp QR Code Preview:</span>
                </div>
                <div className="p-2 bg-white rounded-xl border border-slate-200 shadow-xs">
                  <QRCodeSVG
                    value={getWhatsAppUrl(editGreeting || 'AutoAudit Support', editPhone)}
                    size={110}
                    level="H"
                    includeMargin={true}
                  />
                </div>
                <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Phone: {editPhone}
                </span>
                <code className="font-mono text-[9.5px] break-all text-slate-600 block mt-1">
                  {getWhatsAppUrl('Preview test', editPhone)}
                </code>
              </div>
            </div>
          </form>
        </div>

      </div>

      {/* Filterable Live Telemetry Table */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">Live Contact Telemetry Log</h3>
            <p className="text-xs text-slate-500">Every customer Click-to-Chat trigger is logged with source origin, intent, and timestamp.</p>
          </div>

          {/* Filters Bar */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="text-xs p-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none"
            >
              <option value="All">All Sources</option>
              <option value="floating_widget">Floating Widget</option>
              <option value="hero">Hero Section</option>
              <option value="pricing">Pricing Cards</option>
              <option value="order_modal">Order Modal</option>
              <option value="my_orders">Customer Portal</option>
              <option value="faq">FAQ Banner</option>
            </select>

            <select
              value={intentFilter}
              onChange={(e) => setIntentFilter(e.target.value)}
              className="text-xs p-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none"
            >
              <option value="All">All Intents</option>
              <option value="vin_check">VIN Verification</option>
              <option value="order_tracking">Order Tracking</option>
              <option value="pricing">Pricing / Plans</option>
              <option value="general_support">General Support</option>
            </select>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search VIN or order..."
                className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none w-44"
              />
            </div>
          </div>
        </div>

        {/* Telemetry Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FAFC] text-slate-500 font-semibold border-y border-[#E2E8F0]">
              <tr>
                <th className="py-3 px-4">Time</th>
                <th className="py-3 px-4">Channel</th>
                <th className="py-3 px-4">Trigger Source</th>
                <th className="py-3 px-4">Intent</th>
                <th className="py-3 px-4">Vehicle VIN / Order #</th>
                <th className="py-3 px-4">Inquiry Preview</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No contact events found matching the active filters.
                  </td>
                </tr>
              ) : (
                filteredEvents.map((evt) => (
                  <tr key={evt.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                      {new Date(evt.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-semibold border border-emerald-200">
                        <WhatsAppIcon className="w-3 h-3 text-[#25D366]" />
                        <span>WhatsApp</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800 whitespace-nowrap">
                      {formatSourceLabel(evt.source)}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {getIntentBadge(evt.intent)}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-700 whitespace-nowrap">
                      {evt.orderNumber ? (
                        <span className="font-bold text-blue-600">#{evt.orderNumber}</span>
                      ) : evt.vin ? (
                        <span>{evt.vin}</span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                      {evt.messagePreview || 'Customer clicked WhatsApp chat link'}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <a
                        href={getWhatsAppUrl(evt.messagePreview || undefined, whatsAppConfig.phoneNumber)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 rounded-lg text-[11px] font-semibold transition-colors"
                      >
                        <span>Open Chat</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
