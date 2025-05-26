/**
 * Utility for managing enrollment steps consistently across the application
 * Uses feature flags to control which steps are enabled
 */

import { isFeatureEnabled } from '@/config/feature-flags';

export type EnrollmentStep = {
  id: string;
  label: string;
  href: string;
  enabled: boolean;
  featureFlag?: string; // Optional feature flag that controls this step
};

// The complete set of enrollment steps (including disabled ones)
export const ALL_ENROLLMENT_STEPS: EnrollmentStep[] = [
  { id: 'carriers', label: 'Carriers', href: '/enrollment/carriers', enabled: true },
  { id: 'company', label: 'Company', href: '/enrollment/company', enabled: true },
  { id: 'ownership', label: 'Owners', href: '/enrollment/ownership', enabled: true },
  {
    id: 'authorized-contact',
    label: 'Contact',
    href: '/enrollment/authorized-contact',
    enabled: true,
  },
  {
    id: 'employees',
    label: 'Employees',
    href: '/enrollment/employees',
    enabled: false,
    featureFlag: 'EMPLOYEE_MANAGEMENT',
  },
  { id: 'documents', label: 'Documents', href: '/enrollment/documents', enabled: true },
  { id: 'plans', label: 'Plans', href: '/enrollment/plans', enabled: true },
  { id: 'contributions', label: 'Contributions', href: '/enrollment/contributions', enabled: true },
  { id: 'review', label: 'Submit', href: '/enrollment/review', enabled: true },
];

// Get only the enabled steps
export function getEnabledEnrollmentSteps(): EnrollmentStep[] {
  return ALL_ENROLLMENT_STEPS.filter(step => {
    // If there's a feature flag associated with this step, check if it's enabled
    if (step.featureFlag) {
      return isFeatureEnabled(step.featureFlag);
    }
    // Otherwise use the enabled property
    return step.enabled;
  });
}

// Calculate the index for a step ID
export function getStepIndexById(stepId: string, includeDisabled: boolean = false): number {
  const steps = includeDisabled ? ALL_ENROLLMENT_STEPS : getEnabledEnrollmentSteps();
  return steps.findIndex(step => step.id === stepId);
}

// Get the next step in the flow
export function getNextStep(currentStepId: string): EnrollmentStep | undefined {
  const steps = getEnabledEnrollmentSteps();
  const currentIndex = getStepIndexById(currentStepId);
  if (currentIndex < steps.length - 1) {
    return steps[currentIndex + 1];
  }
  return undefined;
}

// Get the previous step in the flow
export function getPreviousStep(currentStepId: string): EnrollmentStep | undefined {
  const steps = getEnabledEnrollmentSteps();
  const currentIndex = getStepIndexById(currentStepId);
  if (currentIndex > 0) {
    return steps[currentIndex - 1];
  }
  return undefined;
}
