'use client';

import { Spinner } from '@/components/ui';

export function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Spinner size="lg" />
    </div>
  );
}
