/**
 * AutoAudit - Google Forms & Google Sheets Integration Configuration
 * 
 * Central configuration for:
 * 1. Google Forms published respondent embed URL
 * 2. Google Forms private editor URL
 * 3. Google Sheets response spreadsheet URL
 */

export const GOOGLE_FORMS_EDITOR_ID = '1BI-BkUJyXoQKSNUT3GaU30Z2p9m0_cypwDeVP9VTfeU';

/** Private editor link for authorized AutoAudit form managers */
export const GOOGLE_FORMS_EDITOR_URL = `https://docs.google.com/forms/d/${GOOGLE_FORMS_EDITOR_ID}/edit`;

/** Direct link to Google Forms Responses tab */
export const GOOGLE_FORMS_RESPONSES_URL = `https://docs.google.com/forms/d/${GOOGLE_FORMS_EDITOR_ID}/edit#responses`;

/**
 * Single clearly documented configuration constant for the public Google Forms embed URL.
 * Will use VITE_GOOGLE_FORMS_EMBED_URL if defined, falling back to the standard published respondent viewform URL.
 */
export const GOOGLE_FORMS_EMBED_URL: string =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GOOGLE_FORMS_EMBED_URL) ||
  `https://docs.google.com/forms/d/${GOOGLE_FORMS_EDITOR_ID}/viewform?embedded=true`;

/**
 * Google Sheets response destination link (private to authorized staff).
 * Set in VITE_GOOGLE_SHEETS_URL or in the Admin Portal.
 */
export const GOOGLE_SHEETS_RESPONSES_URL: string =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GOOGLE_SHEETS_URL) ||
  '';

/**
 * Specifications for customer photo uploads and Google Form questions:
 * Field Name: "Upload Vehicle Photos"
 * Description: "Upload clear photographs of your vehicle to help our team review your request and improve the vehicle report. Please upload only photographs you are authorized to share."
 */
export const VEHICLE_PHOTO_UPLOAD_GUIDE = {
  questionTitle: 'Upload Vehicle Photos',
  questionDescription:
    'Upload clear photographs of your vehicle to help our team review your request and improve the vehicle report. Please upload only photographs you are authorized to share.',
  recommendedPhotos: [
    { title: 'Front of the vehicle', desc: 'Full frontal view with headlights and grille visible' },
    { title: 'Rear of the vehicle', desc: 'Full rear view showing license plate, emblems, and tailgate' },
    { title: 'Left side (Driver)', desc: 'Clear profile shot showing front-to-rear body condition' },
    { title: 'Right side (Passenger)', desc: 'Clear profile shot showing passenger body panels' },
    { title: 'Dashboard & Odometer', desc: 'Cluster showing exact recorded mileage and warning indicators' },
    { title: 'VIN Plate or Door Jamb Label', desc: 'Legible 17-character VIN plate on dash or driver B-pillar' },
    { title: 'Visible damage or paint defects', desc: 'Close-ups of dents, scratches, rust, or repainted panels' }
  ],
  allowedFileTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
  maxFileSize: '10 MB',
  maxFiles: 5,
  isOptional: true,
  legalNotice:
    'Vehicle photographs support our visual triage and review process, but do not independently verify title brands, structural salvage history, or governmental odometer registries.'
} as const;

export const GOOGLE_FORMS_CONFIG = {
  formId: GOOGLE_FORMS_EDITOR_ID,
  editorUrl: GOOGLE_FORMS_EDITOR_URL,
  responsesUrl: GOOGLE_FORMS_RESPONSES_URL,
  embedUrl: GOOGLE_FORMS_EMBED_URL,
  sheetsUrl: GOOGLE_SHEETS_RESPONSES_URL,
  statusBadge: 'VEHICLE REPORT REQUEST',
  heading: 'Request Your Vehicle History Report',
  description:
    'Provide your contact and vehicle details to request a report from AutoAudit. Our team can review your request and follow up with you.',
  privacyNotice:
    'Your information will be used to process your vehicle report request and contact you about it. Please do not submit passwords or payment card details.',
  iframeTitle: 'AutoAudit Vehicle History Report Request Form',
  photoUploadGuide: VEHICLE_PHOTO_UPLOAD_GUIDE,
} as const;
