/**
 * Password Utility Functions
 * Handles temporary password generation and validation
 */

import crypto from 'crypto';

/**
 * Generate a secure temporary password
 * Format: 12 characters with uppercase, lowercase, numbers, and special characters
 * Excludes ambiguous characters (I, l, O, 0, 1)
 *
 * @returns {string} A secure random password
 */
export function generateTempPassword(): string {
  // Character sets (excluding ambiguous characters)
  const uppercase = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // No I, O
  const lowercase = 'abcdefghjkmnpqrstuvwxyz'; // No i, l, o
  const numbers = '23456789'; // No 0, 1
  const special = '!@#$%^&*';

  // Ensure at least one character from each set
  let password = '';
  password += uppercase[crypto.randomInt(0, uppercase.length)];
  password += lowercase[crypto.randomInt(0, lowercase.length)];
  password += numbers[crypto.randomInt(0, numbers.length)];
  password += special[crypto.randomInt(0, special.length)];

  // Add 8 more random characters from all sets
  const allChars = uppercase + lowercase + numbers + special;
  for (let i = 0; i < 8; i++) {
    password += allChars[crypto.randomInt(0, allChars.length)];
  }

  // Shuffle the password to randomize character positions
  const passwordArray = password.split('');
  for (let i = passwordArray.length - 1; i > 0; i--) {
    const j = crypto.randomInt(0, i + 1);
    [passwordArray[i], passwordArray[j]] = [passwordArray[j], passwordArray[i]];
  }

  return passwordArray.join('');
}

/**
 * Validate password strength
 * Requirements:
 * - Minimum 12 characters (SECURITY: Updated from 8 to 12)
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 *
 * @param {string} password - Password to validate
 * @returns {Object} Validation result with isValid flag and error message
 */
export function validatePassword(password: string): {
  isValid: boolean;
  error?: string
} {
  if (!password || password.length < 12) {
    return {
      isValid: false,
      error: 'Password must be at least 12 characters long'
    };
  }

  if (!/[A-Z]/.test(password)) {
    return {
      isValid: false,
      error: 'Password must contain at least one uppercase letter'
    };
  }

  if (!/[a-z]/.test(password)) {
    return {
      isValid: false,
      error: 'Password must contain at least one lowercase letter'
    };
  }

  if (!/[0-9]/.test(password)) {
    return {
      isValid: false,
      error: 'Password must contain at least one number'
    };
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return {
      isValid: false,
      error: 'Password must contain at least one special character'
    };
  }

  return { isValid: true };
}

/**
 * Password strength indicator
 *
 * @param {string} password - Password to check
 * @returns {string} Strength level: 'weak', 'medium', 'strong'
 */
export function getPasswordStrength(password: string): 'weak' | 'medium' | 'strong' {
  let strength = 0;

  // Length check
  if (password.length >= 8) strength++;
  if (password.length >= 12) strength++;
  if (password.length >= 16) strength++;

  // Character variety
  if (/[A-Z]/.test(password)) strength++;
  if (/[a-z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) strength++;

  if (strength <= 3) return 'weak';
  if (strength <= 5) return 'medium';
  return 'strong';
}
