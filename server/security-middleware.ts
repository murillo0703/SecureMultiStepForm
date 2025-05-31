import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { body, validationResult } from 'express-validator';
import DOMPurify from 'isomorphic-dompurify';
import { ApplicationLogger, ErrorHandler } from './code-quality-utilities';

/**
 * Comprehensive Security Middleware Suite
 * Implements enterprise-level security measures for form processing
 */

// CSRF Protection (simplified token-based approach)
const csrfTokens = new Map<string, { token: string; expires: number }>();

export function generateCSRFToken(sessionId: string): string {
  const token = Math.random().toString(36).substring(2, 15) + 
                Math.random().toString(36).substring(2, 15);
  const expires = Date.now() + (30 * 60 * 1000); // 30 minutes
  
  csrfTokens.set(sessionId, { token, expires });
  return token;
}

export function validateCSRFToken(sessionId: string, token: string): boolean {
  const stored = csrfTokens.get(sessionId);
  if (!stored || stored.expires < Date.now()) {
    csrfTokens.delete(sessionId);
    return false;
  }
  return stored.token === token;
}

// Enhanced security headers
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      upgradeInsecureRequests: []
    }
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
});

// Rate limiting configurations
export const strictRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    ApplicationLogger.warn('Rate limit exceeded', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      path: req.path
    });
    res.status(429).json({
      error: 'Too many requests from this IP, please try again later.',
      retryAfter: '15 minutes'
    });
  }
});

export const generalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: {
    error: 'Too many requests, please slow down.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false
});

export const submissionRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 submissions per hour
  message: {
    error: 'Too many form submissions, please try again later.',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Input sanitization middleware
export function sanitizeInput(req: Request, res: Response, next: NextFunction): void {
  const sanitizeObject = (obj: any): any => {
    if (typeof obj !== 'object' || obj === null) {
      return typeof obj === 'string' ? DOMPurify.sanitize(obj) : obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(sanitizeObject);
    }

    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeObject(value);
    }
    return sanitized;
  };

  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }

  next();
}

// Validation rules for common form fields
export const validationRules = {
  email: body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  phone: body('phone')
    .isMobilePhone('any', { strictMode: false })
    .withMessage('Please provide a valid phone number'),
  
  name: body('name')
    .isLength({ min: 2, max: 100 })
    .trim()
    .matches(/^[a-zA-Z\s\-'\.]+$/)
    .withMessage('Name must be 2-100 characters and contain only letters, spaces, hyphens, apostrophes, and periods'),
  
  companyName: body('companyName')
    .isLength({ min: 2, max: 200 })
    .trim()
    .withMessage('Company name must be 2-200 characters'),
  
  address: body('address')
    .isLength({ min: 5, max: 200 })
    .trim()
    .withMessage('Address must be 5-200 characters'),
  
  city: body('city')
    .isLength({ min: 2, max: 100 })
    .trim()
    .matches(/^[a-zA-Z\s\-'\.]+$/)
    .withMessage('City must contain only letters, spaces, hyphens, apostrophes, and periods'),
  
  state: body('state')
    .isLength({ min: 2, max: 2 })
    .isAlpha()
    .toUpperCase()
    .withMessage('State must be a valid 2-letter state code'),
  
  zipCode: body('zipCode')
    .matches(/^\d{5}(-\d{4})?$/)
    .withMessage('ZIP code must be in format 12345 or 12345-6789'),
  
  ssn: body('ssn')
    .matches(/^\d{3}-\d{2}-\d{4}$/)
    .withMessage('SSN must be in format XXX-XX-XXXX'),
  
  taxId: body('taxId')
    .matches(/^\d{2}-\d{7}$/)
    .withMessage('Tax ID must be in format XX-XXXXXXX'),
  
  employeeCount: body('employeeCount')
    .isInt({ min: 1, max: 10000 })
    .withMessage('Employee count must be between 1 and 10,000'),
  
  date: body('date')
    .isISO8601()
    .toDate()
    .withMessage('Please provide a valid date in YYYY-MM-DD format'),
  
  percentage: body('percentage')
    .isFloat({ min: 0, max: 100 })
    .withMessage('Percentage must be between 0 and 100')
};

// Enhanced validation error handler
export function handleValidationErrors(req: Request, res: Response, next: NextFunction): void {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(error => ({
      field: error.type === 'field' ? error.path : 'unknown',
      message: error.msg,
      value: error.type === 'field' ? error.value : undefined
    }));

    ApplicationLogger.warn('Validation errors detected', {
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
}

// CSRF protection middleware
export function csrfProtection(req: Request, res: Response, next: NextFunction): void {
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
    return next();
  }

  const sessionId = req.sessionID;
  const token = req.headers['x-csrf-token'] as string || req.body._token;

  if (!token || !validateCSRFToken(sessionId, token)) {
    ApplicationLogger.warn('CSRF token validation failed', {
      ip: req.ip,
      sessionId,
      hasToken: !!token
    });
    
    return res.status(403).json({
      error: 'Invalid or missing CSRF token'
    });
  }

  next();
}

// File upload security
export function validateFileUpload(req: Request, res: Response, next: NextFunction): void {
  const allowedMimeTypes = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  const maxFileSize = 10 * 1024 * 1024; // 10MB

  if (req.file) {
    if (!allowedMimeTypes.includes(req.file.mimetype)) {
      return res.status(400).json({
        error: 'Invalid file type. Please upload PDF, image, or document files only.'
      });
    }

    if (req.file.size > maxFileSize) {
      return res.status(400).json({
        error: 'File size exceeds 10MB limit.'
      });
    }

    // Scan filename for suspicious content
    const filename = req.file.originalname;
    if (/[<>:"/\\|?*]/.test(filename) || filename.startsWith('.')) {
      return res.status(400).json({
        error: 'Invalid filename. Please rename your file and try again.'
      });
    }
  }

  next();
}

// IP whitelist/blacklist middleware
const blockedIPs = new Set<string>();
const allowedIPs = new Set<string>();

export function ipFilter(req: Request, res: Response, next: NextFunction): void {
  const clientIP = req.ip;

  if (blockedIPs.has(clientIP)) {
    ApplicationLogger.warn('Blocked IP attempted access', { ip: clientIP });
    return res.status(403).json({ error: 'Access denied' });
  }

  // If allowlist is configured and IP is not in it
  if (allowedIPs.size > 0 && !allowedIPs.has(clientIP)) {
    ApplicationLogger.warn('Non-whitelisted IP attempted access', { ip: clientIP });
    return res.status(403).json({ error: 'Access denied' });
  }

  next();
}

// Request logging middleware
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const startTime = Date.now();
  
  // Log request details
  ApplicationLogger.info('Incoming request', {
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    sessionId: req.sessionID,
    authenticated: req.isAuthenticated ? req.isAuthenticated() : false
  });

  // Log response when request completes
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logLevel = res.statusCode >= 400 ? 'warn' : 'info';
    
    ApplicationLogger[logLevel]('Request completed', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip
    });
  });

  next();
}

// Session security middleware
export function sessionSecurity(req: Request, res: Response, next: NextFunction): void {
  // Regenerate session ID periodically for authenticated users
  if (req.isAuthenticated && req.isAuthenticated()) {
    const lastRegeneration = req.session.lastRegeneration;
    const now = Date.now();
    
    // Regenerate every 30 minutes
    if (!lastRegeneration || now - lastRegeneration > 30 * 60 * 1000) {
      req.session.regenerate((err) => {
        if (err) {
          ApplicationLogger.error('Session regeneration failed', err);
          return next(err);
        }
        
        req.session.lastRegeneration = now;
        next();
      });
      return;
    }
  }

  next();
}

// Utility functions
export function addIPToBlocklist(ip: string): void {
  blockedIPs.add(ip);
  ApplicationLogger.info('IP added to blocklist', { ip });
}

export function removeIPFromBlocklist(ip: string): void {
  blockedIPs.delete(ip);
  ApplicationLogger.info('IP removed from blocklist', { ip });
}

export function addIPToAllowlist(ip: string): void {
  allowedIPs.add(ip);
  ApplicationLogger.info('IP added to allowlist', { ip });
}

export function removeIPFromAllowlist(ip: string): void {
  allowedIPs.delete(ip);
  ApplicationLogger.info('IP removed from allowlist', { ip });
}