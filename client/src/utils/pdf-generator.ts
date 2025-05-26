/**
 * PDF Generator
 *
 * This utility helps with generating and manipulating PDFs from application data.
 * It can auto-populate carrier-specific PDF forms based on employer input.
 */

import { Company, Owner, Employee, Plan, Application, Contribution } from '@shared/schema';

// Mock field mappings for different carriers
const carrierFieldMappings = {
  Anthem: {
    companyName: 'company_name',
    companyAddress: 'company_address',
    companyCity: 'company_city',
    companyState: 'company_state',
    companyZip: 'company_zip',
    companyPhone: 'company_phone',
    taxId: 'tax_id',
    // Owner fields
    ownerFirstName: 'owner_first_name',
    ownerLastName: 'owner_last_name',
    ownerTitle: 'owner_title',
    // Plan fields
    planName: 'plan_name',
    // Contribution fields
    employeeContribution: 'employee_contribution',
    dependentContribution: 'dependent_contribution',
  },
  'Blue Shield': {
    companyName: 'employer_name',
    companyAddress: 'employer_address',
    companyCity: 'employer_city',
    companyState: 'employer_state',
    companyZip: 'employer_zip',
    companyPhone: 'employer_phone',
    taxId: 'employer_tax_id',
    // Owner fields
    ownerName: 'owner_name',
    ownerTitle: 'owner_title',
    // Plan fields
    planName: 'medical_plan',
    // Contribution fields
    employeeContribution: 'ee_contribution',
    dependentContribution: 'dep_contribution',
  },
  CCSB: {
    companyName: 'business_name',
    companyAddress: 'business_address',
    companyCity: 'business_city',
    companyState: 'business_state',
    companyZip: 'business_zip',
    companyPhone: 'business_phone',
    taxId: 'fein',
    // Owner fields
    ownerName: 'principal_name',
    ownerTitle: 'principal_title',
    // Plan fields
    planName: 'selected_plan',
    // Contribution fields
    employeeContribution: 'employee_contrib',
    dependentContribution: 'dependent_contrib',
  },
};

// Function to map application data to carrier-specific fields
export function mapDataToCarrierFields(
  carrier: string,
  company: Company,
  owners: Owner[],
  employees: Employee[],
  plans: Plan[],
  contributions: Contribution[]
) {
  const mapping = carrierFieldMappings[carrier as keyof typeof carrierFieldMappings] || {};
  const primaryOwner = owners[0] || {};
  const primaryPlan = plans[0] || {};
  const primaryContribution = contributions[0] || {};

  const mappedData: Record<string, any> = {};

  // Map company data
  if (mapping.companyName) mappedData[mapping.companyName] = company.name;
  if (mapping.companyAddress) mappedData[mapping.companyAddress] = company.address;
  if (mapping.companyCity) mappedData[mapping.companyCity] = company.city;
  if (mapping.companyState) mappedData[mapping.companyState] = company.state;
  if (mapping.companyZip) mappedData[mapping.companyZip] = company.zip;
  if (mapping.companyPhone) mappedData[mapping.companyPhone] = company.phone;
  if (mapping.taxId) mappedData[mapping.taxId] = company.taxId;

  // Map owner data
  if (mapping.ownerFirstName) mappedData[mapping.ownerFirstName] = primaryOwner.firstName;
  if (mapping.ownerLastName) mappedData[mapping.ownerLastName] = primaryOwner.lastName;
  if (mapping.ownerName)
    mappedData[mapping.ownerName] = `${primaryOwner.firstName} ${primaryOwner.lastName}`;
  if (mapping.ownerTitle) mappedData[mapping.ownerTitle] = primaryOwner.title;

  // Map plan data
  if (mapping.planName) mappedData[mapping.planName] = primaryPlan.name;

  // Map contribution data
  if (mapping.employeeContribution)
    mappedData[mapping.employeeContribution] = primaryContribution.employeeContribution;
  if (mapping.dependentContribution)
    mappedData[mapping.dependentContribution] = primaryContribution.dependentContribution;

  return mappedData;
}

// Function to generate a PDF document
export async function generatePDF(
  carrier: string,
  company: Company,
  owners: Owner[],
  employees: Employee[],
  plans: Plan[],
  contributions: Contribution[],
  application: Application
) {
  const mappedData = mapDataToCarrierFields(
    carrier,
    company,
    owners,
    employees,
    plans,
    contributions
  );

  // Generate PDF on the server side
  try {
    const response = await fetch(`/api/generate-pdf`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        carrier,
        data: mappedData,
        applicationId: application.id,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate PDF');
    }

    // Return PDF as blob
    return await response.blob();
  } catch (error) {
    console.error('PDF generation error:', error);
    throw error;
  }
}

// Utility function to download a PDF
export function downloadPDF(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
