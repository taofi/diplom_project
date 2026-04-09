'use client';

import { Button, Card } from '@/components/ui';
import { UserAvatarIcon } from '@/components/UserAvatarIcon';
import type { PublicUserProfileResponse } from '@/lib/api-user';

type UserProfileHeaderProps = {
  profile: PublicUserProfileResponse;
  isCreatingChat: boolean;
  onStartChat: () => void;
  chatButtonLabel: string;
};

export function UserProfileHeader({
  profile,
  isCreatingChat,
  onStartChat,
  chatButtonLabel,
}: UserProfileHeaderProps) {
  return (
    <Card padding="lg">
      <div className="flex flex-col sm:flex-row sm:items-start gap-6">
        <div className="shrink-0 mx-auto sm:mx-0">
          <UserAvatarIcon avatarUrl={profile.avatar_url} name={profile.name} size={112} />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{profile.name}</h1>
          {profile.description && (
            <p className="text-gray-700 mt-3 whitespace-pre-wrap wrap-break-word">{profile.description}</p>
          )}
        </div>
        <div className="shrink-0 sm:ml-auto">
          <Button variant="primary" onClick={onStartChat} disabled={isCreatingChat}>
            {chatButtonLabel}
          </Button>
        </div>
      </div>
    </Card>
  );
}
