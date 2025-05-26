import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { formatPhoneNumber, formatEIN, isValidPhoneNumber, isValidEIN } from '@/utils/format-masks';

export type FormatType = 'phone' | 'ein';

interface FormattedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  formatType: FormatType;
  onValueChange?: (value: string, isValid: boolean) => void;
}

export function FormattedInput({
  formatType,
  onValueChange,
  value: initialValue = '',
  ...props
}: FormattedInputProps) {
  const [value, setValue] = useState(() => {
    // Format the initial value on first render
    if (typeof initialValue === 'string') {
      if (formatType === 'phone') {
        return formatPhoneNumber(initialValue);
      } else if (formatType === 'ein') {
        return formatEIN(initialValue);
      }
    }
    return initialValue as string;
  });

  const [isValid, setIsValid] = useState(false);
  const isInitialMount = useRef(true);

  // Format the input value when it changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    let formattedValue = '';
    let validationResult = false;

    if (formatType === 'phone') {
      formattedValue = formatPhoneNumber(inputValue);
      validationResult = isValidPhoneNumber(formattedValue);
    } else if (formatType === 'ein') {
      formattedValue = formatEIN(inputValue);
      validationResult = isValidEIN(formattedValue);
    }

    setValue(formattedValue);
    setIsValid(validationResult);

    if (onValueChange) {
      onValueChange(formattedValue, validationResult);
    }
  };

  // Update internal state when initialValue changes
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (initialValue !== value) {
      let formattedValue = initialValue as string;
      let validationResult = false;

      if (formatType === 'phone') {
        formattedValue = formatPhoneNumber(initialValue as string);
        validationResult = isValidPhoneNumber(formattedValue);
      } else if (formatType === 'ein') {
        formattedValue = formatEIN(initialValue as string);
        validationResult = isValidEIN(formattedValue);
      }

      setValue(formattedValue);
      setIsValid(validationResult);

      if (onValueChange) {
        onValueChange(formattedValue, validationResult);
      }
    }
  }, [initialValue, formatType, onValueChange, value]);

  return (
    <Input
      {...props}
      value={value}
      onChange={handleChange}
      className={`${props.className || ''} ${!isValid && value ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
    />
  );
}
