/**
 * Validation Utilities for Lead Import
 *
 * Provides email and phone validation functions for CSV import feature.
 * PRD Reference: docs/LEAD-IMPORT-FEATURE-WEEK-5.md Section 8
 */

/**
 * Validates email format using RFC-compliant regex
 *
 * @param email - Email address to validate
 * @returns true if email is valid, false otherwise
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') {
    return false;
  }

  // Basic RFC 5322 compliant email regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Validates phone number format
 * Accepts various formats but requires 10-15 digits
 *
 * @param phone - Phone number to validate
 * @returns Object with validation result and cleaned phone number
 */
export function validatePhone(phone: string): {
  isValid: boolean;
  cleaned: string;
  warning?: string;
} {
  if (!phone || typeof phone !== 'string') {
    return { isValid: true, cleaned: '' }; // Phone is optional
  }

  // Strip all non-digit characters
  const cleaned = phone.replace(/\D/g, '');

  // Must be 10-15 digits
  if (cleaned.length < 10 || cleaned.length > 15) {
    return {
      isValid: false,
      cleaned,
      warning: `Phone has ${cleaned.length} digits (expected 10-15)`,
    };
  }

  return { isValid: true, cleaned };
}

/**
 * Validates required string field
 *
 * @param value - Field value to validate
 * @param fieldName - Name of the field (for error messages)
 * @param maxLength - Maximum allowed length (default: 255)
 * @returns Object with validation result and error message
 */
export function validateRequiredField(
  value: string,
  fieldName: string,
  maxLength: number = 255
): {
  isValid: boolean;
  error?: string;
} {
  if (!value || typeof value !== 'string' || value.trim().length === 0) {
    return {
      isValid: false,
      error: `${fieldName} is required`,
    };
  }

  if (value.length > maxLength) {
    return {
      isValid: false,
      error: `${fieldName} exceeds ${maxLength} characters`,
    };
  }

  return { isValid: true };
}

/**
 * Validates optional string field
 *
 * @param value - Field value to validate
 * @param fieldName - Name of the field (for error messages)
 * @param maxLength - Maximum allowed length (default: 255)
 * @returns Object with validation result and error message
 */
export function validateOptionalField(
  value: string | undefined | null,
  fieldName: string,
  maxLength: number = 255
): {
  isValid: boolean;
  error?: string;
} {
  // Empty/null is valid for optional fields
  if (!value || typeof value !== 'string' || value.trim().length === 0) {
    return { isValid: true };
  }

  if (value.length > maxLength) {
    return {
      isValid: false,
      error: `${fieldName} exceeds ${maxLength} characters`,
    };
  }

  return { isValid: true };
}

/**
 * Validates a single lead record
 *
 * @param lead - Lead object to validate
 * @param rowNumber - Row number in CSV (for error reporting)
 * @returns Object with validation result and errors
 */
export interface LeadValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  lead: {
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
    company?: string;
    title?: string;
  };
}

export function validateLead(
  lead: any,
  rowNumber: number
): LeadValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate email (required)
  if (!isValidEmail(lead.email)) {
    errors.push(`Row ${rowNumber}: Invalid or missing email`);
  }

  // Validate firstName (required)
  const firstNameValidation = validateRequiredField(lead.firstName, 'First Name');
  if (!firstNameValidation.isValid) {
    errors.push(`Row ${rowNumber}: ${firstNameValidation.error}`);
  }

  // Validate lastName (required)
  const lastNameValidation = validateRequiredField(lead.lastName, 'Last Name');
  if (!lastNameValidation.isValid) {
    errors.push(`Row ${rowNumber}: ${lastNameValidation.error}`);
  }

  // Validate phone (optional)
  if (lead.phone) {
    const phoneValidation = validatePhone(lead.phone);
    if (!phoneValidation.isValid) {
      warnings.push(`Row ${rowNumber}: ${phoneValidation.warning}`);
    }
    lead.phone = phoneValidation.cleaned; // Use cleaned phone
  }

  // Validate company (optional)
  const companyValidation = validateOptionalField(lead.company, 'Company');
  if (!companyValidation.isValid) {
    errors.push(`Row ${rowNumber}: ${companyValidation.error}`);
  }

  // Validate title (optional)
  const titleValidation = validateOptionalField(lead.title, 'Title');
  if (!titleValidation.isValid) {
    errors.push(`Row ${rowNumber}: ${titleValidation.error}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    lead: {
      email: lead.email?.trim() || '',
      firstName: lead.firstName?.trim() || '',
      lastName: lead.lastName?.trim() || '',
      phone: lead.phone || undefined,
      company: lead.company?.trim() || undefined,
      title: lead.title?.trim() || undefined,
    },
  };
}

/**
 * Detects duplicate leads within a CSV file
 * Uses email as the unique identifier
 *
 * @param leads - Array of lead objects
 * @returns Array of duplicate indices
 */
export function detectDuplicatesInFile(leads: any[]): number[] {
  const seen = new Map<string, number>(); // email -> first occurrence index
  const duplicates: number[] = [];

  leads.forEach((lead, idx) => {
    const email = lead.email?.toLowerCase().trim();
    if (!email) return;

    if (seen.has(email)) {
      duplicates.push(idx);
    } else {
      seen.set(email, idx);
    }
  });

  return duplicates;
}
