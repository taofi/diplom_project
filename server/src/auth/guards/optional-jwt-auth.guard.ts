import {
  Injectable,
  CanActivate,
  ExecutionContext,
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
export class OptionalJwtAuthGuard implements CanActivate {
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

    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;
    
    console.log('[AuthGuard] authHeader:', authHeader);

    // Если нет токена - пропускаем (не выбрасываем ошибку)
    if (!authHeader) {
      return true;
    }

    const [type, token] = authHeader.split(' ');

    if (type !== 'Bearer' || !token) {
      return true;
    }

    // Check if token is blacklisted
    const isBlacklisted = await this.tokenService.isTokenBlacklisted(token);
    if (isBlacklisted) {
      return true; // Не блокируем, просто не аутентифицируем
    }

    // Validate token and get user
    try {
      const payload = this.jwtService.verify<{ sub: number }>(token);
      
      if (!payload?.sub) {
        return true;
      }
      
      const user = await this.authService.getProfile(payload.sub);
      
      // Присваиваем полный объект пользователя в request для использования в декораторах @CurrentUser()
      request.user = user;
    } catch (error) {
      // При любой ошибке верификации - пропускаем (не выбрасываем ошибку)
      return true;
    }

    return true;
  }
}
