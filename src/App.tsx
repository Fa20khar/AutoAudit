import React, { useState, useEffect } from 'react';
import { 
  INITIAL_SERVICES, 
  INITIAL_ORDERS, 
  INITIAL_COUPONS, 
  INITIAL_EMAILS 
} from './data/initialData';
import { ServicePlan, Order, Coupon, EmailNotification } from './types';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { TrustStrip } from './components/TrustStrip';
import { ServicesSection } from './components/ServicesSection';
import { HowItWorks } from './components/HowItWorks';
import { SampleReportSection } from './components/SampleReportSection';
import { TrustBenefitsSection } from './components/TrustBenefitsSection';
import { TestimonialsSection } from './components/TestimonialsSection';
import { FAQSection } from './components/FAQSection';
import { FinalCTA } from './components/FinalCTA';
import { Footer } from './components/Footer';
import { SampleReportModal } from './components/SampleReportModal';
import { OrderModal } from './components/OrderModal';
import { MyOrdersModal } from './components/MyOrdersModal';
import { LegalModal } from './components/LegalModal';
import { AdminPanel } from './components/AdminPanel';
import { ReportDownloadModal } from './components/ReportDownloadModal';
import { CustomerIntakeModal } from './components/CustomerIntakeModal';
import { WhatsAppWidget } from './components/WhatsAppWidget';
import { ToastProvider } from './context/ToastContext';
import { LanguageProvider } from './context/LanguageContext';
import { api } from './services/api';

export default function App() {
  return (
    <LanguageProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </LanguageProvider>
  );
}

function AppContent() {
  // Persistence state initialization
  const [services, setServices] = useState<ServicePlan[]>(() => {
    const saved = localStorage.getItem('autoaudit_services');
    return saved ? JSON.parse(saved) : INITIAL_SERVICES;
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('autoaudit_orders');
    return saved ? JSON.parse(saved) : INITIAL_ORDERS;
  });

  const [coupons, setCoupons] = useState<Coupon[]>(() => {
    const saved = localStorage.getItem('autoaudit_coupons');
    return saved ? JSON.parse(saved) : INITIAL_COUPONS;
  });

  const [emails, setEmails] = useState<EmailNotification[]>(() => {
    const saved = localStorage.getItem('autoaudit_emails');
    return saved ? JSON.parse(saved) : INITIAL_EMAILS;
  });

  // UI Navigation & View state
  const [isAdminView, setIsAdminView] = useState<boolean>(false);

  // Modals state
  const [isOrderModalOpen, setIsOrderModalOpen] = useState<boolean>(false);
  const [selectedServiceIdForOrder, setSelectedServiceIdForOrder] = useState<string>('comprehensive-vin');
  const [orderInitialVin, setOrderInitialVin] = useState<string>('');
  const [orderInitialIsVin, setOrderInitialIsVin] = useState<boolean>(true);

  const [isIntakeModalOpen, setIsIntakeModalOpen] = useState<boolean>(false);
  const [intakeInitialVin, setIntakeInitialVin] = useState<string>('');

  const [isSampleModalOpen, setIsSampleModalOpen] = useState<boolean>(false);
  const [isTrackModalOpen, setIsTrackModalOpen] = useState<boolean>(false);
  const [legalModalState, setLegalModalState] = useState<{
    isOpen: boolean;
    tab: 'terms' | 'privacy' | 'refund' | 'compliance';
  }>({
    isOpen: false,
    tab: 'terms',
  });

  const [downloadModalState, setDownloadModalState] = useState<{
    isOpen: boolean;
    vin: string;
    vehicleTitle: string;
    orderNumber: string;
  }>({
    isOpen: false,
    vin: '',
    vehicleTitle: '',
    orderNumber: '',
  });

  const handleDownloadReport = (vin: string, vehicleTitle: string, orderNumber: string) => {
    setDownloadModalState({
      isOpen: true,
      vin,
      vehicleTitle,
      orderNumber,
    });
  };

  // Fetch initial state from backend REST API with fallback to localStorage
  useEffect(() => {
    // 1. Load services from backend
    api.getServices()
      .then((data) => {
        if (data && data.length > 0) setServices(data);
      })
      .catch((err) => console.warn('Using cached services', err));

    // 2. Load active coupons from backend
    api.getCoupons()
      .then((data) => {
        if (data && data.length > 0) setCoupons(data);
      })
      .catch((err) => console.warn('Using cached coupons', err));

    // 3. Load customer-scoped past orders if customer previously placed an order on this browser
    const customerEmail = localStorage.getItem('autoaudit_customer_email');
    if (customerEmail) {
      api.getOrders({ email: customerEmail })
        .then((data) => {
          if (data && data.length > 0) setOrders(data);
        })
        .catch(() => {});
    }
  }, []);

  // Save to localStorage when state changes as instant offline fallback
  useEffect(() => {
    localStorage.setItem('autoaudit_services', JSON.stringify(services));
  }, [services]);

  useEffect(() => {
    localStorage.setItem('autoaudit_orders', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('autoaudit_coupons', JSON.stringify(coupons));
  }, [coupons]);

  useEffect(() => {
    localStorage.setItem('autoaudit_emails', JSON.stringify(emails));
  }, [emails]);

  // Handlers
  const handleOpenOrder = (serviceId?: string) => {
    if (serviceId) {
      setSelectedServiceIdForOrder(serviceId);
    }
    setIsOrderModalOpen(true);
  };

  const handleStartOrderWithVin = (vin: string, isVin: boolean) => {
    setOrderInitialVin(vin);
    setOrderInitialIsVin(isVin);
    setSelectedServiceIdForOrder('comprehensive-vin');
    setIsOrderModalOpen(true);
  };

  const handleOrderCompleted = (newOrder: Order) => {
    // Update local state without duplicating
    setOrders((prev) => [newOrder, ...prev.filter((o) => o.id !== newOrder.id && o.orderNumber !== newOrder.orderNumber)]);

    // Query emails dispatched by the automated mock SMTP service
    api.getEmails({ orderNumber: newOrder.orderNumber })
      .then((serverEmails) => {
        if (serverEmails && serverEmails.length > 0) {
          setEmails((prev) => [
            ...serverEmails,
            ...prev.filter((e) => e.orderNumber !== newOrder.orderNumber)
          ]);
        }
      })
      .catch(() => {});

    // Immediate local representation
    const now = new Date().toISOString();
    
    // 1. Alert to Admin
    const adminAlert: EmailNotification = {
      id: `em-${Date.now()}-admin`,
      orderId: newOrder.id,
      orderNumber: newOrder.orderNumber,
      recipientEmail: 'admin@autoaudit.com',
      recipientType: 'admin',
      subject: `[NEW ORDER] #${newOrder.orderNumber} - ${newOrder.serviceName} (${newOrder.vehicle.vinOrReg})`,
      type: 'new_order_admin',
      body: `New Order Received!\n\nOrder #${newOrder.orderNumber}\nCustomer: ${newOrder.customer.fullName} (${newOrder.customer.email})\nVehicle: ${newOrder.vehicle.year} ${newOrder.vehicle.make} ${newOrder.vehicle.model}\nVIN/Plate: ${newOrder.vehicle.vinOrReg}\nAmount Paid: $${newOrder.total.toFixed(2)}\n\nPlease open the Admin Portal to begin verification fulfillment.`,
      sentAt: now,
      read: false
    };

    // 2. Confirmation to Customer via Mock SMTP
    const customerConf: EmailNotification = {
      id: `em-${Date.now()}-cust`,
      orderId: newOrder.id,
      orderNumber: newOrder.orderNumber,
      recipientEmail: newOrder.customer.email,
      recipientType: 'customer',
      subject: `Order Confirmed: AutoAudit Report for ${newOrder.vehicle.vinOrReg} (${newOrder.orderNumber})`,
      type: 'order_confirmation',
      body: `Dear ${newOrder.customer.fullName},\n\nWe have received your order for the ${newOrder.serviceName}.\n\nVehicle: ${newOrder.vehicle.year} ${newOrder.vehicle.make} ${newOrder.vehicle.model} (VIN: ${newOrder.vehicle.vinOrReg})\nEstimated Delivery: 30–60 minutes.\n\nYour order confirmation email has been dispatched directly to ${newOrder.customer.email} via AutoAudit Mock SMTP service.`,
      smtpTransport: 'Nodemailer Mock SMTP (JSON Transporter)',
      sentAt: now,
      read: true
    };

    setEmails((prev) => [adminAlert, customerConf, ...prev]);
  };

  const handleUpdateOrder = (updatedOrder: Order) => {
    setOrders((prev) => prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o)));
    // Sync status change to backend
    api.updateOrderStatus(updatedOrder.id, updatedOrder.status, updatedOrder.internalNotes).catch(console.warn);
  };

  const handleBatchUpdateOrders = (updatedOrders: Order[]) => {
    const updatedMap = new Map(updatedOrders.map((o) => [o.id, o]));
    setOrders((prev) => prev.map((o) => updatedMap.get(o.id) || o));
    // Sync status changes to backend
    updatedOrders.forEach((o) => {
      api.updateOrderStatus(o.id, o.status, o.internalNotes).catch(console.warn);
    });
  };

  const handleSendEmail = (newEmail: EmailNotification) => {
    setEmails((prev) => [newEmail, ...prev]);
  };

  const handleScrollTo = (id: string) => {
    if (isAdminView) {
      setIsAdminView(false);
      setTimeout(() => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
      return;
    }
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const newOrdersCount = orders.filter((o) => o.status === 'Paid / New').length;

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      
      {/* If in Admin Portal Mode */}
      {isAdminView ? (
        <AdminPanel
          orders={orders}
          services={services}
          coupons={coupons}
          emails={emails}
          onUpdateOrder={handleUpdateOrder}
          onBatchUpdateOrders={handleBatchUpdateOrders}
          onUpdateServices={setServices}
          onUpdateCoupons={setCoupons}
          onSendEmail={handleSendEmail}
          onCloseAdmin={() => setIsAdminView(false)}
          onViewSampleReport={() => setIsSampleModalOpen(true)}
          onDownloadReport={handleDownloadReport}
        />
      ) : (
        /* Public Customer Experience */
        <>
          <Navbar
            onOpenOrder={handleOpenOrder}
            onOpenSample={() => setIsSampleModalOpen(true)}
            onOpenTrack={() => setIsTrackModalOpen(true)}
            onOpenFaq={() => handleScrollTo('faq')}
            onScrollTo={handleScrollTo}
            isAdminView={isAdminView}
            onToggleAdminView={() => setIsAdminView(!isAdminView)}
            newOrdersCount={newOrdersCount}
            onRequestReport={() => setIsIntakeModalOpen(true)}
          />

          <main className="flex-1">
            {/* Section 6, 7, 8: Hero Section with Search Panel & Floating Report Preview */}
            <Hero
              onStartOrderWithVin={handleStartOrderWithVin}
              onOpenSample={() => setIsSampleModalOpen(true)}
              onRequestReport={() => setIsIntakeModalOpen(true)}
            />

            {/* Section 9: Trust Strip */}
            <TrustStrip />

            {/* Section 10: Pricing Section */}
            <ServicesSection
              services={services.filter((s) => s.active)}
              onSelectService={handleOpenOrder}
            />

            {/* Section 19: How It Works */}
            <HowItWorks onStartOrder={() => handleOpenOrder()} />

            {/* Section 18: Sample Report Section */}
            <SampleReportSection
              onOpenSampleModal={() => setIsSampleModalOpen(true)}
            />

            {/* Section 20: Trust / Benefits */}
            <TrustBenefitsSection />

            {/* Section 21: Testimonials */}
            <TestimonialsSection />

            {/* Section 22: FAQ */}
            <FAQSection />

            {/* Section 23: Final CTA */}
            <FinalCTA
              onStartOrder={() => handleOpenOrder()}
              onOpenSample={() => setIsSampleModalOpen(true)}
              onRequestReport={() => setIsIntakeModalOpen(true)}
            />
          </main>

          <Footer
            onOpenLegal={(tab) => setLegalModalState({ isOpen: true, tab })}
            onOpenOrder={() => handleOpenOrder()}
            onOpenSample={() => setIsSampleModalOpen(true)}
            onOpenTrack={() => setIsTrackModalOpen(true)}
            onScrollTo={handleScrollTo}
            onToggleAdmin={() => setIsAdminView(true)}
            onRequestReport={() => setIsIntakeModalOpen(true)}
          />
        </>
      )}

      {/* Global Interactive Modals */}
      <OrderModal
        isOpen={isOrderModalOpen}
        onClose={() => {
          setIsOrderModalOpen(false);
          setOrderInitialVin('');
        }}
        services={services.filter((s) => s.active)}
        selectedServiceId={selectedServiceIdForOrder}
        initialVin={orderInitialVin}
        initialIsVin={orderInitialIsVin}
        coupons={coupons}
        onOrderCompleted={handleOrderCompleted}
        onOpenTrack={() => setIsTrackModalOpen(true)}
        onDownloadReport={handleDownloadReport}
      />

      <SampleReportModal
        isOpen={isSampleModalOpen}
        onClose={() => setIsSampleModalOpen(false)}
        onOrderNow={() => {
          setIsSampleModalOpen(false);
          handleOpenOrder('comprehensive-vin');
        }}
        onDownloadReport={handleDownloadReport}
      />

      <MyOrdersModal
        isOpen={isTrackModalOpen}
        onClose={() => setIsTrackModalOpen(false)}
        orders={orders}
        onOpenSampleReport={() => setIsSampleModalOpen(true)}
        onDownloadReport={handleDownloadReport}
      />

      <LegalModal
        isOpen={legalModalState.isOpen}
        onClose={() => setLegalModalState({ ...legalModalState, isOpen: false })}
        defaultTab={legalModalState.tab}
      />

      <ReportDownloadModal
        isOpen={downloadModalState.isOpen}
        onClose={() => setDownloadModalState({ ...downloadModalState, isOpen: false })}
        vin={downloadModalState.vin}
        vehicleTitle={downloadModalState.vehicleTitle}
        orderNumber={downloadModalState.orderNumber}
      />

      {/* Customer Intake & Auto-Generate Modal (Google Forms Specification) */}
      <CustomerIntakeModal
        isOpen={isIntakeModalOpen}
        onClose={() => {
          setIsIntakeModalOpen(false);
          setIntakeInitialVin('');
        }}
        onOpenReportDownload={handleDownloadReport}
        onOpenLegal={(tab) => setLegalModalState({ isOpen: true, tab })}
        initialVin={intakeInitialVin}
      />

      {/* Persistent Floating WhatsApp Support Widget */}
      <WhatsAppWidget />

    </div>
  );
}
