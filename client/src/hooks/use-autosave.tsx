import { useEffect, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface AutosaveOptions {
  endpoint: string;
  data: any;
  delay?: number;
  enabled?: boolean;
}

export function useAutosave({ endpoint, data, delay = 2000, enabled = true }: AutosaveOptions) {
  const { toast } = useToast();
  const timeoutRef = useRef<NodeJS.Timeout>();
  const previousDataRef = useRef<string>('');

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest('POST', endpoint, data);
      return await res.json();
    },
    onSuccess: () => {
      // Subtle success indication - no toast spam
      console.log('Data auto-saved successfully');
    },
    onError: (error: any) => {
      toast({
        title: 'Auto-save failed',
        description: "Your changes couldn't be saved automatically. Please save manually.",
        variant: 'destructive',
      });
    },
  });

  useEffect(() => {
    if (!enabled || !data) return;

    const currentDataString = JSON.stringify(data);

    // Only save if data has actually changed
    if (currentDataString === previousDataRef.current) return;

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout for autosave
    timeoutRef.current = setTimeout(() => {
      previousDataRef.current = currentDataString;
      saveMutation.mutate(data);
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, endpoint, delay, enabled, saveMutation]);

  return {
    isSaving: saveMutation.isPending,
    saveNow: () => saveMutation.mutate(data),
  };
}
