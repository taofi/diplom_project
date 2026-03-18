'use client';

import { ReactNode } from 'react';

export type CardPadding = 'none' | 'sm' | 'md' | 'lg';

interface CardProps {
  children: ReactNode;
  padding?: CardPadding;
  className?: string;
  onClick?: () => void;
}

const paddingClasses: Record<CardPadding, string> = {
  none: '',
  sm: 'p-3',
  md: 'p-6',
  lg: 'p-8',
};

export function Card({
  children,
  padding = 'md',
  className = '',
  onClick,
}: CardProps) {
  const Component = onClick ? 'button' : 'div';
  
  return (
    <Component
      onClick={onClick}
      className={`
        bg-white rounded-lg shadow-sm
        ${paddingClasses[padding]}
        ${onClick ? 'cursor-pointer hover:opacity-90 transition-opacity w-full text-left' : ''}
        ${className}
      `}
    >
      {children}
    </Component>
  );
}

// Card header with title
interface CardHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function CardHeader({
  title,
  description,
  action,
  className = '',
}: CardHeaderProps) {
  return (
    <div className={`flex justify-between items-start mb-4 ${className}`}>
      <div>
        <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
        {description && (
          <p className="mt-1 text-sm text-gray-500">{description}</p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
