/**
 * Input Sanitization Utilities
 *
 * Provides XSS protection and input validation for user-generated content.
 *
 * Security Principles:
 * 1. NEVER trust user input
 * 2. Sanitize at the boundary (before storage AND before display)
 * 3. Use allowlists, not denylists
 * 4. Validate AND sanitize (defense in depth)
 */

/**
 * Sanitize plain text input (removes all HTML tags and dangerous characters)
 *
 * Use for: Notes content, user names, campaign descriptions, etc.
 *
 * @param input - Raw user input
 * @param maxLength - Maximum allowed length (default: 10000)
 * @returns Sanitized plain text
 */
export function sanitizePlainText(input: string, maxLength: number = 10000): string {
  if (!input) return '';

  // Trim whitespace
  let sanitized = input.trim();

  // Enforce max length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  // Remove all HTML tags
  sanitized = sanitized.replace(/<[^>]*>/g, '');

  // Remove null bytes and control characters (except newlines/tabs)
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  // Normalize whitespace (but preserve intentional line breaks)
  sanitized = sanitized.replace(/[ \t]+/g, ' ');

  return sanitized;
}

/**
 * Sanitize email address
 *
 * @param email - Raw email input
 * @returns Sanitized and normalized email, or null if invalid
 */
export function sanitizeEmail(email: string): string | null {
  if (!email) return null;

  // Basic email regex (RFC 5322 simplified)
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

  const trimmed = email.trim().toLowerCase();

  if (!emailRegex.test(trimmed)) {
    return null;
  }

  // Enforce max length (email standard)
  if (trimmed.length > 320) {
    return null;
  }

  return trimmed;
}

/**
 * Sanitize phone number
 *
 * @param phone - Raw phone input
 * @returns Sanitized phone number with only digits and +
 */
export function sanitizePhone(phone: string): string {
  if (!phone) return '';

  // Remove all characters except digits, +, -, (, ), and spaces
  let sanitized = phone.replace(/[^\d+\-() ]/g, '');

  // Normalize to E.164 format if possible
  sanitized = sanitized.replace(/\s+/g, '').trim();

  // Enforce max length (international phone numbers)
  if (sanitized.length > 20) {
    sanitized = sanitized.substring(0, 20);
  }

  return sanitized;
}

/**
 * Sanitize URL
 *
 * @param url - Raw URL input
 * @returns Sanitized URL, or null if invalid
 */
export function sanitizeUrl(url: string): string | null {
  if (!url) return null;

  const trimmed = url.trim();

  // Only allow http(s) and mailto protocols
  const urlRegex = /^(https?:\/\/|mailto:)/i;

  if (!urlRegex.test(trimmed)) {
    return null;
  }

  // Prevent javascript: and data: URLs
  if (/^(javascript|data|vbscript|file):/i.test(trimmed)) {
    return null;
  }

  // Enforce max length
  if (trimmed.length > 2048) {
    return null;
  }

  try {
    // Validate URL structure
    new URL(trimmed);
    return trimmed;
  } catch {
    return null;
  }
}

/**
 * Sanitize rich text (allows safe HTML subset)
 *
 * Use for: AI-generated messages that may contain formatting
 *
 * Allows: bold, italic, links, line breaks
 * Blocks: scripts, iframes, forms, etc.
 *
 * @param html - Raw HTML input
 * @returns Sanitized HTML with only safe tags
 */
export function sanitizeRichText(html: string): string {
  if (!html) return '';

  // Remove script tags and their content
  let sanitized = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  // Remove event handlers (onclick, onerror, etc.)
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*[^\s>]*/gi, '');

  // Remove dangerous tags
  const dangerousTags = [
    'script', 'iframe', 'frame', 'frameset', 'object', 'embed',
    'applet', 'form', 'input', 'button', 'select', 'textarea',
    'link', 'style', 'meta', 'base'
  ];

  dangerousTags.forEach(tag => {
    const regex = new RegExp(`<${tag}\\b[^<]*(?:(?!<\\/${tag}>)<[^<]*)*<\\/${tag}>`, 'gi');
    sanitized = sanitized.replace(regex, '');
  });

  // Remove javascript: and data: URLs from href/src attributes
  sanitized = sanitized.replace(/href\s*=\s*["']?\s*(javascript|data|vbscript):/gi, 'href="#"');
  sanitized = sanitized.replace(/src\s*=\s*["']?\s*(javascript|data|vbscript):/gi, 'src=""');

  // Enforce max length
  if (sanitized.length > 50000) {
    sanitized = sanitized.substring(0, 50000);
  }

  return sanitized.trim();
}

/**
 * Sanitize JSON data (for storing in JSONB fields)
 *
 * @param data - Raw JSON data
 * @returns Sanitized JSON object
 */
export function sanitizeJson<T extends Record<string, any>>(data: T): T {
  if (!data || typeof data !== 'object') return {} as T;

  const sanitized: Record<string, any> = {};

  for (const [key, value] of Object.entries(data)) {
    // Sanitize key (alphanumeric and underscore only)
    const sanitizedKey = key.replace(/[^a-zA-Z0-9_]/g, '');

    if (!sanitizedKey) continue;

    // Sanitize value based on type
    if (typeof value === 'string') {
      sanitized[sanitizedKey] = sanitizePlainText(value, 5000);
    } else if (typeof value === 'number') {
      sanitized[sanitizedKey] = value;
    } else if (typeof value === 'boolean') {
      sanitized[sanitizedKey] = value;
    } else if (Array.isArray(value)) {
      sanitized[sanitizedKey] = value
        .filter(item => typeof item === 'string' || typeof item === 'number')
        .map(item => typeof item === 'string' ? sanitizePlainText(item, 500) : item)
        .slice(0, 100); // Max 100 array items
    } else if (typeof value === 'object' && value !== null) {
      // Recursive sanitization (max 1 level deep)
      sanitized[sanitizedKey] = sanitizeJson(value);
    }
  }

  return sanitized as T;
}

/**
 * Sanitize SQL LIKE pattern (prevents injection in LIKE clauses)
 *
 * @param pattern - Raw search pattern
 * @returns Escaped LIKE pattern
 */
export function sanitizeLikePattern(pattern: string): string {
  if (!pattern) return '';

  // Escape special LIKE characters: % _ [ ]
  return pattern
    .replace(/\\/g, '\\\\')  // Escape backslash first
    .replace(/%/g, '\\%')
    .replace(/_/g, '\\_')
    .replace(/\[/g, '\\[')
    .replace(/\]/g, '\\]');
}

/**
 * Validate and sanitize integer input
 *
 * @param value - Raw input
 * @param min - Minimum allowed value
 * @param max - Maximum allowed value
 * @returns Sanitized integer, or null if invalid
 */
export function sanitizeInteger(
  value: any,
  min: number = Number.MIN_SAFE_INTEGER,
  max: number = Number.MAX_SAFE_INTEGER
): number | null {
  const num = parseInt(String(value), 10);

  if (isNaN(num) || num < min || num > max) {
    return null;
  }

  return num;
}

/**
 * Validate and sanitize UUID
 *
 * @param uuid - Raw UUID input
 * @returns Sanitized UUID, or null if invalid
 */
export function sanitizeUuid(uuid: string): string | null {
  if (!uuid) return null;

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  const trimmed = uuid.trim().toLowerCase();

  if (!uuidRegex.test(trimmed)) {
    return null;
  }

  return trimmed;
}

/**
 * Sanitize array of tags (for Kajabi tags, campaign tags, etc.)
 *
 * @param tags - Raw array of tags
 * @param maxTags - Maximum number of tags allowed
 * @param maxLength - Maximum length per tag
 * @returns Sanitized array of unique tags
 */
export function sanitizeTags(
  tags: string[],
  maxTags: number = 50,
  maxLength: number = 100
): string[] {
  if (!Array.isArray(tags)) return [];

  return tags
    .filter(tag => typeof tag === 'string' && tag.trim().length > 0)
    .map(tag => sanitizePlainText(tag, maxLength))
    .filter(tag => tag.length > 0)
    .slice(0, maxTags)
    .filter((tag, index, self) => self.indexOf(tag) === index); // Unique only
}

/**
 * Sanitize campaign message content (may contain variables like {{firstName}})
 *
 * @param message - Raw message content
 * @returns Sanitized message with safe variables preserved
 */
export function sanitizeCampaignMessage(message: string): string {
  if (!message) return '';

  // First, sanitize the entire message as plain text
  let sanitized = sanitizePlainText(message, 5000);

  // Allow only safe variable patterns: {{variableName}}
  // But ensure they don't contain script injection attempts
  sanitized = sanitized.replace(/\{\{([^}]+)\}\}/g, (match, varName) => {
    // Only allow alphanumeric variable names
    if (/^[a-zA-Z0-9_]+$/.test(varName.trim())) {
      return `{{${varName.trim()}}}`;
    }
    return ''; // Remove invalid variables
  });

  return sanitized;
}

/**
 * COMPREHENSIVE INPUT VALIDATION & SANITIZATION
 *
 * Use this for API endpoints that accept user input
 */
export interface SanitizationResult<T> {
  isValid: boolean;
  sanitized: T;
  errors: string[];
}

export function sanitizeLeadInput(data: any): SanitizationResult<{
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company?: string;
  title?: string;
}> {
  const errors: string[] = [];

  const firstName = sanitizePlainText(data.firstName || '', 255);
  if (!firstName || firstName.length < 1) {
    errors.push('First name is required');
  }

  const lastName = sanitizePlainText(data.lastName || '', 255);
  if (!lastName || lastName.length < 1) {
    errors.push('Last name is required');
  }

  const email = sanitizeEmail(data.email || '');
  if (!email) {
    errors.push('Valid email is required');
  }

  const phone = data.phone ? sanitizePhone(data.phone) : undefined;
  const company = data.company ? sanitizePlainText(data.company, 255) : undefined;
  const title = data.title ? sanitizePlainText(data.title, 255) : undefined;

  return {
    isValid: errors.length === 0,
    sanitized: {
      firstName,
      lastName,
      email: email || '',
      phone,
      company,
      title,
    },
    errors,
  };
}

export function sanitizeNoteInput(data: any): SanitizationResult<{
  content: string;
  type: string;
}> {
  const errors: string[] = [];

  const content = sanitizePlainText(data.content || '', 5000);
  if (!content || content.length < 1) {
    errors.push('Note content is required');
  }

  const validTypes = ['Call', 'Email', 'Text', 'Meeting', 'General', 'Issue', 'Success'];
  const type = validTypes.includes(data.type) ? data.type : 'General';

  return {
    isValid: errors.length === 0,
    sanitized: { content, type },
    errors,
  };
}

export function sanitizeCampaignInput(data: any): SanitizationResult<{
  name: string;
  description?: string;
  messageTemplate?: string;
  targetTags?: string[];
  bookingLink?: string;
}> {
  const errors: string[] = [];

  const name = sanitizePlainText(data.name || '', 255);
  if (!name || name.length < 1) {
    errors.push('Campaign name is required');
  }

  const description = data.description ? sanitizePlainText(data.description, 1000) : undefined;
  const messageTemplate = data.messageTemplate ? sanitizeCampaignMessage(data.messageTemplate) : undefined;
  const targetTags = data.targetTags ? sanitizeTags(data.targetTags, 50, 100) : undefined;

  let bookingLink: string | undefined;
  if (data.bookingLink) {
    const sanitizedUrl = sanitizeUrl(data.bookingLink);
    if (!sanitizedUrl) {
      errors.push('Invalid booking link URL');
    } else {
      bookingLink = sanitizedUrl;
    }
  }

  return {
    isValid: errors.length === 0,
    sanitized: {
      name,
      description,
      messageTemplate,
      targetTags,
      bookingLink,
    },
    errors,
  };
}
