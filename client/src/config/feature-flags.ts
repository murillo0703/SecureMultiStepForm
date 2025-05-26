/**
 * Feature Flag Configuration
 *
 * This file contains all feature flags for the application.
 * Features can be toggled on/off by changing the values in this file.
 */

export interface FeatureFlag {
  enabled: boolean;
  description: string;
}

export interface FeatureFlagConfig {
  [key: string]: FeatureFlag;
}

// Feature flags
export const FEATURES: FeatureFlagConfig = {
  // Employee management features
  EMPLOYEE_MANAGEMENT: {
    enabled: false, // Set to false to hide employee management features
    description: 'Enable employee census management functionality',
  },

  // Carrier-specific document requirements
  CARRIER_SPECIFIC_DOCUMENTS: {
    enabled: false, // Set to false to use standard document requirements
    description: 'Enable carrier-specific document requirements',
  },

  // Enable premium calculation
  PREMIUM_CALCULATION: {
    enabled: false,
    description: 'Enable premium calculation in plan selection',
  },

  // Enable e-signatures
  E_SIGNATURE: {
    enabled: true,
    description: 'Enable e-signature capabilities',
  },
};

/**
 * Check if a feature is enabled
 * @param featureKey The feature key to check
 * @returns True if the feature is enabled, false otherwise
 */
export function isFeatureEnabled(featureKey: string): boolean {
  return FEATURES[featureKey]?.enabled || false;
}
