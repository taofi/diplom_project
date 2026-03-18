'use client';

import { Checkbox } from './Checkbox';

export type CheckboxGroupLayout = 'vertical' | 'horizontal' | 'grid';

interface CheckboxGroupOption<T> {
  value: T;
  label: string;
  disabled?: boolean;
}

interface CheckboxGroupProps<T extends string | number> {
  name: string;
  label?: string;
  options: CheckboxGroupOption<T>[];
  selectedValues: T[];
  onChange: (values: T[]) => void;
  layout?: CheckboxGroupLayout;
  columns?: number;
  className?: string;
  error?: string;
}

const layoutClasses: Record<CheckboxGroupLayout, string> = {
  vertical: 'flex flex-col gap-2',
  horizontal: 'flex flex-wrap gap-4 items-center',
  grid: 'grid grid-cols-2 gap-2',
};

export function CheckboxGroup<T extends string | number>({
  name,
  label,
  options,
  selectedValues,
  onChange,
  layout = 'vertical',
  columns,
  className = '',
  error,
}: CheckboxGroupProps<T>) {
  const handleChange = (value: T, checked: boolean) => {
    if (checked) {
      onChange([...selectedValues, value]);
    } else {
      onChange(selectedValues.filter((v) => v !== value));
    }
  };

  const gridStyle = layout === 'grid' && columns ? { gridTemplateColumns: `repeat(${columns}, 1fr)` } : {};

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium mb-2 text-gray-700">
          {label}
        </label>
      )}
      <div className={layoutClasses[layout]} style={gridStyle}>
        {options.map((option) => (
          <Checkbox
            key={String(option.value)}
            name={`${name}-${option.value}`}
            label={option.label}
            checked={selectedValues.includes(option.value)}
            onChange={(checked) => handleChange(option.value, checked)}
            disabled={option.disabled}
          />
        ))}
      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
