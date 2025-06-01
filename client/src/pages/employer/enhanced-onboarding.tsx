import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Building, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  ChevronLeft, 
  ChevronRight,
  Save,
  CheckCircle,
  Clock,
  FileText,
  Upload,
  Shield,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useSecureFormStorage } from '@/hooks/use-secure-form-storage';
import { 
  FormField, 
  SelectField, 
  CheckboxField, 
  TextareaField,
  formatPhoneNumber,
  formatTaxId,
  formatZipCode,
  validators,
  validateForm
} from '@/components/forms/reusable-form-fields';

// Industry categories with hierarchical structure
const INDUSTRY_CATEGORIES = {
  'technology': {
    label: 'Technology',
    subcategories: [
      { value: 'software-development', label: 'Software Development' },
      { value: 'it-services', label: 'IT Services' },
      { value: 'cybersecurity', label: 'Cybersecurity' },
      { value: 'data-analytics', label: 'Data Analytics' },
      { value: 'artificial-intelligence', label: 'Artificial Intelligence' }
    ]
  },
  'healthcare': {
    label: 'Healthcare',
    subcategories: [
      { value: 'medical-practice', label: 'Medical Practice' },
      { value: 'dental-practice', label: 'Dental Practice' },
      { value: 'veterinary', label: 'Veterinary Services' },
      { value: 'home-healthcare', label: 'Home Healthcare' },
      { value: 'medical-devices', label: 'Medical Devices' }
    ]
  },
  'professional-services': {
    label: 'Professional Services',
    subcategories: [
      { value: 'accounting', label: 'Accounting' },
      { value: 'legal-services', label: 'Legal Services' },
      { value: 'consulting', label: 'Consulting' },
      { value: 'marketing-advertising', label: 'Marketing & Advertising' },
      { value: 'real-estate', label: 'Real Estate' }
    ]
  },
  'manufacturing': {
    label: 'Manufacturing',
    subcategories: [
      { value: 'automotive', label: 'Automotive' },
      { value: 'electronics', label: 'Electronics' },
      { value: 'food-beverage', label: 'Food & Beverage' },
      { value: 'textiles', label: 'Textiles' },
      { value: 'chemicals', label: 'Chemicals' }
    ]
  },
  'retail': {
    label: 'Retail',
    subcategories: [
      { value: 'clothing-apparel', label: 'Clothing & Apparel' },
      { value: 'electronics-retail', label: 'Electronics' },
      { value: 'grocery', label: 'Grocery' },
      { value: 'automotive-retail', label: 'Automotive' },
      { value: 'home-garden', label: 'Home & Garden' }
    ]
  },
  'construction': {
    label: 'Construction',
    subcategories: [
      { value: 'general-construction', label: 'General Construction' },
      { value: 'electrical', label: 'Electrical' },
      { value: 'plumbing', label: 'Plumbing' },
      { value: 'roofing', label: 'Roofing' },
      { value: 'landscaping', label: 'Landscaping' }
    ]
  },
  'other': {
    label: 'Other',
    subcategories: [
      { value: 'agriculture', label: 'Agriculture' },
      { value: 'transportation', label: 'Transportation' },
      { value: 'education', label: 'Education' },
      { value: 'hospitality', label: 'Hospitality' },
      { value: 'non-profit', label: 'Non-Profit' }
    ]
  }
};

const US_STATES = [
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
  { value: 'WY', label: 'Wyoming' }
];

const EMPLOYEE_COUNT_OPTIONS = [
  { value: '1-5', label: '1-5 employees' },
  { value: '6-10', label: '6-10 employees' },
  { value: '11-25', label: '11-25 employees' },
  { value: '26-50', label: '26-50 employees' },
  { value: '51-100', label: '51-100 employees' },
  { value: '101-250', label: '101-250 employees' },
  { value: '251-500', label: '251-500 employees' },
  { value: '500+', label: '500+ employees' }
];

// Form data interface
interface OnboardingFormData {
  companyInfo: {
    name: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    phone: string;
    taxId: string;
    sicCode: string;
    industry: string;
    industrySubcategory: string;
    employeeCount: string;
    yearEstablished: string;
    description: string;
  };
  contactInfo: {
    firstName: string;
    lastName: string;
    email: string;
    jobTitle: string;
    relationshipToCompany: string;
    phone: string;
    isPrimaryContact: boolean;
    isAuthorizedSigner: boolean;
    isOwner: boolean;
  };
  ownershipInfo: {
    firstName: string;
    lastName: string;
    title: string;
    ownershipPercentage: string;
    email: string;
    phone: string;
    relationshipToCompany: string;
    isEligibleForCoverage: boolean;
    isAuthorizedContact: boolean;
  };
  documents: {
    uploadedFiles: string[];
    notes: string;
  };
}

const initialFormData: OnboardingFormData = {
  companyInfo: {
    name: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    phone: '',
    taxId: '',
    sicCode: '',
    industry: '',
    industrySubcategory: '',
    employeeCount: '',
    yearEstablished: new Date().getFullYear().toString(),
    description: ''
  },
  contactInfo: {
    firstName: '',
    lastName: '',
    email: '',
    jobTitle: '',
    relationshipToCompany: '',
    phone: '',
    isPrimaryContact: true,
    isAuthorizedSigner: false,
    isOwner: false
  },
  ownershipInfo: {
    firstName: '',
    lastName: '',
    title: '',
    ownershipPercentage: '',
    email: '',
    phone: '',
    relationshipToCompany: '',
    isEligibleForCoverage: false,
    isAuthorizedContact: false
  },
  documents: {
    uploadedFiles: [],
    notes: ''
  }
};

export default function EnhancedEmployerOnboarding() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Secure form storage with auto-save
  const {
    formData,
    currentStep,
    hasUnsavedChanges,
    isLoading,
    isSaving,
    updateFormData,
    updateStep,
    saveForm,
    clearForm,
    lastSaved
  } = useSecureFormStorage<OnboardingFormData>('employer-onboarding', initialFormData);

  // Redirect if not employer
  if (user?.role !== 'employer') {
    setLocation('/');
    return null;
  }

  // Auto-populate contact info if user is owner
  useEffect(() => {
    if (formData.contactInfo.isOwner && user) {
      const nameParts = user.name.split(' ');
      updateFormData({
        ownershipInfo: {
          ...formData.ownershipInfo,
          firstName: nameParts[0] || '',
          lastName: nameParts.slice(1).join(' ') || '',
          email: formData.contactInfo.email,
          phone: formData.contactInfo.phone,
          relationshipToCompany: 'Owner'
        }
      });
    }
  }, [formData.contactInfo.isOwner, user?.name, formData.contactInfo.email, formData.contactInfo.phone]);

  // Form validation rules
  const getValidationRules = () => {
    const rules: Record<string, ((value: any) => string | null)[]> = {};
    
    if (currentStep === 1) {
      rules['companyInfo.name'] = [validators.required];
      rules['companyInfo.address'] = [validators.required];
      rules['companyInfo.city'] = [validators.required];
      rules['companyInfo.state'] = [validators.required];
      rules['companyInfo.zip'] = [validators.required, validators.zipCode];
      rules['companyInfo.phone'] = [validators.required, validators.phone];
      rules['companyInfo.taxId'] = [validators.required, validators.taxId];
      rules['companyInfo.industry'] = [validators.required];
      rules['companyInfo.employeeCount'] = [validators.required];
    } else if (currentStep === 2) {
      rules['contactInfo.firstName'] = [validators.required];
      rules['contactInfo.lastName'] = [validators.required];
      rules['contactInfo.email'] = [validators.required, validators.email];
      rules['contactInfo.phone'] = [validators.required, validators.phone];
      rules['contactInfo.jobTitle'] = [validators.required];
    } else if (currentStep === 3 && formData.contactInfo.isOwner) {
      rules['ownershipInfo.ownershipPercentage'] = [validators.required, validators.percentage];
    }
    
    return rules;
  };

  // Validate current step
  const validateCurrentStep = () => {
    const rules = getValidationRules();
    const stepErrors = validateForm(formData, rules);
    setErrors(stepErrors);
    return Object.keys(stepErrors).length === 0;
  };

  // Handle formatted input changes
  const handleFormattedChange = (field: string, value: string, formatter: (v: string) => string) => {
    const formatted = formatter(value);
    const keys = field.split('.');
    const section = keys[0] as keyof OnboardingFormData;
    const property = keys[1];
    
    updateFormData({
      [section]: {
        ...formData[section],
        [property]: formatted
      }
    });
  };

  // Navigation functions
  const nextStep = () => {
    if (validateCurrentStep()) {
      updateStep(Math.min(currentStep + 1, 4));
    }
  };

  const prevStep = () => {
    updateStep(Math.max(currentStep - 1, 1));
  };

  // Submit form mutation
  const submitFormMutation = useMutation({
    mutationFn: async () => {
      if (!validateCurrentStep()) {
        throw new Error('Please fix validation errors before submitting');
      }
      
      const res = await apiRequest('POST', '/api/employer/onboarding/submit', formData);
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Application Submitted',
        description: 'Your onboarding application has been submitted successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/employer/applications'] });
      setLocation('/employer/dashboard');
      clearForm();
    },
    onError: (error: any) => {
      toast({
        title: 'Submission Failed',
        description: error.message || 'Failed to submit application.',
        variant: 'destructive',
      });
    },
  });

  // Calculate progress
  const progressPercentage = (currentStep / 4) * 100;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Employer Onboarding</h1>
        <p className="text-muted-foreground mb-4">
          Complete your company information to get started with insurance enrollment
        </p>
        
        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Step {currentStep} of 4</span>
            <span>{Math.round(progressPercentage)}% Complete</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        {/* Auto-save indicator */}
        {lastSaved && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
            <Shield className="h-3 w-3" />
            Last saved: {new Date(lastSaved).toLocaleTimeString()}
            {hasUnsavedChanges && <span className="text-orange-500">• Unsaved changes</span>}
            {isSaving && <span className="text-blue-500">• Saving...</span>}
          </div>
        )}
      </div>

      {/* Step Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {currentStep === 1 && <Building className="h-5 w-5" />}
            {currentStep === 2 && <User className="h-5 w-5" />}
            {currentStep === 3 && <Mail className="h-5 w-5" />}
            {currentStep === 4 && <FileText className="h-5 w-5" />}
            
            {currentStep === 1 && "Company Information"}
            {currentStep === 2 && "Contact Information"}
            {currentStep === 3 && "Ownership Information"}
            {currentStep === 4 && "Review & Submit"}
          </CardTitle>
          <CardDescription>
            {currentStep === 1 && "Enter your company's basic details and business information"}
            {currentStep === 2 && "Provide primary contact information for your account"}
            {currentStep === 3 && "Add ownership details for compliance requirements"}
            {currentStep === 4 && "Review all information and submit your application"}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Step 1: Company Information */}
          {currentStep === 1 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <FormField
                  label="Company Name"
                  name="companyName"
                  value={formData.companyInfo.name}
                  onChange={(value) => updateFormData({
                    companyInfo: { ...formData.companyInfo, name: value }
                  })}
                  error={errors['companyInfo.name']}
                  required
                  placeholder="Enter your company name"
                />
              </div>
              
              <div className="md:col-span-2">
                <FormField
                  label="Business Address"
                  name="address"
                  value={formData.companyInfo.address}
                  onChange={(value) => updateFormData({
                    companyInfo: { ...formData.companyInfo, address: value }
                  })}
                  error={errors['companyInfo.address']}
                  required
                  placeholder="Street address"
                />
              </div>
              
              <FormField
                label="City"
                name="city"
                value={formData.companyInfo.city}
                onChange={(value) => updateFormData({
                  companyInfo: { ...formData.companyInfo, city: value }
                })}
                error={errors['companyInfo.city']}
                required
                placeholder="City"
              />
              
              <SelectField
                label="State"
                name="state"
                value={formData.companyInfo.state}
                onChange={(value) => updateFormData({
                  companyInfo: { ...formData.companyInfo, state: value }
                })}
                options={US_STATES}
                error={errors['companyInfo.state']}
                required
                placeholder="Select state"
              />
              
              <FormField
                label="ZIP Code"
                name="zip"
                value={formData.companyInfo.zip}
                onChange={(value) => handleFormattedChange('companyInfo.zip', value, formatZipCode)}
                error={errors['companyInfo.zip']}
                required
                placeholder="ZIP code"
              />
              
              <FormField
                label="Phone Number"
                name="phone"
                type="tel"
                value={formData.companyInfo.phone}
                onChange={(value) => handleFormattedChange('companyInfo.phone', value, formatPhoneNumber)}
                error={errors['companyInfo.phone']}
                required
                placeholder="(555) 123-4567"
              />
              
              <FormField
                label="Federal Tax ID (EIN)"
                name="taxId"
                value={formData.companyInfo.taxId}
                onChange={(value) => handleFormattedChange('companyInfo.taxId', value, formatTaxId)}
                error={errors['companyInfo.taxId']}
                required
                placeholder="12-3456789"
              />
              
              <SelectField
                label="Number of Employees"
                name="employeeCount"
                value={formData.companyInfo.employeeCount}
                onChange={(value) => updateFormData({
                  companyInfo: { ...formData.companyInfo, employeeCount: value }
                })}
                options={EMPLOYEE_COUNT_OPTIONS}
                error={errors['companyInfo.employeeCount']}
                required
                placeholder="Select employee count"
              />
              
              <SelectField
                label="Industry"
                name="industry"
                value={formData.companyInfo.industry}
                onChange={(value) => updateFormData({
                  companyInfo: { ...formData.companyInfo, industry: value, industrySubcategory: '' }
                })}
                options={Object.entries(INDUSTRY_CATEGORIES).map(([key, cat]) => ({
                  value: key,
                  label: cat.label
                }))}
                error={errors['companyInfo.industry']}
                required
                placeholder="Select industry"
              />
              
              {formData.companyInfo.industry && INDUSTRY_CATEGORIES[formData.companyInfo.industry as keyof typeof INDUSTRY_CATEGORIES] && (
                <SelectField
                  label="Industry Subcategory"
                  name="industrySubcategory"
                  value={formData.companyInfo.industrySubcategory}
                  onChange={(value) => updateFormData({
                    companyInfo: { ...formData.companyInfo, industrySubcategory: value }
                  })}
                  options={INDUSTRY_CATEGORIES[formData.companyInfo.industry as keyof typeof INDUSTRY_CATEGORIES].subcategories}
                  placeholder="Select subcategory"
                />
              )}
              
              <FormField
                label="Year Established"
                name="yearEstablished"
                type="number"
                value={formData.companyInfo.yearEstablished}
                onChange={(value) => updateFormData({
                  companyInfo: { ...formData.companyInfo, yearEstablished: value }
                })}
                placeholder="YYYY"
              />
              
              <FormField
                label="SIC Code (Optional)"
                name="sicCode"
                value={formData.companyInfo.sicCode}
                onChange={(value) => updateFormData({
                  companyInfo: { ...formData.companyInfo, sicCode: value }
                })}
                placeholder="4-digit SIC code"
              />
              
              <div className="md:col-span-2">
                <TextareaField
                  label="Business Description"
                  name="description"
                  value={formData.companyInfo.description}
                  onChange={(value) => updateFormData({
                    companyInfo: { ...formData.companyInfo, description: value }
                  })}
                  placeholder="Brief description of your business activities"
                  rows={3}
                />
              </div>
            </div>
          )}

          {/* Step 2: Contact Information */}
          {currentStep === 2 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                label="First Name"
                name="firstName"
                value={formData.contactInfo.firstName}
                onChange={(value) => updateFormData({
                  contactInfo: { ...formData.contactInfo, firstName: value }
                })}
                error={errors['contactInfo.firstName']}
                required
                placeholder="First name"
              />
              
              <FormField
                label="Last Name"
                name="lastName"
                value={formData.contactInfo.lastName}
                onChange={(value) => updateFormData({
                  contactInfo: { ...formData.contactInfo, lastName: value }
                })}
                error={errors['contactInfo.lastName']}
                required
                placeholder="Last name"
              />
              
              <FormField
                label="Email Address"
                name="email"
                type="email"
                value={formData.contactInfo.email}
                onChange={(value) => updateFormData({
                  contactInfo: { ...formData.contactInfo, email: value }
                })}
                error={errors['contactInfo.email']}
                required
                placeholder="email@company.com"
              />
              
              <FormField
                label="Phone Number"
                name="contactPhone"
                type="tel"
                value={formData.contactInfo.phone}
                onChange={(value) => handleFormattedChange('contactInfo.phone', value, formatPhoneNumber)}
                error={errors['contactInfo.phone']}
                required
                placeholder="(555) 123-4567"
              />
              
              <FormField
                label="Job Title"
                name="jobTitle"
                value={formData.contactInfo.jobTitle}
                onChange={(value) => updateFormData({
                  contactInfo: { ...formData.contactInfo, jobTitle: value }
                })}
                error={errors['contactInfo.jobTitle']}
                required
                placeholder="Your job title"
              />
              
              <SelectField
                label="Relationship to Company"
                name="relationshipToCompany"
                value={formData.contactInfo.relationshipToCompany}
                onChange={(value) => updateFormData({
                  contactInfo: { ...formData.contactInfo, relationshipToCompany: value }
                })}
                options={[
                  { value: 'owner', label: 'Owner' },
                  { value: 'partner', label: 'Partner' },
                  { value: 'employee', label: 'Employee' },
                  { value: 'hr-manager', label: 'HR Manager' },
                  { value: 'office-manager', label: 'Office Manager' },
                  { value: 'other', label: 'Other' }
                ]}
                required
                placeholder="Select relationship"
              />
              
              <div className="md:col-span-2 space-y-4">
                <CheckboxField
                  label="I am the primary contact for this account"
                  name="isPrimaryContact"
                  value={formData.contactInfo.isPrimaryContact}
                  onChange={(value) => updateFormData({
                    contactInfo: { ...formData.contactInfo, isPrimaryContact: value }
                  })}
                />
                
                <CheckboxField
                  label="I am authorized to sign documents on behalf of the company"
                  name="isAuthorizedSigner"
                  value={formData.contactInfo.isAuthorizedSigner}
                  onChange={(value) => updateFormData({
                    contactInfo: { ...formData.contactInfo, isAuthorizedSigner: value }
                  })}
                />
                
                <CheckboxField
                  label="I am an owner of this company"
                  name="isOwner"
                  value={formData.contactInfo.isOwner}
                  onChange={(value) => updateFormData({
                    contactInfo: { ...formData.contactInfo, isOwner: value }
                  })}
                />
              </div>
            </div>
          )}

          {/* Step 3: Ownership Information */}
          {currentStep === 3 && (
            <div>
              {formData.contactInfo.isOwner ? (
                <div className="space-y-6">
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Since you indicated you're an owner, your contact information has been pre-filled below.
                      Please review and update as needed.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      label="First Name"
                      name="ownerFirstName"
                      value={formData.ownershipInfo.firstName}
                      onChange={(value) => updateFormData({
                        ownershipInfo: { ...formData.ownershipInfo, firstName: value }
                      })}
                      required
                      placeholder="First name"
                    />
                    
                    <FormField
                      label="Last Name"
                      name="ownerLastName"
                      value={formData.ownershipInfo.lastName}
                      onChange={(value) => updateFormData({
                        ownershipInfo: { ...formData.ownershipInfo, lastName: value }
                      })}
                      required
                      placeholder="Last name"
                    />
                    
                    <FormField
                      label="Title"
                      name="ownerTitle"
                      value={formData.ownershipInfo.title}
                      onChange={(value) => updateFormData({
                        ownershipInfo: { ...formData.ownershipInfo, title: value }
                      })}
                      placeholder="CEO, President, etc."
                    />
                    
                    <FormField
                      label="Ownership Percentage"
                      name="ownershipPercentage"
                      type="number"
                      value={formData.ownershipInfo.ownershipPercentage}
                      onChange={(value) => updateFormData({
                        ownershipInfo: { ...formData.ownershipInfo, ownershipPercentage: value }
                      })}
                      error={errors['ownershipInfo.ownershipPercentage']}
                      required
                      placeholder="0-100"
                    />
                    
                    <FormField
                      label="Email Address"
                      name="ownerEmail"
                      type="email"
                      value={formData.ownershipInfo.email}
                      onChange={(value) => updateFormData({
                        ownershipInfo: { ...formData.ownershipInfo, email: value }
                      })}
                      placeholder="email@company.com"
                    />
                    
                    <FormField
                      label="Phone Number"
                      name="ownerPhone"
                      type="tel"
                      value={formData.ownershipInfo.phone}
                      onChange={(value) => handleFormattedChange('ownershipInfo.phone', value, formatPhoneNumber)}
                      placeholder="(555) 123-4567"
                    />
                    
                    <div className="md:col-span-2 space-y-4">
                      <CheckboxField
                        label="Owner is eligible for company coverage"
                        name="isEligibleForCoverage"
                        value={formData.ownershipInfo.isEligibleForCoverage}
                        onChange={(value) => updateFormData({
                          ownershipInfo: { ...formData.ownershipInfo, isEligibleForCoverage: value }
                        })}
                      />
                      
                      <CheckboxField
                        label="Owner is an authorized contact for insurance matters"
                        name="isAuthorizedContact"
                        value={formData.ownershipInfo.isAuthorizedContact}
                        onChange={(value) => updateFormData({
                          ownershipInfo: { ...formData.ownershipInfo, isAuthorizedContact: value }
                        })}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    No ownership information required. You can proceed to the next step.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Step 4: Review & Submit */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Please review all information before submitting. You'll be able to make changes after submission if needed.
                </AlertDescription>
              </Alert>
              
              {/* Company Information Review */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Company Information</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Company Name:</span>
                    <p>{formData.companyInfo.name}</p>
                  </div>
                  <div>
                    <span className="font-medium">Address:</span>
                    <p>{formData.companyInfo.address}, {formData.companyInfo.city}, {formData.companyInfo.state} {formData.companyInfo.zip}</p>
                  </div>
                  <div>
                    <span className="font-medium">Phone:</span>
                    <p>{formData.companyInfo.phone}</p>
                  </div>
                  <div>
                    <span className="font-medium">Tax ID:</span>
                    <p>{formData.companyInfo.taxId}</p>
                  </div>
                  <div>
                    <span className="font-medium">Industry:</span>
                    <p>{INDUSTRY_CATEGORIES[formData.companyInfo.industry as keyof typeof INDUSTRY_CATEGORIES]?.label}</p>
                  </div>
                  <div>
                    <span className="font-medium">Employees:</span>
                    <p>{formData.companyInfo.employeeCount}</p>
                  </div>
                </CardContent>
              </Card>
              
              {/* Contact Information Review */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Name:</span>
                    <p>{formData.contactInfo.firstName} {formData.contactInfo.lastName}</p>
                  </div>
                  <div>
                    <span className="font-medium">Email:</span>
                    <p>{formData.contactInfo.email}</p>
                  </div>
                  <div>
                    <span className="font-medium">Phone:</span>
                    <p>{formData.contactInfo.phone}</p>
                  </div>
                  <div>
                    <span className="font-medium">Job Title:</span>
                    <p>{formData.contactInfo.jobTitle}</p>
                  </div>
                </CardContent>
              </Card>
              
              {/* Ownership Information Review */}
              {formData.contactInfo.isOwner && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Ownership Information</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Owner Name:</span>
                      <p>{formData.ownershipInfo.firstName} {formData.ownershipInfo.lastName}</p>
                    </div>
                    <div>
                      <span className="font-medium">Ownership Percentage:</span>
                      <p>{formData.ownershipInfo.ownershipPercentage}%</p>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              <TextareaField
                label="Additional Notes (Optional)"
                name="notes"
                value={formData.documents.notes}
                onChange={(value) => updateFormData({
                  documents: { ...formData.documents, notes: value }
                })}
                placeholder="Any additional information or special requirements"
                rows={3}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between items-center mt-8">
        <div className="flex gap-2">
          {currentStep > 1 && (
            <Button variant="outline" onClick={prevStep}>
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
          )}
          
          <Button variant="outline" onClick={saveForm} disabled={isSaving}>
            <Save className="h-4 w-4 mr-1" />
            {isSaving ? 'Saving...' : 'Save Progress'}
          </Button>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setLocation('/employer/dashboard')}>
            Save & Continue Later
          </Button>
          
          {currentStep < 4 ? (
            <Button onClick={nextStep}>
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button 
              onClick={() => submitFormMutation.mutate()}
              disabled={submitFormMutation.isPending}
            >
              {submitFormMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Submit Application
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}