import { Request, Response } from 'express';
import fetch from 'node-fetch';
import { z } from 'zod';
import { XMLParser } from 'fast-xml-parser';

// Validation schema for address input
const addressValidationSchema = z.object({
  street: z.string().min(1, 'Street address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().length(2, 'State must be a 2-letter code'),
  zip: z.string().regex(/^\d{5}(-\d{4})?$/, 'ZIP code must be in format 12345 or 12345-6789'),
});

// USPS API integration
async function validateWithUSPS(address: z.infer<typeof addressValidationSchema>) {
  // Check if USPS API key is available
  const uspsUserId = process.env.USPS_USER_ID;
  if (!uspsUserId) {
    console.warn('USPS_USER_ID not found in environment variables');
    return { success: false, message: 'Address validation service not configured' };
  }

  try {
    // Create USPS XML request
    const xmlRequest = `
      <AddressValidateRequest USERID="${uspsUserId}">
        <Revision>1</Revision>
        <Address ID="0">
          <Address1></Address1>
          <Address2>${address.street}</Address2>
          <City>${address.city}</City>
          <State>${address.state}</State>
          <Zip5>${address.zip.split('-')[0]}</Zip5>
          <Zip4>${address.zip.includes('-') ? address.zip.split('-')[1] : ''}</Zip4>
        </Address>
      </AddressValidateRequest>
    `;

    // Call USPS API
    const response = await fetch(
      `https://secure.shippingapis.com/ShippingAPI.dll?API=Verify&XML=${encodeURIComponent(xmlRequest)}`,
      { method: 'GET' }
    );

    if (!response.ok) {
      throw new Error(`USPS API responded with status: ${response.status}`);
    }

    const xmlResponse = await response.text();
    const parser = new XMLParser({ ignoreAttributes: false });
    const result = parser.parse(xmlResponse);

    // Check for error response
    if (result.Error) {
      return {
        success: false,
        message: result.Error.Description || 'Address validation failed',
      };
    }

    // Parse successful response
    if (result.AddressValidateResponse && result.AddressValidateResponse.Address) {
      const validatedAddress = result.AddressValidateResponse.Address;
      const isDifferent =
        validatedAddress.Address2 !== address.street ||
        validatedAddress.City !== address.city ||
        validatedAddress.State !== address.state ||
        validatedAddress.Zip5 !== address.zip.split('-')[0];

      return {
        success: true,
        valid: true,
        corrected: isDifferent,
        correctedAddress: isDifferent
          ? {
              street: validatedAddress.Address2 || address.street,
              city: validatedAddress.City || address.city,
              state: validatedAddress.State || address.state,
              zip: `${validatedAddress.Zip5 || ''}${validatedAddress.Zip4 ? '-' + validatedAddress.Zip4 : ''}`,
            }
          : null,
      };
    }

    return {
      success: false,
      message: 'Unable to validate address format',
    };
  } catch (error) {
    console.error('USPS address validation error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Address validation service error',
    };
  }
}

// Express route handler
export async function validateAddress(req: Request, res: Response) {
  try {
    console.log('Validating address:', req.body);

    // Validate request body
    const validationResult = addressValidationSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid address format',
        errors: validationResult.error.format(),
      });
    }

    // Basic validation - implemented when USPS API is not available
    // This performs address validation even if the USPS API fails or isn't configured
    function basicAddressValidation(address: z.infer<typeof addressValidationSchema>) {
      const zipPattern = /^\d{5}(-\d{4})?$/;
      const statePattern = /^[A-Z]{2}$/;

      let isValid = true;
      let validationMessage = '';

      // Validate ZIP code
      if (!zipPattern.test(address.zip)) {
        isValid = false;
        validationMessage = 'ZIP code must be in format 12345 or 12345-6789';
      }

      // Validate state
      if (!statePattern.test(address.state)) {
        isValid = false;
        validationMessage = 'State must be a 2-letter code';
      }

      // Basic validation for required fields
      if (!address.street || address.street.length < 3) {
        isValid = false;
        validationMessage = 'Street address is too short or missing';
      }

      if (!address.city || address.city.length < 2) {
        isValid = false;
        validationMessage = 'City name is too short or missing';
      }

      return {
        isValid,
        message: validationMessage,
        address: address,
      };
    }

    // First perform basic validation
    const basicValidation = basicAddressValidation(validationResult.data);
    if (!basicValidation.isValid) {
      console.log('Basic validation failed:', basicValidation.message);
      return res.status(200).json({
        valid: false,
        warning: true,
        message: basicValidation.message || 'Address appears to be invalid',
      });
    }

    // Try USPS API validation
    const uspsResult = await validateWithUSPS(validationResult.data);
    console.log('USPS validation result:', uspsResult);

    if (!uspsResult.success) {
      // If USPS validation fails, we'll use our basic validation but still warn the user
      return res.status(200).json({
        valid: basicValidation.isValid,
        warning: true,
        message: uspsResult.message || "Address format validated, but couldn't verify with USPS",
      });
    }

    return res.status(200).json({
      valid: uspsResult.valid,
      corrected: uspsResult.corrected,
      correctedAddress: uspsResult.correctedAddress,
    });
  } catch (error) {
    console.error('Address validation handler error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during address validation',
    });
  }
}
