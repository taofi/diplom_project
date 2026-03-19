'use client';

import { Alert } from '@/components/ui';

interface ErrorMessageProps {
  message: string;
}

export function ErrorMessage({ message }: ErrorMessageProps) {
  if (!message) return null;

  return (
    <Alert variant="error" message={message} className="mb-6" />
  );
}
