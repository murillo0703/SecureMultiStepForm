import { useState, useEffect } from 'react';

export type Step = {
  id: string;
  label: string;
  component: React.ReactNode;
  validator?: () => boolean;
};

type FormData = Record<string, any>;

interface UseMultistepFormProps {
  steps: Step[];
  initialData?: FormData;
  onComplete?: (data: FormData) => void;
  saveData?: (data: FormData) => void;
}

export function useMultistepForm({
  steps,
  initialData = {},
  onComplete,
  saveData,
}: UseMultistepFormProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [formData, setFormData] = useState<FormData>(initialData);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);

  // Update form data and trigger save
  const updateFormData = (newData: Partial<FormData>) => {
    const updatedData = { ...formData, ...newData };
    setFormData(updatedData);

    // Auto-save with debounce
    setIsSaving(true);
    if (saveData) {
      const timeoutId = setTimeout(() => {
        saveData(updatedData);
        setIsSaving(false);
      }, 1000);

      return () => clearTimeout(timeoutId);
    }
  };

  // Mark the current step as completed
  const completeCurrentStep = () => {
    const currentStep = steps[currentStepIndex];
    if (!completedSteps.includes(currentStep.id)) {
      setCompletedSteps([...completedSteps, currentStep.id]);
    }
  };

  // Navigate to the next step
  const nextStep = () => {
    const currentStep = steps[currentStepIndex];

    // Check if step has a validator function
    if (currentStep.validator && !currentStep.validator()) {
      return false;
    }

    completeCurrentStep();

    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
      return true;
    } else {
      // We've reached the end of the form
      setIsCompleted(true);
      if (onComplete) {
        onComplete(formData);
      }
      return true;
    }
  };

  // Navigate to the previous step
  const prevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
      return true;
    }
    return false;
  };

  // Go to a specific step
  const goToStep = (index: number) => {
    if (index >= 0 && index < steps.length) {
      setCurrentStepIndex(index);
      return true;
    }
    return false;
  };

  // Go to a step by ID
  const goToStepById = (stepId: string) => {
    const stepIndex = steps.findIndex(step => step.id === stepId);
    if (stepIndex !== -1) {
      return goToStep(stepIndex);
    }
    return false;
  };

  // Check if step is completed
  const isStepCompleted = (stepId: string) => {
    return completedSteps.includes(stepId);
  };

  return {
    currentStepIndex,
    currentStep: steps[currentStepIndex],
    steps,
    formData,
    isCompleted,
    isSaving,
    completedSteps,
    isStepCompleted,
    updateFormData,
    nextStep,
    prevStep,
    goToStep,
    goToStepById,
    progress: {
      current: currentStepIndex + 1,
      total: steps.length,
      percentage: Math.round(((currentStepIndex + 1) / steps.length) * 100),
      completedCount: completedSteps.length,
    },
  };
}
