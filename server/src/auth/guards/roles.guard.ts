import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../../db/models/user.model';
import { ROLES_KEY } from '../decorators/roles.decorator';

interface AuthRequest {
  user?: { role: UserRole[] };
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest() as AuthRequest;
    const user = request.user;

    if (!user) {
      return false;
    }

    return requiredRoles.some((role) => user.role.includes(role));
  }
}
