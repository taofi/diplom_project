import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { TokenService } from '../../token/token.service';
import { JwtService } from '@nestjs/jwt';
import { User } from '../../db/models/user.model';
import { AuthService } from '../auth.service';

interface AuthRequest {
  headers: { authorization?: string };
  user?: User & { sub?: number };
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private tokenService: TokenService,
    private jwtService: JwtService,
    private authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest() as AuthRequest;
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException('No token provided');
    }

    const [type, token] = authHeader.split(' ');

    if (type !== 'Bearer' || !token) {
      throw new UnauthorizedException('Invalid token format');
    }

    // Check if token is blacklisted
    const isBlacklisted = await this.tokenService.isTokenBlacklisted(token);
    if (isBlacklisted) {
      throw new UnauthorizedException('Token has been revoked');
    }

    // Validate token and get user
    try {
      const payload = this.jwtService.verify<{ sub: number }>(token);
      console.log('[JwtAuthGuard] JWT payload:', payload);
      
      if (!payload?.sub) {
        throw new UnauthorizedException('Invalid token payload');
      }
      
      const user = await this.authService.getProfile(payload.sub);
      console.log('[JwtAuthGuard] User from getProfile:', user?.id, user?.email);
      
      // Инициализируем user если его нет, затем добавляем sub для совместимости с CurrentUserId декоратором
      if (!request.user) {
        (request as unknown as Record<string, unknown>).user = {};
      }
      (request.user as unknown as Record<string, unknown>).sub = user.id;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      console.error('JWT verification error:', error);
      throw new UnauthorizedException('Invalid token');
    }

    return true;
  }
}
