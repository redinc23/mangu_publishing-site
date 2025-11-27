/**
 * Form validation utilities
 * Provides validation functions for common form fields
 */

/**
 * Validate email format
 * @param {string} email - The email to validate
 * @returns {object} - { valid: boolean, error: string }
 */
export const validateEmail = (email) => {
  if (!email || email.trim() === '') {
    return { valid: false, error: 'Email is required' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, error: 'Please enter a valid email address' };
  }

  return { valid: true, error: '' };
};

/**
 * Validate password strength
 * @param {string} password - The password to validate
 * @param {object} options - Validation options
 * @returns {object} - { valid: boolean, error: string }
 */
export const validatePassword = (password, options = {}) => {
  const {
    minLength = 8,
    requireUppercase = true,
    requireLowercase = true,
    requireNumber = true,
    requireSpecial = false,
  } = options;

  if (!password || password.trim() === '') {
    return { valid: false, error: 'Password is required' };
  }

  if (password.length < minLength) {
    return {
      valid: false,
      error: `Password must be at least ${minLength} characters long`,
    };
  }

  if (requireUppercase && !/[A-Z]/.test(password)) {
    return {
      valid: false,
      error: 'Password must contain at least one uppercase letter',
    };
  }

  if (requireLowercase && !/[a-z]/.test(password)) {
    return {
      valid: false,
      error: 'Password must contain at least one lowercase letter',
    };
  }

  if (requireNumber && !/\d/.test(password)) {
    return {
      valid: false,
      error: 'Password must contain at least one number',
    };
  }

  if (requireSpecial && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return {
      valid: false,
      error: 'Password must contain at least one special character',
    };
  }

  return { valid: true, error: '' };
};

/**
 * Validate password confirmation
 * @param {string} password - The original password
 * @param {string} confirmPassword - The confirmation password
 * @returns {object} - { valid: boolean, error: string }
 */
export const validatePasswordConfirmation = (password, confirmPassword) => {
  if (!confirmPassword || confirmPassword.trim() === '') {
    return { valid: false, error: 'Please confirm your password' };
  }

  if (password !== confirmPassword) {
    return { valid: false, error: 'Passwords do not match' };
  }

  return { valid: true, error: '' };
};

/**
 * Validate name (display name, full name, etc.)
 * @param {string} name - The name to validate
 * @param {object} options - Validation options
 * @returns {object} - { valid: boolean, error: string }
 */
export const validateName = (name, options = {}) => {
  const { minLength = 2, maxLength = 50, required = true } = options;

  if (!name || name.trim() === '') {
    if (required) {
      return { valid: false, error: 'Name is required' };
    }
    return { valid: true, error: '' };
  }

  const trimmedName = name.trim();

  if (trimmedName.length < minLength) {
    return {
      valid: false,
      error: `Name must be at least ${minLength} characters long`,
    };
  }

  if (trimmedName.length > maxLength) {
    return {
      valid: false,
      error: `Name must not exceed ${maxLength} characters`,
    };
  }

  // Check for valid characters (letters, spaces, hyphens, apostrophes)
  if (!/^[a-zA-Z\s'-]+$/.test(trimmedName)) {
    return {
      valid: false,
      error: 'Name can only contain letters, spaces, hyphens, and apostrophes',
    };
  }

  return { valid: true, error: '' };
};

/**
 * Validate required field
 * @param {string} value - The value to validate
 * @param {string} fieldName - The name of the field for error message
 * @returns {object} - { valid: boolean, error: string }
 */
export const validateRequired = (value, fieldName = 'This field') => {
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    return { valid: false, error: `${fieldName} is required` };
  }

  return { valid: true, error: '' };
};

/**
 * Validate form with multiple fields
 * @param {object} formData - Object containing form field values
 * @param {object} validationRules - Object containing validation rules for each field
 * @returns {object} - { valid: boolean, errors: object }
 *
 * Example usage:
 * const result = validateForm(
 *   { email: 'test@example.com', password: 'Pass123' },
 *   {
 *     email: (value) => validateEmail(value),
 *     password: (value) => validatePassword(value)
 *   }
 * );
 */
export const validateForm = (formData, validationRules) => {
  const errors = {};
  let isValid = true;

  Object.keys(validationRules).forEach((field) => {
    const validationFn = validationRules[field];
    const result = validationFn(formData[field]);

    if (!result.valid) {
      errors[field] = result.error;
      isValid = false;
    }
  });

  return { valid: isValid, errors };
};

/**
 * Get password strength (weak, medium, strong)
 * @param {string} password - The password to check
 * @returns {object} - { strength: string, score: number }
 */
export const getPasswordStrength = (password) => {
  if (!password) {
    return { strength: 'none', score: 0 };
  }

  let score = 0;

  // Length check
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (password.length >= 16) score += 1;

  // Character variety checks
  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1;

  // Determine strength
  let strength = 'weak';
  if (score >= 5) strength = 'strong';
  else if (score >= 3) strength = 'medium';

  return { strength, score };
};
