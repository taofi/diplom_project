'use client';

import { ServerImage } from '@/components/Image';

interface UserAvatarIconProps {
  avatarUrl?: string | null;
  size?: number;
}

export function UserAvatarIcon({ avatarUrl, size = 32 }: UserAvatarIconProps) {
  return (
    <div
      className="rounded-full overflow-hidden border border-gray-300"
      style={{ width: size, height: size }}
    >
      <ServerImage
        src={avatarUrl}
        alt="User avatar"
        width={size}
        height={size}
        className="w-full h-full"
      />
    </div>
  );
}
