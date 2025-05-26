import { useState, useEffect, useMemo } from 'react';
import documentRules from '@shared/document-rules.json';

interface DocumentRequirement {
  type: string;
  label: string;
  description: string;
  required?: boolean;
  condition?: string;
}

interface DocumentGroup {
  id: string;
  label: string;
  description: string;
  requirements: DocumentRequirement[];
  oneOf?: boolean;
  condition?: string;
}

interface CompanyData {
  hasPriorCoverage?: boolean;
  selectedCarrier?: string;
  employeeCount?: number;
  companyState?: string;
  uploadedDocuments?: string[];
}

export function useDocumentValidation(companyData: CompanyData) {
  const [uploadedDocs, setUploadedDocs] = useState<string[]>(companyData.uploadedDocuments || []);

  // Evaluate conditions based on company data
  const evaluateCondition = (condition: string): boolean => {
    switch (condition) {
      case 'hasPriorCoverage':
        return companyData.hasPriorCoverage === true;
      case 'employeeCount > 50':
        return (companyData.employeeCount || 0) > 50;
      case 'missingDE9C':
        return !uploadedDocs.includes('DE9C');
      default:
        return false;
    }
  };

  // Generate required document groups based on company data
  const requiredGroups = useMemo((): DocumentGroup[] => {
    const groups: DocumentGroup[] = [];

    // Always required: Pay proof and business docs
    groups.push({
      id: 'payProof',
      label: documentRules.payProof.label,
      description: documentRules.payProof.description,
      requirements: documentRules.payProof.oneOf,
      oneOf: true,
    });

    groups.push({
      id: 'businessDocs',
      label: documentRules.businessDocs.label,
      description: documentRules.businessDocs.description,
      requirements: documentRules.businessDocs.oneOf,
      oneOf: true,
    });

    // Conditional: Prior coverage
    if (evaluateCondition(documentRules.priorCoverage.condition)) {
      groups.push({
        id: 'priorCoverage',
        label: documentRules.priorCoverage.label,
        description: documentRules.priorCoverage.description,
        requirements: documentRules.priorCoverage.required,
        condition: documentRules.priorCoverage.condition,
      });
    }

    // Carrier-specific requirements
    if (companyData.selectedCarrier && documentRules.carrierSpecific[companyData.selectedCarrier]) {
      const carrierDocs = documentRules.carrierSpecific[companyData.selectedCarrier];
      groups.push({
        id: 'carrierSpecific',
        label: `${companyData.selectedCarrier} Requirements`,
        description: `Additional documents required by ${companyData.selectedCarrier}`,
        requirements: carrierDocs.filter(doc => !doc.condition || evaluateCondition(doc.condition)),
      });
    }

    // Employee count based requirements
    if (evaluateCondition(documentRules.employeeCount.condition)) {
      groups.push({
        id: 'employeeCount',
        label: documentRules.employeeCount.label,
        description: documentRules.employeeCount.description,
        requirements: documentRules.employeeCount.required,
        condition: documentRules.employeeCount.condition,
      });
    }

    return groups;
  }, [companyData, uploadedDocs]);

  // Check if a group is satisfied
  const isGroupSatisfied = (group: DocumentGroup): boolean => {
    if (group.oneOf) {
      // For "oneOf" groups, at least one document must be uploaded
      return group.requirements.some(req => uploadedDocs.includes(req.type));
    } else {
      // For regular groups, all required documents must be uploaded
      return group.requirements
        .filter(req => req.required !== false)
        .every(req => uploadedDocs.includes(req.type));
    }
  };

  // Get overall validation status
  const validationStatus = useMemo(() => {
    const totalGroups = requiredGroups.length;
    const satisfiedGroups = requiredGroups.filter(isGroupSatisfied).length;
    const isComplete = satisfiedGroups === totalGroups;

    return {
      isComplete,
      satisfiedGroups,
      totalGroups,
      missingGroups: requiredGroups.filter(group => !isGroupSatisfied(group)),
    };
  }, [requiredGroups, uploadedDocs]);

  // Mark document as uploaded
  const markDocumentUploaded = (docType: string) => {
    setUploadedDocs(prev => {
      if (!prev.includes(docType)) {
        return [...prev, docType];
      }
      return prev;
    });
  };

  // Remove uploaded document
  const removeDocument = (docType: string) => {
    setUploadedDocs(prev => prev.filter(doc => doc !== docType));
  };

  // Get status for a specific document type
  const getDocumentStatus = (docType: string) => {
    return {
      isUploaded: uploadedDocs.includes(docType),
      isRequired: requiredGroups.some(group =>
        group.requirements.some(req => req.type === docType)
      ),
    };
  };

  return {
    requiredGroups,
    uploadedDocs,
    validationStatus,
    isGroupSatisfied,
    markDocumentUploaded,
    removeDocument,
    getDocumentStatus,
    evaluateCondition,
  };
}
