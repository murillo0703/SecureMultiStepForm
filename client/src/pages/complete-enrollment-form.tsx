import React, { useState } from 'react';
import { useFormState } from '@/hooks/use-form-state';
import { EnhancedForm } from '@/components/forms/form-bug-fixes';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

/**
 * Complete Production-Ready Enrollment Form
 * Demonstrates all implemented features:
 * - Persistent form state with localStorage and server sync
 * - Comprehensive validation and error handling
 * - PDF generation and download
 * - Security measures (CSRF, rate limiting, input sanitization)
 * - Save and resume functionality
 * - Review step with edit capabilities
 * - Accessibility compliance
 * - Mobile-responsive design
 */

const enrollmentSteps = [
  {
    id: 'company-info',
    title: 'Company Information',
    fields: [
      {
        name: 'companyName',
        label: 'Company Name',
        type: 'text' as const,
        required: true,
        autoComplete: 'organization',
        validation: (value: string) => 
          value.length < 2 ? 'Company name must be at least 2 characters' : null
      },
      {
        name: 'companyAddress',
        label: 'Business Address',
        type: 'text' as const,
        required: true,
        autoComplete: 'street-address'
      },
      {
        name: 'companyCity',
        label: 'City',
        type: 'text' as const,
        required: true,
        autoComplete: 'address-level2'
      },
      {
        name: 'companyState',
        label: 'State',
        type: 'select' as const,
        required: true,
        options: [
          { value: 'CA', label: 'California' },
          { value: 'NY', label: 'New York' },
          { value: 'TX', label: 'Texas' },
          { value: 'FL', label: 'Florida' }
        ]
      },
      {
        name: 'companyZip',
        label: 'ZIP Code',
        type: 'text' as const,
        required: true,
        autoComplete: 'postal-code',
        validation: (value: string) => 
          !/^\d{5}(-\d{4})?$/.test(value) ? 'ZIP code must be in format 12345 or 12345-6789' : null
      },
      {
        name: 'employeeCount',
        label: 'Number of Employees',
        type: 'select' as const,
        required: true,
        options: [
          { value: '1-10', label: '1-10 employees' },
          { value: '11-25', label: '11-25 employees' },
          { value: '26-50', label: '26-50 employees' },
          { value: '51-100', label: '51-100 employees' },
          { value: '100+', label: '100+ employees' }
        ]
      }
    ]
  },
  {
    id: 'contact-info',
    title: 'Contact Information',
    fields: [
      {
        name: 'contactName',
        label: 'Primary Contact Name',
        type: 'text' as const,
        required: true,
        autoComplete: 'name'
      },
      {
        name: 'contactEmail',
        label: 'Email Address',
        type: 'email' as const,
        required: true,
        autoComplete: 'email'
      },
      {
        name: 'contactPhone',
        label: 'Phone Number',
        type: 'tel' as const,
        required: true,
        autoComplete: 'tel',
        validation: (value: string) => {
          const cleaned = value.replace(/\D/g, '');
          return cleaned.length !== 10 ? 'Phone number must be 10 digits' : null;
        }
      },
      {
        name: 'contactTitle',
        label: 'Job Title',
        type: 'text' as const,
        required: true,
        autoComplete: 'organization-title'
      },
      {
        name: 'isOwner',
        label: 'Are you an owner of the company?',
        type: 'select' as const,
        required: true,
        options: [
          { value: 'yes', label: 'Yes' },
          { value: 'no', label: 'No' }
        ]
      }
    ]
  },
  {
    id: 'owner-info',
    title: 'Owner Information',
    fields: [
      {
        name: 'ownerName',
        label: 'Owner Name',
        type: 'text' as const,
        required: true,
        autoPopulateFrom: 'contactName'
      },
      {
        name: 'ownerEmail',
        label: 'Owner Email',
        type: 'email' as const,
        required: true,
        autoPopulateFrom: 'contactEmail'
      },
      {
        name: 'ownerPhone',
        label: 'Owner Phone',
        type: 'tel' as const,
        required: true,
        autoPopulateFrom: 'contactPhone'
      },
      {
        name: 'ownershipPercentage',
        label: 'Ownership Percentage',
        type: 'select' as const,
        required: true,
        options: [
          { value: '25', label: '25%' },
          { value: '50', label: '50%' },
          { value: '75', label: '75%' },
          { value: '100', label: '100%' }
        ]
      }
    ]
  },
  {
    id: 'coverage-details',
    title: 'Coverage Details',
    fields: [
      {
        name: 'requestedCoverage',
        label: 'Type of Coverage',
        type: 'select' as const,
        required: true,
        options: [
          { value: 'health', label: 'Health Insurance' },
          { value: 'dental', label: 'Dental Insurance' },
          { value: 'vision', label: 'Vision Insurance' },
          { value: 'health-dental', label: 'Health + Dental' },
          { value: 'comprehensive', label: 'Comprehensive Package' }
        ]
      },
      {
        name: 'effectiveDate',
        label: 'Desired Effective Date',
        type: 'date' as const,
        required: true,
        validation: (value: string) => {
          const date = new Date(value);
          const today = new Date();
          return date <= today ? 'Effective date must be in the future' : null;
        }
      },
      {
        name: 'priorCoverage',
        label: 'Do you currently have coverage?',
        type: 'select' as const,
        required: true,
        options: [
          { value: 'yes', label: 'Yes' },
          { value: 'no', label: 'No' }
        ]
      },
      {
        name: 'currentCarrier',
        label: 'Current Insurance Carrier',
        type: 'text' as const,
        dependsOn: 'priorCoverage'
      }
    ]
  }
];

export default function CompleteEnrollmentForm() {
  const [submissionStatus, setSubmissionStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const { toast } = useToast();

  const {
    formData,
    currentStep,
    lastSaved,
    isDirty,
    isSaving,
    updateField,
    saveToServer,
    clearForm
  } = useFormState({
    formId: 'insurance-enrollment',
    autoSave: true,
    autoSaveDelay: 2000,
    enableServerSync: true
  });

  const handleSubmit = async (formData: Record<string, any>) => {
    setSubmissionStatus('submitting');
    
    try {
      // Submit form with comprehensive data
      const response = await apiRequest('POST', '/api/forms/submit', {
        formId: 'insurance-enrollment',
        formData,
        submissionType: 'enrollment'
      });

      const result = await response.json();
      setSubmissionId(result.submissionId);
      setSubmissionStatus('success');

      // Generate PDF
      try {
        const pdfResponse = await apiRequest('POST', '/api/generate-pdf', {
          submissionId: result.submissionId,
          formData,
          submissionType: 'enrollment'
        });
        
        const pdfData = await pdfResponse.json();
        setPdfUrl(pdfData.downloadUrl);
      } catch (pdfError) {
        console.warn('PDF generation failed:', pdfError);
        // Don't fail the submission if PDF generation fails
      }

      toast({
        title: "Application Submitted Successfully!",
        description: "Your enrollment application has been received. You will receive a confirmation email shortly.",
      });

    } catch (error) {
      console.error('Submission failed:', error);
      setSubmissionStatus('error');
      
      toast({
        title: "Submission Failed",
        description: "There was an error submitting your application. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSaveProgress = async () => {
    try {
      await saveToServer();
      toast({
        title: "Progress Saved",
        description: "Your application progress has been saved. You can return later to continue.",
      });
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Failed to save progress. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDownloadPDF = () => {
    if (pdfUrl) {
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = `enrollment-${submissionId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleStartNew = () => {
    clearForm();
    setSubmissionStatus('idle');
    setSubmissionId(null);
    setPdfUrl(null);
  };

  // Success state - show confirmation and options
  if (submissionStatus === 'success') {
    return (
      <div className="max-w-2xl mx-auto space-y-6 p-6">
        <Card className="border-green-200 bg-green-50">
          <CardHeader className="text-center">
            <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <CardTitle className="text-2xl text-green-800">
              Application Submitted Successfully!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center space-y-2">
              <p className="text-green-700">
                Your enrollment application has been received and is being processed.
              </p>
              <Badge variant="outline" className="text-green-700 border-green-300">
                Submission ID: {submissionId}
              </Badge>
            </div>

            <div className="grid gap-3 mt-6">
              {pdfUrl && (
                <Button onClick={handleDownloadPDF} className="w-full">
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF Copy
                </Button>
              )}
              
              <Button variant="outline" onClick={handleStartNew} className="w-full">
                <FileText className="w-4 h-4 mr-2" />
                Submit Another Application
              </Button>
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-2">What happens next?</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• You will receive a confirmation email within 15 minutes</li>
                <li>• Our team will review your application within 2 business days</li>
                <li>• We will contact you if any additional information is needed</li>
                <li>• You can check your application status using your submission ID</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (submissionStatus === 'error') {
    return (
      <div className="max-w-2xl mx-auto space-y-6 p-6">
        <Card className="border-red-200 bg-red-50">
          <CardHeader className="text-center">
            <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
            <CardTitle className="text-2xl text-red-800">
              Submission Failed
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <p className="text-red-700">
              There was an error submitting your application. Your progress has been saved.
            </p>
            <Button onClick={() => setSubmissionStatus('idle')} className="w-full">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main form
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Insurance Enrollment Application
          </h1>
          <p className="text-gray-600">
            Complete your enrollment securely with our step-by-step process
          </p>
        </div>

        {/* Progress Indicators */}
        <div className="mb-8 space-y-4">
          {/* Save Status */}
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              {isDirty ? (
                <Badge variant="outline" className="text-yellow-700 border-yellow-300">
                  Unsaved Changes
                </Badge>
              ) : lastSaved ? (
                <Badge variant="outline" className="text-green-700 border-green-300">
                  Saved {new Date(lastSaved).toLocaleTimeString()}
                </Badge>
              ) : null}
              
              {isSaving && (
                <Badge variant="outline" className="text-blue-700 border-blue-300">
                  Saving...
                </Badge>
              )}
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleSaveProgress}
              disabled={isSaving}
            >
              Save Progress
            </Button>
          </div>
        </div>

        {/* Form */}
        <EnhancedForm
          steps={enrollmentSteps}
          onSubmit={handleSubmit}
          onSave={handleSaveProgress}
          storageKey="insurance-enrollment"
          className="space-y-6"
        />

        {/* Security Notice */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-start space-x-3">
            <div className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5">
              🔒
            </div>
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-1">Your data is secure</p>
              <p>
                This form uses enterprise-level security including encryption, 
                input validation, and secure transmission. Your information is 
                protected and will only be used for processing your insurance enrollment.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}