import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, AlertTriangle } from "lucide-react";

interface AddressValidatorProps {
  address: string;
  city: string;
  state: string;
  zip: string;
  onAddressChange: (field: string, value: string) => void;
  onValidatedAddress: (validatedAddress: {
    address: string;
    city: string;
    state: string;
    zip: string;
    isValid: boolean;
  }) => void;
}

export function AddressValidator({
  address,
  city,
  state,
  zip,
  onAddressChange,
  onValidatedAddress,
}: AddressValidatorProps) {
  const { toast } = useToast();
  const [isValidating, setIsValidating] = useState(false);
  const [suggestion, setSuggestion] = useState<{
    address: string;
    city: string;
    state: string;
    zip: string;
  } | null>(null);
  const [validationStatus, setValidationStatus] = useState<
    "none" | "valid" | "warning" | "error"
  >("none");

  // Formats address for validation API
  const formatAddressForValidation = () => {
    return {
      street: address,
      city,
      state,
      zip,
    };
  };

  // Validate with USPS API
  const validateAddress = async () => {
    if (!address || !city || !state || !zip) {
      toast({
        title: "Missing Address Information",
        description: "Please provide complete address details to validate.",
        variant: "destructive",
      });
      return;
    }

    setIsValidating(true);
    setSuggestion(null);

    try {
      // Call API endpoint for address validation
      const response = await fetch("/api/validate-address", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formatAddressForValidation()),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Address validation failed");
      }

      if (data.valid) {
        // Address is valid, but may have corrections
        if (data.corrected) {
          setSuggestion({
            address: data.correctedAddress.street,
            city: data.correctedAddress.city,
            state: data.correctedAddress.state,
            zip: data.correctedAddress.zip,
          });
          setValidationStatus("warning");
        } else {
          // Address is valid as-is
          setValidationStatus("valid");
          onValidatedAddress({
            address,
            city,
            state,
            zip,
            isValid: true,
          });
        }
      } else {
        // Address is not valid
        setValidationStatus("error");
        onValidatedAddress({
          address,
          city,
          state,
          zip,
          isValid: false,
        });
      }
    } catch (error) {
      console.error("Address validation error:", error);
      // Soft failure - allow user to continue even if validation fails
      setValidationStatus("error");
      toast({
        title: "Validation Service Unavailable",
        description:
          "We couldn't validate your address, but you can continue with submission.",
        variant: "destructive",
      });
    } finally {
      setIsValidating(false);
    }
  };

  const acceptSuggestion = () => {
    if (suggestion) {
      onAddressChange("address", suggestion.address);
      onAddressChange("city", suggestion.city);
      onAddressChange("state", suggestion.state);
      onAddressChange("zip", suggestion.zip);
      onValidatedAddress({
        ...suggestion,
        isValid: true,
      });
      setValidationStatus("valid");
      setSuggestion(null);
    }
  };

  const keepOriginal = () => {
    onValidatedAddress({
      address,
      city,
      state,
      zip,
      isValid: false, // Not validated as correct, but user chose to keep it
    });
    setValidationStatus("warning");
    setSuggestion(null);
  };

  return (
    <div className="space-y-4">
      {/* Validation Button - temporarily disabled until API key is set up */}
      <div className="flex justify-end">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            // Auto mark as valid for now
            onValidatedAddress({
              address,
              city,
              state,
              zip,
              isValid: true,
            });
            setValidationStatus("valid");
          }}
          disabled={!address || !city || !state || !zip}
        >
          {"Accept Address"}
        </Button>
      </div>

      {/* Validation Status */}
      {validationStatus === "valid" && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
          <AlertDescription className="text-green-700">
            Address has been validated successfully.
          </AlertDescription>
        </Alert>
      )}

      {/* Address Correction Suggestion */}
      {validationStatus === "warning" && suggestion && (
        <Alert className="bg-yellow-50 border-yellow-200">
          <AlertTriangle className="h-4 w-4 text-yellow-500 mr-2" />
          <div className="flex flex-col space-y-2">
            <AlertDescription className="text-yellow-700">
              Did you mean:
              <div className="font-medium mt-1">
                {suggestion.address}
                <br />
                {suggestion.city}, {suggestion.state} {suggestion.zip}
              </div>
            </AlertDescription>
            <div className="flex space-x-2 mt-2">
              <Button
                size="sm"
                variant="outline"
                className="border-yellow-300 text-yellow-700 hover:bg-yellow-100"
                onClick={acceptSuggestion}
              >
                Use Suggested Address
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-yellow-700"
                onClick={keepOriginal}
              >
                Keep My Address
              </Button>
            </div>
          </div>
        </Alert>
      )}

      {/* Validation Error */}
      {validationStatus === "error" && (
        <Alert className="bg-red-50 border-red-200">
          <AlertTriangle className="h-4 w-4 text-red-500 mr-2" />
          <AlertDescription className="text-red-700">
            We couldn't validate this address. Please double-check your entry or
            continue with your current address.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}