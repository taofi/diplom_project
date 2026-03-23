import {
  Injectable,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import * as bcrypt from 'bcrypt';
import { User } from '../db/models/user.model';
import { UserRole as UserRoleModel } from '../db/models/user-role.model';
import { TokenService } from '../token/token.service';
import { EmailService } from '../email/email.service';
import { CartService } from '../cart/cart.service';
import { OrderService } from '../order/order.service';

// Генерация 6-значного кода
function generateVerificationCode(): string {
  return Math.floor(Math.random() * 1000000)
    .toString()
    .padStart(6, '0');
}

// Генерация пароля (12 символов)
function generatePassword(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

// Извлечение имени из email
function extractNameFromEmail(email: string): string {
  const parts = email.split('@');
  return parts[0] || 'Пользователь';
}

@Injectable()
export class CheckoutVerificationService {
  constructor(
    @InjectModel(User)
    private userModel: typeof User,
    @InjectModel(UserRoleModel)
    private userRoleModel: typeof UserRoleModel,
    private tokenService: TokenService,
    private emailService: EmailService,
    private cartService: CartService,
    private orderService: OrderService,
  ) {}

  /**
   * Отправить код верификации на email
   */
  async sendVerificationCode(email: string, locale: string = 'ru'): Promise<{
    success: boolean;
    message: string;
    expiresIn: number;
  }> {
    // Проверить, не существует ли уже пользователь
    const existingUser = await this.userModel.findOne({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Проверить, не отправлен ли уже код (можно добавить rate limiting)
    const existingCode = await this.tokenService.getVerificationCode(email);
    if (existingCode) {
      // Код уже отправлен - не отправляем новый сразу
      throw new BadRequestException('Code already sent. Please request a new one or wait for the current code to expire.');
    }

    // Генерировать код
    const verificationCode = generateVerificationCode();
    const ttlSeconds = 300; // 5 минут

    // Сохранить код в Redis
    await this.tokenService.setVerificationCode(email, verificationCode, ttlSeconds);

    // Отправить email с кодом
    try {
      await this.emailService.sendVerificationCode(
        email,
        verificationCode,
        {
          name: extractNameFromEmail(email),
          expires: 5,
          locale,
        }
      );
    } catch (error) {
      console.error('Failed to send verification email:', error);
      throw new BadRequestException('Failed to send verification email');
    }

    return {
      success: true,
      message: 'Code sent successfully',
      expiresIn: ttlSeconds,
    };
  }

  /**
   * Подтвердить код и создать аккаунт
   * @param cartItems - элементы корзины с фронта (новый подход)
   */
  async verifyCodeAndCreateAccount(
    email: string,
    code: string,
    locale: string = 'ru',
    guestId?: string,
    cartItems?: { productId: number; licenseTypeId: number }[],
  ): Promise<{
    success: boolean;
    user: {
      id: number;
      email: string;
      name: string;
      roles: string[];
      locale: string;
      avatar_url: string | null;
    };
    accessToken: string;
    refreshToken: string;
  } | {
    success: false;
    message: string;
    error: string;
  }> {
    // Проверить код
    const isValid = await this.tokenService.verifyCode(email, code);

    if (!isValid) {
      // Проверить, есть ли код и не истек ли он
      const storedCode = await this.tokenService.getVerificationCode(email);
      
      if (!storedCode) {
        return {
          success: false,
          message: 'Code expired. Please request a new one.',
          error: 'CODE_EXPIRED',
        };
      }

      return {
        success: false,
        message: 'Invalid code',
        error: 'INVALID_CODE',
      };
    }

    // Удалить код из Redis (он больше не нужен)
    await this.tokenService.deleteVerificationCode(email);

    // Проверить еще раз, что пользователь не существует
    const existingUser = await this.userModel.findOne({
      where: { email },
    });

    if (existingUser) {
      return {
        success: false,
        message: 'User already exists',
        error: 'USER_EXISTS',
      };
    }

    // Сгенерировать пароль
    const password = generatePassword();
    const passwordHash = await bcrypt.hash(password, 10);

    // Извлечь имя из email
    const name = extractNameFromEmail(email);

    // Создать пользователя
    const user = await this.userModel.create({
      email,
      password_hash: passwordHash,
      name,
      locale,
    });

    // Создать роль по умолчанию
    await this.userRoleModel.create({
      user_id: user.id,
      role: 'user',
    });

    // Синхронизируем корзину (переданную с фронта)
    if (cartItems && cartItems.length > 0) {
      try {
        // Для каждого товара нужно получить правильный product_license_id
        // по productId и licenseTypeId
        const syncedItems: Array<{ productLicenseId: number; productId: number }> = [];
        
        for (const item of cartItems) {
          const productLicenseId = await this.cartService.findProductLicenseId(
            item.productId,
            item.licenseTypeId,
          );
          
          if (productLicenseId) {
            syncedItems.push({ productLicenseId, productId: item.productId });
          } else {
            console.warn(
              `[CheckoutVerification] ProductLicense not found for productId=${item.productId}, licenseTypeId=${item.licenseTypeId}`,
            );
          }
        }
        
        if (syncedItems.length > 0) {
          await this.cartService.syncCart(user.id, syncedItems, locale);
          console.log(`[CheckoutVerification] Cart synced: ${syncedItems.length} items to user ${user.id}`);
        }
      } catch (error) {
        console.error('[CheckoutVerification] Failed to sync cart:', error);
        // Продолжаем, даже если не удалось синхронизировать корзину
      }
    }
    // TODO: Удалить загрузку гостевой корзины по guestId когда frontend перейдёт на новый подход
    else if (guestId) {
      // Для обратной совместимости - пробуем загрузить с сервера (старый подход)
      try {
        const guestCartItems = await this.cartService.getGuestCart(guestId);
        if (guestCartItems.length > 0) {
          await this.cartService.syncCart(
            user.id,
            guestCartItems.map((item) => ({ productLicenseId: item.productLicenseId })),
            locale,
          );
          await this.cartService.clearGuestCart(guestId);
          console.log(`[CheckoutVerification] Cart transferred (legacy): ${guestCartItems.length} items to user ${user.id}`);
        }
      } catch (error) {
        console.error('[CheckoutVerification] Failed to transfer cart (legacy):', error);
      }
    }

    // Перенести заказы гостя на пользователя (по email)
    try {
      const transferredOrdersCount = await this.orderService.transferGuestOrdersToUser(
        user.id,
        email,
      );
      
      if (transferredOrdersCount > 0) {
        console.log(`[CheckoutVerification] Orders transferred: ${transferredOrdersCount} orders to user ${user.id}`);
      }
    } catch (error) {
      console.error('[CheckoutVerification] Failed to transfer orders:', error);
      // Продолжаем, даже если не удалось перенести заказы
    }

    // Отправить email с паролем
    try {
      await this.emailService.sendAccountCreated(
        email,
        name,
        password,
        locale
      );
    } catch (error) {
      console.error('Failed to send account created email:', error);
      // Продолжаем, даже если не удалось отправить email с паролем
    }

    // Сгенерировать токены
    const tokens = await this.tokenService.generateTokens({
      sub: user.id,
      email: user.email,
      roles: ['user'],
    });

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        roles: ['user'],
        locale: user.locale,
        avatar_url: user.avatar_url,
      },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }
}