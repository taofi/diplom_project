'use client';

import { ServerImage } from '@/components/Image';

interface UserAvatarIconProps {
  avatarUrl?: string | null;
  name?: string | null;
  size?: number;
}

export function UserAvatarIcon({ avatarUrl, name, size = 32 }: UserAvatarIconProps) {
  const normalizedAvatarUrl = typeof avatarUrl === 'string' ? avatarUrl.trim() : '';
  const hasAvatar =
    normalizedAvatarUrl !== '' &&
    normalizedAvatarUrl !== 'null' &&
    normalizedAvatarUrl !== 'undefined';
  const displayLetter = name?.trim()?.charAt(0)?.toUpperCase() || '?';

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
        <div className="flex h-full w-full items-center justify-center text-gray-700 font-semibold select-none">
          <span aria-hidden="true" style={{ fontSize: Math.max(12, Math.floor(size * 0.48)) }}>
            {displayLetter}
          </span>
        </div>
      )}
    </div>
  );
}
