/**
 * Code Quality Utilities
 * 
 * This module provides standardized utilities for maintaining code quality,
 * including logging, error handling, validation helpers, and performance monitoring.
 * 
 * @author Murillo Insurance Development Team
 * @version 1.0.0
 * @since 2025-01-01
 */

import { Request, Response, NextFunction } from 'express';
import { performance } from 'perf_hooks';

/**
 * Standardized application logger with different severity levels
 * Provides consistent logging format across the application
 */
export class ApplicationLogger {
  private static formatMessage(level: string, message: string, context?: Record<string, any>): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` | Context: ${JSON.stringify(context)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
  }

  /**
   * Log informational messages
   * @param message - The message to log
   * @param context - Additional context data
   */
  static info(message: string, context?: Record<string, any>): void {
    console.log(this.formatMessage('info', message, context));
  }

  /**
   * Log warning messages
   * @param message - The warning message
   * @param context - Additional context data
   */
  static warn(message: string, context?: Record<string, any>): void {
    console.warn(this.formatMessage('warn', message, context));
  }

  /**
   * Log error messages
   * @param message - The error message
   * @param error - The error object or additional context
   */
  static error(message: string, error?: Error | Record<string, any>): void {
    const context = error instanceof Error 
      ? { 
          name: error.name, 
          message: error.message, 
          stack: error.stack 
        }
      : error;
    console.error(this.formatMessage('error', message, context));
  }

  /**
   * Log debug messages (only in development)
   * @param message - The debug message
   * @param context - Additional context data
   */
  static debug(message: string, context?: Record<string, any>): void {
    if (process.env.NODE_ENV === 'development') {
      console.debug(this.formatMessage('debug', message, context));
    }
  }

  /**
   * Log performance metrics
   * @param operation - The operation name
   * @param duration - Duration in milliseconds
   * @param context - Additional context data
   */
  static performance(operation: string, duration: number, context?: Record<string, any>): void {
    const perfContext = { ...context, duration: `${duration.toFixed(2)}ms` };
    this.info(`Performance: ${operation}`, perfContext);
  }
}

/**
 * Standardized error handling utilities
 * Provides consistent error responses and logging
 */
export class ErrorHandler {
  /**
   * Handle and format API errors consistently
   * @param error - The error to handle
   * @param req - Express request object
   * @param res - Express response object
   * @param operation - The operation that failed
   */
  static handleApiError(
    error: Error | unknown,
    req: Request,
    res: Response,
    operation: string
  ): void {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const statusCode = this.getHttpStatusCode(error);

    // Log the error with context
    ApplicationLogger.error(`API Error in ${operation}`, {
      error: errorMessage,
      path: req.path,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      stack: error instanceof Error ? error.stack : undefined
    });

    // Send appropriate response
    res.status(statusCode).json({
      success: false,
      error: this.getPublicErrorMessage(error, statusCode),
      operation,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Determine appropriate HTTP status code from error
   * @param error - The error to analyze
   * @returns HTTP status code
   */
  private static getHttpStatusCode(error: Error | unknown): number {
    if (error instanceof Error) {
      // Check for specific error types and return appropriate status codes
      if (error.message.includes('not found') || error.message.includes('does not exist')) {
        return 404;
      }
      if (error.message.includes('unauthorized') || error.message.includes('authentication')) {
        return 401;
      }
      if (error.message.includes('forbidden') || error.message.includes('permission')) {
        return 403;
      }
      if (error.message.includes('validation') || error.message.includes('invalid')) {
        return 400;
      }
      if (error.message.includes('conflict') || error.message.includes('already exists')) {
        return 409;
      }
    }
    return 500; // Internal server error by default
  }

  /**
   * Get user-friendly error message (hide sensitive information)
   * @param error - The error to format
   * @param statusCode - HTTP status code
   * @returns Public-safe error message
   */
  private static getPublicErrorMessage(error: Error | unknown, statusCode: number): string {
    // In production, don't expose internal error details
    if (process.env.NODE_ENV === 'production' && statusCode === 500) {
      return 'An internal error occurred. Please try again later.';
    }

    return error instanceof Error ? error.message : 'An unexpected error occurred';
  }

  /**
   * Create a standardized API error response middleware
   * @param operation - The operation name for context
   * @returns Express middleware function
   */
  static createErrorMiddleware(operation: string) {
    return (error: Error, req: Request, res: Response, next: NextFunction): void => {
      this.handleApiError(error, req, res, operation);
    };
  }
}

/**
 * Performance monitoring utilities
 * Track and measure application performance
 */
export class PerformanceMonitor {
  private static readonly performanceMap = new Map<string, number>();

  /**
   * Start timing an operation
   * @param operationId - Unique identifier for the operation
   */
  static startTimer(operationId: string): void {
    this.performanceMap.set(operationId, performance.now());
  }

  /**
   * End timing and log performance
   * @param operationId - The operation identifier
   * @param operationName - Human-readable operation name
   * @param context - Additional context data
   */
  static endTimer(
    operationId: string, 
    operationName: string, 
    context?: Record<string, any>
  ): number {
    const startTime = this.performanceMap.get(operationId);
    if (!startTime) {
      ApplicationLogger.warn(`Performance timer not found for operation: ${operationId}`);
      return 0;
    }

    const duration = performance.now() - startTime;
    this.performanceMap.delete(operationId);

    ApplicationLogger.performance(operationName, duration, context);
    return duration;
  }

  /**
   * Measure the execution time of an async function
   * @param operationName - Name of the operation
   * @param fn - The function to measure
   * @param context - Additional context for logging
   * @returns The result of the function execution
   */
  static async measureAsync<T>(
    operationName: string,
    fn: () => Promise<T>,
    context?: Record<string, any>
  ): Promise<T> {
    const operationId = `${operationName}-${Date.now()}-${Math.random()}`;
    
    this.startTimer(operationId);
    try {
      const result = await fn();
      this.endTimer(operationId, operationName, { ...context, success: true });
      return result;
    } catch (error) {
      this.endTimer(operationId, operationName, { ...context, success: false, error: true });
      throw error;
    }
  }

  /**
   * Create middleware to measure request processing time
   * @param operationName - Name for the operation being measured
   * @returns Express middleware function
   */
  static createRequestTimingMiddleware(operationName?: string) {
    return (req: Request, res: Response, next: NextFunction): void => {
      const operation = operationName || `${req.method} ${req.path}`;
      const operationId = `request-${Date.now()}-${Math.random()}`;
      
      this.startTimer(operationId);
      
      // Measure when response finishes
      res.on('finish', () => {
        this.endTimer(operationId, operation, {
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
          ip: req.ip
        });
      });

      next();
    };
  }
}

/**
 * Data validation and sanitization utilities
 * Provides reusable validation functions
 */
export class ValidationUtils {
  /**
   * Validate that a value is not null or undefined
   * @param value - The value to check
   * @param fieldName - Name of the field for error messages
   * @throws Error if value is null or undefined
   */
  static requireNonNull<T>(value: T | null | undefined, fieldName: string): T {
    if (value === null || value === undefined) {
      throw new Error(`${fieldName} is required and cannot be null or undefined`);
    }
    return value;
  }

  /**
   * Validate string is not empty after trimming
   * @param value - The string to validate
   * @param fieldName - Name of the field for error messages
   * @returns Trimmed string
   * @throws Error if string is empty or whitespace
   */
  static requireNonEmptyString(value: string, fieldName: string): string {
    const trimmed = value.trim();
    if (trimmed.length === 0) {
      throw new Error(`${fieldName} cannot be empty or contain only whitespace`);
    }
    return trimmed;
  }

  /**
   * Validate numeric range
   * @param value - The number to validate
   * @param min - Minimum allowed value (inclusive)
   * @param max - Maximum allowed value (inclusive)
   * @param fieldName - Name of the field for error messages
   * @returns The validated number
   * @throws Error if number is outside range
   */
  static validateRange(value: number, min: number, max: number, fieldName: string): number {
    if (value < min || value > max) {
      throw new Error(`${fieldName} must be between ${min} and ${max}, got ${value}`);
    }
    return value;
  }

  /**
   * Validate email format
   * @param email - Email address to validate
   * @returns Normalized email address
   * @throws Error if email format is invalid
   */
  static validateEmail(email: string): string {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const normalizedEmail = email.toLowerCase().trim();
    
    if (!emailRegex.test(normalizedEmail)) {
      throw new Error('Invalid email address format');
    }
    
    return normalizedEmail;
  }

  /**
   * Validate phone number format
   * @param phone - Phone number to validate
   * @returns Formatted phone number
   * @throws Error if phone format is invalid
   */
  static validatePhoneNumber(phone: string): string {
    // Remove all non-digit characters
    const digitsOnly = phone.replace(/\D/g, '');
    
    // Check if it's a valid length (10-15 digits)
    if (digitsOnly.length < 10 || digitsOnly.length > 15) {
      throw new Error('Phone number must be between 10 and 15 digits');
    }
    
    return digitsOnly;
  }

  /**
   * Validate and format SSN
   * @param ssn - Social Security Number to validate
   * @returns Formatted SSN (XXX-XX-XXXX)
   * @throws Error if SSN format is invalid
   */
  static validateSSN(ssn: string): string {
    const digitsOnly = ssn.replace(/\D/g, '');
    
    if (digitsOnly.length !== 9) {
      throw new Error('SSN must be exactly 9 digits');
    }
    
    // Format as XXX-XX-XXXX
    return `${digitsOnly.slice(0, 3)}-${digitsOnly.slice(3, 5)}-${digitsOnly.slice(5)}`;
  }

  /**
   * Validate pagination parameters
   * @param page - Page number (1-based)
   * @param limit - Items per page
   * @returns Validated pagination object
   */
  static validatePagination(page?: number, limit?: number): { page: number; limit: number; offset: number } {
    const validatedPage = Math.max(1, page || 1);
    const validatedLimit = Math.min(100, Math.max(1, limit || 10));
    const offset = (validatedPage - 1) * validatedLimit;
    
    return {
      page: validatedPage,
      limit: validatedLimit,
      offset
    };
  }
}

/**
 * HTTP response utilities for consistent API responses
 */
export class ResponseUtils {
  /**
   * Send a successful response with data
   * @param res - Express response object
   * @param data - Data to send
   * @param message - Optional success message
   * @param statusCode - HTTP status code (default: 200)
   */
  static success<T>(
    res: Response,
    data: T,
    message: string = 'Operation completed successfully',
    statusCode: number = 200
  ): void {
    res.status(statusCode).json({
      success: true,
      message,
      data,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Send a paginated response
   * @param res - Express response object
   * @param data - Array of data items
   * @param pagination - Pagination information
   * @param totalCount - Total number of items
   */
  static paginated<T>(
    res: Response,
    data: T[],
    pagination: { page: number; limit: number },
    totalCount: number
  ): void {
    const totalPages = Math.ceil(totalCount / pagination.limit);
    
    res.status(200).json({
      success: true,
      data,
      pagination: {
        currentPage: pagination.page,
        totalPages,
        itemsPerPage: pagination.limit,
        totalItems: totalCount,
        hasNextPage: pagination.page < totalPages,
        hasPreviousPage: pagination.page > 1
      },
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Send an error response
   * @param res - Express response object
   * @param message - Error message
   * @param statusCode - HTTP status code
   * @param details - Additional error details
   */
  static error(
    res: Response,
    message: string,
    statusCode: number = 500,
    details?: Record<string, any>
  ): void {
    res.status(statusCode).json({
      success: false,
      error: message,
      details,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Send a validation error response
   * @param res - Express response object
   * @param errors - Array of validation errors
   */
  static validationError(
    res: Response,
    errors: Array<{ field: string; message: string; value?: any }>
  ): void {
    res.status(400).json({
      success: false,
      error: 'Validation failed',
      validationErrors: errors,
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Environment configuration utilities
 * Centralized environment variable management
 */
export class ConfigManager {
  /**
   * Get required environment variable
   * @param key - Environment variable key
   * @param defaultValue - Optional default value
   * @returns Environment variable value
   * @throws Error if required variable is missing
   */
  static getRequiredEnv(key: string, defaultValue?: string): string {
    const value = process.env[key] || defaultValue;
    if (!value) {
      throw new Error(`Required environment variable ${key} is not set`);
    }
    return value;
  }

  /**
   * Get optional environment variable
   * @param key - Environment variable key
   * @param defaultValue - Default value if not set
   * @returns Environment variable value or default
   */
  static getOptionalEnv(key: string, defaultValue: string = ''): string {
    return process.env[key] || defaultValue;
  }

  /**
   * Get boolean environment variable
   * @param key - Environment variable key
   * @param defaultValue - Default boolean value
   * @returns Boolean value
   */
  static getBooleanEnv(key: string, defaultValue: boolean = false): boolean {
    const value = process.env[key];
    if (!value) return defaultValue;
    return ['true', '1', 'yes', 'on'].includes(value.toLowerCase());
  }

  /**
   * Get numeric environment variable
   * @param key - Environment variable key
   * @param defaultValue - Default numeric value
   * @returns Numeric value
   */
  static getNumericEnv(key: string, defaultValue: number = 0): number {
    const value = process.env[key];
    if (!value) return defaultValue;
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? defaultValue : parsed;
  }

  /**
   * Validate that all required environment variables are set
   * @param requiredVars - Array of required variable names
   * @throws Error if any required variables are missing
   */
  static validateRequiredEnvVars(requiredVars: string[]): void {
    const missing = requiredVars.filter(key => !process.env[key]);
    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
  }
}

/**
 * String formatting utilities
 * Consistent string manipulation across the application
 */
export class StringUtils {
  /**
   * Convert string to title case
   * @param str - String to convert
   * @returns Title case string
   */
  static toTitleCase(str: string): string {
    return str.replace(/\w\S*/g, (txt) => 
      txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    );
  }

  /**
   * Truncate string to specified length
   * @param str - String to truncate
   * @param maxLength - Maximum length
   * @param suffix - Suffix to add if truncated (default: '...')
   * @returns Truncated string
   */
  static truncate(str: string, maxLength: number, suffix: string = '...'): string {
    if (str.length <= maxLength) return str;
    return str.slice(0, maxLength - suffix.length) + suffix;
  }

  /**
   * Generate a random string of specified length
   * @param length - Length of random string
   * @param charset - Character set to use
   * @returns Random string
   */
  static generateRandomString(
    length: number, 
    charset: string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  ): string {
    let result = '';
    for (let i = 0; i < length; i++) {
      result += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return result;
  }
}