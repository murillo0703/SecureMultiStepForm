import express from 'express';
import { 
  securityHeaders, 
  sanitizeInput, 
  authRateLimit, 
  apiRateLimit,
  validationRules,
  handleValidationErrors 
} from './security-middleware';
import { ApplicationLogger, ErrorHandler, PerformanceMonitor } from './code-quality-utilities';
import { PasswordSecurity } from './enhanced-storage';

/**
 * Security demonstration module
 * Shows the enhanced security features in action
 */

// Simulate user storage for demonstration
const demoUsers = new Map();
let userIdCounter = 1;

/**
 * Create demo routes with enhanced security
 */
export function createSecurityDemo(app: express.Application) {
  // Apply security middleware globally
  app.use(securityHeaders);
  app.use(sanitizeInput);
  app.use(apiRateLimit);

  // Demo: Secure user registration with validation
  app.post('/demo/register', 
    authRateLimit,
    validationRules.userRegistration,
    handleValidationErrors,
    PerformanceMonitor.createRequestTimingMiddleware('User Registration'),
    async (req, res) => {
      try {
        const { username, email, password, name } = req.body;

        ApplicationLogger.info('Registration attempt', { 
          username, 
          email,
          ip: req.ip 
        });

        // Check if user already exists
        for (const [id, user] of demoUsers) {
          if (user.username === username || user.email === email) {
            ApplicationLogger.warn('Registration failed - user exists', { username, email });
            return res.status(409).json({
              success: false,
              error: 'User with this username or email already exists'
            });
          }
        }

        // Hash password securely
        const hashedPassword = await PasswordSecurity.hashPassword(password);

        // Create user
        const newUser = {
          id: userIdCounter++,
          username,
          email,
          name,
          password: hashedPassword,
          createdAt: new Date(),
          role: 'user'
        };

        demoUsers.set(newUser.id, newUser);

        ApplicationLogger.info('User registered successfully', { 
          userId: newUser.id, 
          username 
        });

        // Return user without password
        const { password: _, ...userResponse } = newUser;
        res.status(201).json({
          success: true,
          message: 'User registered successfully',
          data: userResponse
        });

      } catch (error) {
        ErrorHandler.handleApiError(error, req, res, 'User Registration');
      }
    }
  );

  // Demo: Secure login with enhanced validation
  app.post('/demo/login',
    authRateLimit,
    validationRules.userLogin,
    handleValidationErrors,
    PerformanceMonitor.createRequestTimingMiddleware('User Login'),
    async (req, res) => {
      try {
        const { username, password } = req.body;

        ApplicationLogger.info('Login attempt', { 
          username, 
          ip: req.ip 
        });

        // Find user
        let targetUser = null;
        for (const [id, user] of demoUsers) {
          if (user.username === username) {
            targetUser = user;
            break;
          }
        }

        if (!targetUser) {
          // Perform dummy password verification to prevent timing attacks
          await PasswordSecurity.verifyPassword(password, 'dummy:hash');
          ApplicationLogger.warn('Login failed - user not found', { username });
          return res.status(401).json({
            success: false,
            error: 'Invalid username or password'
          });
        }

        // Verify password
        const isValidPassword = await PasswordSecurity.verifyPassword(
          password, 
          targetUser.password
        );

        if (!isValidPassword) {
          ApplicationLogger.warn('Login failed - invalid password', { 
            username,
            userId: targetUser.id 
          });
          return res.status(401).json({
            success: false,
            error: 'Invalid username or password'
          });
        }

        ApplicationLogger.info('Login successful', { 
          userId: targetUser.id, 
          username 
        });

        // Return user without password
        const { password: _, ...userResponse } = targetUser;
        res.status(200).json({
          success: true,
          message: 'Login successful',
          data: userResponse
        });

      } catch (error) {
        ErrorHandler.handleApiError(error, req, res, 'User Login');
      }
    }
  );

  // Demo: Input sanitization test
  app.post('/demo/sanitization-test',
    apiRateLimit,
    (req, res) => {
      ApplicationLogger.info('Sanitization test', { 
        originalBody: JSON.stringify(req.body),
        ip: req.ip 
      });

      res.json({
        success: true,
        message: 'Input has been sanitized',
        sanitizedData: req.body,
        note: 'Any HTML/script tags have been removed for security'
      });
    }
  );

  // Demo: Performance monitoring test
  app.get('/demo/performance-test',
    PerformanceMonitor.createRequestTimingMiddleware('Performance Test'),
    async (req, res) => {
      // Simulate some processing time
      await new Promise(resolve => setTimeout(resolve, Math.random() * 100));

      const users = Array.from(demoUsers.values()).map(user => {
        const { password, ...safeUser } = user;
        return safeUser;
      });

      res.json({
        success: true,
        message: 'Performance test completed',
        data: {
          totalUsers: users.length,
          users: users
        }
      });
    }
  );

  // Demo: Error handling test
  app.get('/demo/error-test', (req, res) => {
    const errorType = req.query.type as string || 'generic';
    
    switch (errorType) {
      case 'validation':
        throw new Error('validation failed - test error');
      case 'unauthorized':
        throw new Error('unauthorized access attempt');
      case 'not-found':
        throw new Error('resource not found');
      default:
        throw new Error('Generic test error for demonstration');
    }
  });

  // Demo: Security headers test
  app.get('/demo/security-headers', (req, res) => {
    res.json({
      success: true,
      message: 'Security headers are active',
      headers: {
        'Content-Security-Policy': 'Check response headers',
        'X-Frame-Options': 'Check response headers',
        'X-Content-Type-Options': 'Check response headers',
        'Referrer-Policy': 'Check response headers'
      }
    });
  });

  ApplicationLogger.info('Security demonstration routes created');
}

/**
 * Get demo statistics
 */
export function getDemoStats() {
  return {
    totalUsers: demoUsers.size,
    users: Array.from(demoUsers.values()).map(user => ({
      id: user.id,
      username: user.username,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
      role: user.role
    }))
  };
}