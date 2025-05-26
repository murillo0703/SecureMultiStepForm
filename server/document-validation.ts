import documentRules from "@shared/document-rules.json";
import featureFlags from "@shared/feature-flags.json";

interface CompanyData {
  hasPriorCoverage?: boolean;
  selectedCarrier?: string;
  employeeCount?: number;
  companyState?: string;
  uploadedDocuments?: string[];
}

interface ValidationResult {
  isValid: boolean;
  missingRequirements: string[];
  satisfiedGroups: number;
  totalGroups: number;
  errors: string[];
}

// Evaluate conditions based on company data
function evaluateCondition(condition: string, companyData: CompanyData): boolean {
  switch (condition) {
    case "hasPriorCoverage":
      return companyData.hasPriorCoverage === true;
    case "employeeCount > 50":
      return (companyData.employeeCount || 0) > 50;
    case "missingDE9C":
      return !companyData.uploadedDocuments?.includes("DE9C");
    default:
      return false;
  }
}

// Generate required document groups based on company data
function getRequiredGroups(companyData: CompanyData) {
  const groups: any[] = [];

  // Always required: Pay proof and business docs
  groups.push({
    id: "payProof",
    label: documentRules.payProof.label,
    requirements: documentRules.payProof.oneOf,
    oneOf: true
  });

  groups.push({
    id: "businessDocs", 
    label: documentRules.businessDocs.label,
    requirements: documentRules.businessDocs.oneOf,
    oneOf: true
  });

  // Conditional: Prior coverage
  if (evaluateCondition(documentRules.priorCoverage.condition, companyData)) {
    groups.push({
      id: "priorCoverage",
      label: documentRules.priorCoverage.label,
      requirements: documentRules.priorCoverage.required
    });
  }

  // Carrier-specific requirements
  if (companyData.selectedCarrier && documentRules.carrierSpecific[companyData.selectedCarrier]) {
    const carrierDocs = documentRules.carrierSpecific[companyData.selectedCarrier];
    groups.push({
      id: "carrierSpecific",
      label: `${companyData.selectedCarrier} Requirements`,
      requirements: carrierDocs.filter(doc => 
        !doc.condition || evaluateCondition(doc.condition, companyData)
      )
    });
  }

  // Employee count based requirements
  if (evaluateCondition(documentRules.employeeCount.condition, companyData)) {
    groups.push({
      id: "employeeCount",
      label: documentRules.employeeCount.label,
      requirements: documentRules.employeeCount.required
    });
  }

  return groups;
}

// Check if a group is satisfied
function isGroupSatisfied(group: any, uploadedDocs: string[]): boolean {
  if (group.oneOf) {
    // For "oneOf" groups, at least one document must be uploaded
    return group.requirements.some((req: any) => uploadedDocs.includes(req.type));
  } else {
    // For regular groups, all required documents must be uploaded
    return group.requirements
      .filter((req: any) => req.required !== false)
      .every((req: any) => uploadedDocs.includes(req.type));
  }
}

// Main validation function
export function validateDocuments(companyData: CompanyData): ValidationResult {
  if (!featureFlags.smartDocuments.enabled) {
    return {
      isValid: true,
      missingRequirements: [],
      satisfiedGroups: 0,
      totalGroups: 0,
      errors: []
    };
  }

  const uploadedDocs = companyData.uploadedDocuments || [];
  const requiredGroups = getRequiredGroups(companyData);
  
  const satisfiedGroups = requiredGroups.filter(group => 
    isGroupSatisfied(group, uploadedDocs)
  ).length;
  
  const missingGroups = requiredGroups.filter(group => 
    !isGroupSatisfied(group, uploadedDocs)
  );

  const missingRequirements = missingGroups.map(group => group.label);
  const isValid = satisfiedGroups === requiredGroups.length;

  return {
    isValid,
    missingRequirements,
    satisfiedGroups,
    totalGroups: requiredGroups.length,
    errors: missingRequirements.map(req => `Missing required documents: ${req}`)
  };
}

// Check if user can override validation
export function canOverrideValidation(userRole: string): boolean {
  if (userRole === "admin" && featureFlags.adminOverride.enabled) {
    return true;
  }
  
  if ((userRole === "owner" || userRole === "staff") && featureFlags.brokerOverride.enabled) {
    return true;
  }
  
  return false;
}

// Validate with override capability
export function validateWithOverride(
  companyData: CompanyData, 
  userRole: string, 
  overrideReason?: string
): ValidationResult {
  const validation = validateDocuments(companyData);
  
  if (!validation.isValid && canOverrideValidation(userRole) && overrideReason) {
    return {
      ...validation,
      isValid: true,
      errors: [`Override applied by ${userRole}: ${overrideReason}`]
    };
  }
  
  return validation;
}