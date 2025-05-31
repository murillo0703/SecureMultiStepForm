import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { body, validationResult, param, query } from 'express-validator';
import DOMPurify from 'isomorphic-dompurify';

/**
 * Security middleware collection for comprehensive protection
 * against common web vulnerabilities including XSS, injection attacks,
 * and rate limiting for brute force protection
 */

/**
 * Enhanced rate limiting configuration
 * Implements different limits for different endpoint types
 */
export const createRateLimit = (windowMs: number, max: number, message?: string) => {
  return rateLimit({
    windowMs,
    max,
    message: message || 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req: Request, res: Response) => {
      console.warn(`Rate limit exceeded for IP: ${req.ip} on ${req.path}`);
      res.status(429).json({
        error: 'Rate limit exceeded',
        retryAfter: Math.round(windowMs / 1000)
      });
    }
  });
};

/**
 * Authentication endpoint rate limiting - stricter limits
 */
export const authRateLimit = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  5, // 5 attempts
  'Too many authentication attempts, please try again in 15 minutes.'
);

/**
 * General API rate limiting
 */
export const apiRateLimit = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  100 // 100 requests
);

/**
 * Enhanced helmet configuration for security headers
 */
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "fonts.googleapis.com"],
      fontSrc: ["'self'", "fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false, // Disable for development
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
});

/**
 * Input sanitization middleware
 * Sanitizes all string inputs to prevent XSS attacks
 */
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Sanitize request body
    if (req.body && typeof req.body === 'object') {
      req.body = sanitizeObject(req.body);
    }

    // Sanitize query parameters
    if (req.query && typeof req.query === 'object') {
      req.query = sanitizeObject(req.query);
    }

    // Sanitize URL parameters
    if (req.params && typeof req.params === 'object') {
      req.params = sanitizeObject(req.params);
    }

    next();
  } catch (error) {
    console.error('Input sanitization error:', error);
    res.status(400).json({ error: 'Invalid input format' });
  }
};

/**
 * Recursively sanitize object properties
 */
function sanitizeObject(obj: any): any {
  if (typeof obj === 'string') {
    return DOMPurify.sanitize(obj, { ALLOWED_TAGS: [] });
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }
  
  if (obj && typeof obj === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeObject(value);
    }
    return sanitized;
  }
  
  return obj;
}

/**
 * Common validation rules for different field types
 */
export const validationRules = {
  /**
   * User registration validation
   */
  userRegistration: [
    body('username')
      .isLength({ min: 3, max: 30 })
      .withMessage('Username must be between 3 and 30 characters')
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage('Username can only contain letters, numbers, and underscores')
      .trim()
      .escape(),
    
    body('email')
      .isEmail()
      .withMessage('Please provide a valid email address')
      .normalizeEmail()
      .isLength({ max: 255 })
      .withMessage('Email must not exceed 255 characters'),
    
    body('name')
      .isLength({ min: 2, max: 100 })
      .withMessage('Name must be between 2 and 100 characters')
      .matches(/^[a-zA-Z\s\-'\.]+$/)
      .withMessage('Name can only contain letters, spaces, hyphens, apostrophes, and periods')
      .trim()
      .escape(),
    
    body('password')
      .isLength({ min: 8, max: 128 })
      .withMessage('Password must be between 8 and 128 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character')
  ],

  /**
   * User login validation
   */
  userLogin: [
    body('username')
      .isLength({ min: 3, max: 30 })
      .withMessage('Invalid username format')
      .trim()
      .escape(),
    
    body('password')
      .isLength({ min: 8, max: 128 })
      .withMessage('Invalid password format')
  ],

  /**
   * Company information validation
   */
  companyInfo: [
    body('name')
      .isLength({ min: 2, max: 200 })
      .withMessage('Company name must be between 2 and 200 characters')
      .trim()
      .escape(),
    
    body('address')
      .isLength({ min: 5, max: 500 })
      .withMessage('Address must be between 5 and 500 characters')
      .trim()
      .escape(),
    
    body('city')
      .isLength({ min: 2, max: 100 })
      .withMessage('City must be between 2 and 100 characters')
      .matches(/^[a-zA-Z\s\-'\.]+$/)
      .withMessage('City can only contain letters, spaces, hyphens, apostrophes, and periods')
      .trim()
      .escape(),
    
    body('state')
      .isLength({ min: 2, max: 2 })
      .withMessage('State must be a 2-character code')
      .matches(/^[A-Z]{2}$/)
      .withMessage('State must be a valid 2-letter state code')
      .toUpperCase(),
    
    body('zip')
      .matches(/^\d{5}(-\d{4})?$/)
      .withMessage('ZIP code must be in format 12345 or 12345-6789'),
    
    body('phone')
      .matches(/^[\+]?[1-9][\d]{0,15}$/)
      .withMessage('Please provide a valid phone number')
      .optional(),
    
    body('taxId')
      .matches(/^\d{2}-\d{7}$/)
      .withMessage('Tax ID must be in format XX-XXXXXXX')
      .optional(),
    
    body('industry')
      .isLength({ min: 2, max: 100 })
      .withMessage('Industry must be between 2 and 100 characters')
      .trim()
      .escape()
      .optional()
  ],

  /**
   * Employee information validation
   */
  employeeInfo: [
    body('firstName')
      .isLength({ min: 2, max: 50 })
      .withMessage('First name must be between 2 and 50 characters')
      .matches(/^[a-zA-Z\s\-'\.]+$/)
      .withMessage('First name can only contain letters, spaces, hyphens, apostrophes, and periods')
      .trim()
      .escape(),
    
    body('lastName')
      .isLength({ min: 2, max: 50 })
      .withMessage('Last name must be between 2 and 50 characters')
      .matches(/^[a-zA-Z\s\-'\.]+$/)
      .withMessage('Last name can only contain letters, spaces, hyphens, apostrophes, and periods')
      .trim()
      .escape(),
    
    body('email')
      .isEmail()
      .withMessage('Please provide a valid email address')
      .normalizeEmail()
      .optional(),
    
    body('dob')
      .isISO8601()
      .withMessage('Date of birth must be a valid date')
      .toDate(),
    
    body('ssn')
      .matches(/^\d{3}-\d{2}-\d{4}$/)
      .withMessage('SSN must be in format XXX-XX-XXXX'),
    
    body('address')
      .isLength({ min: 5, max: 200 })
      .withMessage('Address must be between 5 and 200 characters')
      .trim()
      .escape(),
    
    body('city')
      .isLength({ min: 2, max: 50 })
      .withMessage('City must be between 2 and 50 characters')
      .matches(/^[a-zA-Z\s\-'\.]+$/)
      .withMessage('City can only contain letters, spaces, hyphens, apostrophes, and periods')
      .trim()
      .escape(),
    
    body('state')
      .isLength({ min: 2, max: 2 })
      .withMessage('State must be a 2-character code')
      .matches(/^[A-Z]{2}$/)
      .withMessage('State must be a valid 2-letter state code')
      .toUpperCase(),
    
    body('zip')
      .matches(/^\d{5}(-\d{4})?$/)
      .withMessage('ZIP code must be in format 12345 or 12345-6789')
  ],

  /**
   * ID parameter validation
   */
  idParam: [
    param('id')
      .isInt({ min: 1 })
      .withMessage('ID must be a positive integer')
      .toInt()
  ],

  /**
   * Pagination validation
   */
  pagination: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer')
      .toInt(),
    
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100')
      .toInt()
  ]
};

/**
 * Validation result handler middleware
 * Formats and returns validation errors in a consistent format
 */
export const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(error => ({
      field: error.type === 'field' ? (error as any).path : 'unknown',
      message: error.msg,
      value: error.type === 'field' ? (error as any).value : undefined
    }));

    console.warn('Validation errors:', {
      ip: req.ip,
      path: req.path,
      errors: formattedErrors
    });

    return res.status(400).json({
      error: 'Validation failed',
      details: formattedErrors
    });
  }
  
  next();
};

/**
 * Security logging middleware
 * Logs security-related events for monitoring and analysis
 */
export const securityLogger = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  
  // Log request details
  console.log(`Security Log: ${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString(),
    sessionId: req.sessionID
  });

  // Log response completion
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    
    if (res.statusCode >= 400) {
      console.warn(`Security Warning: ${res.statusCode} response`, {
        ip: req.ip,
        path: req.path,
        statusCode: res.statusCode,
        duration,
        timestamp: new Date().toISOString()
      });
    }
  });

  next();
};

/**
 * Content-Type validation middleware
 * Ensures requests have appropriate content types
 */
export const validateContentType = (expectedTypes: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.method !== 'GET' && req.method !== 'DELETE') {
      const contentType = req.get('Content-Type');
      
      if (!contentType || !expectedTypes.some(type => contentType.includes(type))) {
        return res.status(400).json({
          error: 'Invalid content type',
          expected: expectedTypes
        });
      }
    }
    
    next();
  };
};

/**
 * Request size validation middleware
 * Prevents oversized requests that could cause DoS
 */
export const validateRequestSize = (maxSize: number) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const contentLength = req.get('Content-Length');
    
    if (contentLength && parseInt(contentLength) > maxSize) {
      return res.status(413).json({
        error: 'Request too large',
        maxSize: `${maxSize} bytes`
      });
    }
    
    next();
  };
};