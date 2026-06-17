export class AuthResponseDto {
  user: {
    id: number;
    email: string;
    name: string;
    roles: string[];
    locale: string;
    avatar_url: string | null;
    description?: string | null;
  };
  accessToken: string;
  refreshToken: string;
}


