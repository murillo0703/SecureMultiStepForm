import { z } from 'zod';
import { createInsertSchema } from 'drizzle-zod';

// Quote schemas for comprehensive insurance quoting engine
export const quoteSchema = z.object({
  id: z.number(),
  userId: z.number(),
  companyId: z.number(),
  quoteNumber: z.string(),
  status: z.enum(['draft', 'pending', 'quoted', 'bound', 'declined']),
  effectiveDate: z.date(),
  expirationDate: z.date(),
  brokerageRate: z.number().min(0).max(100),
  totalPremium: z.number().min(0),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const insertQuoteSchema = createInsertSchema(z.object({
  userId: z.number(),
  companyId: z.number(),
  quoteNumber: z.string(),
  status: z.enum(['draft', 'pending', 'quoted', 'bound', 'declined']).default('draft'),
  effectiveDate: z.date(),
  expirationDate: z.date(),
  brokerageRate: z.number().min(0).max(100).default(0),
  totalPremium: z.number().min(0).default(0),
})).omit({ id: true, createdAt: true, updatedAt: true });

export type Quote = z.infer<typeof quoteSchema>;
export type InsertQuote = z.infer<typeof insertQuoteSchema>;

// Employee schemas with comprehensive dependent tracking
export const employeeQuoteSchema = z.object({
  id: z.number(),
  quoteId: z.number(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  dateOfBirth: z.date(),
  gender: z.enum(['male', 'female']),
  zipCode: z.string().length(5),
  county: z.string(),
  ratingArea: z.number(),
  salary: z.number().min(0),
  hoursPerWeek: z.number().min(0).max(168),
  eligibleDate: z.date(),
  enrollmentTier: z.enum(['employee', 'employee_spouse', 'employee_children', 'family']),
  dependents: z.array(z.object({
    id: z.number(),
    employeeId: z.number(),
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    dateOfBirth: z.date(),
    relationship: z.enum(['spouse', 'child']),
    gender: z.enum(['male', 'female']),
    isEligible: z.boolean(),
  })),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const insertEmployeeQuoteSchema = createInsertSchema(z.object({
  quoteId: z.number(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  dateOfBirth: z.date(),
  gender: z.enum(['male', 'female']),
  zipCode: z.string().length(5),
  county: z.string(),
  ratingArea: z.number(),
  salary: z.number().min(0),
  hoursPerWeek: z.number().min(0).max(168),
  eligibleDate: z.date(),
  enrollmentTier: z.enum(['employee', 'employee_spouse', 'employee_children', 'family']),
})).omit({ id: true, createdAt: true, updatedAt: true });

export type EmployeeQuote = z.infer<typeof employeeQuoteSchema>;
export type InsertEmployeeQuote = z.infer<typeof insertEmployeeQuoteSchema>;

// Plan selection schemas with comprehensive benefit types
export const quotePlanSchema = z.object({
  id: z.number(),
  quoteId: z.number(),
  planId: z.number(),
  planType: z.enum([
    'medical',
    'dental', 
    'vision',
    'basic_life',
    'supplemental_life',
    'voluntary_accident',
    'critical_illness',
    'universal_life'
  ]),
  carrier: z.string(),
  planName: z.string(),
  network: z.string(),
  metalTier: z.enum(['bronze', 'silver', 'gold', 'platinum']).optional(),
  monthlyPremium: z.number().min(0),
  employerContribution: z.number().min(0).max(100),
  employeeContribution: z.number().min(0),
  isSelected: z.boolean().default(false),
  ratingFactors: z.object({
    ageBasedRating: z.boolean(),
    areaFactor: z.number(),
    groupSize: z.number(),
    industryFactor: z.number(),
  }),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const insertQuotePlanSchema = createInsertSchema(z.object({
  quoteId: z.number(),
  planId: z.number(),
  planType: z.enum([
    'medical',
    'dental', 
    'vision',
    'basic_life',
    'supplemental_life',
    'voluntary_accident',
    'critical_illness',
    'universal_life'
  ]),
  carrier: z.string(),
  planName: z.string(),
  network: z.string(),
  metalTier: z.enum(['bronze', 'silver', 'gold', 'platinum']).optional(),
  monthlyPremium: z.number().min(0),
  employerContribution: z.number().min(0).max(100),
  employeeContribution: z.number().min(0),
  isSelected: z.boolean().default(false),
})).omit({ id: true, createdAt: true, updatedAt: true });

export type QuotePlan = z.infer<typeof quotePlanSchema>;
export type InsertQuotePlan = z.infer<typeof insertQuotePlanSchema>;

// Contribution modeling schemas
export const contributionModelSchema = z.object({
  id: z.number(),
  quoteId: z.number(),
  planType: z.enum([
    'medical',
    'dental', 
    'vision',
    'basic_life',
    'supplemental_life',
    'voluntary_accident',
    'critical_illness',
    'universal_life'
  ]),
  employeeContribution: z.number().min(0).max(100),
  spouseContribution: z.number().min(0).max(100),
  childrenContribution: z.number().min(0).max(100),
  familyContribution: z.number().min(0).max(100),
  contributionType: z.enum(['percentage', 'fixed_amount']),
  maxEmployerContribution: z.number().min(0).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const insertContributionModelSchema = createInsertSchema(z.object({
  quoteId: z.number(),
  planType: z.enum([
    'medical',
    'dental', 
    'vision',
    'basic_life',
    'supplemental_life',
    'voluntary_accident',
    'critical_illness',
    'universal_life'
  ]),
  employeeContribution: z.number().min(0).max(100),
  spouseContribution: z.number().min(0).max(100),
  childrenContribution: z.number().min(0).max(100),
  familyContribution: z.number().min(0).max(100),
  contributionType: z.enum(['percentage', 'fixed_amount']),
  maxEmployerContribution: z.number().min(0).optional(),
})).omit({ id: true, createdAt: true, updatedAt: true });

export type ContributionModel = z.infer<typeof contributionModelSchema>;
export type InsertContributionModel = z.infer<typeof insertContributionModelSchema>;

// Proposal generation schemas
export const proposalSchema = z.object({
  id: z.number(),
  quoteId: z.number(),
  proposalNumber: z.string(),
  status: z.enum(['draft', 'sent', 'viewed', 'accepted', 'declined']),
  coverPageIncluded: z.boolean().default(true),
  censusIncluded: z.boolean().default(true),
  sideByySideComparison: z.boolean().default(true),
  masterPlanList: z.boolean().default(true),
  benefitSummary: z.boolean().default(true),
  customSections: z.array(z.string()).default([]),
  generatedAt: z.date(),
  sentAt: z.date().optional(),
  viewedAt: z.date().optional(),
  respondedAt: z.date().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const insertProposalSchema = createInsertSchema(z.object({
  quoteId: z.number(),
  proposalNumber: z.string(),
  status: z.enum(['draft', 'sent', 'viewed', 'accepted', 'declined']).default('draft'),
  coverPageIncluded: z.boolean().default(true),
  censusIncluded: z.boolean().default(true),
  sideByySideComparison: z.boolean().default(true),
  masterPlanList: z.boolean().default(true),
  benefitSummary: z.boolean().default(true),
  customSections: z.array(z.string()).default([]),
})).omit({ id: true, generatedAt: true, createdAt: true, updatedAt: true });

export type Proposal = z.infer<typeof proposalSchema>;
export type InsertProposal = z.infer<typeof insertProposalSchema>;

// Rating area and carrier schemas
export const ratingAreaSchema = z.object({
  zipCode: z.string().length(5),
  county: z.string(),
  state: z.string().length(2),
  ratingArea: z.number(),
  carrierSpecificAreas: z.record(z.string(), z.number()),
});

export const carrierSchema = z.object({
  id: z.string(),
  name: z.string(),
  states: z.array(z.string()),
  planTypes: z.array(z.enum([
    'medical',
    'dental', 
    'vision',
    'basic_life',
    'supplemental_life',
    'voluntary_accident',
    'critical_illness',
    'universal_life'
  ])),
  ratingMethods: z.object({
    ageBasedRating: z.boolean(),
    areaFactorRating: z.boolean(),
    compositeRating: z.boolean(),
    tieredRating: z.boolean(),
  }),
  isActive: z.boolean().default(true),
});

export type RatingArea = z.infer<typeof ratingAreaSchema>;
export type Carrier = z.infer<typeof carrierSchema>;

// Age-based rating calculation helpers
export const calculateAge = (dateOfBirth: Date, effectiveDate: Date = new Date()): number => {
  const ageDiff = effectiveDate.getTime() - dateOfBirth.getTime();
  return Math.floor(ageDiff / (1000 * 60 * 60 * 24 * 365.25));
};

export const getDependentRatingRules = () => ({
  maxChildrenRated: 3, // Only oldest 3 children under 18 are rated
  childCutoffAge: 18,
  maxDependentAge: 26,
  spouseRatingRequired: true,
});

export const getRatingAreaForZip = (zipCode: string): number => {
  // Mock implementation - in real system this would query SERFF data
  const ratingAreas: Record<string, number> = {
    '90210': 1, // Los Angeles
    '10001': 1, // Manhattan
    '60601': 1, // Chicago
    '77001': 1, // Houston
    '33101': 1, // Miami
  };
  return ratingAreas[zipCode] || 1;
};