import React, { useState, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { FormInput } from './FormInput';
import { FormSelect } from './FormSelect';
import { FormSection } from './FormSection';
import { useFormState } from '@/contexts/FormStateContext';
import { validateFormData } from '@shared/validateFields';
import { apiRequest, queryClient } from '@/lib/queryClient';

// Industry options with SIC codes
const industryOptions = [
  { value: '11', label: 'Agriculture, Forestry, Fishing and Hunting' },
  { value: '21', label: 'Mining, Quarrying, and Oil and Gas Extraction' },
  { value: '22', label: 'Utilities' },
  { value: '23', label: 'Construction' },
  { value: '31', label: 'Manufacturing' },
  { value: '42', label: 'Wholesale Trade' },
  { value: '44', label: 'Retail Trade' },
  { value: '48', label: 'Transportation and Warehousing' },
  { value: '51', label: 'Information' },
  { value: '52', label: 'Finance and Insurance' },
  { value: '53', label: 'Real Estate and Rental and Leasing' },
  { value: '54', label: 'Professional, Scientific, and Technical Services' },
  { value: '55', label: 'Management of Companies and Enterprises' },
  { value: '56', label: 'Administrative and Support and Waste Management Services' },
  { value: '61', label: 'Educational Services' },
  { value: '62', label: 'Health Care and Social Assistance' },
  { value: '71', label: 'Arts, Entertainment, and Recreation' },
  { value: '72', label: 'Accommodation and Food Services' },
  { value: '81', label: 'Other Services (except Public Administration)' },
  { value: '92', label: 'Public Administration' },
];

// US States options
const stateOptions = [
  { value: 'AL', label: 'Alabama' },
  { value: 'AK', label: 'Alaska' },
  { value: 'AZ', label: 'Arizona' },
  { value: 'AR', label: 'Arkansas' },
  { value: 'CA', label: 'California' },
  { value: 'CO', label: 'Colorado' },
  { value: 'CT', label: 'Connecticut' },
  { value: 'DE', label: 'Delaware' },
  { value: 'FL', label: 'Florida' },
  { value: 'GA', label: 'Georgia' },
  { value: 'HI', label: 'Hawaii' },
  { value: 'ID', label: 'Idaho' },
  { value: 'IL', label: 'Illinois' },
  { value: 'IN', label: 'Indiana' },
  { value: 'IA', label: 'Iowa' },
  { value: 'KS', label: 'Kansas' },
  { value: 'KY', label: 'Kentucky' },
  { value: 'LA', label: 'Louisiana' },
  { value: 'ME', label: 'Maine' },
  { value: 'MD', label: 'Maryland' },
  { value: 'MA', label: 'Massachusetts' },
  { value: 'MI', label: 'Michigan' },
  { value: 'MN', label: 'Minnesota' },
  { value: 'MS', label: 'Mississippi' },
  { value: 'MO', label: 'Missouri' },
  { value: 'MT', label: 'Montana' },
  { value: 'NE', label: 'Nebraska' },
  { value: 'NV', label: 'Nevada' },
  { value: 'NH', label: 'New Hampshire' },
  { value: 'NJ', label: 'New Jersey' },
  { value: 'NM', label: 'New Mexico' },
  { value: 'NY', label: 'New York' },
  { value: 'NC', label: 'North Carolina' },
  { value: 'ND', label: 'North Dakota' },
  { value: 'OH', label: 'Ohio' },
  { value: 'OK', label: 'Oklahoma' },
  { value: 'OR', label: 'Oregon' },
  { value: 'PA', label: 'Pennsylvania' },
  { value: 'RI', label: 'Rhode Island' },
  { value: 'SC', label: 'South Carolina' },
  { value: 'SD', label: 'South Dakota' },
  { value: 'TN', label: 'Tennessee' },
  { value: 'TX', label: 'Texas' },
  { value: 'UT', label: 'Utah' },
  { value: 'VT', label: 'Vermont' },
  { value: 'VA', label: 'Virginia' },
  { value: 'WA', label: 'Washington' },
  { value: 'WV', label: 'West Virginia' },
  { value: 'WI', label: 'Wisconsin' },
  { value: 'WY', label: 'Wyoming' },
];

export function RefactoredCompanyForm() {
  const { state, updateCompanyInfo, setErrors, clearErrors, setSubmitting, nextStep } = useFormState();
  const { toast } = useToast();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Standardized form submission with proper error handling
  const saveCompanyMutation = useMutation({
    mutationFn: async (formData: typeof state.companyInfo) => {
      try {
        const response = await apiRequest('POST', '/api/employer/company', formData);
        return await response.json();
      } catch (error) {
        throw new Error('Failed to save company information');
      }
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Company information saved successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/companies'] });
      nextStep(); // Move to next step in the form flow
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save company information.',
        variant: 'destructive',
      });
    },
  });

  // Unified field update handler with validation
  const handleFieldChange = useCallback((field: keyof typeof state.companyInfo, value: string) => {
    // Clear field error when user starts typing
    if (fieldErrors[field]) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }

    // Update form state
    updateCompanyInfo({ [field]: value });
  }, [fieldErrors, updateCompanyInfo]);

  // Enhanced validation with proper error handling
  const validateForm = useCallback(() => {
    const validation = validateFormData(state.companyInfo, 'companyInfo');
    
    if (!validation.isValid) {
      setFieldErrors(validation.errors);
      setErrors(validation.errors);
      return false;
    }
    
    clearErrors();
    setFieldErrors({});
    return true;
  }, [state.companyInfo, setErrors, clearErrors]);

  // Standardized form submission handler
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: 'Validation Error',
        description: 'Please correct the errors below before submitting.',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    try {
      await saveCompanyMutation.mutateAsync(state.companyInfo);
    } finally {
      setSubmitting(false);
    }
  }, [validateForm, setSubmitting, saveCompanyMutation, state.companyInfo, toast]);

  return (
    <FormSection
      title="Company Information"
      description="Provide your company's basic information and contact details."
      isLoading={saveCompanyMutation.isPending}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Company Details Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput
            id="companyName"
            label="Company Name"
            value={state.companyInfo.companyName}
            onChange={(value) => handleFieldChange('companyName', value)}
            error={fieldErrors.companyName}
            placeholder="Enter company name"
            required
            autoComplete="organization"
          />

          <FormInput
            id="taxId"
            label="Federal Tax ID (EIN)"
            value={state.companyInfo.taxId}
            onChange={(value) => handleFieldChange('taxId', value)}
            error={fieldErrors.taxId}
            placeholder="XX-XXXXXXX"
            formatting="taxId"
            required
          />

          <FormSelect
            id="industry"
            label="Industry"
            value={state.companyInfo.industry}
            onChange={(value) => handleFieldChange('industry', value)}
            options={industryOptions}
            error={fieldErrors.industry}
            placeholder="Select industry"
            required
          />

          <FormInput
            id="phone"
            label="Phone Number"
            value={state.companyInfo.phone}
            onChange={(value) => handleFieldChange('phone', value)}
            error={fieldErrors.phone}
            placeholder="(555) 123-4567"
            formatting="phone"
            type="tel"
            required
            autoComplete="tel"
          />
        </div>

        {/* Address Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Business Address</h3>
          
          <FormInput
            id="address"
            label="Street Address"
            value={state.companyInfo.address}
            onChange={(value) => handleFieldChange('address', value)}
            error={fieldErrors.address}
            placeholder="123 Main Street"
            required
            autoComplete="street-address"
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormInput
              id="city"
              label="City"
              value={state.companyInfo.city}
              onChange={(value) => handleFieldChange('city', value)}
              error={fieldErrors.city}
              placeholder="City"
              required
              autoComplete="address-level2"
            />

            <FormSelect
              id="state"
              label="State"
              value={state.companyInfo.state}
              onChange={(value) => handleFieldChange('state', value)}
              options={stateOptions}
              error={fieldErrors.state}
              placeholder="Select state"
              required
            />

            <FormInput
              id="zip"
              label="ZIP Code"
              value={state.companyInfo.zip}
              onChange={(value) => handleFieldChange('zip', value)}
              error={fieldErrors.zip}
              placeholder="12345"
              formatting="zip"
              required
              autoComplete="postal-code"
            />
          </div>
        </div>

        {/* Employee Count */}
        <FormInput
          id="employeeCount"
          label="Number of Employees"
          value={state.companyInfo.employeeCount}
          onChange={(value) => handleFieldChange('employeeCount', value)}
          error={fieldErrors.employeeCount}
          placeholder="50"
          type="number"
          required
        />

        {/* Form Actions */}
        <div className="flex justify-between pt-6">
          <Button 
            type="button" 
            variant="outline"
            onClick={() => {
              updateCompanyInfo({
                companyName: '',
                taxId: '',
                industry: '',
                address: '',
                city: '',
                state: '',
                zip: '',
                phone: '',
                employeeCount: '',
              });
              setFieldErrors({});
              clearErrors();
            }}
          >
            Clear Form
          </Button>
          
          <Button 
            type="submit" 
            disabled={saveCompanyMutation.isPending || state.isSubmitting}
          >
            {saveCompanyMutation.isPending ? 'Saving...' : 'Save & Continue'}
          </Button>
        </div>
      </form>
    </FormSection>
  );
}