import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatters } from '@shared/validateFields';

interface FormInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string;
  placeholder?: string;
  type?: 'text' | 'email' | 'tel' | 'date' | 'number';
  required?: boolean;
  disabled?: boolean;
  autoComplete?: string;
  maxLength?: number;
  formatting?: 'taxId' | 'phone' | 'ssn' | 'zip';
  className?: string;
}

export function FormInput({
  id,
  label,
  value,
  onChange,
  onBlur,
  error,
  placeholder,
  type = 'text',
  required = false,
  disabled = false,
  autoComplete,
  maxLength,
  formatting,
  className = '',
}: FormInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = e.target.value;
    
    // Apply formatting if specified
    if (formatting && newValue) {
      switch (formatting) {
        case 'taxId':
          newValue = formatters.formatTaxId(newValue);
          break;
        case 'phone':
          newValue = formatters.formatPhone(newValue);
          break;
        case 'ssn':
          newValue = formatters.formatSsn(newValue);
          break;
        case 'zip':
          newValue = formatters.formatZip(newValue);
          break;
      }
    }
    
    onChange(newValue);
  };

  const getMaxLength = () => {
    if (maxLength) return maxLength;
    if (formatting === 'taxId') return 10; // XX-XXXXXXX
    if (formatting === 'phone') return 14; // (XXX) XXX-XXXX
    if (formatting === 'ssn') return 11; // XXX-XX-XXXX
    if (formatting === 'zip') return 10; // XXXXX-XXXX
    return undefined;
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <Label htmlFor={id} className="text-sm font-medium">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      <Input
        id={id}
        type={type}
        value={value}
        onChange={handleChange}
        onBlur={onBlur}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete={autoComplete}
        maxLength={getMaxLength()}
        className={`
          ${error ? 'border-red-500 focus:border-red-500' : ''}
          transition-colors duration-200
        `}
      />
      {error && (
        <p className="text-sm text-red-600 mt-1" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}