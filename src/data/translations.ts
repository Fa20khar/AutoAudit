export type Language = 'en' | 'es';

export interface Translations {
  // Top Banner & Common
  topBannerLive: string;
  topBannerResponse: string;
  topBannerCoverage: string;
  whatsAppQr: string;
  langEn: string;
  langEs: string;
  languageLabel: string;

  // Navbar
  navHome: string;
  navVehicleReports: string;
  navPricing: string;
  navHowItWorks: string;
  navSampleReport: string;
  navFaq: string;
  navRequestReport: string;
  navMyReports: string;
  navAdminPortal: string;
  navGetReport: string;
  navCustomerPortal: string;

  // Hero Section
  heroBadge: string;
  heroTitle1: string;
  heroTitle2: string;
  heroSubtitle: string;
  tabVin: string;
  tabPlate: string;
  vinPlaceholder: string;
  platePlaceholder: string;
  selectStatePlaceholder: string;
  checkHistoryBtn: string;
  viewSampleBtn: string;
  secureCheckoutNote: string;
  needVinHelp: string;
  customIntakePrompt: string;
  fillIntakeBtn: string;
  quickSampleVins: string;

  // Trust Benefits
  trustRegistryAudited: string;
  trustOfficialNMVTIS: string;
  trustInstantDelivery: string;
  trustEncryptedCheckout: string;
  trustOdometerVerified: string;
  trustDamageCheck: string;

  // Services / Pricing Section
  pricingBadge: string;
  pricingTitle: string;
  pricingSubtitle: string;
  mostPopular: string;
  orderReportBtn: string;
  planBasicTitle: string;
  planBasicDesc: string;
  planComprehensiveTitle: string;
  planComprehensiveDesc: string;
  planDealerTitle: string;
  planDealerDesc: string;

  // How It Works
  howBadge: string;
  howTitle: string;
  howSubtitle: string;
  howStep1Title: string;
  howStep1Desc: string;
  howStep2Title: string;
  howStep2Desc: string;
  howStep3Title: string;
  howStep3Desc: string;
  howStep4Title: string;
  howStep4Desc: string;

  // FAQ Section
  faqBadge: string;
  faqTitle: string;
  faqSubtitle: string;
  faqStillQuestions: string;
  faqSupportHelp: string;
  faqChatBtn: string;

  // Final CTA
  ctaTitle: string;
  ctaSubtitle: string;
  ctaOrderBtn: string;
  ctaSampleBtn: string;
  ctaIntakeBtn: string;

  // Footer
  footerTagline: string;
  footerDisclaimer: string;
  footerCompany: string;
  footerReports: string;
  footerSupportLegal: string;
  footerAbout: string;
  footerOrderTracking: string;
  footerTerms: string;
  footerPrivacy: string;
  footerRefund: string;
  footerCompliance: string;
  footerRights: string;
}

export const TRANSLATIONS: Record<Language, Translations> = {
  en: {
    // Top Banner & Common
    topBannerLive: 'Live Support & VIN Verification:',
    topBannerResponse: '⚡ Avg Response < 5 Mins',
    topBannerCoverage: '24/7 Dedicated Support',
    whatsAppQr: 'WhatsApp QR: 03420617217',
    langEn: 'English',
    langEs: 'Español',
    languageLabel: 'Language',

    // Navbar
    navHome: 'Home',
    navVehicleReports: 'Vehicle Reports',
    navPricing: 'Pricing',
    navHowItWorks: 'How It Works',
    navSampleReport: 'Sample Report',
    navFaq: 'FAQ',
    navRequestReport: 'Request Vehicle Report',
    navMyReports: 'My Reports',
    navAdminPortal: 'Admin Portal',
    navGetReport: 'Get Report',
    navCustomerPortal: 'Customer Order Portal',

    // Hero Section
    heroBadge: 'OFFICIAL VEHICLE REGISTRY AUDITING',
    heroTitle1: 'Instant Vehicle History Reports',
    heroTitle2: 'Before You Buy or Sell.',
    heroSubtitle: 'Protect yourself against hidden salvage titles, flood damage, odometer fraud, and prior collisions with certified NMVTIS record auditing.',
    tabVin: 'VIN Number (17 Chars)',
    tabPlate: 'US License Plate',
    vinPlaceholder: 'Enter 17-character VIN (e.g. 1HGCR2F83HA029184)...',
    platePlaceholder: 'Enter License Plate (e.g. 7XYZ890)...',
    selectStatePlaceholder: 'Select State (e.g. CA, TX, FL)',
    checkHistoryBtn: 'Check Vehicle History',
    viewSampleBtn: 'View Sample Report',
    secureCheckoutNote: 'Secure checkout • Fast email delivery',
    needVinHelp: 'Need VIN Help? WhatsApp QR: 03420617217',
    customIntakePrompt: 'Need custom verification or full customer intake?',
    fillIntakeBtn: 'Fill Intake Form',
    quickSampleVins: 'Quick Sample VINs:',

    // Trust Benefits
    trustRegistryAudited: 'Certified Records',
    trustOfficialNMVTIS: 'Official NMVTIS Partner Registry',
    trustInstantDelivery: 'Delivered in under 60 Seconds',
    trustEncryptedCheckout: '256-Bit SSL Encrypted Checkout',
    trustOdometerVerified: 'Odometer Rollback Auditing',
    trustDamageCheck: 'Salvage, Flood & Theft Detection',

    // Services / Pricing Section
    pricingBadge: 'SIMPLE PLANS',
    pricingTitle: 'Choose the Right Vehicle Report',
    pricingSubtitle: 'Simple plans with clear pricing and transparent official records. No recurring subscriptions.',
    mostPopular: 'MOST POPULAR',
    orderReportBtn: 'Order Report',
    planBasicTitle: 'Basic Title Check',
    planBasicDesc: 'Essential title brand verification, salvage registry lookup, and theft alerts.',
    planComprehensiveTitle: 'Comprehensive VIN Audit',
    planComprehensiveDesc: 'Complete history: collisions, odometer rollback checks, lien status, and official PDF.',
    planDealerTitle: 'Dealer Multi-VIN 5-Pack',
    planDealerDesc: 'Bundle of 5 comprehensive audits for dealerships and active car buyers.',

    // How It Works
    howBadge: 'SIMPLE PROCESS',
    howTitle: 'How AutoAudit Works',
    howSubtitle: 'Follow four simple steps from entering your vehicle details to receiving your verified report.',
    howStep1Title: 'Choose Your Report',
    howStep1Desc: 'Select the vehicle report tier or service that fits your purchase requirements.',
    howStep2Title: 'Enter Vehicle Details',
    howStep2Desc: 'Enter the 17-digit VIN or vehicle registration information.',
    howStep3Title: 'Pay Securely',
    howStep3Desc: 'Complete checkout using our encrypted, instant fraud-protected payment methods.',
    howStep4Title: 'Receive Your Report',
    howStep4Desc: 'Access your interactive report online and receive the PDF directly in your inbox.',

    // FAQ Section
    faqBadge: 'COMMON QUESTIONS',
    faqTitle: 'Frequently Asked Questions',
    faqSubtitle: 'Everything you need to know about our vehicle history reports, fulfillment, and terms.',
    faqStillQuestions: 'Still have questions about a vehicle?',
    faqSupportHelp: 'Our team is available on WhatsApp 24/7 at 03420617217 (+92 342 0617217) to help you verify VINs and choose the right report.',
    faqChatBtn: 'Scan WhatsApp QR: 03420617217',

    // Final CTA
    ctaTitle: 'Ready to check vehicle history?',
    ctaSubtitle: 'Enter any 17-digit VIN now and receive complete title brands, salvage records, and collision data.',
    ctaOrderBtn: 'Get Vehicle Report Now',
    ctaSampleBtn: 'View Sample Report',
    ctaIntakeBtn: 'Customer Intake Form',

    // Footer
    footerTagline: 'Simple, transparent vehicle history reporting.',
    footerDisclaimer: 'AutoAudit is an online digital ordering platform compiling vehicle title, salvage, and collision records from authorized registries. We do not provide physical vehicle inspections.',
    footerCompany: 'Company',
    footerReports: 'Reports',
    footerSupportLegal: 'Support & Legal',
    footerAbout: 'About AutoAudit',
    footerOrderTracking: 'Order Support & Tracking',
    footerTerms: 'Terms of Service',
    footerPrivacy: 'Privacy Policy',
    footerRefund: 'Refund Policy',
    footerCompliance: 'NMVTIS Compliance',
    footerRights: 'All rights reserved.',
  },
  es: {
    // Top Banner & Common
    topBannerLive: 'Soporte en Vivo y Verificación de VIN:',
    topBannerResponse: '⚡ Respuesta Promedio < 5 Mins',
    topBannerCoverage: 'Soporte Dedicado 24/7',
    whatsAppQr: 'QR de WhatsApp: 03420617217',
    langEn: 'English',
    langEs: 'Español',
    languageLabel: 'Idioma',

    // Navbar
    navHome: 'Inicio',
    navVehicleReports: 'Informes de Vehículos',
    navPricing: 'Precios',
    navHowItWorks: 'Cómo Funciona',
    navSampleReport: 'Informe de Muestra',
    navFaq: 'Preguntas Frecuentes',
    navRequestReport: 'Solicitar Informe',
    navMyReports: 'Mis Informes',
    navAdminPortal: 'Portal Admin',
    navGetReport: 'Obtener Informe',
    navCustomerPortal: 'Portal de Pedidos de Clientes',

    // Hero Section
    heroBadge: 'AUDITORÍA OFICIAL DEL REGISTRO AUTOMOTRIZ',
    heroTitle1: 'Informes de Historial del Vehículo',
    heroTitle2: 'Antes de Comprar o Vender.',
    heroSubtitle: 'Protéjase contra títulos de salvamento ocultos, daños por inundación, fraude de odómetro y colisiones previas con auditoría certificada de registros NMVTIS.',
    tabVin: 'Número VIN (17 Caracteres)',
    tabPlate: 'Placa de EE.UU. y Estado',
    vinPlaceholder: 'Ingrese VIN de 17 caracteres (ej. 1HGCR2F83HA029184)...',
    platePlaceholder: 'Ingrese la Placa (ej. 7XYZ890)...',
    selectStatePlaceholder: 'Seleccione Estado (ej. CA, TX, FL)',
    checkHistoryBtn: 'Verificar Historial del Vehículo',
    viewSampleBtn: 'Ver Informe de Ejemplo',
    secureCheckoutNote: 'Pago seguro con cifrado • Envío rápido por correo',
    needVinHelp: '¿Ayuda con el VIN? QR de WhatsApp: 03420617217',
    customIntakePrompt: '¿Necesita verificación personalizada o solicitud completa?',
    fillIntakeBtn: 'Llenar Formulario',
    quickSampleVins: 'VINs de Prueba:',

    // Trust Benefits
    trustRegistryAudited: 'Registros Certificados',
    trustOfficialNMVTIS: 'Registro Oficial de Socios NMVTIS',
    trustInstantDelivery: 'Entrega en menos de 60 Segundos',
    trustEncryptedCheckout: 'Pago Seguro con Cifrado SSL de 256 Bits',
    trustOdometerVerified: 'Auditoría de Manipulación de Odómetro',
    trustDamageCheck: 'Detección de Salvamento, Inundación y Robo',

    // Services / Pricing Section
    pricingBadge: 'PLANES SENCILLOS',
    pricingTitle: 'Elija el Informe de Vehículo Adecuado',
    pricingSubtitle: 'Planes claros con precios transparentes y registros oficiales verificados. Sin suscripciones recurrentes.',
    mostPopular: 'MÁS POPULAR',
    orderReportBtn: 'Ordenar Informe',
    planBasicTitle: 'Verificación Básica de Título',
    planBasicDesc: 'Verificación esencial de título, búsqueda de salvamento y alertas de robo.',
    planComprehensiveTitle: 'Auditoría Completa de VIN',
    planComprehensiveDesc: 'Historial completo: colisiones, odómetro, gravámenes y PDF oficial descargable.',
    planDealerTitle: 'Paquete Concesionario 5-VIN',
    planDealerDesc: 'Paquete de 5 auditorías completas para concesionarios y compradores frecuentes.',

    // How It Works
    howBadge: 'PROCESO SIMPLE',
    howTitle: 'Cómo Funciona AutoAudit',
    howSubtitle: 'Siga cuatro sencillos pasos desde ingresar los datos del vehículo hasta recibir su informe verificado.',
    howStep1Title: 'Elija su Informe',
    howStep1Desc: 'Seleccione el nivel de informe que mejor se adapte a sus necesidades de compra.',
    howStep2Title: 'Ingrese los Datos',
    howStep2Desc: 'Escriba el VIN de 17 dígitos o la información de registro del vehículo.',
    howStep3Title: 'Pague con Seguridad',
    howStep3Desc: 'Complete el pago a través de métodos seguros y protegidos contra fraudes.',
    howStep4Title: 'Reciba su Informe',
    howStep4Desc: 'Acceda a su informe interactivo en línea y reciba el PDF directamente en su correo.',

    // FAQ Section
    faqBadge: 'PREGUNTAS FRECUENTES',
    faqTitle: 'Preguntas Frecuentes',
    faqSubtitle: 'Todo lo que necesita saber sobre nuestros informes de historial, entrega y términos.',
    faqStillQuestions: '¿Aún tiene preguntas sobre un vehículo?',
    faqSupportHelp: 'Nuestro equipo está disponible en WhatsApp 24/7 al 03420617217 (+92 342 0617217) para ayudarle a verificar VINs y elegir el informe adecuado.',
    faqChatBtn: 'Escanear QR de WhatsApp: 03420617217',

    // Final CTA
    ctaTitle: '¿Listo para verificar el historial del vehículo?',
    ctaSubtitle: 'Ingrese cualquier VIN de 17 dígitos ahora y reciba marcas de título, registros de salvamento y datos de accidentes.',
    ctaOrderBtn: 'Obtener Informe de Vehículo Ahora',
    ctaSampleBtn: 'Ver Informe de Ejemplo',
    ctaIntakeBtn: 'Formulario de Solicitud de Cliente',

    // Footer
    footerTagline: 'Informes de historial de vehículos simples y transparentes.',
    footerDisclaimer: 'AutoAudit es una plataforma digital de pedidos en línea que compila registros de títulos, salvamento y colisiones de registros autorizados. No proporcionamos inspecciones físicas de vehículos.',
    footerCompany: 'Compañía',
    footerReports: 'Informes',
    footerSupportLegal: 'Soporte y Legal',
    footerAbout: 'Acerca de AutoAudit',
    footerOrderTracking: 'Soporte y Rastreo de Pedidos',
    footerTerms: 'Términos de Servicio',
    footerPrivacy: 'Política de Privacidad',
    footerRefund: 'Política de Reembolso',
    footerCompliance: 'Cumplimiento NMVTIS',
    footerRights: 'Todos los derechos reservados.',
  },
};
