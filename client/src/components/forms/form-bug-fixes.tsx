import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, CheckCircle2, ArrowLeft, ArrowRight, Save } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';

/**
 * Form Bug Fixes Implementation
 * Addresses all 10 reported issues:
 * 1. Progress bar synchronization
 * 2. Auto-population of owner fields
 * 3. Date picker improvements
 * 4. Save and return functionality
 * 5. Input validation
 * 6. Summary/edit capabilities
 * 7. Accessibility improvements
 * 8. Format validation
 * 9. Submission feedback
 * 10. Multiple submission prevention
 */

interface FormStep {
  id: string;
  title: string;
  fields: FormField[];
}

interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'tel' | 'date' | 'select' | 'textarea';
  required?: boolean;
  options?: { value: string; label: string }[];
  validation?: (value: string) => string | null;
  autoPopulateFrom?: string;
}

interface FormProps {
  steps: FormStep[];
  onSubmit: (data: Record<string, any>) => Promise<void>;
  storageKey?: string;
}

export function EnhancedForm({ steps, onSubmit, storageKey = 'enrollment-form' }: FormProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [showSummary, setShowSummary] = useState(false);
  const { toast } = useToast();

  // Load saved data on mount
  useEffect(() => {
    const savedData = localStorage.getItem(storageKey);
    const savedStep = localStorage.getItem(`${storageKey}-step`);
    
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        setFormData(parsedData);
        handleOwnerAutoPopulation(parsedData);
      } catch (error) {
        console.warn('Failed to load saved data:', error);
      }
    }
    
    if (savedStep) {
      const step = parseInt(savedStep, 10);
      if (step >= 0 && step < steps.length) {
        setCurrentStep(step);
      }
    }
  }, [storageKey, steps.length]);

  // Save data whenever it changes
  useEffect(() => {
    if (Object.keys(formData).length > 0) {
      localStorage.setItem(storageKey, JSON.stringify(formData));
      localStorage.setItem(`${storageKey}-step`, currentStep.toString());
    }
  }, [formData, currentStep, storageKey]);

  // Fix #2: Auto-populate owner fields when initiator is owner
  const handleOwnerAutoPopulation = useCallback((data: Record<string, any>) => {
    if (data.isOwner === 'yes' || data.isOwner === true) {
      // Map initiator/contact fields to owner fields
      const fieldMappings = {
        ownerName: data.contactName || data.initiatorName || data.firstName + ' ' + data.lastName,
        ownerEmail: data.contactEmail || data.initiatorEmail || data.email,
        ownerPhone: data.contactPhone || data.initiatorPhone || data.phone,
        ownerAddress: data.contactAddress || data.initiatorAddress || data.address
      };
      
      // Update form data with mapped values, but don't overwrite existing values
      const updates: Record<string, any> = {};
      Object.entries(fieldMappings).forEach(([ownerField, sourceValue]) => {
        if (sourceValue && (!data[ownerField] || data[ownerField] === '')) {
          updates[ownerField] = sourceValue;
        }
      });
      
      if (Object.keys(updates).length > 0) {
        setFormData(prev => ({
          ...prev,
          ...updates
        }));
      }
    }
  }, []);

  // Fix #5: Input validation
  const validateField = useCallback((fieldName: string, value: string): string | null => {
    const field = steps.flatMap(step => step.fields).find(f => f.name === fieldName);
    if (!field) return null;

    // Required field validation
    if (field.required && (!value || value.trim() === '')) {
      return `${field.label} is required`;
    }

    // Type-specific validation
    switch (field.type) {
      case 'email':
        if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          return 'Please enter a valid email address';
        }
        break;
      case 'tel':
        if (value && !/^\+?[\d\s\-\(\)]+$/.test(value)) {
          return 'Please enter a valid phone number';
        }
        break;
      case 'date':
        if (value) {
          const date = new Date(value);
          if (isNaN(date.getTime())) {
            return 'Please enter a valid date';
          }
          // Fix #3: Prevent future dates for birth dates
          if (fieldName.includes('dob') && date > new Date()) {
            return 'Date of birth cannot be in the future';
          }
        }
        break;
    }

    // Custom validation
    if (field.validation) {
      return field.validation(value);
    }

    return null;
  }, [steps]);

  // Handle field changes with real-time validation
  const handleFieldChange = (fieldName: string, value: string) => {
    setFormData(prev => {
      const newData = { ...prev, [fieldName]: value };
      
      // Trigger auto-population immediately when isOwner changes to 'yes'
      if (fieldName === 'isOwner' && value === 'yes') {
        setTimeout(() => handleOwnerAutoPopulation(newData), 0);
      } else {
        handleOwnerAutoPopulation(newData);
      }
      
      return newData;
    });

    // Clear existing error
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });

    // Real-time validation
    const error = validateField(fieldName, value);
    if (error) {
      setErrors(prev => ({ ...prev, [fieldName]: error }));
    }
  };

  // Fix #1: Progress bar synchronization
  const updateProgressBar = useCallback(() => {
    // Calculate progress based on completed steps plus current step progress
    const baseProgress = (currentStep / steps.length) * 100;
    const currentStepProgress = (1 / steps.length) * 100;
    
    // Add partial progress for current step if any fields are filled
    const currentStepFields = steps[currentStep]?.fields || [];
    const filledFields = currentStepFields.filter(field => 
      formData[field.name] && formData[field.name].toString().trim() !== ''
    );
    const stepCompletion = filledFields.length / currentStepFields.length;
    
    return baseProgress + (currentStepProgress * stepCompletion);
  }, [currentStep, steps.length, formData]);

  // Validate current step
  const validateCurrentStep = (): boolean => {
    const currentStepData = steps[currentStep];
    const stepErrors: Record<string, string> = {};
    
    currentStepData.fields.forEach(field => {
      const value = formData[field.name] || '';
      const error = validateField(field.name, value);
      if (error) {
        stepErrors[field.name] = error;
      }
    });

    setErrors(stepErrors);
    return Object.keys(stepErrors).length === 0;
  };

  // Navigation functions
  const handleNext = () => {
    if (!validateCurrentStep()) {
      // Focus first error field
      const firstError = Object.keys(errors)[0];
      if (firstError) {
        const element = document.getElementById(firstError);
        element?.focus();
        element?.scrollIntoView({ behavior: 'smooth' });
      }
      return;
    }

    setCompletedSteps(prev => new Set([...prev, currentStep]));
    
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      // Show summary before final submission
      setShowSummary(true);
    }
  };

  const handlePrevious = () => {
    if (showSummary) {
      setShowSummary(false);
    } else if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  // Fix #6: Edit capability from summary
  const handleEditStep = (stepIndex: number) => {
    setShowSummary(false);
    setCurrentStep(stepIndex);
  };

  // Fix #4: Save progress
  const handleSaveProgress = async () => {
    try {
      // Data is already saved to localStorage in useEffect
      toast({
        title: "Progress Saved",
        description: "Your progress has been saved. You can return later to continue.",
      });
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Failed to save progress. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Fix #9 & #10: Submission with feedback and prevention of multiple submissions
  const handleSubmit = async () => {
    if (!validateCurrentStep()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      
      // Clear saved data after successful submission
      localStorage.removeItem(storageKey);
      localStorage.removeItem(`${storageKey}-step`);
      
      toast({
        title: "Application Submitted",
        description: "Your enrollment application has been submitted successfully. You will receive a confirmation email shortly.",
      });
    } catch (error) {
      toast({
        title: "Submission Failed",
        description: "Failed to submit application. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Fix #8: Format validation for specific fields
  const formatters = {
    phone: (value: string) => {
      const cleaned = value.replace(/\D/g, '');
      if (cleaned.length === 10) {
        return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
      }
      return value;
    },
    ssn: (value: string) => {
      const cleaned = value.replace(/\D/g, '');
      if (cleaned.length === 9) {
        return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 5)}-${cleaned.slice(5)}`;
      }
      return value;
    },
    zip: (value: string) => {
      const cleaned = value.replace(/\D/g, '');
      if (cleaned.length === 5) {
        return cleaned;
      } else if (cleaned.length === 9) {
        return `${cleaned.slice(0, 5)}-${cleaned.slice(5)}`;
      }
      return value;
    }
  };

  // Render form field with accessibility improvements
  const renderField = (field: FormField) => {
    const fieldValue = formData[field.name] || '';
    const fieldError = errors[field.name];
    const fieldId = field.name;

    return (
      <div key={field.name} className="space-y-2">
        <Label 
          htmlFor={fieldId}
          className={`text-sm font-medium ${field.required ? "after:content-['*'] after:text-red-500 after:ml-1" : ''}`}
        >
          {field.label}
        </Label>
        
        {field.type === 'select' ? (
          <Select 
            value={fieldValue} 
            onValueChange={(value) => handleFieldChange(field.name, value)}
          >
            <SelectTrigger 
              id={fieldId}
              className={fieldError ? 'border-red-500' : ''}
              aria-invalid={!!fieldError}
              aria-describedby={fieldError ? `${fieldId}-error` : undefined}
            >
              <SelectValue placeholder="Select an option" />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : field.type === 'textarea' ? (
          <Textarea
            id={fieldId}
            value={fieldValue}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            className={fieldError ? 'border-red-500' : ''}
            aria-invalid={!!fieldError}
            aria-describedby={fieldError ? `${fieldId}-error` : undefined}
            rows={4}
          />
        ) : (
          <Input
            id={fieldId}
            type={field.type}
            value={fieldValue}
            onChange={(e) => {
              let value = e.target.value;
              
              // Apply formatters
              if (field.name.includes('phone') && formatters.phone) {
                value = formatters.phone(value);
              } else if (field.name.includes('ssn') && formatters.ssn) {
                value = formatters.ssn(value);
              } else if (field.name.includes('zip') && formatters.zip) {
                value = formatters.zip(value);
              }
              
              handleFieldChange(field.name, value);
            }}
            className={fieldError ? 'border-red-500' : ''}
            aria-invalid={!!fieldError}
            aria-describedby={fieldError ? `${fieldId}-error` : undefined}
            // Fix #3: Prevent iOS zoom on date inputs
            style={field.type === 'date' ? { fontSize: '16px' } : undefined}
          />
        )}
        
        {fieldError && (
          <div id={`${fieldId}-error`} className="flex items-center gap-1 text-sm text-red-600" role="alert">
            <AlertCircle className="w-4 h-4" />
            <span>{fieldError}</span>
          </div>
        )}
      </div>
    );
  };

  // Summary view for review before submission
  if (showSummary) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Review Your Application</CardTitle>
            <p className="text-sm text-gray-600">
              Please review all information before submitting. Click "Edit" to make changes.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {steps.map((step, stepIndex) => (
              <div key={step.id} className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">{step.title}</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditStep(stepIndex)}
                  >
                    Edit
                  </Button>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  {step.fields.map(field => (
                    <div key={field.name} className="space-y-1">
                      <Label className="text-sm font-medium text-gray-700">
                        {field.label}
                      </Label>
                      <p className="text-sm text-gray-900">
                        {formData[field.name] || 'Not provided'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={handlePrevious}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting}
            className="flex items-center gap-2"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Application'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Fixed Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>Step {currentStep + 1} of {steps.length}</span>
          <span>{Math.round(updateProgressBar())}% Complete</span>
        </div>
        <Progress value={updateProgressBar()} className="w-full" />
      </div>

      {/* Step Navigation */}
      <div className="flex items-center justify-center space-x-2 overflow-x-auto">
        {steps.map((step, index) => (
          <button
            key={step.id}
            onClick={() => {
              if (completedSteps.has(index) || index <= currentStep) {
                setCurrentStep(index);
              }
            }}
            disabled={!completedSteps.has(index) && index > currentStep}
            className={`
              px-3 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap
              ${index === currentStep 
                ? 'bg-blue-600 text-white' 
                : completedSteps.has(index)
                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }
            `}
          >
            {completedSteps.has(index) && <CheckCircle2 className="w-3 h-3 inline mr-1" />}
            {step.title}
          </button>
        ))}
      </div>

      {/* Current Step Form */}
      <Card>
        <CardHeader>
          <CardTitle>{steps[currentStep].title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            {steps[currentStep].fields.map(renderField)}
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentStep === 0}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Previous
        </Button>

        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            onClick={handleSaveProgress}
            className="flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Save Progress
          </Button>

          <Button onClick={handleNext}>
            {currentStep === steps.length - 1 ? 'Review' : 'Next'}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}