import { useState, useEffect, useCallback } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useAuth } from './use-auth';

interface SecureFormData {
  formId: string;
  userId: number;
  data: any;
  step: number;
  lastSaved: string;
  expiresAt: string;
}

export function useSecureFormStorage<T>(formId: string, initialData: T) {
  const { user } = useAuth();
  const [formData, setFormData] = useState<T>(initialData);
  const [currentStep, setCurrentStep] = useState(1);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Load saved form data
  const { data: savedData, isLoading } = useQuery<SecureFormData>({
    queryKey: [`/api/forms/${formId}/data`],
    enabled: !!user,
    retry: false,
  });

  // Auto-save mutation
  const saveFormMutation = useMutation({
    mutationFn: async (data: { formData: T; step: number }) => {
      const res = await apiRequest('POST', `/api/forms/${formId}/save`, {
        data: data.formData,
        step: data.step,
      });
      return res.json();
    },
    onSuccess: () => {
      setHasUnsavedChanges(false);
      queryClient.invalidateQueries({ queryKey: [`/api/forms/${formId}/data`] });
    },
  });

  // Load saved data when available
  useEffect(() => {
    if (savedData && !isLoading) {
      setFormData(savedData.data);
      setCurrentStep(savedData.step);
      setHasUnsavedChanges(false);
    }
  }, [savedData, isLoading]);

  // Auto-save on data changes (debounced)
  useEffect(() => {
    if (hasUnsavedChanges && user) {
      const timeoutId = setTimeout(() => {
        saveFormMutation.mutate({ formData, step: currentStep });
      }, 2000); // Auto-save after 2 seconds of inactivity

      return () => clearTimeout(timeoutId);
    }
  }, [formData, currentStep, hasUnsavedChanges, user]);

  // Update form data
  const updateFormData = useCallback((updates: Partial<T>) => {
    setFormData(prev => ({ ...prev, ...updates }));
    setHasUnsavedChanges(true);
  }, []);

  // Update step
  const updateStep = useCallback((step: number) => {
    setCurrentStep(step);
    setHasUnsavedChanges(true);
  }, []);

  // Manual save
  const saveForm = useCallback(() => {
    if (user) {
      saveFormMutation.mutate({ formData, step: currentStep });
    }
  }, [formData, currentStep, user]);

  // Clear form data
  const clearForm = useCallback(async () => {
    try {
      await apiRequest('DELETE', `/api/forms/${formId}/data`);
      setFormData(initialData);
      setCurrentStep(1);
      setHasUnsavedChanges(false);
      queryClient.invalidateQueries({ queryKey: [`/api/forms/${formId}/data`] });
    } catch (error) {
      console.error('Failed to clear form:', error);
    }
  }, [formId, initialData]);

  return {
    formData,
    currentStep,
    hasUnsavedChanges,
    isLoading,
    isSaving: saveFormMutation.isPending,
    updateFormData,
    updateStep,
    saveForm,
    clearForm,
    lastSaved: savedData?.lastSaved,
    expiresAt: savedData?.expiresAt,
  };
}