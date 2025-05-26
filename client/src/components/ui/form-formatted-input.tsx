import * as React from "react";
import { useController, Control, FieldValues, Path } from "react-hook-form";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { FormattedInput, FormatType } from "@/components/ui/formatted-input";

interface FormattedInputFieldProps<TFieldValues extends FieldValues> {
  control: Control<TFieldValues>;
  name: Path<TFieldValues>;
  label?: string;
  placeholder?: string;
  formatType: FormatType;
  className?: string;
}

export function FormattedInputField<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  formatType,
  className,
}: FormattedInputFieldProps<TFieldValues>) {
  const { field, fieldState } = useController({
    name,
    control,
  });
  
  return (
    <FormItem className={className}>
      {label && <FormLabel>{label}</FormLabel>}
      <FormControl>
        <FormattedInput
          placeholder={placeholder}
          formatType={formatType}
          value={field.value || ''}
          onChange={(e) => {
            // Let the FormattedInput handle the formatting
            // The actual value update happens via onValueChange
          }}
          onValueChange={(value) => {
            field.onChange(value);
          }}
          onBlur={field.onBlur}
          className={fieldState.error ? "border-red-500 focus-visible:ring-red-500" : ""}
        />
      </FormControl>
      <FormMessage />
    </FormItem>
  );
}