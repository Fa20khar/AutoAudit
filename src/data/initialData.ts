import { ServicePlan, Order, Coupon, EmailNotification, ContactEvent, WhatsAppConfig } from '../types';

export const INITIAL_SERVICES: ServicePlan[] = [
  {
    id: 'basic-report',
    name: 'Basic Report',
    tagline: 'Vehicle history overview, title check, and essential odometer records.',
    price: 18.99,
    originalPrice: 24.99,
    deliveryTime: 'Standard processing (1–2 hrs)',
    isPopular: false,
    requiredFields: ['VIN or Plate', 'Year / Make / Model', 'Email'],
    includedItems: [
      'Vehicle history overview',
      'Title information & state brand check',
      'Odometer information & rollback alerts',
      'Basic report details & technical specs'
    ],
    exclusions: [
      'Copart / Manheim Historical Auction Photos',
      'Detailed Insurance Collision Breakdown',
      'Priority Queue Assignment'
    ],
    active: true
  },
  {
    id: 'comprehensive-vin',
    name: 'Complete Report',
    tagline: 'Comprehensive vehicle history, title records, accidents, and salvage status.',
    price: 28.99,
    originalPrice: 38.99,
    deliveryTime: 'Expedited processing (30–45 mins)',
    isPopular: true,
    requiredFields: ['17-character VIN', 'Make / Model / Year', 'Email', 'Phone'],
    includedItems: [
      'Comprehensive vehicle history overview',
      'Title records across all 50 US states & Canada',
      'Accident information & structural integrity',
      'Odometer history & verified mileage timeline',
      'Salvage information & total loss write-offs',
      'Additional available records (recalls, liens, owners)'
    ],
    exclusions: [
      'Copart / Manheim Historical Auction Photo Archive'
    ],
    active: true
  },
  {
    id: 'premium-auction-audit',
    name: 'Premium Report',
    tagline: 'Extended vehicle history with historical salvage auction records and priority delivery.',
    price: 42.99,
    originalPrice: 59.99,
    deliveryTime: 'Priority processing (15–30 mins)',
    isPopular: false,
    requiredFields: ['17-character VIN', 'Make / Model / Year', 'Email', 'Phone'],
    includedItems: [
      'Everything in Complete Report',
      'Extended vehicle history & prior sale records',
      'Additional available records & historical bids',
      'Detailed report information & build options',
      'Priority processing queue assignment'
    ],
    exclusions: [],
    active: true
  }
];

export const INITIAL_COUPONS: Coupon[] = [
  {
    code: 'FAKHAR20',
    discountPercent: 20,
    usageCount: 14,
    maxUsage: 100,
    expiryDate: '2026-12-31',
    active: true
  },
  {
    code: 'WELCOME10',
    discountFixed: 5.0,
    usageCount: 29,
    maxUsage: 200,
    expiryDate: '2026-11-30',
    active: true
  }
];

export const INITIAL_ORDERS: Order[] = [
  {
    id: 'ord-10025',
    orderNumber: 'AA-10025',
    serviceId: 'comprehensive-vin',
    serviceName: 'Comprehensive VIN Check',
    status: 'Paid / New',
    subtotal: 28.99,
    discountAmount: 5.80,
    total: 23.19,
    couponCode: 'FAKHAR20',
    customer: {
      fullName: 'Hamza Tariq',
      email: 'hamza.tariq@gmail.com',
      phone: '+92 300 4567891'
    },
    vehicle: {
      vinOrReg: 'WAUZZZF45LA019283',
      isVin: true,
      make: 'Audi',
      model: 'A4 45 TFSI quattro',
      year: 2021,
      mileage: '34,200 km',
      countryOrState: 'Punjab, PK (Import)',
      customerNotes: 'Please verify if odometer was rolled back and check for front bumper repair records.'
    },
    payment: {
      status: 'Paid',
      gatewayRef: 'PAY-TXN-88392109',
      paidAt: '2026-09-28T05:30:00Z',
      method: 'Online Card Payment (Visa)'
    },
    internalNotes: 'Customer imported from Japan/UK auction. Cross-checking NMVTIS and export manifest database.',
    createdAt: '2026-09-28T05:28:12Z',
    updatedAt: '2026-09-28T05:30:00Z',
    auditLogs: [
      {
        id: 'log-1',
        timestamp: '2026-09-28T05:28:12Z',
        actor: 'Customer (Hamza Tariq)',
        action: 'Order Placed',
        details: 'Order created with coupon FAKHAR20'
      },
      {
        id: 'log-2',
        timestamp: '2026-09-28T05:30:00Z',
        actor: 'Payment Gateway',
        action: 'Payment Confirmed',
        details: 'Verified $23.19 via gateway ref PAY-TXN-88392109'
      }
    ]
  },
  {
    id: 'ord-10024',
    orderNumber: 'AA-10024',
    serviceId: 'premium-auction-audit',
    serviceName: 'Premium Auction & Damage Audit',
    status: 'Processing',
    subtotal: 42.99,
    discountAmount: 0,
    total: 42.99,
    customer: {
      fullName: 'Sarah Jenkins',
      email: 'sjenkins.auto@outlook.com',
      phone: '+1 415 555 0192'
    },
    vehicle: {
      vinOrReg: '1HGCR2F83HA029184',
      isVin: true,
      make: 'Honda',
      model: 'Accord Touring 2.0T',
      year: 2020,
      mileage: '41,800 miles',
      countryOrState: 'California, USA',
      customerNotes: 'Looking to buy from a private party this evening. Need urgency on auction check.'
    },
    payment: {
      status: 'Paid',
      gatewayRef: 'PAY-TXN-77312984',
      paidAt: '2026-09-28T04:15:00Z',
      method: 'Mastercard 4242'
    },
    internalNotes: 'Obtained Copart lot #4910294. Found clean run history with 0 salvage flags. Compiling final PDF.',
    createdAt: '2026-09-28T04:12:00Z',
    updatedAt: '2026-09-28T04:20:00Z',
    auditLogs: [
      {
        id: 'log-3',
        timestamp: '2026-09-28T04:12:00Z',
        actor: 'Customer (Sarah Jenkins)',
        action: 'Order Placed',
        details: 'Premium plan selected'
      },
      {
        id: 'log-4',
        timestamp: '2026-09-28T04:15:00Z',
        actor: 'Payment Gateway',
        action: 'Payment Confirmed',
        details: 'Verified $42.99'
      },
      {
        id: 'log-5',
        timestamp: '2026-09-28T04:20:00Z',
        actor: 'Admin (Fakhar Zaman)',
        action: 'Status -> Processing',
        details: 'Assigned to authorized source verification queue'
      }
    ]
  },
  {
    id: 'ord-10022',
    orderNumber: 'AA-10022',
    serviceId: 'comprehensive-vin',
    serviceName: 'Comprehensive VIN Check',
    status: 'Delivered',
    subtotal: 28.99,
    discountAmount: 0,
    total: 28.99,
    customer: {
      fullName: 'Zubair Ahmed',
      email: 'zubair.ahmed.eng@gmail.com',
      phone: '+92 321 9876543'
    },
    vehicle: {
      vinOrReg: 'JTDKN3DU5E1293847',
      isVin: true,
      make: 'Toyota',
      model: 'Prius Two 1.8L Hybrid',
      year: 2018,
      mileage: '78,400 km',
      countryOrState: 'Islamabad, PK',
      customerNotes: 'Need battery degradation history and taxi usage check.'
    },
    payment: {
      status: 'Paid',
      gatewayRef: 'PAY-TXN-66102834',
      paidAt: '2026-09-27T18:00:00Z',
      method: 'Bank Direct Transfer'
    },
    internalNotes: 'Clean title verified. No taxi commercial registration found. 1 minor fender record in 2021.',
    resultFile: {
      fileUrl: '#sample-prius-report',
      fileName: 'Toyota-Prius-JTDKN3DU5E1293847-Report.pdf',
      uploadedAt: '2026-09-27T18:35:00Z',
      type: 'pdf',
      expiryDate: '2026-10-27T18:35:00Z'
    },
    createdAt: '2026-09-27T17:55:00Z',
    updatedAt: '2026-09-27T18:40:00Z',
    auditLogs: [
      {
        id: 'log-6',
        timestamp: '2026-09-27T17:55:00Z',
        actor: 'Customer',
        action: 'Order Placed'
      },
      {
        id: 'log-7',
        timestamp: '2026-09-27T18:35:00Z',
        actor: 'Admin',
        action: 'Report Uploaded',
        details: 'Uploaded Toyota-Prius-JTDKN3DU5E1293847-Report.pdf'
      },
      {
        id: 'log-8',
        timestamp: '2026-09-27T18:40:00Z',
        actor: 'Admin',
        action: 'Result Sent to Customer',
        details: 'Sent "Report Ready" email with secure download link'
      }
    ]
  }
];

export const INITIAL_EMAILS: EmailNotification[] = [
  {
    id: 'em-1',
    orderId: 'ord-10025',
    orderNumber: 'AA-10025',
    recipientEmail: 'admin@autoaudit.com',
    recipientType: 'admin',
    subject: '[NEW ORDER ALERT] Order #AA-10025 - Comprehensive VIN Check (Audi A4)',
    type: 'new_order_admin',
    body: `Admin Alert: A new vehicle report order has been paid and received!

Order ID: AA-10025
Customer: Hamza Tariq (hamza.tariq@gmail.com | +92 300 4567891)
Service: Comprehensive VIN Check ($23.19 Paid)
Vehicle: 2021 Audi A4 45 TFSI quattro
VIN / Reg: WAUZZZF45LA019283
Customer Note: "Please verify if odometer was rolled back and check for front bumper repair records."

Action Required:
1. Open Admin Panel -> Order #AA-10025
2. Click [Mark Processing]
3. Source report from authorized provider
4. Upload result PDF or paste secure delivery link
5. Click [Send Result to Customer] to deliver.`,
    sentAt: '2026-09-28T05:30:05Z',
    read: false
  },
  {
    id: 'em-2',
    orderId: 'ord-10025',
    orderNumber: 'AA-10025',
    recipientEmail: 'hamza.tariq@gmail.com',
    recipientType: 'customer',
    subject: 'Order Confirmation: Your AutoAudit Report #AA-10025 is in queue',
    type: 'order_confirmation',
    body: `Dear Hamza Tariq,

Thank you for your order with AutoAudit! We have received your payment and our verification team has begun sourcing your comprehensive vehicle history report.

Order Summary:
- Order Number: AA-10025
- Vehicle: 2021 Audi A4 45 TFSI quattro
- VIN: WAUZZZF45LA019283
- Service: Comprehensive VIN Check
- Estimated Delivery: 30 - 60 minutes
- Delivery Method: Direct to hamza.tariq@gmail.com

What happens next?
As soon as your official history records and title checks are compiled, you will receive an email titled "[REPORT READY] Your Vehicle History Report" with your secure download link.

You can also track your order status anytime on our website using your order number.

Warm regards,
AutoAudit Fulfillment Team`,
    sentAt: '2026-09-28T05:30:10Z',
    read: true
  },
  {
    id: 'em-3',
    orderId: 'ord-10022',
    orderNumber: 'AA-10022',
    recipientEmail: 'zubair.ahmed.eng@gmail.com',
    recipientType: 'customer',
    subject: '[REPORT READY] AutoAudit Vehicle History Report for Toyota Prius (JTDKN3DU5E1293847)',
    type: 'report_ready',
    body: `Dear Zubair Ahmed,

Great news! The official vehicle history report for your 2018 Toyota Prius Two 1.8L Hybrid (VIN: JTDKN3DU5E1293847) is complete and ready for you to view and download.

Vehicle Summary:
- Title Status: CLEAN (No Salvage, No Flood, No Rebuilt Brand)
- Prior Owners: 2 Registered Private Owners
- Verified Odometer: 78,400 km
- Collision Records: 1 Minor Cosmetic Repair (2021)
- Active Recalls: 0 Open Recalls

Access your report:
Download your official PDF report directly from our secure cloud storage or view the interactive version online.

Thank you for trusting AutoAudit for your car purchasing peace of mind!`,
    sentAt: '2026-09-27T18:40:02Z',
    read: true
  }
];

export const SAMPLE_REPORT_DATA = {
  vin: 'WAUZZZF45LA019283',
  vehicle: '2021 Audi A4 45 TFSI quattro S-Line Sedan',
  engine: '2.0L Turbocharged Inline-4 (261 HP)',
  transmission: '7-Speed Dual-Clutch Automatic S-Tronic',
  drivetrain: 'All-Wheel Drive (quattro)',
  assembly: 'Ingolstadt, Germany',
  estimatedMileage: '34,200 mi / 55,040 km',
  odometerStatus: 'Verified Normal / Consistent Trend',
  titleRecord: 'Clean Title (No Brand)',
  priorOwners: 2,
  reportedAccidents: 1,
  salvageOrJunk: 'None Reported (Passed)',
  lienStatus: 'No Financial Liens Recorded',
  openRecalls: 0,
  airbagDeployment: 'None Reported (Passed)',
  theftRecord: 'Not Reported Stolen',
  lemonLaw: 'No Lemon / Manufacturer Buyback',
  ownershipTimeline: [
    {
      period: '2021 - 2023 (2 yrs, 4 mos)',
      type: 'Personal Lease',
      location: 'San Jose, California',
      mileageAccumulated: '19,850 mi',
      notes: 'Regular scheduled maintenance at authorized Audi dealership every 10,000 miles.'
    },
    {
      period: '2023 - Present (1 yr, 1 mo)',
      type: 'Personal Vehicle',
      location: 'Lahore, Pakistan (Imported)',
      mileageAccumulated: '14,350 mi',
      notes: 'Registered under private individual. Clean import documentation cleared customs.'
    }
  ],
  accidentDetails: [
    {
      date: 'May 14, 2023',
      location: 'San Jose, CA',
      severity: 'Minor Damage (Front Right Bumper & Headlamp)',
      airbagsDeployed: 'No',
      structuralDamage: 'No Frame Damage',
      vehicleDrivable: 'Yes (Driven from scene)',
      repairFacility: 'Audi Certified Collision Repair Center',
      details: 'Vehicle struck low curb/parking bollard. Right front bumper cover replaced, headlamp assembly re-aimed. Zero structural deflection.'
    }
  ],
  serviceHistory: [
    { date: 'Aug 20, 2024', mileage: '33,900 mi', service: 'Full synthetic oil & filter change, cabin air filter replacement, 4-wheel tire rotation' },
    { date: 'Nov 12, 2023', mileage: '24,500 mi', service: 'Brake fluid flush, spark plugs inspected, multi-point digital inspection' },
    { date: 'May 18, 2023', mileage: '19,850 mi', service: 'Post-incident certified repair completion inspection & alignment' },
    { date: 'Jan 05, 2022', mileage: '10,120 mi', service: 'Manufacturer 10k scheduled maintenance, engine diagnostics cleared' }
  ]
};

export const FAQS = [
  {
    q: 'What information do I need to order a report?',
    a: 'You only need the vehicle’s 17-character Vehicle Identification Number (VIN) or the official license plate / registration number along with the province or state. For delivery, provide your name and email address where the report should be sent.'
  },
  {
    q: 'How long does it take to receive my report?',
    a: 'Turnaround depends on the selected plan: Basic Reports are processed within 1–2 hours, Complete Reports within 30–45 minutes, and Premium Reports receive priority queue assignment for 15–30 minute fulfillment.'
  },
  {
    q: 'How will I receive my report?',
    a: 'Your finished report is delivered securely to your registered email address as a high-resolution, tamper-evident PDF document. You can also view and download it directly from your AutoAudit customer dashboard anytime.'
  },
  {
    q: 'Can I access previous reports?',
    a: 'Yes. Once an order is completed, your report remains accessible in your customer dashboard under "My Reports" using your order number and email, where it can be downloaded or printed for up to 60 days.'
  },
  {
    q: 'What information is included in a vehicle report?',
    a: 'Reports include state DMV title records, salvage and rebuilt brands, reported accidents and insurance total loss payouts, verified odometer trend history, open safety recalls, lien and repossession flags, and auction records where available.'
  },
  {
    q: 'What is your refund/cancellation policy?',
    a: 'If records cannot be obtained for your submitted VIN, or if we fail to fulfill your report within the stated timeframe, you are entitled to a full refund to your original payment method. You can request cancellation through support before report compilation starts.'
  }
];

export const TESTIMONIALS = [
  {
    name: 'Sarah M. Jenkins',
    role: 'Used Car Buyer · Honda Accord',
    city: 'San Jose, CA',
    content: 'The report was delivered in about 35 minutes on a Saturday afternoon. It showed clean title records with two previous owners and verified mileage consistency. Made negotiating with the private seller straightforward.',
    rating: 5,
    orderId: 'AA-2026-1042',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80'
  },
  {
    name: 'Marcus Vance',
    role: 'Automotive Buyer · BMW 3-Series',
    city: 'Austin, TX',
    content: 'Clear layout with no confusing jargon. The accident and title verification section flagged a minor rear bumper repair from three years ago that the dealership hadn’t noted. Very helpful service.',
    rating: 5,
    orderId: 'AA-2026-0988',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80'
  },
  {
    name: 'Elena Rostova',
    role: 'Private Vehicle Buyer · Toyota RAV4',
    city: 'Denver, CO',
    content: 'The checkout process was secure and fast. I received the PDF directly in my email and accessed the interactive report from my phone before finalizing the purchase.',
    rating: 5,
    orderId: 'AA-2026-1120',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80'
  }
];

export const INITIAL_WHATSAPP_CONFIG: WhatsAppConfig = {
  phoneNumber: '923420617217',
  displayNumber: '+92 342 0617217',
  defaultGreeting: 'Hello AutoAudit Support, I would like assistance with a vehicle history report.',
  supportAvailability: 'Mon–Sun · 24/7 Coverage · Avg Response < 5 Mins',
  active: true,
};

export const INITIAL_CONTACT_EVENTS: ContactEvent[] = [
  {
    id: 'evt_101',
    channel: 'whatsapp',
    source: 'floating_widget',
    intent: 'vin_check',
    vin: '1HGCR2F83HA029184',
    messagePreview: 'Hi AutoAudit, I have a question regarding vehicle with VIN: 1HGCR2F83HA029184.',
    timestamp: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    deviceType: 'mobile',
    pageUrl: '/',
  },
  {
    id: 'evt_102',
    channel: 'whatsapp',
    source: 'pricing',
    intent: 'pricing',
    messagePreview: 'Hi AutoAudit, what is the difference between Complete and Premium auction records?',
    timestamp: new Date(Date.now() - 1000 * 60 * 140).toISOString(),
    deviceType: 'desktop',
    pageUrl: '/#services',
  },
  {
    id: 'evt_103',
    channel: 'whatsapp',
    source: 'hero',
    intent: 'vin_check',
    messagePreview: 'Can you verify if Copart auction photos are included for Canadian vehicles?',
    timestamp: new Date(Date.now() - 1000 * 60 * 320).toISOString(),
    deviceType: 'desktop',
    pageUrl: '/#hero',
  },
  {
    id: 'evt_104',
    channel: 'whatsapp',
    source: 'order_modal',
    intent: 'general_support',
    messagePreview: 'Need assistance verifying my payment method during checkout.',
    timestamp: new Date(Date.now() - 1000 * 60 * 540).toISOString(),
    deviceType: 'mobile',
    pageUrl: '/checkout',
  },
  {
    id: 'evt_105',
    channel: 'whatsapp',
    source: 'my_orders',
    intent: 'order_tracking',
    orderNumber: 'AA-10025',
    vin: '1G1YY22U965104921',
    messagePreview: 'Hello AutoAudit Support, I need an update on my order #AA-10025.',
    timestamp: new Date(Date.now() - 1000 * 60 * 960).toISOString(),
    deviceType: 'mobile',
    pageUrl: '/portal/orders',
  },
  {
    id: 'evt_106',
    channel: 'whatsapp',
    source: 'faq',
    intent: 'general_support',
    messagePreview: 'Do you offer batch vehicle report discounts for small auto dealerships?',
    timestamp: new Date(Date.now() - 1000 * 60 * 1440).toISOString(),
    deviceType: 'desktop',
    pageUrl: '/#faq',
  },
];

