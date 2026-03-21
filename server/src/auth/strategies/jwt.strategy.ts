import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/sequelize';
import { User, UserRole } from '../../db/models/user.model';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    @InjectModel(User)
    private userModel: typeof User,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.secret') || 'default_secret',
    });
  }

  // Вспомогательная функция для нормализации ролей
  private normalizeRoles(roles: unknown): string[] {
    if (!roles) return [UserRole.USER];

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
      roleArray = [UserRole.USER];
    }

    return [...new Set(roleArray.filter((r) => r))];
  }

  async validate(payload: { sub: number; email: string; roles: string[] }) {
    const user = await this.userModel.findByPk(payload.sub);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Нормализуем роли перед возвратом
    const normalizedRoles = this.normalizeRoles(user.role);
    user.role = normalizedRoles as UserRole[];

    return user;
  }
}
