/**
 * Carrier-specific document requirements
 * 
 * This file defines the document requirements for each carrier.
 * These requirements are used when the CARRIER_SPECIFIC_DOCUMENTS feature flag is enabled.
 */

import { isFeatureEnabled } from "./feature-flags";

export interface DocumentRequirement {
  type: string;
  label: string;
  description: string;
  required: boolean;
  carriers?: string[]; // If specified, this document is only required for these carriers
}

// Base document requirements that apply to all carriers
export const BASE_DOCUMENT_REQUIREMENTS: DocumentRequirement[] = [
  {
    type: "DE-9C",
    label: "DE-9C",
    description: "Quarterly Contribution Return and Report of Wages",
    required: true
  },
  {
    type: "Business License",
    label: "Business License",
    description: "Current business license showing business name and address",
    required: true
  },
  {
    type: "Articles of Incorporation",
    label: "Articles of Incorporation/Business Formation",
    description: "Articles of incorporation, partnership agreement, or LLC formation documents",
    required: true
  },
  {
    type: "Wage and Tax Statement",
    label: "Wage and Tax Statement",
    description: "IRS Form W-2 or 1099 for each eligible employee",
    required: true
  },
  {
    type: "Current Carrier Bill",
    label: "Current Carrier Bill",
    description: "Most recent premium bill from current insurance carrier (if applicable)",
    required: false
  }
];

// Carrier-specific document requirements
export const CARRIER_DOCUMENT_REQUIREMENTS: Record<string, DocumentRequirement[]> = {
  "Anthem": [
    {
      type: "Anthem-Group-App",
      label: "Anthem Group Application",
      description: "Completed Anthem group application form",
      required: true,
      carriers: ["Anthem"]
    }
  ],
  "Blue Shield": [
    {
      type: "BlueShield-MasterGroup-App",
      label: "Blue Shield Master Group Application",
      description: "Completed Blue Shield Master Group Application",
      required: true,
      carriers: ["Blue Shield"]
    },
    {
      type: "BlueShield-RefusalOfCoverage",
      label: "Blue Shield Refusal of Coverage Form",
      description: "Completed refusal form for eligible employees declining coverage",
      required: true,
      carriers: ["Blue Shield"]
    }
  ],
  "Kaiser": [
    {
      type: "Kaiser-GroupApp",
      label: "Kaiser Permanente Group Application",
      description: "Completed Kaiser Permanente Group Application",
      required: true,
      carriers: ["Kaiser"]
    }
  ],
  "UnitedHealthcare": [
    {
      type: "UHC-GroupApp",
      label: "UnitedHealthcare Group Application",
      description: "Completed UnitedHealthcare Group Application",
      required: true,
      carriers: ["UnitedHealthcare"]
    },
    {
      type: "UHC-EmployerApp",
      label: "UnitedHealthcare Employer Application",
      description: "Completed UnitedHealthcare Employer Application form",
      required: true,
      carriers: ["UnitedHealthcare"]
    }
  ]
};

/**
 * Gets the required documents based on the selected carriers
 * @param selectedCarriers Array of carrier names that have been selected
 * @returns Array of required document types
 */
export function getRequiredDocuments(selectedCarriers: string[] = []): DocumentRequirement[] {
  // If carrier-specific documents are not enabled, just return the base requirements
  if (!isFeatureEnabled("CARRIER_SPECIFIC_DOCUMENTS")) {
    return BASE_DOCUMENT_REQUIREMENTS;
  }
  
  // Start with base requirements
  const documents = [...BASE_DOCUMENT_REQUIREMENTS];
  
  // Add carrier-specific requirements
  selectedCarriers.forEach(carrier => {
    if (CARRIER_DOCUMENT_REQUIREMENTS[carrier]) {
      CARRIER_DOCUMENT_REQUIREMENTS[carrier].forEach(doc => {
        // Only add if not already in the list
        if (!documents.some(existingDoc => existingDoc.type === doc.type)) {
          documents.push(doc);
        }
      });
    }
  });
  
  return documents;
}

/**
 * Gets the list of document types that are required
 * @param selectedCarriers Array of carrier names that have been selected
 * @returns Array of required document type strings
 */
export function getRequiredDocumentTypes(selectedCarriers: string[] = []): string[] {
  return getRequiredDocuments(selectedCarriers)
    .filter(doc => doc.required)
    .map(doc => doc.type);
}