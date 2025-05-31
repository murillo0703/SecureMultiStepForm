import { Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import DOMPurify from 'isomorphic-dompurify';
import { ZodSchema, ZodError } from 'zod';

// Input sanitization middleware
export function sanitizeInput(req: Request, res: Response, next: NextFunction) {
  // Sanitize all string inputs in body, query, and params
  const sanitizeObject = (obj: any): any => {
    if (typeof obj === 'string') {
      return DOMPurify.sanitize(obj.trim());
    }
    if (Array.isArray(obj)) {
      return obj.map(sanitizeObject);
    }
    if (obj && typeof obj === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = sanitizeObject(value);
      }
      return sanitized;
    }
    return obj;
  };

  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }
  if (req.params) {
    req.params = sanitizeObject(req.params);
  }

  next();
}

// Validation error handler
export function handleValidationErrors(req: Request, res: Response, next: NextFunction) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: errors.array().map(error => ({
        field: error.type === 'field' ? error.path : 'unknown',
        message: error.msg,
        value: error.type === 'field' ? error.value : undefined
      }))
    });
  }
  next();
}

// Zod schema validation middleware
export function validateSchema(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          message: 'Schema validation failed',
          errors: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
            code: err.code
          }))
        });
      }
      next(error);
    }
  };
}

// Common validation rules
export const validationRules = {
  email: body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Must be a valid email address'),
  
  phone: body('phone')
    .isMobilePhone('any')
    .withMessage('Must be a valid phone number'),
  
  name: body('name')
    .isLength({ min: 1, max: 100 })
    .trim()
    .escape()
    .withMessage('Name must be between 1 and 100 characters'),
  
  password: body('password')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must be at least 8 characters with uppercase, lowercase, number, and special character'),
  
  ssn: body('ssn')
    .matches(/^\d{3}-?\d{2}-?\d{4}$/)
    .withMessage('SSN must be in format XXX-XX-XXXX'),
  
  ein: body('taxId')
    .matches(/^\d{2}-?\d{7}$/)
    .withMessage('EIN must be in format XX-XXXXXXX'),
  
  zipCode: body('zip')
    .matches(/^\d{5}(-\d{4})?$/)
    .withMessage('ZIP code must be 5 or 9 digits'),
  
  state: body('state')
    .isLength({ min: 2, max: 2 })
    .isAlpha()
    .toUpperCase()
    .withMessage('State must be 2-letter abbreviation'),
  
  currency: body('monthlyCost')
    .isFloat({ min: 0 })
    .withMessage('Amount must be a positive number'),
  
  percentage: body('ownershipPercentage')
    .isFloat({ min: 0, max: 100 })
    .withMessage('Percentage must be between 0 and 100'),
  
  date: body('dob')
    .isISO8601()
    .toDate()
    .withMessage('Must be a valid date'),
  
  id: param('id')
    .isInt({ min: 1 })
    .withMessage('ID must be a positive integer'),
  
  uuid: param('id')
    .isUUID()
    .withMessage('ID must be a valid UUID'),
  
  // File upload validation
  fileType: (allowedTypes: string[]) => 
    body('file').custom((value, { req }) => {
      if (!req.file) {
        throw new Error('File is required');
      }
      if (!allowedTypes.includes(req.file.mimetype)) {
        throw new Error(`File type must be one of: ${allowedTypes.join(', ')}`);
      }
      return true;
    }),
  
  fileSize: (maxSize: number) =>
    body('file').custom((value, { req }) => {
      if (req.file && req.file.size > maxSize) {
        throw new Error(`File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB`);
      }
      return true;
    })
};

// Security headers middleware
export function securityHeaders(req: Request, res: Response, next: NextFunction) {
  // Prevent XSS attacks
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Remove server information
  res.removeHeader('X-Powered-By');
  
  next();
}

// Request logging for security monitoring
export function securityLogger(req: Request, res: Response, next: NextFunction) {
  const timestamp = new Date().toISOString();
  const ip = req.ip || req.connection.remoteAddress;
  const userAgent = req.get('User-Agent');
  
  // Log sensitive endpoint access
  if (req.path.includes('/admin') || req.path.includes('/api/user')) {
    console.log(`[SECURITY] ${timestamp} - ${req.method} ${req.path} from ${ip} - ${userAgent}`);
  }
  
  // Log failed authentication attempts
  res.on('finish', () => {
    if ((req.path.includes('/login') || req.path.includes('/register')) && res.statusCode === 401) {
      console.log(`[SECURITY] ${timestamp} - FAILED AUTH: ${req.method} ${req.path} from ${ip} - Status: ${res.statusCode}`);
    }
  });
  
  next();
}