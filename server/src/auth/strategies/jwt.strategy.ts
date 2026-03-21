import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/sequelize';
import { User } from '../../db/models/user.model';
import { UserRole as UserRoleModel } from '../../db/models/user-role.model';
import { normalizeRoles } from '../utils/normalize-roles';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    @InjectModel(User)
    private userModel: typeof User,
    @InjectModel(UserRoleModel)
    private userRoleModel: typeof UserRoleModel,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.secret') || 'default_secret',
    });
  }

  async validate(payload: { sub: number; email: string; roles: string[] }) {
    const user = await this.userModel.findByPk(payload.sub, {
      include: [{ model: this.userRoleModel, as: 'user_roles' }],
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Нормализуем роли перед возвратом
    const normalizedRoles = normalizeRoles(user.user_roles?.map(ur => ur.role));
    (user as unknown as { role: string[] }).role = normalizedRoles;

    return user;
  }
}
