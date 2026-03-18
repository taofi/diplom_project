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
    },
    ref
  ) => {
    const inputId = id || name;
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [localValue, setLocalValue] = useState(String(value));

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
            type={type === 'number' ? 'text' : type}
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
