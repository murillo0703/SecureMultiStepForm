import { createRoot } from 'react-dom/client';
import App from './App-simple';
import './index.css';
import { ThemeProvider } from '@/components/theme-provider';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { AuthProvider } from '@/hooks/use-auth';
import { applyBrandTheme } from '@/lib/brand-config';
import { Toaster } from '@/components/ui/toaster';

// Apply brand theme variables from configuration
applyBrandTheme();

createRoot(document.getElementById('root')!).render(
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="light" storageKey="murillo-theme">
      <AuthProvider>
        <App />
        <Toaster />
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);
