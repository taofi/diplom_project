export class PublicUserProfileDto {
  id: number;
  name: string;
  avatar_url: string | null;
  description: string | null;
  roles: string[];
  created_at: Date;
}
