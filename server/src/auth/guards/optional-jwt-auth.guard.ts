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

    if (!authHeader) {
      return true;
    }

    const [type, token] = authHeader.split(' ');

    if (type !== 'Bearer' || !token) {
      return true;
    }

    const isBlacklisted = await this.tokenService.isTokenBlacklisted(token);
    if (isBlacklisted) {
      return true;
    }

    try {
      const payload = this.jwtService.verify<{ sub: number }>(token);
      
      if (!payload?.sub) {
        return true;
      }
      
      const user = await this.authService.getProfile(payload.sub);
      
      request.user = user;
    } catch (error) {
      return true;
    }

    return true;
  }
}


