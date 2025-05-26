/**
 * Utility functions for formatting and validating user input
 */

/**
 * Formats a phone number input as XXX-XXX-XXXX
 * @param value The input value to format
 * @returns The formatted phone number
 */
export function formatPhoneNumber(value: string): string {
  // Remove all non-digit characters
  const digits = value.replace(/\D/g, '');

  // Format the phone number based on length
  if (digits.length <= 3) {
    return digits;
  } else if (digits.length <= 6) {
    return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  } else {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  }
}

/**
 * Formats an Employer Identification Number (EIN) as XX-XXXXXXX
 * @param value The input value to format
 * @returns The formatted EIN
 */
export function formatEIN(value: string): string {
  // Remove all non-digit characters
  const digits = value.replace(/\D/g, '');

  // Format the EIN based on length
  if (digits.length <= 2) {
    return digits;
  } else {
    return `${digits.slice(0, 2)}-${digits.slice(2, 9)}`;
  }
}

/**
 * Validates if a phone number is complete (10 digits)
 * @param value The phone number to validate
 * @returns Whether the phone number is valid
 */
export function isValidPhoneNumber(value: string): boolean {
  const digits = value.replace(/\D/g, '');
  return digits.length === 10;
}

/**
 * Validates if an EIN is complete (9 digits)
 * @param value The EIN to validate
 * @returns Whether the EIN is valid
 */
export function isValidEIN(value: string): boolean {
  const digits = value.replace(/\D/g, '');
  return digits.length === 9;
}
