import { z } from 'zod';

// Contribution validation schema
export const contributionValidationSchema = z.object({
  companyId: z.number().min(1, 'Company ID is required'),
  planId: z.number().min(1, 'Plan ID is required'),
  employeeContribution: z
    .number()
    .min(50, 'Employee contribution must be at least 50%')
    .max(100, 'Employee contribution cannot exceed 100%'),
  dependentContribution: z
    .number()
    .min(0, 'Dependent contribution cannot be negative')
    .max(100, 'Dependent contribution cannot exceed 100%'),
});

// Employee validation schema
export const employeeValidationSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  middleName: z.string().optional(),
  preferredName: z.string().optional(),
  email: z.string().email('Invalid email address'),
  personalEmail: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  mobilePhone: z.string().optional(),
  dob: z.string().min(10, 'Date of birth is required'),
  ssn: z.string().regex(/^\d{3}-\d{2}-\d{4}$/, 'SSN must be in format XXX-XX-XXXX'),
  gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']).optional(),
  maritalStatus: z.enum(['single', 'married', 'divorced', 'widowed', 'separated']).optional(),
  address: z.string().min(5, 'Address must be at least 5 characters'),
  address2: z.string().optional(),
  city: z.string().min(2, 'City must be at least 2 characters'),
  state: z.string().length(2, 'State must be 2 characters'),
  zip: z.string().regex(/^\d{5}(-\d{4})?$/, 'ZIP code must be in format 12345 or 12345-6789'),
  country: z.string().default('US'),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  emergencyContactRelationship: z.string().optional(),
  currentJobTitle: z.string().optional(),
  currentDepartment: z.string().optional(),
  currentSalary: z.number().optional(),
  currentHireDate: z.string().optional(),
  hoursPerWeek: z.number().min(1).max(168).default(40),
  employeeClass: z.enum(['full_time', 'part_time', 'contractor', 'temp']).optional(),
  payrollFrequency: z.enum(['weekly', 'bi-weekly', 'semi-monthly', 'monthly']).default('bi-weekly'),
  isEligibleForBenefits: z.boolean().default(true),
});

// Document validation constants and functions
export const REQUIRED_DOCUMENT_TYPES = [
  'business_license',
  'tax_return',
  'employee_census',
  'current_health_plan',
  'w2_forms',
  'payroll_records',
  'ownership_documents',
  'financial_statements'
] as const;

export type RequiredDocumentType = typeof REQUIRED_DOCUMENT_TYPES[number];

export interface DocumentValidationResult {
  isValid: boolean;
  missingDocuments: RequiredDocumentType[];
  uploadedDocuments: RequiredDocumentType[];
}

export function validateRequiredDocuments(uploadedDocuments: string[]): DocumentValidationResult {
  const uploaded = uploadedDocuments.filter(doc => 
    REQUIRED_DOCUMENT_TYPES.includes(doc as RequiredDocumentType)
  ) as RequiredDocumentType[];
  
  const missing = REQUIRED_DOCUMENT_TYPES.filter(reqDoc => 
    !uploaded.includes(reqDoc)
  );
  
  return {
    isValid: missing.length === 0,
    missingDocuments: missing,
    uploadedDocuments: uploaded
  };
}

// Plan selection validation
export interface PlanSelectionValidationResult {
  isValid: boolean;
  errors: string[];
  selectedPlans: number[];
}

export function validatePlanSelection(selectedPlans: number[]): PlanSelectionValidationResult {
  const errors: string[] = [];
  
  if (selectedPlans.length === 0) {
    errors.push('At least one plan must be selected');
  }
  
  // Add more validation rules as needed
  if (selectedPlans.length > 10) {
    errors.push('Too many plans selected (maximum 10)');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    selectedPlans
  };
}

export type ContributionFormValues = z.infer<typeof contributionValidationSchema>;
export type EmployeeFormValues = z.infer<typeof employeeValidationSchema>;