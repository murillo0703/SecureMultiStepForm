// Shared validation schemas for consistent field validation across the app
export const validationSchemas = {
  // Personal Information
  personalInfo: {
    firstName: (value: string) => ({
      isValid: value && value.length >= 2,
      error: !value ? 'First name is required' : value.length < 2 ? 'Must be at least 2 characters' : ''
    }),
    lastName: (value: string) => ({
      isValid: value && value.length >= 2,
      error: !value ? 'Last name is required' : value.length < 2 ? 'Must be at least 2 characters' : ''
    }),
    email: (value: string) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return {
        isValid: value && emailRegex.test(value),
        error: !value ? 'Email is required' : !emailRegex.test(value) ? 'Invalid email format' : ''
      };
    },
    phone: (value: string) => {
      const phoneRegex = /^\(\d{3}\) \d{3}-\d{4}$/;
      return {
        isValid: value && phoneRegex.test(value),
        error: !value ? 'Phone is required' : !phoneRegex.test(value) ? 'Phone must be in format (555) 123-4567' : ''
      };
    },
  },

  // Company Information
  companyInfo: {
    companyName: (value: string) => ({
      isValid: value && value.length >= 2,
      error: !value ? 'Company name is required' : value.length < 2 ? 'Must be at least 2 characters' : ''
    }),
    taxId: (value: string) => {
      const taxIdRegex = /^\d{2}-\d{7}$/;
      return {
        isValid: value && taxIdRegex.test(value),
        error: !value ? 'Tax ID is required' : !taxIdRegex.test(value) ? 'Tax ID must be in format XX-XXXXXXX' : ''
      };
    },
    industry: (value: string) => ({
      isValid: !!value,
      error: !value ? 'Industry is required' : ''
    }),
    address: (value: string) => ({
      isValid: !!value,
      error: !value ? 'Address is required' : ''
    }),
    city: (value: string) => ({
      isValid: !!value,
      error: !value ? 'City is required' : ''
    }),
    state: (value: string) => ({
      isValid: value && value.length === 2,
      error: !value ? 'State is required' : value.length !== 2 ? 'State must be 2 characters' : ''
    }),
    zip: (value: string) => {
      const zipRegex = /^\d{5}(-\d{4})?$/;
      return {
        isValid: value && zipRegex.test(value),
        error: !value ? 'ZIP code is required' : !zipRegex.test(value) ? 'ZIP code must be 5 or 9 digits' : ''
      };
    },
    employeeCount: (value: string | number) => {
      const num = typeof value === 'string' ? parseInt(value) : value;
      return {
        isValid: !isNaN(num) && num > 0,
        error: !value ? 'Employee count is required' : isNaN(num) || num <= 0 ? 'Must be a positive number' : ''
      };
    },
  },

  // Employee Information
  employeeInfo: {
    firstName: (value: string) => ({
      isValid: value && value.length >= 2,
      error: !value ? 'First name is required' : value.length < 2 ? 'Must be at least 2 characters' : ''
    }),
    lastName: (value: string) => ({
      isValid: value && value.length >= 2,
      error: !value ? 'Last name is required' : value.length < 2 ? 'Must be at least 2 characters' : ''
    }),
    email: (value: string) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return {
        isValid: value && emailRegex.test(value),
        error: !value ? 'Email is required' : !emailRegex.test(value) ? 'Invalid email format' : ''
      };
    },
    ssn: (value: string) => {
      const ssnRegex = /^\d{3}-\d{2}-\d{4}$/;
      return {
        isValid: value && ssnRegex.test(value),
        error: !value ? 'SSN is required' : !ssnRegex.test(value) ? 'SSN must be in format XXX-XX-XXXX' : ''
      };
    },
    dob: (value: string) => {
      const date = new Date(value);
      const today = new Date();
      return {
        isValid: value && !isNaN(date.getTime()) && date <= today,
        error: !value ? 'Date of birth is required' : isNaN(date.getTime()) ? 'Invalid date' : date > today ? 'Date of birth cannot be in the future' : ''
      };
    },
  },

  // Owner Information
  ownerInfo: {
    firstName: (value: string) => ({
      isValid: value && value.length >= 2,
      error: !value ? 'First name is required' : value.length < 2 ? 'Must be at least 2 characters' : ''
    }),
    lastName: (value: string) => ({
      isValid: value && value.length >= 2,
      error: !value ? 'Last name is required' : value.length < 2 ? 'Must be at least 2 characters' : ''
    }),
    ownershipPercentage: (value: string | number) => {
      const num = typeof value === 'string' ? parseFloat(value) : value;
      return {
        isValid: !isNaN(num) && num >= 0 && num <= 100,
        error: !value ? 'Ownership percentage is required' : isNaN(num) ? 'Must be a number' : num < 0 ? 'Cannot be negative' : num > 100 ? 'Cannot exceed 100%' : ''
      };
    },
    relationshipToCompany: (value: string) => ({
      isValid: !!value,
      error: !value ? 'Relationship to company is required' : ''
    }),
  },

  // Authentication
  auth: {
    username: (value: string) => ({
      isValid: value && value.length >= 3,
      error: !value ? 'Username is required' : value.length < 3 ? 'Must be at least 3 characters' : ''
    }),
    password: (value: string) => ({
      isValid: value && value.length >= 8,
      error: !value ? 'Password is required' : value.length < 8 ? 'Must be at least 8 characters' : ''
    }),
    email: (value: string) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return {
        isValid: value && emailRegex.test(value),
        error: !value ? 'Email is required' : !emailRegex.test(value) ? 'Invalid email format' : ''
      };
    },
  },
};

// Utility function to validate form data against a schema
export const validateFormData = (data: any, schemaName: keyof typeof validationSchemas) => {
  const schema = validationSchemas[schemaName];
  const errors: Record<string, string> = {};
  let isValid = true;

  Object.keys(schema).forEach((fieldName) => {
    const validator = (schema as any)[fieldName];
    const fieldValue = data[fieldName];
    const result = validator(fieldValue);
    
    if (!result.isValid) {
      errors[fieldName] = result.error;
      isValid = false;
    }
  });

  return { isValid, errors };
};

// Input masking utilities
export const formatters = {
  // Format Tax ID: XX-XXXXXXX
  formatTaxId: (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 2) return digits;
    return `${digits.slice(0, 2)}-${digits.slice(2, 9)}`;
  },

  // Format Phone: (XXX) XXX-XXXX
  formatPhone: (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  },

  // Format SSN: XXX-XX-XXXX
  formatSsn: (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 3) return digits;
    if (digits.length <= 5) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5, 9)}`;
  },

  // Format ZIP: XXXXX or XXXXX-XXXX
  formatZip: (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 5) return digits;
    return `${digits.slice(0, 5)}-${digits.slice(5, 9)}`;
  },
};

// Field validation helpers
export const validators = {
  isValidEmail: (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
  isValidPhone: (phone: string) => /^\(\d{3}\) \d{3}-\d{4}$/.test(phone),
  isValidTaxId: (taxId: string) => /^\d{2}-\d{7}$/.test(taxId),
  isValidSsn: (ssn: string) => /^\d{3}-\d{2}-\d{4}$/.test(ssn),
  isValidZip: (zip: string) => /^\d{5}(-\d{4})?$/.test(zip),
};