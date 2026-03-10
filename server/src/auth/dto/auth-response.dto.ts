export class AuthResponseDto {
  user: {
    id: number;
    email: string;
    name: string;
    role: string;
    locale: string;
    avatar_url: string | null;
  };
  accessToken: string;
  refreshToken: string;
}
