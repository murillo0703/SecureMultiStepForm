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

export type ContributionFormValues = z.infer<typeof contributionValidationSchema>;