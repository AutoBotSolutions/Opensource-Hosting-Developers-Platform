// Custom error classes for the HostingCo backend
import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  public code?: string;

  constructor(message: string, statusCode: number = 500, code?: string) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.code = code;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  public details: any;

  constructor(message: string, details?: any) {
    super(message, 400, 'VALIDATION_ERROR');
    this.details = details;
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Access denied') {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT');
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests') {
    super(message, 429, 'RATE_LIMIT');
  }
}

export class DatabaseError extends AppError {
  constructor(message: string = 'Database operation failed') {
    super(message, 500, 'DATABASE_ERROR');
  }
}

export class ExternalServiceError extends AppError {
  constructor(service: string, message: string = 'External service error') {
    super(`${service}: ${message}`, 502, 'EXTERNAL_SERVICE_ERROR');
  }
}

export class ConfigurationError extends AppError {
  constructor(message: string = 'Configuration error') {
    super(message, 500, 'CONFIGURATION_ERROR');
  }
}

// Error response formatter

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
    stack?: string;
  };
  timestamp: string;
}

export const formatErrorResponse = (error: AppError, includeStack: boolean = false): ErrorResponse => {
  const response: ErrorResponse = {
    success: false,
    error: {
      code: error.code || 'INTERNAL_ERROR',
      message: error.message
    },
    timestamp: new Date().toISOString()
  };

  if (error instanceof ValidationError && error.details) {
    response.error.details = error.details;
  }

  if (includeStack && error.stack) {
    response.error.stack = error.stack;
  }

  return response;
};

// Error handler middleware
export const errorHandler = (error: Error, req: any, res: any, next: any) => {
  let appError: AppError;

  if (error instanceof AppError) {
    appError = error;
  } else if (error.name === 'ValidationError') {
    appError = new ValidationError(error.message);
  } else if (error.name === 'JsonWebTokenError') {
    appError = new AuthenticationError('Invalid token');
  } else if (error.name === 'TokenExpiredError') {
    appError = new AuthenticationError('Token expired');
  } else if (error.name === 'CastError') {
    appError = new ValidationError('Invalid data format');
  } else {
    appError = new AppError('Internal server error', 500, 'INTERNAL_ERROR');
  }

  // Log error
  console.error('Error:', {
    message: appError.message,
    code: appError.code,
    statusCode: appError.statusCode,
    stack: appError.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Send error response
  const includeStack = process.env.NODE_ENV === 'development';
  const errorResponse = formatErrorResponse(appError, includeStack);

  res.status(appError.statusCode).json(errorResponse);
};

// Async error wrapper
export const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Validation error helper
export const createValidationError = (field: string, message: string) => {
  return new ValidationError(`Validation failed for ${field}: ${message}`, { field, message });
};

// Multiple validation errors helper
export const createMultipleValidationErrors = (errors: Array<{ field: string; message: string }>) => {
  const details = errors.reduce((acc, error) => {
    acc[error.field] = error.message;
    return acc;
  }, {} as Record<string, string>);

  return new ValidationError('Multiple validation errors', details);
};

// Error codes enumeration
export enum ErrorCodes {
  // Authentication & Authorization
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  INVALID_TOKEN = 'INVALID_TOKEN',
  
  // Validation
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_FIELD = 'MISSING_FIELD',
  INVALID_FORMAT = 'INVALID_FORMAT',
  
  // Resource errors
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  ALREADY_EXISTS = 'ALREADY_EXISTS',
  
  // Business logic errors
  INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  SUBSCRIPTION_EXPIRED = 'SUBSCRIPTION_EXPIRED',
  
  // System errors
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',
  RATE_LIMIT = 'RATE_LIMIT',
  
  // Generic errors
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  BAD_REQUEST = 'BAD_REQUEST'
}

// Error message templates
export const ErrorMessages = {
  [ErrorCodes.AUTHENTICATION_ERROR]: 'Authentication required',
  [ErrorCodes.AUTHORIZATION_ERROR]: 'Access denied',
  [ErrorCodes.TOKEN_EXPIRED]: 'Your session has expired',
  [ErrorCodes.INVALID_TOKEN]: 'Invalid authentication token',
  
  [ErrorCodes.VALIDATION_ERROR]: 'Validation failed',
  [ErrorCodes.INVALID_INPUT]: 'Invalid input provided',
  [ErrorCodes.MISSING_FIELD]: 'Required field is missing',
  [ErrorCodes.INVALID_FORMAT]: 'Invalid data format',
  
  [ErrorCodes.NOT_FOUND]: 'Resource not found',
  [ErrorCodes.CONFLICT]: 'Resource conflict',
  [ErrorCodes.ALREADY_EXISTS]: 'Resource already exists',
  
  [ErrorCodes.INSUFFICIENT_BALANCE]: 'Insufficient balance',
  [ErrorCodes.QUOTA_EXCEEDED]: 'Resource quota exceeded',
  [ErrorCodes.SUBSCRIPTION_EXPIRED]: 'Subscription has expired',
  
  [ErrorCodes.DATABASE_ERROR]: 'Database operation failed',
  [ErrorCodes.EXTERNAL_SERVICE_ERROR]: 'External service error',
  [ErrorCodes.CONFIGURATION_ERROR]: 'System configuration error',
  [ErrorCodes.RATE_LIMIT]: 'Too many requests',
  
  [ErrorCodes.INTERNAL_ERROR]: 'Internal server error',
  [ErrorCodes.BAD_REQUEST]: 'Bad request'
};

// Error factory functions
export const createError = (code: ErrorCodes, message?: string, details?: any) => {
  const errorMessage = message || ErrorMessages[code];
  
  switch (code) {
    case ErrorCodes.AUTHENTICATION_ERROR:
    case ErrorCodes.TOKEN_EXPIRED:
    case ErrorCodes.INVALID_TOKEN:
      return new AuthenticationError(errorMessage);
      
    case ErrorCodes.AUTHORIZATION_ERROR:
      return new AuthorizationError(errorMessage);
      
    case ErrorCodes.VALIDATION_ERROR:
    case ErrorCodes.INVALID_INPUT:
    case ErrorCodes.MISSING_FIELD:
    case ErrorCodes.INVALID_FORMAT:
      return new ValidationError(errorMessage, details);
      
    case ErrorCodes.NOT_FOUND:
      return new NotFoundError();
      
    case ErrorCodes.CONFLICT:
    case ErrorCodes.ALREADY_EXISTS:
      return new ConflictError(errorMessage);
      
    case ErrorCodes.RATE_LIMIT:
      return new RateLimitError(errorMessage);
      
    case ErrorCodes.DATABASE_ERROR:
      return new DatabaseError(errorMessage);
      
    case ErrorCodes.EXTERNAL_SERVICE_ERROR:
      return new ExternalServiceError('Service', errorMessage);
      
    case ErrorCodes.CONFIGURATION_ERROR:
      return new ConfigurationError(errorMessage);
      
    default:
      return new AppError(errorMessage, 500, code);
  }
};
