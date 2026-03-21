import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import * as bcrypt from 'bcrypt';
import { User } from '../db/models/user.model';
import { UserRole as UserRoleModel } from '../db/models/user-role.model';
import { TokenService } from '../token/token.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { normalizeRoles } from './utils/normalize-roles';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User)
    private userModel: typeof User,
    @InjectModel(UserRoleModel)
    private userRoleModel: typeof UserRoleModel,
    private tokenService: TokenService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    const existingUser = await this.userModel.findOne({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    
    // Нормализуем роли перед сохранением
    const normalizedRoles = normalizeRoles(dto.roles);

    const user = await this.userModel.create({
      email: dto.email,
      password_hash: passwordHash,
      name: dto.name,
      locale: dto.locale || 'ru',
    });

    // Создаем записи ролей в отдельной таблице
    for (const role of normalizedRoles) {
      await this.userRoleModel.create({
        user_id: user.id,
        role,
      });
    }

    const tokens = await this.tokenService.generateTokens({
      sub: user.id,
      email: user.email,
      roles: normalizedRoles,
    });
    
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        roles: normalizedRoles,
        locale: user.locale,
        avatar_url: user.avatar_url,
      },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.userModel.findOne({
      where: { email: dto.email },
      include: [{ model: this.userRoleModel, as: 'user_roles' }],
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(
      dto.password,
      user.password_hash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Обновляем locale пользователя при входе (если передан)
    if (dto.locale) {
      await user.update({ locale: dto.locale });
      await user.reload();
    }

    // Нормализуем роли перед отправкой
    const normalizedRoles = normalizeRoles(user.user_roles?.map(ur => ur.role));

    const tokens = await this.tokenService.generateTokens({
      sub: user.id,
      email: user.email,
      roles: normalizedRoles,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        roles: normalizedRoles,
        locale: user.locale,
        avatar_url: user.avatar_url,
      },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async refresh(
    refreshToken: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      // Verify refresh token
      const payload = await this.tokenService.verifyRefreshToken(refreshToken);
      const userId = payload.sub as number;

      // Validate refresh token in Redis
      const isValid = await this.tokenService.validateRefreshToken(
        userId.toString(),
        refreshToken,
      );

      if (!isValid) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Revoke old refresh token (rotation)
      await this.tokenService.revokeRefreshToken(userId.toString());

      // Get user
      const user = await this.userModel.findByPk(userId, {
        include: [{ model: this.userRoleModel, as: 'user_roles' }],
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // Нормализуем роли перед отправкой
      const normalizedRoles = normalizeRoles(user.user_roles?.map(ur => ur.role));

      // Generate new tokens
      const tokens = await this.tokenService.generateTokens({
        sub: user.id,
        email: user.email,
        roles: normalizedRoles,
      });

      return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(userId: number, accessToken: string): Promise<void> {
    // Revoke refresh token
    await this.tokenService.revokeRefreshToken(userId.toString());

    // Add access token to blacklist
    // We need to get the expiry time from the token
    // For simplicity, we'll use a default TTL matching JWT expiry
    const ttl = 15 * 60; // 15 minutes in seconds
    await this.tokenService.blacklistAccessToken(accessToken, ttl);
  }

  async logoutAll(userId: number): Promise<void> {
    // Revoke refresh token
    await this.tokenService.revokeRefreshToken(userId.toString());
  }

  async getProfile(userId: number): Promise<User> {
    const user = await this.userModel.findByPk(userId, {
      include: [{ model: this.userRoleModel, as: 'user_roles' }],
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Нормализуем роли
    const normalizedRoles = normalizeRoles(user.user_roles?.map(ur => ur.role));
    
    // Формируем объект с ролями для обратной совместимости (чтобы toJSON() мог их вернуть)
    (user as unknown as { role: string[] }).role = normalizedRoles;
    
    return user;
  }
}
