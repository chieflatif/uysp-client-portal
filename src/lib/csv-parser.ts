/**
 * CSV Parsing Utilities for Lead Import
 *
 * Provides CSV parsing, column mapping, and validation for bulk lead imports.
 * PRD Reference: docs/LEAD-IMPORT-FEATURE-WEEK-5.md Section 5
 */

import Papa from 'papaparse';
import { validateLead, detectDuplicatesInFile, type LeadValidationResult } from './validation';

/**
 * Column mapping configuration
 * Maps CSV column names to our internal field names
 */
export interface ColumnMapping {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  company?: string;
  title?: string;
}

/**
 * Parsed CSV result
 */
export interface ParsedCSVResult {
  success: boolean;
  data?: any[];
  columns?: string[];
  error?: string;
}

/**
 * Validated leads result
 */
export interface ValidatedLeadsResult {
  validLeads: any[];
  invalidLeads: Array<{
    row: number;
    lead: any;
    errors: string[];
    warnings: string[];
  }>;
  duplicates: Array<{
    row: number;
    email: string;
  }>;
  summary: {
    total: number;
    valid: number;
    invalid: number;
    duplicates: number;
  };
}

/**
 * Parses CSV file and returns structured data
 *
 * @param file - CSV file to parse
 * @returns Promise with parsed data or error
 */
export function parseCSVFile(file: File): Promise<ParsedCSVResult> {
  return new Promise((resolve) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header: string) => header.trim(),
      complete: (results) => {
        if (results.errors.length > 0) {
          resolve({
            success: false,
            error: `CSV parsing errors: ${results.errors.map((e) => e.message).join(', ')}`,
          });
          return;
        }

        if (!results.data || results.data.length === 0) {
          resolve({
            success: false,
            error: 'CSV file is empty',
          });
          return;
        }

        resolve({
          success: true,
          data: results.data,
          columns: results.meta.fields,
        });
      },
      error: (error) => {
        resolve({
          success: false,
          error: `Failed to parse CSV: ${error.message}`,
        });
      },
    });
  });
}

/**
 * Detects column mapping automatically or returns null if mapping is needed
 *
 * @param columns - Array of column names from CSV
 * @returns Column mapping if auto-detected, null if manual mapping needed
 */
export function detectColumnMapping(columns: string[]): ColumnMapping | null {
  const lowerColumns = columns.map((c) => c.toLowerCase());

  // Required columns
  const emailIdx = lowerColumns.findIndex((c) =>
    ['email', 'email address', 'e-mail'].includes(c)
  );
  const firstNameIdx = lowerColumns.findIndex((c) =>
    ['firstname', 'first name', 'first', 'fname'].includes(c)
  );
  const lastNameIdx = lowerColumns.findIndex((c) =>
    ['lastname', 'last name', 'last', 'lname'].includes(c)
  );

  // If any required column is missing, manual mapping is needed
  if (emailIdx === -1 || firstNameIdx === -1 || lastNameIdx === -1) {
    return null;
  }

  // Optional columns
  const phoneIdx = lowerColumns.findIndex((c) =>
    ['phone', 'phone number', 'mobile', 'cell', 'telephone'].includes(c)
  );
  const companyIdx = lowerColumns.findIndex((c) =>
    ['company', 'organization', 'org', 'employer'].includes(c)
  );
  const titleIdx = lowerColumns.findIndex((c) =>
    ['title', 'job title', 'position', 'role'].includes(c)
  );

  return {
    email: columns[emailIdx],
    firstName: columns[firstNameIdx],
    lastName: columns[lastNameIdx],
    phone: phoneIdx >= 0 ? columns[phoneIdx] : undefined,
    company: companyIdx >= 0 ? columns[companyIdx] : undefined,
    title: titleIdx >= 0 ? columns[titleIdx] : undefined,
  };
}

/**
 * Maps CSV data to internal lead format using column mapping
 *
 * @param data - Raw CSV data
 * @param mapping - Column mapping configuration
 * @returns Array of mapped lead objects
 */
export function mapLeadsData(data: any[], mapping: ColumnMapping): any[] {
  return data.map((row) => ({
    email: row[mapping.email],
    firstName: row[mapping.firstName],
    lastName: row[mapping.lastName],
    phone: mapping.phone ? row[mapping.phone] : undefined,
    company: mapping.company ? row[mapping.company] : undefined,
    title: mapping.title ? row[mapping.title] : undefined,
  }));
}

/**
 * Validates all leads and returns categorized results
 *
 * @param leads - Array of lead objects to validate
 * @returns Validated leads categorized by valid/invalid/duplicate
 */
export function validateLeads(leads: any[]): ValidatedLeadsResult {
  const validLeads: any[] = [];
  const invalidLeads: Array<{
    row: number;
    lead: any;
    errors: string[];
    warnings: string[];
  }> = [];

  // First pass: validate all leads
  leads.forEach((lead, idx) => {
    const validation = validateLead(lead, idx + 1); // Row numbers are 1-indexed

    if (validation.isValid) {
      validLeads.push(validation.lead);
    } else {
      invalidLeads.push({
        row: idx + 1,
        lead,
        errors: validation.errors,
        warnings: validation.warnings,
      });
    }
  });

  // Second pass: detect duplicates within valid leads
  const duplicateIndices = detectDuplicatesInFile(validLeads);
  const duplicates = duplicateIndices.map((idx) => ({
    row: idx + 1,
    email: validLeads[idx].email,
  }));

  // Remove duplicates from valid leads
  const validLeadsNoDupes = validLeads.filter(
    (_, idx) => !duplicateIndices.includes(idx)
  );

  return {
    validLeads: validLeadsNoDupes,
    invalidLeads,
    duplicates,
    summary: {
      total: leads.length,
      valid: validLeadsNoDupes.length,
      invalid: invalidLeads.length,
      duplicates: duplicates.length,
    },
  };
}

/**
 * Generates downloadable error report CSV
 *
 * @param invalidLeads - Array of invalid lead records
 * @returns CSV string for download
 */
export function generateErrorReport(
  invalidLeads: Array<{
    row: number;
    lead: any;
    errors: string[];
    warnings: string[];
  }>
): string {
  const headers = ['Row', 'Email', 'First Name', 'Last Name', 'Error'];
  const rows = invalidLeads.map((item) => [
    item.row,
    item.lead.email || '',
    item.lead.firstName || '',
    item.lead.lastName || '',
    item.errors.join('; '),
  ]);

  const csv = Papa.unparse({
    fields: headers,
    data: rows,
  });

  return csv;
}

/**
 * Checks if file size is within acceptable limit
 *
 * @param file - File to check
 * @param maxSizeMB - Maximum file size in MB (default: 5)
 * @returns True if file size is acceptable
 */
export function isFileSizeAcceptable(file: File, maxSizeMB: number = 5): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
}

/**
 * Validates file format is CSV
 *
 * @param file - File to validate
 * @returns True if file is CSV
 */
export function isCSVFile(file: File): boolean {
  return (
    file.type === 'text/csv' ||
    file.type === 'application/vnd.ms-excel' ||
    file.name.endsWith('.csv')
  );
}
