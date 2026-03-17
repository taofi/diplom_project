import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../../db/models/user.model';
import { ROLES_KEY } from '../decorators/roles.decorator';

interface AuthRequest {
  user?: { role: UserRole[] };
}

/**
 * Guard for checking if user is admin
 * Use @UseGuards(AdminGuard) or @Roles(UserRole.ADMIN)
 */
@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Check for explicitly set roles
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (requiredRoles && requiredRoles.length > 0) {
      // If roles are explicitly set, use RolesGuard logic
      const request = context.switchToHttp().getRequest() as AuthRequest;
      const user = request.user;

      if (!user) {
        return false;
      }

      return requiredRoles.some((role) => user.role.includes(role));
    }

    // Default: check if user is admin
    const request = context.switchToHttp().getRequest() as AuthRequest;
    const user = request.user;

    if (!user) {
      return false;
    }

    return user.role.includes(UserRole.ADMIN);
  }
}
