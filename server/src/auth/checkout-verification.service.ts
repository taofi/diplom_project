import {
  Injectable,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import * as bcrypt from 'bcrypt';
import { User } from '../db/models/user.model';
import { UserRole as UserRoleModel } from '../db/models/user-role.model';
import { TokenService } from '../token/token.service';
import { EmailService } from '../email/email.service';
import { CartService } from '../cart/cart.service';
import { OrderService } from '../order/order.service';

function generateVerificationCode(): string {
  return Math.floor(Math.random() * 1000000)
    .toString()
    .padStart(6, '0');
}

function generatePassword(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

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

  
   async sendVerificationCode(email: string, locale: string = 'ru'): Promise<{
     success: boolean;
     message: string;
     expiresIn: number;
   }> {
     const existingCode = await this.tokenService.getVerificationCode(email);
     if (existingCode) {
       throw new BadRequestException('Code already sent. Please request a new one or wait for the current code to expire.');
     }

    const verificationCode = generateVerificationCode();
    const ttlSeconds = 300;

    await this.tokenService.setVerificationCode(email, verificationCode, ttlSeconds);

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
    const isValid = await this.tokenService.verifyCode(email, code);

    if (!isValid) {
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

    await this.tokenService.deleteVerificationCode(email);

    const existingUser = await this.userModel.findOne({
      where: { email },
      include: [{ model: this.userRoleModel }],
    });

    if (existingUser) {
      const roles = existingUser.user_roles?.map(ur => ur.role) || ['user'];

      try {
        const transferredOrdersCount = await this.orderService.transferGuestOrdersToUser(
          existingUser.id,
          email,
        );

        if (transferredOrdersCount > 0) {
          console.log(`[CheckoutVerification] Orders transferred: ${transferredOrdersCount} orders to user ${existingUser.id}`);
        }
      } catch (error) {
        console.error('[CheckoutVerification] Failed to transfer orders:', error);
      }

      if (cartItems && cartItems.length > 0) {
        try {
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
            await this.cartService.syncCart(existingUser.id, syncedItems, locale);
            console.log(`[CheckoutVerification] Cart synced: ${syncedItems.length} items to user ${existingUser.id}`);
          }
        } catch (error) {
          console.error('[CheckoutVerification] Failed to sync cart:', error);
        }
      }
      else if (guestId) {
        try {
          const guestCartItems = await this.cartService.getGuestCart(guestId);
          if (guestCartItems.length > 0) {
            await this.cartService.syncCart(
              existingUser.id,
              guestCartItems.map(item => ({ productLicenseId: item.productLicenseId })),
              locale,
            );
            await this.cartService.clearGuestCart(guestId);
            console.log(`[CheckoutVerification] Cart transferred (legacy): ${guestCartItems.length} items to user ${existingUser.id}`);
          }
        } catch (error) {
          console.error('[CheckoutVerification] Failed to transfer cart (legacy):', error);
        }
      }

      const tokens = await this.tokenService.generateTokens({
        sub: existingUser.id,
        email: existingUser.email,
        roles,
      });

      return {
        success: true,
        user: {
          id: existingUser.id,
          email: existingUser.email,
          name: existingUser.name,
          roles,
          locale: existingUser.locale,
          avatar_url: existingUser.avatar_url,
        },
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      };
    }

    const password = generatePassword();
    const passwordHash = await bcrypt.hash(password, 10);

    const name = extractNameFromEmail(email);

    const user = await this.userModel.create({
      email,
      password_hash: passwordHash,
      name,
      locale,
    });

    await this.userRoleModel.create({
      user_id: user.id,
      role: 'user',
    });

    if (cartItems && cartItems.length > 0) {
      try {
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
      }
    }
    else if (guestId) {
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
    }

    try {
      await this.emailService.sendAccountCreated(
        email,
        name,
        password,
        locale
      );
    } catch (error) {
      console.error('Failed to send account created email:', error);
    }

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

