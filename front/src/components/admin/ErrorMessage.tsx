'use client';

interface ErrorMessageProps {
  message: string;
}

export function ErrorMessage({ message }: ErrorMessageProps) {
  if (!message) return null;

  return (
    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
      {message}
    </div>
  );
}
