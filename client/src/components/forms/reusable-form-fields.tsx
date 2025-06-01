import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle } from 'lucide-react';

interface FormFieldProps {
  label: string;
  name: string;
  value: string | boolean;
  onChange: (value: any) => void;
  error?: string;
  required?: boolean;
  placeholder?: string;
  type?: 'text' | 'email' | 'tel' | 'number' | 'date';
  autoComplete?: string;
  disabled?: boolean;
}

interface SelectFieldProps extends Omit<FormFieldProps, 'type'> {
  options: { value: string; label: string }[];
  placeholder?: string;
}

interface TextareaFieldProps extends Omit<FormFieldProps, 'type'> {
  rows?: number;
}

export function FormField({ 
  label, 
  name, 
  value, 
  onChange, 
  error, 
  required, 
  placeholder, 
  type = 'text',
  autoComplete,
  disabled 
}: FormFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name} className={required ? "after:content-['*'] after:text-red-500 after:ml-1" : ""}>
        {label}
      </Label>
      <Input
        id={name}
        type={type}
        value={value as string}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        disabled={disabled}
        className={error ? 'border-red-500' : ''}
      />
      {error && (
        <div className="flex items-center gap-1 text-sm text-red-600">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}
    </div>
  );
}

export function SelectField({ 
  label, 
  name, 
  value, 
  onChange, 
  options, 
  error, 
  required, 
  placeholder = "Select an option",
  disabled 
}: SelectFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name} className={required ? "after:content-['*'] after:text-red-500 after:ml-1" : ""}>
        {label}
      </Label>
      <Select value={value as string} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger className={error ? 'border-red-500' : ''}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && (
        <div className="flex items-center gap-1 text-sm text-red-600">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}
    </div>
  );
}

export function CheckboxField({ 
  label, 
  name, 
  value, 
  onChange, 
  error, 
  disabled 
}: Omit<FormFieldProps, 'type' | 'placeholder'>) {
  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-2">
        <Checkbox
          id={name}
          checked={value as boolean}
          onCheckedChange={onChange}
          disabled={disabled}
        />
        <Label
          htmlFor={name}
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          {label}
        </Label>
      </div>
      {error && (
        <div className="flex items-center gap-1 text-sm text-red-600">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}
    </div>
  );
}

export function TextareaField({ 
  label, 
  name, 
  value, 
  onChange, 
  error, 
  required, 
  placeholder, 
  rows = 3,
  disabled 
}: TextareaFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name} className={required ? "after:content-['*'] after:text-red-500 after:ml-1" : ""}>
        {label}
      </Label>
      <Textarea
        id={name}
        value={value as string}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        disabled={disabled}
        className={error ? 'border-red-500' : ''}
      />
      {error && (
        <div className="flex items-center gap-1 text-sm text-red-600">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}
    </div>
  );
}

// Phone number formatter
export function formatPhoneNumber(value: string): string {
  const cleaned = value.replace(/\D/g, '');
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
  if (match) {
    return `(${match[1]}) ${match[2]}-${match[3]}`;
  }
  return value;
}

// Tax ID formatter
export function formatTaxId(value: string): string {
  const cleaned = value.replace(/\D/g, '');
  const match = cleaned.match(/^(\d{2})(\d{7})$/);
  if (match) {
    return `${match[1]}-${match[2]}`;
  }
  return value;
}

// ZIP code formatter
export function formatZipCode(value: string): string {
  const cleaned = value.replace(/\D/g, '');
  if (cleaned.length <= 5) {
    return cleaned;
  }
  const match = cleaned.match(/^(\d{5})(\d{4})$/);
  if (match) {
    return `${match[1]}-${match[2]}`;
  }
  return cleaned.slice(0, 9);
}

// Form validation utilities
export const validators = {
  required: (value: any) => !value ? 'This field is required' : null,
  email: (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return !emailRegex.test(value) ? 'Please enter a valid email address' : null;
  },
  phone: (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    return cleaned.length !== 10 ? 'Phone number must be 10 digits' : null;
  },
  taxId: (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    return cleaned.length !== 9 ? 'Tax ID must be 9 digits' : null;
  },
  zipCode: (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    return cleaned.length < 5 ? 'ZIP code must be at least 5 digits' : null;
  },
  percentage: (value: string) => {
    const num = parseFloat(value);
    return isNaN(num) || num < 0 || num > 100 ? 'Must be a percentage between 0 and 100' : null;
  },
};

// Validate entire form
export function validateForm(data: Record<string, any>, rules: Record<string, ((value: any) => string | null)[]>): Record<string, string> {
  const errors: Record<string, string> = {};
  
  Object.keys(rules).forEach(field => {
    const value = data[field];
    const fieldRules = rules[field];
    
    for (const rule of fieldRules) {
      const error = rule(value);
      if (error) {
        errors[field] = error;
        break; // Stop at first error for each field
      }
    }
  });
  
  return errors;
}