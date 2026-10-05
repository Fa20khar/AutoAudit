/**
 * AutoAudit VIN Validation Utility
 * Standardized ISO 3779 / NHTSA 17-character VIN verification.
 * 
 * Rules:
 * 1. Must be exactly 17 characters long.
 * 2. Letters I, O, and Q are strictly prohibited to avoid confusion with digits 1 and 0.
 * 3. Only alphanumeric characters (A-Z and 0-9) are allowed, with no spaces, dashes, or symbols.
 */

export interface VinValidationResult {
  isValid: boolean;
  status: 'empty' | 'incomplete' | 'invalid_chars' | 'invalid_length' | 'valid';
  charCount: number;
  message: string;
  forbiddenLetters: string[];
  cleanVin: string;
  wmi?: string; // World Manufacturer Identifier (chars 1-3)
  vds?: string; // Vehicle Descriptor Section (chars 4-8)
  checkDigit?: string; // Character 9
  modelYear?: string; // Character 10
  plantCode?: string; // Character 11
  vis?: string; // Vehicle Identifier Section (chars 12-17)
}

/**
 * Standard 17-character VIN regex excluding prohibited letters I, O, Q
 */
export const VIN_REGEX = /^[A-HJ-NPR-Z0-9]{17}$/;

/**
 * Regex matching prohibited VIN characters (I, O, Q)
 */
export const VIN_FORBIDDEN_CHARS_REGEX = /[IOQ]/gi;

/**
 * Regex matching allowed individual VIN characters
 */
export const VIN_ALLOWED_CHARS_REGEX = /^[A-HJ-NPR-Z0-9]+$/;

/**
 * Validates a VIN string and returns structured real-time diagnostic feedback
 */
export function validateVinFormat(input: string): VinValidationResult {
  const cleanVin = (input || '').trim().toUpperCase();
  const charCount = cleanVin.length;

  if (!cleanVin) {
    return {
      isValid: false,
      status: 'empty',
      charCount: 0,
      message: 'Enter your 17-character Vehicle Identification Number (VIN).',
      forbiddenLetters: [],
      cleanVin: ''
    };
  }

  // Detect prohibited letters: I, O, and Q
  const forbiddenMatches = cleanVin.match(VIN_FORBIDDEN_CHARS_REGEX) || [];
  const uniqueForbidden = Array.from(new Set(forbiddenMatches));

  if (uniqueForbidden.length > 0) {
    return {
      isValid: false,
      status: 'invalid_chars',
      charCount,
      message: `Invalid letter${uniqueForbidden.length > 1 ? 's' : ''} detected: '${uniqueForbidden.join(', ')}'. The letters I, O, and Q are never used in standard 17-character VINs to avoid confusion with digits 1 and 0.`,
      forbiddenLetters: uniqueForbidden,
      cleanVin
    };
  }

  // Detect non-alphanumeric characters (spaces, dashes, symbols)
  if (/[^A-Z0-9]/.test(cleanVin)) {
    return {
      isValid: false,
      status: 'invalid_chars',
      charCount,
      message: 'VIN must contain letters and numbers only. Symbols, dashes, and spaces are not allowed.',
      forbiddenLetters: [],
      cleanVin
    };
  }

  // Detect character length deficiency
  if (charCount < 17) {
    return {
      isValid: false,
      status: 'incomplete',
      charCount,
      message: `Incomplete VIN: ${charCount}/17 characters entered (${17 - charCount} more needed).`,
      forbiddenLetters: [],
      cleanVin
    };
  }

  // Detect excessive length
  if (charCount > 17) {
    return {
      isValid: false,
      status: 'invalid_length',
      charCount,
      message: `VIN cannot exceed 17 characters (currently ${charCount}). Please remove extra characters.`,
      forbiddenLetters: [],
      cleanVin
    };
  }

  // Final regex verification
  if (!VIN_REGEX.test(cleanVin)) {
    return {
      isValid: false,
      status: 'invalid_chars',
      charCount,
      message: 'Invalid VIN structure. Please verify the characters match your vehicle documents.',
      forbiddenLetters: [],
      cleanVin
    };
  }

  // Extract standard ISO 3779 sections
  return {
    isValid: true,
    status: 'valid',
    charCount: 17,
    message: 'Valid 17-character VIN format verified.',
    forbiddenLetters: [],
    cleanVin,
    wmi: cleanVin.slice(0, 3),
    vds: cleanVin.slice(3, 8),
    checkDigit: cleanVin[8],
    modelYear: cleanVin[9],
    plantCode: cleanVin[10],
    vis: cleanVin.slice(11, 17)
  };
}
