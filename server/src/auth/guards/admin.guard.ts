import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRoleType } from '../../db/models/user.model';
import { ROLES_KEY } from '../decorators/roles.decorator';

interface AuthRequest {
  user?: { role: UserRoleType[] | string[] };
}


@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  private normalizeUserRoles(roles: unknown): string[] {
    if (!roles) return [];

    let roleArray: string[];

    if (Array.isArray(roles)) {
      roleArray = roles
        .map((r) => {
          if (typeof r === 'string') {
            if (r.includes(',')) {
              return r.split(',').map((item) => item.trim());
            }
            return r.trim();
          }
          return String(r);
        })
        .flat();
    } else if (typeof roles === 'string') {
      roleArray = roles.split(',').map((r) => r.trim());
    } else {
      roleArray = [];
    }

    return [...new Set(roleArray.filter((r) => r))];
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return false;
    }

    const userRoles = this.normalizeUserRoles(user.role);

    const requiredRoles = this.reflector.getAllAndOverride<UserRoleType[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (requiredRoles && requiredRoles.length > 0) {
      return requiredRoles.some((role) => userRoles.includes(String(role)));
    }

    return userRoles.includes('admin');
  }
}


