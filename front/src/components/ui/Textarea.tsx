'use client';

import { forwardRef, useEffect, useRef } from 'react';

interface TextareaProps {
  name: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  className?: string;
  id?: string;
  minLength?: number;
  maxLength?: number;
  autoResize?: boolean;
}

const baseClasses = 'w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary transition-colors';
const errorClasses = 'border-red-300 focus:ring-red-500';
const defaultClasses = 'border-gray-300';

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      name,
      label,
      value,
      onChange,
      placeholder,
      rows = 4,
      required = false,
      disabled = false,
      error,
      className = '',
      id,
      minLength,
      maxLength,
      autoResize = false,
    },
    ref
  ) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const inputId = id || name;

    // Auto-resize
    useEffect(() => {
      if (autoResize && textareaRef.current) {
        const textarea = textareaRef.current;
        textarea.style.height = 'auto';
        textarea.style.height = `${Math.min(textarea.scrollHeight, 500)}px`;
      }
    }, [value, autoResize]);

    const textareaClasses = [
      baseClasses,
      error ? errorClasses : defaultClasses,
      autoResize ? 'resize-none overflow-hidden' : '',
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
        <textarea
          ref={(node) => {
            // Handle both refs
            if (ref) {
              if (typeof ref === 'function') {
                ref(node);
              } else {
                ref.current = node;
              }
            }
            (textareaRef as React.MutableRefObject<HTMLTextAreaElement | null>).current = node;
          }}
          id={inputId}
          name={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          rows={rows}
          className={textareaClasses}
          style={autoResize ? { minHeight: `${rows * 24}px` } : undefined}
          minLength={minLength}
          maxLength={maxLength}
        />
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        {maxLength && (
          <p className="mt-1 text-xs text-gray-400 text-right">
            {value.length}/{maxLength}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
