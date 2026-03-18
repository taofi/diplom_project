'use client';

import { ReactNode } from 'react';

interface SectionProps {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  action?: ReactNode;
}

export function Section({
  title,
  description,
  children,
  className = '',
  action,
}: SectionProps) {
  return (
    <div className={`bg-white rounded-lg shadow-sm p-6 ${className}`}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          {description && (
            <p className="mt-1 text-sm text-gray-500">{description}</p>
          )}
        </div>
        {action && <div>{action}</div>}
      </div>
      {children}
    </div>
  );
}
