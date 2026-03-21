import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRoleType } from '../../db/models/user.model';
import { ROLES_KEY } from '../decorators/roles.decorator';

interface AuthRequest {
  user?: { role: UserRoleType[] | string[] };
}

/**
 * Guard for checking if user is admin
 * Use @UseGuards(AdminGuard) or @Roles(UserRoleEnum.ADMIN)
 */
@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  // Нормализация ролей - преобразует все возможные форматы в массив строк
  private normalizeUserRoles(roles: unknown): string[] {
    if (!roles) return [];

    let roleArray: string[];

    // Если это массив
    if (Array.isArray(roles)) {
      roleArray = roles
        .map((r) => {
          if (typeof r === 'string') {
            // Если элемент содержит запятую, разбиваем на массив
            if (r.includes(',')) {
              return r.split(',').map((item) => item.trim());
            }
            return r.trim();
          }
          return String(r);
        })
        .flat();
    } else if (typeof roles === 'string') {
      // Если это строка, разбиваем по запятым
      roleArray = roles.split(',').map((r) => r.trim());
    } else {
      roleArray = [];
    }

    // Убираем дубликаты и пустые значения
    return [...new Set(roleArray.filter((r) => r))];
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest() as AuthRequest;
    const user = request.user;

    if (!user) {
      return false;
    }

    // Нормализуем роли
    const userRoles = this.normalizeUserRoles(user.role);

    // Check for explicitly set roles
    const requiredRoles = this.reflector.getAllAndOverride<UserRoleType[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (requiredRoles && requiredRoles.length > 0) {
      return requiredRoles.some((role) => userRoles.includes(String(role)));
    }

    // Default: check if user is admin
    return userRoles.includes('admin');
  }
}
