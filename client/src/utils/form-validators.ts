import { z } from "zod";
import { 
  insertCompanySchema, 
  insertOwnerSchema, 
  insertEmployeeSchema,
  insertContributionSchema,
} from "@shared/schema";

// Company validation
export const companyValidationSchema = insertCompanySchema.extend({
  name: z.string().min(1, "Company name is required"),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(2, "State is required").max(2, "Use 2-letter state code"),
  zip: z.string().min(5, "ZIP code is required").max(10, "ZIP code is too long"),
  phone: z.string().min(10, "Phone number is required"),
  taxId: z.string()
    .min(9, "Tax ID must be at least 9 digits")
    .max(11, "Tax ID is too long")
    .regex(/^\d{2}-\d{7}$|^\d{9}$/, "Tax ID must be in format XX-XXXXXXX or XXXXXXXXX"),
  industry: z.string().min(1, "Industry is required"),
  
  // New fields based on requirements
  companyStructure: z.enum([
    "Sole Proprietor", 
    "Corporation", 
    "Partnership", 
    "Limited Liability Partnership", 
    "Limited Partnership", 
    "LLC"
  ], { 
    required_error: "Company structure is required" 
  }),
  
  startDate: z.string().min(1, "Start date is required"),
  
  totalEmployees: z.number()
    .int("Must be a whole number")
    .min(1, "Must have at least 1 employee"),
    
  fullTimeEmployees: z.number()
    .int("Must be a whole number")
    .min(1, "Must have at least 1 full-time employee"),
    
  hadTwentyPlusEmployees: z.boolean(),
  
  hasMedicalCoverage: z.boolean(),
  currentCarrier: z.string().optional(),
  
  mailingAddressSame: z.boolean().default(true),
  mailingAddress: z.string().optional(),
  mailingCity: z.string().optional(),
  mailingState: z.string().optional(),
  mailingZip: z.string().optional(),
})
.refine(
  (data) => !data.hasMedicalCoverage || data.currentCarrier, {
    message: "Current carrier is required if you have medical coverage",
    path: ["currentCarrier"],
  }
)
.refine(
  (data) => data.fullTimeEmployees <= data.totalEmployees, {
    message: "Full-time employees cannot exceed total employees",
    path: ["fullTimeEmployees"],
  }
)
.refine(
  (data) => !(!data.mailingAddressSame && !data.mailingAddress), {
    message: "Mailing address is required when different from physical address",
    path: ["mailingAddress"],
  }
)
.refine(
  (data) => !(!data.mailingAddressSame && !data.mailingCity), {
    message: "Mailing city is required when different from physical address",
    path: ["mailingCity"],
  }
)
.refine(
  (data) => !(!data.mailingAddressSame && !data.mailingState), {
    message: "Mailing state is required when different from physical address",
    path: ["mailingState"],
  }
)
.refine(
  (data) => !(!data.mailingAddressSame && !data.mailingZip), {
    message: "Mailing ZIP is required when different from physical address",
    path: ["mailingZip"],
  }
);

// Owner validation
export const ownerValidationSchema = insertOwnerSchema.extend({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  title: z.string().min(1, "Title is required"),
  ownershipPercentage: z.number()
    .min(1, "Ownership percentage must be at least 1%")
    .max(100, "Ownership percentage cannot exceed 100%"),
  email: z.string().email("Invalid email format").min(1, "Email is required"),
  phone: z.string().min(10, "Phone number must be at least 10 digits").min(1, "Phone number is required"),
  isEligibleForCoverage: z.boolean().default(false),
});

// Employee validation
export const employeeValidationSchema = insertEmployeeSchema.extend({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  dob: z.string().min(1, "Date of birth is required"),
  ssn: z.string()
    .min(9, "SSN must be at least 9 digits")
    .max(11, "SSN is too long")
    .regex(/^\d{3}-\d{2}-\d{4}$|^\d{9}$/, "SSN must be in format XXX-XX-XXXX or XXXXXXXXX"),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(2, "State is required").max(2, "Use 2-letter state code"),
  zip: z.string().min(5, "ZIP code is required").max(10, "ZIP code is too long"),
  email: z.string().email("Invalid email format").optional().or(z.literal("")),
  phone: z.string().min(10, "Phone number must be at least 10 digits").optional().or(z.literal("")),
});

// Contribution validation
export const contributionValidationSchema = insertContributionSchema.extend({
  employeeContribution: z.number()
    .min(50, "Employee contribution must be at least 50%")
    .max(100, "Employee contribution cannot exceed 100%"),
  dependentContribution: z.number()
    .min(0, "Dependent contribution must be at least 0%")
    .max(100, "Dependent contribution cannot exceed 100%"),
});

// Login validation
export const loginValidationSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

// Registration validation
export const registrationValidationSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
  confirmPassword: z.string(),
  email: z.string().email("Invalid email format"),
  companyName: z.string().min(1, "Company name is required"),
  acceptTerms: z.boolean().refine(val => val === true, {
    message: "You must accept the terms and conditions"
  })
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Validate company owners total percentage
export function validateOwnersPercentage(owners: any[]): boolean {
  const totalPercentage = owners.reduce((sum, owner) => sum + (owner.ownershipPercentage || 0), 0);
  return totalPercentage === 100;
}

// Validate required documents
export const REQUIRED_DOCUMENT_TYPES = ["DE-9C", "Articles of Incorporation", "Business License"];

export function validateRequiredDocuments(documents: any[]): boolean {
  const uploadedTypes = documents.map(doc => doc.type);
  return REQUIRED_DOCUMENT_TYPES.every(type => uploadedTypes.includes(type));
}

// Plan selection validation
export function validatePlanSelection(selectedPlans: any[]): boolean {
  return selectedPlans.length > 0;
}
