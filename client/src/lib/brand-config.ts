// Brand Configuration Utility
// This file provides access to white-labeling functionality for the Murillo Benefits Launcher

// Define the configuration interface
export interface BrandConfig {
  brandName: string;
  productName: string;
  primaryColor: string;
  accentColor: string;
  logo: string | null;
  contactEmail: string;
  contactPhone: string;
  adminPortalUrl?: string;
  privacyPolicyUrl?: string;
  termsOfServiceUrl?: string;
}

// Default configuration (Murillo branding)
export const DEFAULT_CONFIG: BrandConfig = {
  brandName: 'Murillo Insurance Agency',
  productName: 'Benefits Submission Center',
  primaryColor: '#0891b2', // Cyan-600
  accentColor: '#0e7490', // Cyan-700
  logo: null,
  contactEmail: 'support@murilloinsuranceagency.com',
  contactPhone: '(555) 123-4567',
  adminPortalUrl: '/admin/dashboard',
  privacyPolicyUrl: '/privacy-policy',
  termsOfServiceUrl: '/terms-of-service',
};

// Get the app configuration from the window object or use defaults
export function getBrandConfig(): BrandConfig {
  if (typeof window !== 'undefined' && window.AppConfig) {
    return {
      ...DEFAULT_CONFIG,
      ...window.AppConfig,
    };
  }
  return DEFAULT_CONFIG;
}

// Get the app name (combines brand and product name)
export function getAppName(): string {
  const config = getBrandConfig();
  return `${config.brandName} ${config.productName}`;
}

// Generate CSS variables for the theme colors
export function getBrandCssVariables(): Record<string, string> {
  const config = getBrandConfig();
  return {
    '--primary-color': config.primaryColor,
    '--accent-color': config.accentColor,
  };
}

// Apply the CSS variables to the document root
export function applyBrandTheme(): void {
  if (typeof document === 'undefined') return;

  const variables = getBrandCssVariables();
  const root = document.documentElement;

  Object.entries(variables).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
}

// Declare global AppConfig interface for TypeScript
declare global {
  interface Window {
    AppConfig?: Partial<BrandConfig>;
  }
}
