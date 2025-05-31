import { useState, useCallback, useMemo } from 'react';
import { z } from 'zod';

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  email?: boolean;
  phone?: boolean;
  ssn?: boolean;
  ein?: boolean;
  zipCode?: boolean;
  custom?: (value: any) => string | null;
}

export interface FieldConfig {
  rules?: ValidationRule;
  dependsOn?: string[];
  transform?: (value: string) => string;
}

export interface FormConfig {
  [fieldName: string]: FieldConfig;
}

export function useFormValidation<T extends Record<string, any>>(
  initialValues: T,
  config: FormConfig = {}
) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});
  const [isValidating, setIsValidating] = useState(false);

  // Validation patterns
  const patterns = {
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    phone: /^[\+]?[1-9][\d]{0,15}$/,
    ssn: /^\d{3}-?\d{2}-?\d{4}$/,
    ein: /^\d{2}-?\d{7}$/,
    zipCode: /^\d{5}(-\d{4})?$/,
  };

  const validateField = useCallback((name: keyof T, value: any): string | null => {
    const fieldConfig = config[name as string];
    if (!fieldConfig?.rules) return null;

    const rules = fieldConfig.rules;
    const stringValue = String(value || '');

    // Required validation
    if (rules.required && (!value || stringValue.trim() === '')) {
      return 'This field is required';
    }

    // Skip other validations if field is empty and not required
    if (!value || stringValue.trim() === '') {
      return null;
    }

    // Length validations
    if (rules.minLength && stringValue.length < rules.minLength) {
      return `Must be at least ${rules.minLength} characters`;
    }

    if (rules.maxLength && stringValue.length > rules.maxLength) {
      return `Must be no more than ${rules.maxLength} characters`;
    }

    // Pattern validations
    if (rules.email && !patterns.email.test(stringValue)) {
      return 'Please enter a valid email address';
    }

    if (rules.phone && !patterns.phone.test(stringValue.replace(/[\s\-\(\)]/g, ''))) {
      return 'Please enter a valid phone number';
    }

    if (rules.ssn && !patterns.ssn.test(stringValue)) {
      return 'Please enter a valid SSN (XXX-XX-XXXX)';
    }

    if (rules.ein && !patterns.ein.test(stringValue)) {
      return 'Please enter a valid EIN (XX-XXXXXXX)';
    }

    if (rules.zipCode && !patterns.zipCode.test(stringValue)) {
      return 'Please enter a valid ZIP code';
    }

    if (rules.pattern && !rules.pattern.test(stringValue)) {
      return 'Please enter a valid format';
    }

    // Custom validation
    if (rules.custom) {
      return rules.custom(value);
    }

    return null;
  }, [config]);

  const validateAllFields = useCallback((): boolean => {
    const newErrors: Partial<Record<keyof T, string>> = {};
    let hasErrors = false;

    Object.keys(values).forEach((key) => {
      const error = validateField(key as keyof T, values[key as keyof T]);
      if (error) {
        newErrors[key as keyof T] = error;
        hasErrors = true;
      }
    });

    setErrors(newErrors);
    return !hasErrors;
  }, [values, validateField]);

  const setValue = useCallback((name: keyof T, value: any) => {
    const fieldConfig = config[name as string];
    
    // Apply transformation if defined
    const transformedValue = fieldConfig?.transform 
      ? fieldConfig.transform(String(value))
      : value;

    setValues(prev => ({ ...prev, [name]: transformedValue }));

    // Validate immediately if field has been touched
    if (touched[name]) {
      const error = validateField(name, transformedValue);
      setErrors(prev => ({ ...prev, [name]: error || undefined }));
    }

    // Validate dependent fields
    if (fieldConfig?.dependsOn) {
      fieldConfig.dependsOn.forEach(depField => {
        if (touched[depField as keyof T]) {
          const depError = validateField(depField as keyof T, values[depField as keyof T]);
          setErrors(prev => ({ ...prev, [depField]: depError || undefined }));
        }
      });
    }
  }, [config, touched, validateField, values]);

  const setFieldTouched = useCallback((name: keyof T, isTouched: boolean = true) => {
    setTouched(prev => ({ ...prev, [name]: isTouched }));
    
    if (isTouched) {
      const error = validateField(name, values[name]);
      setErrors(prev => ({ ...prev, [name]: error || undefined }));
    }
  }, [validateField, values]);

  const handleSubmit = useCallback(async (onSubmit: (values: T) => Promise<void> | void) => {
    setIsValidating(true);
    
    // Mark all fields as touched
    const allTouched = Object.keys(values).reduce((acc, key) => {
      acc[key as keyof T] = true;
      return acc;
    }, {} as Partial<Record<keyof T, boolean>>);
    setTouched(allTouched);

    const isValid = validateAllFields();
    
    if (isValid) {
      try {
        await onSubmit(values);
      } catch (error) {
        console.error('Form submission error:', error);
      }
    }
    
    setIsValidating(false);
  }, [values, validateAllFields]);

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsValidating(false);
  }, [initialValues]);

  const isValid = useMemo(() => {
    return Object.keys(errors).every(key => !errors[key as keyof T]);
  }, [errors]);

  const isDirty = useMemo(() => {
    return Object.keys(values).some(key => 
      values[key as keyof T] !== initialValues[key as keyof T]
    );
  }, [values, initialValues]);

  return {
    values,
    errors,
    touched,
    isValidating,
    isValid,
    isDirty,
    setValue,
    setTouched: setFieldTouched,
    validateField,
    validateAllFields,
    handleSubmit,
    reset,
  };
}

// Pre-configured validation schemas for common form types
export const commonValidations = {
  email: {
    rules: {
      required: true,
      email: true,
      maxLength: 255,
    }
  },
  password: {
    rules: {
      required: true,
      minLength: 8,
      custom: (value: string) => {
        if (!/(?=.*[a-z])/.test(value)) return 'Must contain at least one lowercase letter';
        if (!/(?=.*[A-Z])/.test(value)) return 'Must contain at least one uppercase letter';
        if (!/(?=.*\d)/.test(value)) return 'Must contain at least one number';
        if (!/(?=.*[@$!%*?&])/.test(value)) return 'Must contain at least one special character';
        return null;
      }
    }
  },
  confirmPassword: {
    rules: {
      required: true,
      custom: (value: string, allValues: any) => {
        if (value !== allValues.password) return 'Passwords do not match';
        return null;
      }
    },
    dependsOn: ['password']
  },
  phone: {
    rules: {
      phone: true,
    },
    transform: (value: string) => value.replace(/[^\d\+\-\(\)\s]/g, '')
  },
  ssn: {
    rules: {
      ssn: true,
    },
    transform: (value: string) => {
      const digits = value.replace(/\D/g, '');
      if (digits.length >= 6) {
        return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5, 9)}`;
      } else if (digits.length >= 3) {
        return `${digits.slice(0, 3)}-${digits.slice(3)}`;
      }
      return digits;
    }
  },
  ein: {
    rules: {
      ein: true,
    },
    transform: (value: string) => {
      const digits = value.replace(/\D/g, '');
      if (digits.length >= 2) {
        return `${digits.slice(0, 2)}-${digits.slice(2, 9)}`;
      }
      return digits;
    }
  },
  zipCode: {
    rules: {
      zipCode: true,
    },
    transform: (value: string) => {
      const digits = value.replace(/\D/g, '');
      if (digits.length > 5) {
        return `${digits.slice(0, 5)}-${digits.slice(5, 9)}`;
      }
      return digits;
    }
  },
  currency: {
    rules: {
      pattern: /^\d+(\.\d{1,2})?$/,
      custom: (value: string) => {
        const num = parseFloat(value);
        if (isNaN(num) || num < 0) return 'Must be a valid positive number';
        return null;
      }
    },
    transform: (value: string) => {
      const cleaned = value.replace(/[^\d.]/g, '');
      const parts = cleaned.split('.');
      if (parts.length > 2) {
        return `${parts[0]}.${parts[1]}`;
      }
      if (parts.length === 2 && parts[1].length > 2) {
        return `${parts[0]}.${parts[1].slice(0, 2)}`;
      }
      return cleaned;
    }
  },
  percentage: {
    rules: {
      custom: (value: string) => {
        const num = parseFloat(value);
        if (isNaN(num) || num < 0 || num > 100) return 'Must be between 0 and 100';
        return null;
      }
    }
  },
  required: {
    rules: {
      required: true,
    }
  },
  name: {
    rules: {
      required: true,
      minLength: 2,
      maxLength: 50,
      pattern: /^[a-zA-Z\s\-'\.]+$/,
    }
  },
  company: {
    rules: {
      required: true,
      minLength: 2,
      maxLength: 100,
    }
  },
  address: {
    rules: {
      required: true,
      minLength: 5,
      maxLength: 200,
    }
  },
  city: {
    rules: {
      required: true,
      minLength: 2,
      maxLength: 50,
      pattern: /^[a-zA-Z\s\-'\.]+$/,
    }
  },
  state: {
    rules: {
      required: true,
      pattern: /^[A-Z]{2}$/,
    },
    transform: (value: string) => value.toUpperCase()
  }
};