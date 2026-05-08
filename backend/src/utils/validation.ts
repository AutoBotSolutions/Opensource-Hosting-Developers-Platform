// Comprehensive input validation schemas and utilities

import { ValidationError, createMultipleValidationErrors } from './errors';

// Validation rule interface
export interface ValidationRule {
  required?: boolean;
  type?: string;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  min?: number;
  max?: number;
  enum?: string[];
  custom?: (value: any) => string | null;
}

// Validation schema interface
export interface ValidationSchema {
  [field: string]: ValidationRule;
}

// Common validation patterns
export const Patterns = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^\+?[\d\s\-\(\)]+$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
  URL: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
  IPV4: /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
  CREDIT_CARD: /^(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|3[0-9]{13}|6(?:011|5[0-9]{2})[0-9]{12})$/,
  API_KEY: /^[a-zA-Z0-9_-]+$/,
  SERVER_NAME: /^[a-zA-Z0-9_-]+$/,
  DOMAIN: /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9])*$/,
  TIMEZONE: /^[a-zA-Z_\/]+$/,
  CURRENCY: /^[A-Z]{3}$/
};

// Common validation schemas
export const Schemas = {
  // User validation
  user: {
    email: { required: true, pattern: Patterns.EMAIL },
    password: { required: true, minLength: 8, pattern: Patterns.PASSWORD },
    name: { required: true, minLength: 2, maxLength: 100 },
    phone: { pattern: Patterns.PHONE },
    company: { maxLength: 100 },
    role: { required: true, enum: ['admin', 'user', 'support'] }
  },

  // Server validation
  server: {
    name: { required: true, minLength: 3, maxLength: 50, pattern: Patterns.SERVER_NAME },
    plan: { required: true, enum: ['basic', 'pro', 'enterprise'] },
    location: { required: true, minLength: 2, maxLength: 50 },
    userId: { required: true }
  },

  // Invoice validation
  invoice: {
    userId: { required: true },
    amount: { required: true, min: 0, type: 'number' },
    dueDate: { required: true },
    description: { required: true, minLength: 5, maxLength: 500 },
    items: { required: true, custom: validateInvoiceItems }
  },

  // Support ticket validation
  supportTicket: {
    subject: { required: true, minLength: 5, maxLength: 200 },
    description: { required: true, minLength: 10, maxLength: 2000 },
    priority: { enum: ['low', 'medium', 'high'] },
    category: { enum: ['Technical', 'Billing', 'Domain', 'Account', 'General'] }
  },

  // Payment method validation
  paymentMethod: {
    type: { required: true, enum: ['credit_card', 'bank_account', 'paypal'] },
    cardNumber: { custom: validateCreditCard },
    expiryMonth: { min: 1, max: 12 },
    expiryYear: { min: new Date().getFullYear() },
    cvv: { minLength: 3, maxLength: 4, pattern: /^\d+$/ },
    bankName: { minLength: 2, maxLength: 100 },
    accountNumber: { required: true, minLength: 8, maxLength: 20 },
    routingNumber: { required: true, minLength: 9, maxLength: 9, pattern: /^\d+$/ }
  },

  // Settings validation
  userSettings: {
    'personal.name': { required: true, minLength: 2, maxLength: 100 },
    'personal.email': { required: true, pattern: Patterns.EMAIL },
    'personal.phone': { pattern: Patterns.PHONE },
    'personal.timezone': { pattern: Patterns.TIMEZONE },
    'personal.language': { minLength: 2, maxLength: 5 },
    'security.sessionTimeout': { enum: ['1h', '6h', '12h', '24h', '7d'] },
    'preferences.theme': { enum: ['light', 'dark'] },
    'preferences.currency': { pattern: Patterns.CURRENCY }
  },

  // API key validation
  apiKey: {
    name: { required: true, minLength: 3, maxLength: 50 },
    permissions: { required: true, custom: validatePermissions }
  }
};

// Validation functions
export const validateField = (field: string, value: any, rule: ValidationRule): string | null => {
  // Required validation
  if (rule.required && (value === undefined || value === null || value === '')) {
    return `${field} is required`;
  }

  // Skip other validations if field is empty and not required
  if (!rule.required && (value === undefined || value === null || value === '')) {
    return null;
  }

  // Type validation
  if (rule.type === 'number' && isNaN(Number(value))) {
    return `${field} must be a number`;
  }

  // String validations
  if (typeof value === 'string') {
    if (rule.minLength && value.length < rule.minLength) {
      return `${field} must be at least ${rule.minLength} characters long`;
    }

    if (rule.maxLength && value.length > rule.maxLength) {
      return `${field} must not exceed ${rule.maxLength} characters`;
    }

    if (rule.pattern && !rule.pattern.test(value)) {
      return `${field} format is invalid`;
    }
  }

  // Number validations
  if (typeof value === 'number') {
    if (rule.min !== undefined && value < rule.min) {
      return `${field} must be at least ${rule.min}`;
    }

    if (rule.max !== undefined && value > rule.max) {
      return `${field} must not exceed ${rule.max}`;
    }
  }

  // Enum validation
  if (rule.enum && !rule.enum.includes(value)) {
    return `${field} must be one of: ${rule.enum.join(', ')}`;
  }

  // Custom validation
  if (rule.custom) {
    const customError = rule.custom(value);
    if (customError) {
      return customError;
    }
  }

  return null;
};

export const validateObject = (data: any, schema: ValidationSchema): ValidationError | null => {
  const errors: Array<{ field: string; message: string }> = [];

  for (const [field, rule] of Object.entries(schema)) {
    const value = data[field];
    const error = validateField(field, value, rule);
    if (error) {
      errors.push({ field, message: error });
    }
  }

  if (errors.length > 0) {
    return createMultipleValidationErrors(errors);
  }

  return null;
};

// Custom validation functions
function validateInvoiceItems(items: any): string | null {
  if (!Array.isArray(items) || items.length === 0) {
    return 'At least one item is required';
  }

  for (const item of items) {
    if (!item.name || typeof item.name !== 'string') {
      return 'Item name is required';
    }
    if (typeof item.quantity !== 'number' || item.quantity <= 0) {
      return 'Item quantity must be a positive number';
    }
    if (typeof item.price !== 'number' || item.price < 0) {
      return 'Item price must be a non-negative number';
    }
  }

  return null;
}

function validateCreditCard(cardNumber: any): string | null {
  if (!cardNumber) return null;
  
  const cleanNumber = cardNumber.replace(/\s/g, '');
  
  if (!Patterns.CREDIT_CARD.test(cleanNumber)) {
    return 'Invalid credit card number';
  }

  // Luhn algorithm validation
  let sum = 0;
  let isEven = false;
  
  for (let i = cleanNumber.length - 1; i >= 0; i--) {
    let digit = parseInt(cleanNumber[i]);
    
    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    
    sum += digit;
    isEven = !isEven;
  }
  
  if (sum % 10 !== 0) {
    return 'Invalid credit card number';
  }

  return null;
}

function validatePermissions(permissions: any): string | null {
  if (!Array.isArray(permissions) || permissions.length === 0) {
    return 'At least one permission is required';
  }

  const validPermissions = ['read', 'write', 'delete', 'admin'];
  const invalidPermissions = permissions.filter(p => !validPermissions.includes(p));
  
  if (invalidPermissions.length > 0) {
    return `Invalid permissions: ${invalidPermissions.join(', ')}`;
  }

  return null;
}

// Middleware for validation
export const validateRequest = (schema: ValidationSchema) => {
  return (req: any, res: any, next: any) => {
    try {
      const error = validateObject(req.body, schema);
      if (error) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: error.message,
            details: error.details
          }
        });
      }
      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation error occurred'
        }
      });
    }
  };
};

// Query parameter validation
export const validateQuery = (schema: ValidationSchema) => {
  return (req: any, res: any, next: any) => {
    try {
      const error = validateObject(req.query, schema);
      if (error) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: error.message,
            details: error.details
          }
        });
      }
      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Query validation error occurred'
        }
      });
    }
  };
};

// Path parameter validation
export const validateParams = (schema: ValidationSchema) => {
  return (req: any, res: any, next: any) => {
    try {
      const error = validateObject(req.params, schema);
      if (error) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: error.message,
            details: error.details
          }
        });
      }
      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Parameter validation error occurred'
        }
      });
    }
  };
};

// Sanitization utilities
export const sanitizeString = (value: any): string => {
  if (typeof value !== 'string') return '';
  return value.trim().replace(/[<>]/g, '');
};

export const sanitizeNumber = (value: any): number | null => {
  const num = Number(value);
  return isNaN(num) ? null : num;
};

export const sanitizeBoolean = (value: any): boolean => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    return value.toLowerCase() === 'true';
  }
  return Boolean(value);
};

// Combined validation and sanitization
export const validateAndSanitize = (data: any, schema: ValidationSchema) => {
  const sanitized: any = {};
  const errors: Array<{ field: string; message: string }> = [];

  for (const [field, rule] of Object.entries(schema)) {
    const value = data[field];
    
    // Sanitize based on type
    if (typeof value === 'string') {
      sanitized[field] = sanitizeString(value);
    } else if (typeof value === 'number') {
      sanitized[field] = sanitizeNumber(value);
    } else if (typeof value === 'boolean') {
      sanitized[field] = sanitizeBoolean(value);
    } else {
      sanitized[field] = value;
    }

    // Validate
    const error = validateField(field, sanitized[field], rule);
    if (error) {
      errors.push({ field, message: error });
    }
  }

  if (errors.length > 0) {
    throw createMultipleValidationErrors(errors);
  }

  return sanitized;
};
