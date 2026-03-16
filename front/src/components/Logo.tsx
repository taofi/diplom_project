'use client';

import Link from 'next/link';

export function Logo() {
  
  return (
    <Link href="/" className="flex items-center gap-2">
      <span className="text-4xl font-display text-primary">
        Nadzin
      </span>
    </Link>
  );
}
