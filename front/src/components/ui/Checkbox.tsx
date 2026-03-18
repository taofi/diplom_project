'use client';

import { forwardRef } from 'react';

interface CheckboxProps {
  name: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  id?: string;
  error?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      name,
      label,
      checked,
      onChange,
      disabled = false,
      className = '',
      id,
      error,
    },
    ref
  ) => {
    const inputId = id || name;

    return (
      <div className={`flex items-start gap-2 ${className}`}>
        <input
          ref={ref}
          id={inputId}
          type="checkbox"
          name={name}
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
        />
        <label htmlFor={inputId} className="text-sm text-gray-700 cursor-pointer">
          {label}
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';
