import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './use-auth';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from './use-toast';

/**
 * Enhanced Form State Management Hook
 * Provides persistent form state with localStorage backup and server synchronization
 */

interface FormStateOptions {
  formId: string;
  autoSave?: boolean;
  autoSaveDelay?: number;
  enableServerSync?: boolean;
}

interface SavedFormData {
  data: Record<string, any>;
  currentStep: number;
  lastSaved: string;
  version: number;
}

interface FormStateHook {
  formData: Record<string, any>;
  currentStep: number;
  lastSaved: string | null;
  isLoading: boolean;
  isSaving: boolean;
  isDirty: boolean;
  updateField: (field: string, value: any) => void;
  updateMultipleFields: (fields: Record<string, any>) => void;
  setCurrentStep: (step: number) => void;
  saveToLocal: () => void;
  saveToServer: () => Promise<void>;
  loadFromServer: () => Promise<void>;
  clearForm: () => void;
  restoreVersion: (version: SavedFormData) => void;
  getFormSummary: () => Array<{ label: string; value: any; step: number }>;
}

export function useFormState({
  formId,
  autoSave = true,
  autoSaveDelay = 2000,
  enableServerSync = true
}: FormStateOptions): FormStateHook {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [currentStep, setCurrentStepState] = useState(0);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [autoSaveTimeout, setAutoSaveTimeout] = useState<NodeJS.Timeout | null>(null);

  const { user } = useAuth();
  const { toast } = useToast();

  const storageKey = `form-${formId}`;
  const stepKey = `form-${formId}-step`;

  // Load initial data from localStorage
  useEffect(() => {
    const savedData = localStorage.getItem(storageKey);
    const savedStep = localStorage.getItem(stepKey);

    if (savedData) {
      try {
        const parsedData: SavedFormData = JSON.parse(savedData);
        setFormData(parsedData.data);
        setLastSaved(parsedData.lastSaved);
        
        if (savedStep) {
          setCurrentStepState(parseInt(savedStep, 10));
        }
      } catch (error) {
        console.warn('Failed to load form data from localStorage:', error);
      }
    }

    // Load from server if authenticated
    if (enableServerSync && user) {
      loadFromServer();
    }
  }, [formId, user, enableServerSync]);

  // Auto-save functionality
  useEffect(() => {
    if (autoSave && isDirty) {
      if (autoSaveTimeout) {
        clearTimeout(autoSaveTimeout);
      }

      const timeout = setTimeout(() => {
        saveToLocal();
        if (enableServerSync && user) {
          saveToServer();
        }
      }, autoSaveDelay);

      setAutoSaveTimeout(timeout);

      return () => clearTimeout(timeout);
    }
  }, [formData, currentStep, isDirty, autoSave, autoSaveDelay]);

  // Save to localStorage
  const saveToLocal = useCallback(() => {
    const saveData: SavedFormData = {
      data: formData,
      currentStep,
      lastSaved: new Date().toISOString(),
      version: Date.now()
    };

    localStorage.setItem(storageKey, JSON.stringify(saveData));
    localStorage.setItem(stepKey, currentStep.toString());
    setLastSaved(saveData.lastSaved);
    setIsDirty(false);
  }, [formData, currentStep, storageKey, stepKey]);

  // Save to server
  const saveToServer = useCallback(async (): Promise<void> => {
    if (!user || !enableServerSync) return;

    setIsSaving(true);
    try {
      await apiRequest('POST', '/api/forms/save-progress', {
        formId,
        data: formData,
        currentStep,
        lastSaved: new Date().toISOString()
      });

      const now = new Date().toISOString();
      setLastSaved(now);
      setIsDirty(false);

      toast({
        title: "Progress Saved",
        description: "Your form progress has been saved to the server.",
      });
    } catch (error) {
      console.error('Failed to save to server:', error);
      toast({
        title: "Save Failed",
        description: "Failed to save progress to server. Your data is still saved locally.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  }, [user, enableServerSync, formId, formData, currentStep, toast]);

  // Load from server
  const loadFromServer = useCallback(async (): Promise<void> => {
    if (!user || !enableServerSync) return;

    setIsLoading(true);
    try {
      const response = await apiRequest('GET', `/api/forms/load-progress/${formId}`);
      const serverData = await response.json();

      if (serverData.data) {
        setFormData(serverData.data);
        setCurrentStepState(serverData.currentStep || 0);
        setLastSaved(serverData.lastSaved);
        setIsDirty(false);

        // Update localStorage with server data
        const saveData: SavedFormData = {
          data: serverData.data,
          currentStep: serverData.currentStep || 0,
          lastSaved: serverData.lastSaved,
          version: Date.now()
        };
        localStorage.setItem(storageKey, JSON.stringify(saveData));
        localStorage.setItem(stepKey, (serverData.currentStep || 0).toString());
      }
    } catch (error) {
      console.warn('Failed to load from server, using local data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, enableServerSync, formId, storageKey, stepKey]);

  // Update single field
  const updateField = useCallback((field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
  }, []);

  // Update multiple fields
  const updateMultipleFields = useCallback((fields: Record<string, any>) => {
    setFormData(prev => ({ ...prev, ...fields }));
    setIsDirty(true);
  }, []);

  // Set current step
  const setCurrentStep = useCallback((step: number) => {
    setCurrentStepState(step);
    setIsDirty(true);
  }, []);

  // Clear form data
  const clearForm = useCallback(() => {
    setFormData({});
    setCurrentStepState(0);
    setLastSaved(null);
    setIsDirty(false);
    localStorage.removeItem(storageKey);
    localStorage.removeItem(stepKey);
  }, [storageKey, stepKey]);

  // Restore from a specific version
  const restoreVersion = useCallback((version: SavedFormData) => {
    setFormData(version.data);
    setCurrentStepState(version.currentStep);
    setLastSaved(version.lastSaved);
    setIsDirty(true);
  }, []);

  // Get form summary for review
  const getFormSummary = useCallback(() => {
    const summary: Array<{ label: string; value: any; step: number }> = [];
    
    Object.entries(formData).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        // Convert camelCase to readable labels
        const label = key
          .replace(/([A-Z])/g, ' $1')
          .replace(/^./, str => str.toUpperCase())
          .trim();
        
        summary.push({
          label,
          value,
          step: 0 // This should be mapped to actual step numbers
        });
      }
    });

    return summary;
  }, [formData]);

  return {
    formData,
    currentStep,
    lastSaved,
    isLoading,
    isSaving,
    isDirty,
    updateField,
    updateMultipleFields,
    setCurrentStep,
    saveToLocal,
    saveToServer,
    loadFromServer,
    clearForm,
    restoreVersion,
    getFormSummary
  };
}