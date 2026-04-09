'use client';

import { ServerImage } from '@/components/Image';

interface UserAvatarIconProps {
  avatarUrl?: string | null;
  size?: number;
}

export function UserAvatarIcon({ avatarUrl, size = 32 }: UserAvatarIconProps) {
  const normalizedAvatarUrl = typeof avatarUrl === 'string' ? avatarUrl.trim() : '';
  const hasAvatar =
    normalizedAvatarUrl !== '' &&
    normalizedAvatarUrl !== 'null' &&
    normalizedAvatarUrl !== 'undefined';

  return (
    <div
      className="rounded-full overflow-hidden border border-gray-300 bg-gray-100"
      style={{ width: size, height: size }}
    >
      {hasAvatar ? (
        <ServerImage
          src={normalizedAvatarUrl}
          alt="User avatar"
          width={size}
          height={size}
          className="w-full h-full"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-gray-500">
          <svg
            width={Math.floor(size * 0.55)}
            height={Math.floor(size * 0.55)}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path d="M20 21a8 8 0 0 0-16 0" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </div>
      )}
    </div>
  );
}
