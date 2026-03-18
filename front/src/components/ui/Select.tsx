'use client';

import { forwardRef } from 'react';

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

interface SelectProps {
  name: string;
  label?: string;
  value: string | number;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  className?: string;
  id?: string;
}

const baseClasses = 'w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary transition-colors bg-white';
const errorClasses = 'border-red-300 focus:ring-red-500';
const defaultClasses = 'border-gray-300';

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      name,
      label,
      value,
      onChange,
      options,
      placeholder,
      required = false,
      disabled = false,
      error,
      className = '',
      id,
    },
    ref
  ) => {
    const inputId = id || name;

    const selectClasses = [
      baseClasses,
      error ? errorClasses : defaultClasses,
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div className="relative">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium mb-1 text-gray-700"
          >
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <select
          ref={ref}
          id={inputId}
          name={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          disabled={disabled}
          className={selectClasses}
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
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';
