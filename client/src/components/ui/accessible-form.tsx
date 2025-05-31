import React, { useState, useId } from 'react';
import { cn } from '@/lib/utils';

interface AccessibleFormFieldProps {
  label: string;
  error?: string;
  required?: boolean;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function AccessibleFormField({
  label,
  error,
  required = false,
  description,
  children,
  className
}: AccessibleFormFieldProps) {
  const fieldId = useId();
  const errorId = `${fieldId}-error`;
  const descriptionId = `${fieldId}-description`;

  return (
    <div className={cn("space-y-2", className)}>
      <label
        htmlFor={fieldId}
        className="block text-sm font-medium text-gray-900 dark:text-gray-100"
      >
        {label}
        {required && (
          <span
            className="text-red-500 ml-1"
            aria-label="required field"
          >
            *
          </span>
        )}
      </label>
      
      {description && (
        <p
          id={descriptionId}
          className="text-sm text-gray-600 dark:text-gray-400"
        >
          {description}
        </p>
      )}
      
      <div className="relative">
        {React.cloneElement(children as React.ReactElement, {
          id: fieldId,
          'aria-describedby': [
            description ? descriptionId : '',
            error ? errorId : ''
          ].filter(Boolean).join(' '),
          'aria-invalid': error ? 'true' : 'false',
          'aria-required': required,
          className: cn(
            error && "border-red-500 focus:border-red-500 focus:ring-red-500"
          )
        })}
        
        {error && (
          <div
            id={errorId}
            className="mt-1 text-sm text-red-600 dark:text-red-400"
            role="alert"
            aria-live="polite"
          >
            {error}
          </div>
        )}
      </div>
    </div>
  );
}

interface AccessibleInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  description?: string;
  containerClassName?: string;
}

export function AccessibleInput({
  label,
  error,
  description,
  required,
  containerClassName,
  className,
  ...props
}: AccessibleInputProps) {
  return (
    <AccessibleFormField
      label={label}
      error={error}
      required={required}
      description={description}
      className={containerClassName}
    >
      <input
        className={cn(
          "block w-full rounded-md border-gray-300 dark:border-gray-600",
          "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100",
          "shadow-sm focus:border-primary focus:ring-primary",
          "disabled:cursor-not-allowed disabled:bg-gray-50 dark:disabled:bg-gray-900",
          "sm:text-sm transition-colors duration-200",
          className
        )}
        {...props}
      />
    </AccessibleFormField>
  );
}

interface AccessibleSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  description?: string;
  options: Array<{ value: string; label: string; disabled?: boolean }>;
  placeholder?: string;
  containerClassName?: string;
}

export function AccessibleSelect({
  label,
  error,
  description,
  required,
  options,
  placeholder,
  containerClassName,
  className,
  ...props
}: AccessibleSelectProps) {
  return (
    <AccessibleFormField
      label={label}
      error={error}
      required={required}
      description={description}
      className={containerClassName}
    >
      <select
        className={cn(
          "block w-full rounded-md border-gray-300 dark:border-gray-600",
          "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100",
          "shadow-sm focus:border-primary focus:ring-primary",
          "disabled:cursor-not-allowed disabled:bg-gray-50 dark:disabled:bg-gray-900",
          "sm:text-sm transition-colors duration-200",
          className
        )}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </option>
        ))}
      </select>
    </AccessibleFormField>
  );
}

interface AccessibleTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  description?: string;
  containerClassName?: string;
}

export function AccessibleTextarea({
  label,
  error,
  description,
  required,
  containerClassName,
  className,
  ...props
}: AccessibleTextareaProps) {
  return (
    <AccessibleFormField
      label={label}
      error={error}
      required={required}
      description={description}
      className={containerClassName}
    >
      <textarea
        className={cn(
          "block w-full rounded-md border-gray-300 dark:border-gray-600",
          "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100",
          "shadow-sm focus:border-primary focus:ring-primary",
          "disabled:cursor-not-allowed disabled:bg-gray-50 dark:disabled:bg-gray-900",
          "sm:text-sm transition-colors duration-200 resize-vertical",
          className
        )}
        {...props}
      />
    </AccessibleFormField>
  );
}

interface AccessibleCheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  description?: string;
  containerClassName?: string;
}

export function AccessibleCheckbox({
  label,
  error,
  description,
  containerClassName,
  className,
  ...props
}: AccessibleCheckboxProps) {
  const fieldId = useId();
  const errorId = `${fieldId}-error`;
  const descriptionId = `${fieldId}-description`;

  return (
    <div className={cn("space-y-2", containerClassName)}>
      <div className="flex items-start">
        <input
          type="checkbox"
          id={fieldId}
          className={cn(
            "h-4 w-4 rounded border-gray-300 dark:border-gray-600",
            "text-primary focus:ring-primary",
            "disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          aria-describedby={[
            description ? descriptionId : '',
            error ? errorId : ''
          ].filter(Boolean).join(' ')}
          aria-invalid={error ? 'true' : 'false'}
          {...props}
        />
        <div className="ml-3">
          <label
            htmlFor={fieldId}
            className="text-sm font-medium text-gray-900 dark:text-gray-100 cursor-pointer"
          >
            {label}
          </label>
          {description && (
            <p
              id={descriptionId}
              className="text-sm text-gray-600 dark:text-gray-400"
            >
              {description}
            </p>
          )}
        </div>
      </div>
      
      {error && (
        <div
          id={errorId}
          className="text-sm text-red-600 dark:text-red-400"
          role="alert"
          aria-live="polite"
        >
          {error}
        </div>
      )}
    </div>
  );
}

interface AccessibleRadioGroupProps {
  label: string;
  name: string;
  options: Array<{ value: string; label: string; description?: string; disabled?: boolean }>;
  value?: string;
  onChange: (value: string) => void;
  error?: string;
  description?: string;
  required?: boolean;
  containerClassName?: string;
}

export function AccessibleRadioGroup({
  label,
  name,
  options,
  value,
  onChange,
  error,
  description,
  required,
  containerClassName
}: AccessibleRadioGroupProps) {
  const groupId = useId();
  const errorId = `${groupId}-error`;
  const descriptionId = `${groupId}-description`;

  return (
    <fieldset className={cn("space-y-3", containerClassName)}>
      <legend className="text-sm font-medium text-gray-900 dark:text-gray-100">
        {label}
        {required && (
          <span
            className="text-red-500 ml-1"
            aria-label="required field"
          >
            *
          </span>
        )}
      </legend>
      
      {description && (
        <p
          id={descriptionId}
          className="text-sm text-gray-600 dark:text-gray-400"
        >
          {description}
        </p>
      )}
      
      <div
        className="space-y-2"
        role="radiogroup"
        aria-describedby={[
          description ? descriptionId : '',
          error ? errorId : ''
        ].filter(Boolean).join(' ')}
        aria-invalid={error ? 'true' : 'false'}
        aria-required={required}
      >
        {options.map((option) => {
          const optionId = `${groupId}-${option.value}`;
          return (
            <div key={option.value} className="flex items-start">
              <input
                type="radio"
                id={optionId}
                name={name}
                value={option.value}
                checked={value === option.value}
                onChange={(e) => onChange(e.target.value)}
                disabled={option.disabled}
                className="h-4 w-4 border-gray-300 dark:border-gray-600 text-primary focus:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
              />
              <div className="ml-3">
                <label
                  htmlFor={optionId}
                  className="text-sm font-medium text-gray-900 dark:text-gray-100 cursor-pointer"
                >
                  {option.label}
                </label>
                {option.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {option.description}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      {error && (
        <div
          id={errorId}
          className="text-sm text-red-600 dark:text-red-400"
          role="alert"
          aria-live="polite"
        >
          {error}
        </div>
      )}
    </fieldset>
  );
}