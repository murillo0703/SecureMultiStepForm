// Centralized error handling utilities for consistent error management

export interface AppError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
}

export class ErrorHandler {
  // Enhanced error logging with structured format
  static logError(error: unknown, context?: string): void {
    const timestamp = new Date().toISOString();
    const err = error as any;
    const errorInfo = {
      timestamp,
      context: context || 'Unknown',
      message: err?.message || 'Unknown error',
      stack: err?.stack,
      ...(err?.code && { code: err.code }),
      ...(err?.status && { status: err.status }),
    };
    
    console.error('[ERROR]', JSON.stringify(errorInfo, null, 2));
  }

  // Standardized async error wrapper with proper try-catch
  static async handleAsync<T>(
    operation: () => Promise<T>,
    context: string,
    onError?: (error: any) => void
  ): Promise<{ success: boolean; data?: T; error?: AppError }> {
    try {
      const data = await operation();
      return { success: true, data };
    } catch (error) {
      this.logError(error, context);
      const err = error as any;
      
      const appError: AppError = {
        code: err?.code || 'UNKNOWN_ERROR',
        message: err?.message || 'An unexpected error occurred',
        details: err?.details,
        timestamp: new Date(),
      };

      if (onError) {
        onError(appError);
      }

      return { success: false, error: appError };
    }
  }

  // API error response formatter
  static formatApiError(error: any): { status: number; message: string; code?: string } {
    if (error.code === 'VALIDATION_ERROR') {
      return { status: 400, message: error.message, code: error.code };
    }
    if (error.code === 'NOT_FOUND') {
      return { status: 404, message: error.message, code: error.code };
    }
    if (error.code === 'UNAUTHORIZED') {
      return { status: 401, message: error.message, code: error.code };
    }
    if (error.code === 'FORBIDDEN') {
      return { status: 403, message: error.message, code: error.code };
    }
    
    return { 
      status: error.status || 500, 
      message: error.message || 'Internal server error',
      code: error.code 
    };
  }

  // Client-side error display utilities
  static displayUserError(error: AppError | string, showToast?: (message: string, type: 'error' | 'warning') => void): void {
    const message = typeof error === 'string' ? error : error.message;
    
    if (showToast) {
      showToast(message, 'error');
    } else {
      console.error('User Error:', message);
    }
  }

  // Form validation error formatter
  static formatValidationErrors(errors: Record<string, string>): string[] {
    return Object.entries(errors).map(([field, message]) => `${field}: ${message}`);
  }
}

// Network error handling utilities
export class NetworkErrorHandler {
  static async handleNetworkRequest<T>(
    request: () => Promise<Response>,
    context: string
  ): Promise<{ success: boolean; data?: T; error?: AppError }> {
    try {
      const response = await request();
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      return ErrorHandler.handleAsync(async () => {
        throw error;
      }, context);
    }
  }

  static isNetworkError(error: any): boolean {
    return error.name === 'TypeError' && error.message.includes('fetch');
  }

  static isTimeoutError(error: any): boolean {
    return error.name === 'AbortError' || error.message.includes('timeout');
  }
}

// Form submission error handling
export class FormErrorHandler {
  static handleSubmissionError(
    error: any,
    setFieldErrors: (errors: Record<string, string>) => void,
    showToast: (message: string, type: 'error') => void
  ): void {
    if (error.details && typeof error.details === 'object') {
      // Validation errors from server
      setFieldErrors(error.details);
    } else {
      // General submission error
      showToast(error.message || 'Failed to submit form. Please try again.', 'error');
    }
  }

  static clearFieldErrors(setFieldErrors: (errors: Record<string, string>) => void): void {
    setFieldErrors({});
  }
}

// Development vs Production error handling
export const isDevelopment = process.env.NODE_ENV === 'development';

export function devLog(message: string, data?: any): void {
  if (isDevelopment) {
    console.log(`[DEV] ${message}`, data || '');
  }
}