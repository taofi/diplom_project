import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { User } from '../db/models/user.model';
import { UserRole as UserRoleModel } from '../db/models/user-role.model';
import { TokenService } from '../token/token.service';
import { EmailService } from '../email/email.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { normalizeRoles } from './utils/normalize-roles';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

// Генерация случайного кода
function generateVerificationCode(length: number = 6): string {
  return Math.floor(
    Math.random() * Math.pow(10, length)
  )
    .toString()
    .padStart(length, '0');
}

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User)
    private userModel: typeof User,
    @InjectModel(UserRoleModel)
    private userRoleModel: typeof UserRoleModel,
    private tokenService: TokenService,
    private emailService: EmailService,
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

    // Генерируем и сохраняем код верификации
    const verificationCode = generateVerificationCode();
    await this.tokenService.setVerificationCode(user.email, verificationCode);

    // Отправляем письмо с кодом верификации
    try {
      await this.emailService.sendVerificationCode(
        user.email,
        verificationCode,
        {
          name: user.name,
          expires: 15,
          locale: user.locale,
        }
      );
    } catch (error) {
      // Логируем ошибку, но не блокируем регистрацию
      console.error('Failed to send verification email:', error);
    }

    const tokens = await this.tokenService.generateTokens({
      sub: user.id,
      email: user.email,
      roles: normalizedRoles,
    });

    // Возвращаем информацию о необходимости верификации
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        roles: normalizedRoles,
        locale: user.locale,
        avatar_url: user.avatar_url,
        description: user.description,
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
        description: user.description,
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

  async forgotPassword(dto: ForgotPasswordDto): Promise<{ message: string }> {
    const email = dto.email.trim().toLowerCase();
    const user = await this.userModel.findOne({ where: { email } });

    // Возвращаем одинаковый ответ, чтобы не раскрывать наличие пользователя.
    if (!user) {
      return {
        message: 'If this email exists, password reset instructions have been sent.',
      };
    }

    const resetToken = randomBytes(32).toString('hex');
    const expiresInMinutes = 60;
    await this.tokenService.setPasswordResetToken(email, resetToken, expiresInMinutes * 60);

    const frontendUrl = 'http://localhost:4000';
    const resetLink =
      `${frontendUrl}/${user.locale || 'ru'}/reset-password` +
      `?token=${encodeURIComponent(resetToken)}&email=${encodeURIComponent(email)}`;

    try {
      await this.emailService.sendPasswordReset(
        user.email,
        user.name || 'User',
        resetLink,
        expiresInMinutes,
        user.locale || 'ru',
      );
    } catch (error) {
      console.error('Failed to send password reset email:', error);
    }

    return {
      message: 'If this email exists, password reset instructions have been sent.',
    };
  }

  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    const email = dto.email.trim().toLowerCase();
    const isValidToken = await this.tokenService.verifyPasswordResetToken(email, dto.token);

    if (!isValidToken) {
      throw new BadRequestException('Invalid or expired password reset token');
    }

    const user = await this.userModel.findOne({ where: { email } });
    if (!user) {
      throw new BadRequestException('Invalid or expired password reset token');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, 10);
    await user.update({ password_hash: passwordHash });

    await this.tokenService.deletePasswordResetToken(email);
    await this.tokenService.revokeRefreshToken(user.id.toString());

    return { message: 'Password has been reset successfully' };
  }

  async updateProfile(
    userId: number,
    data: { name?: string; avatar_url?: string; description?: string },
  ): Promise<{
    id: number;
    email: string;
    name: string;
    roles: string[];
    locale: string;
    avatar_url: string | null;
    description: string | null;
    created_at: Date;
  }> {
    const user = await this.userModel.findByPk(userId, {
      include: [{ model: this.userRoleModel, as: 'user_roles' }],
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Обновляем только переданные поля
    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) {
      updateData.name = data.name;
    }
    if (data.avatar_url !== undefined) {
      updateData.avatar_url = data.avatar_url;
    }
    if (data.description !== undefined) {
      updateData.description = data.description.trim();
    }

    if (Object.keys(updateData).length > 0) {
      await user.update(updateData);
    }

    // Нормализуем роли
    const normalizedRoles = normalizeRoles(
      user.user_roles?.map((ur) => ur.role),
    );

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      roles: normalizedRoles,
      locale: user.locale,
      avatar_url: user.avatar_url,
      description: user.description,
      created_at: user.created_at,
    };
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
