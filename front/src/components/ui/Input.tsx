'use client';

import { forwardRef, useState, useEffect, useRef, useCallback } from 'react';

export type InputType = 'text' | 'email' | 'password' | 'number' | 'url' | 'date' | 'tel';
export type NumberType = 'integer' | 'float' | 'currency';

interface InputProps {
  // Base
  type?: InputType;
  name: string;
  label?: string;
  value: string | number;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  className?: string;
  id?: string;
  showPasswordToggle?: boolean;

  // Number-specific constraints
  min?: number;
  max?: number;
  step?: number;
  decimals?: number;
  allowNegative?: boolean;
  numberType?: NumberType;

  // Text-specific constraints
  minLength?: number;
  maxLength?: number;
  autoResize?: boolean;
  rows?: number;

  // Formatting
  prefix?: string;
  suffix?: string;
  formatter?: (value: string) => string;
}

// Base input styles
const baseInputClasses = 'w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary transition-colors';
const errorInputClasses = 'border-red-300 focus:ring-red-500';
const defaultInputClasses = 'border-gray-300';

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      type = 'text',
      name,
      label,
      value,
      onChange,
      placeholder,
      required = false,
      disabled = false,
      error,
      className = '',
      id,
      // Number constraints
      min,
      max,
      step,
      decimals,
      allowNegative = true,
      numberType = 'float',
      // Text constraints
      minLength,
      maxLength,
      autoResize = false,
      rows = 1,
      // Formatting
      prefix,
      suffix,
      formatter,
      showPasswordToggle = false,
    },
    ref
  ) => {
    const inputId = id || name;
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [localValue, setLocalValue] = useState(String(value));
    const [showPassword, setShowPassword] = useState(false);

    // Sync external value
    useEffect(() => {
      setLocalValue(String(value));
    }, [value]);

    // Auto-resize for text type with autoResize
    useEffect(() => {
      if (autoResize && textareaRef.current) {
        const textarea = textareaRef.current;
        textarea.style.height = 'auto';
        textarea.style.height = `${Math.min(textarea.scrollHeight, 300)}px`;
      }
    }, [localValue, autoResize]);

    // Format number value
    const formatNumber = useCallback(
      (val: string): string => {
        if (val === '' || val === '-') return val;

        let num = parseFloat(val);

        if (isNaN(num)) return localValue;

        // Handle negative
        if (!allowNegative && num < 0) {
          num = Math.abs(num);
        }

        // Apply decimals
        if (decimals !== undefined) {
          num = Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
        }

        // Apply min/max
        if (min !== undefined && num < min) num = min;
        if (max !== undefined && num > max) num = max;

        return num.toString();
      },
      [decimals, min, max, allowNegative, localValue]
    );

    // Handle input change
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      let newValue = e.target.value;

      // Number type handling
      if (type === 'number') {
        // Allow negative sign
        if (newValue === '-' && allowNegative) {
          setLocalValue(newValue);
          onChange(newValue);
          return;
        }

        // Validate number
        if (!/^-?\d*\.?\d*$/.test(newValue)) {
          return; // Invalid input
        }

        newValue = formatNumber(newValue);
      }

      // Apply formatter if provided
      if (formatter) {
        newValue = formatter(newValue);
      }

      setLocalValue(newValue);
      onChange(newValue);
    };

    // Handle blur - enforce constraints
    const handleBlur = () => {
      if (type === 'number' && localValue) {
        const formatted = formatNumber(localValue);
        if (formatted !== localValue) {
          setLocalValue(formatted);
          onChange(formatted);
        }
      }

      // Enforce minLength
      if (minLength && localValue.length < minLength) {
        // Don't enforce on blur, just let user know
      }
    };

    // Number input props
    const numberProps = type === 'number' ? {
      min,
      max,
      step: step ?? (decimals ? Math.pow(10, -decimals) : 1),
    } : {};

    // Text input props
    const textProps = type === 'text' ? {
      minLength,
      maxLength,
    } : {};

    const inputClasses = [
      baseInputClasses,
      error ? errorInputClasses : defaultInputClasses,
      prefix ? 'pl-8' : '',
      suffix ? 'pr-8' : '',
      showPasswordToggle ? 'pr-10' : '',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    // Render as textarea if autoResize is enabled
    if (autoResize && type === 'text') {
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
          <div className="relative">
            {prefix && (
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                {prefix}
              </span>
            )}
            <textarea
              ref={textareaRef as React.RefObject<HTMLTextAreaElement>}
              id={inputId}
              name={name}
              value={localValue}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder={placeholder}
              required={required}
              disabled={disabled}
              rows={rows}
              className={inputClasses}
              style={{ minHeight: `${rows * 24}px`, resize: 'none' }}
              {...textProps}
            />
            {suffix && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                {suffix}
              </span>
            )}
          </div>
          {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        </div>
      );
    }

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
        <div className="relative">
          {prefix && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              {prefix}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            type={type === 'number' ? 'text' : type === 'password' && showPasswordToggle ? (showPassword ? 'text' : 'password') : type}
            name={name}
            value={localValue}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
            className={inputClasses}
            inputMode={type === 'number' ? 'decimal' : type === 'tel' ? 'tel' : type === 'email' ? 'email' : type === 'url' ? 'url' : 'text'}
            {...numberProps}
            {...textProps}
          />
          {showPasswordToggle && type === 'password' && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
              tabIndex={-1}
            >
              {showPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                  <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                  <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          )}
          {suffix && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              {suffix}
            </span>
          )}
        </div>
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
