import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { MailerService } from '@nestjs-modules/mailer';
import * as fs from 'fs';
import * as path from 'path';
import { TemplateService } from './templates/template.service';
import type { TemplateVariables, TemplateName } from './templates/types';
import { Order } from '../db/models/order.model';
import { OrderItem } from '../db/models/order-item.model';
import { ProductLicense } from '../db/models/product-license.model';
import { Product } from '../db/models/product.model';

export interface SendEmailOptions {
  to: string;
  subject?: string;
  html?: string;
}

export interface OrderItemInfo {
  name: string;
  price: string;
}

export interface OrderDetails {
  orderId: string;
  items: OrderItemInfo[];
  total: string;
}

export interface EmailAttachment {
  filename: string;
  path: string;
  contentType: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(
    private readonly mailerService: MailerService,
    private readonly templateService: TemplateService,
    @InjectModel(Order)
    private readonly orderModel: typeof Order,
    @InjectModel(OrderItem)
    private readonly orderItemModel: typeof OrderItem,
    @InjectModel(ProductLicense)
    private readonly productLicenseModel: typeof ProductLicense,
  ) {}

  /**
   * Отправить email с использованием шаблона
   */
  async sendTemplatedEmail(
    to: string,
    templateName: TemplateName,
    variables: TemplateVariables,
    locale: string = 'ru'
  ): Promise<void> {
    try {
      const { subject, body } = this.templateService.render(templateName, locale, variables);

      await this.mailerService.sendMail({
        to,
        subject,
        html: body,
      });

      this.logger.log(`Email sent to ${to}: ${subject}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}:`, error);
      throw error;
    }
  }

  /**
   * Отправить простой email без шаблона
   */
  async sendEmail(options: SendEmailOptions): Promise<void> {
    try {
      await this.mailerService.sendMail({
        to: options.to,
        subject: options.subject || 'Сообщение от Nadzin',
        html: options.html || '',
      });

      this.logger.log(`Email sent to ${options.to}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${options.to}:`, error);
      throw error;
    }
  }

  /**
   * Отправить код подтверждения
   */
  async sendVerificationCode(
    email: string,
    code: string,
    options: { name?: string; expires?: number; locale?: string } = {}
  ): Promise<void> {
    await this.sendTemplatedEmail(email, 'verificationCode', {
      name: options.name || 'Пользователь',
      code,
      expires: String(options.expires || 15),
    }, options.locale);
  }

  /**
   * Отправить приветственное письмо
   */
  async sendWelcome(
    email: string,
    name: string,
    locale: string = 'ru'
  ): Promise<void> {
    await this.sendTemplatedEmail(email, 'welcome', { name }, locale);
  }

  /**
   * Отправить письмо для сброса пароля
   */
  async sendPasswordReset(
    email: string,
    name: string,
    resetLink: string,
    expires: number = 60,
    locale: string = 'ru'
  ): Promise<void> {
    await this.sendTemplatedEmail(email, 'passwordReset', {
      name,
      resetLink,
      expires: String(expires),
    }, locale);
  }

  /**
   * Отправить подтверждение покупки
   */
  async sendPurchaseConfirmation(
    email: string,
    name: string,
    orderDetails: OrderDetails,
    locale: string = 'ru'
  ): Promise<void> {
    const orderItems = orderDetails.items
      .map(item => `<li>${item.name} - ${item.price}</li>`)
      .join('');

    await this.sendTemplatedEmail(email, 'purchaseConfirmation', {
      name,
      orderId: orderDetails.orderId,
      orderItems,
      totalPrice: orderDetails.total,
    }, locale);
  }

  /**
   * Отправить письмо о созданном аккаунте с паролем
   */
  async sendAccountCreated(
    email: string,
    name: string,
    password: string,
    locale: string = 'ru'
  ): Promise<void> {
    await this.sendTemplatedEmail(email, 'accountCreated', {
      name,
      email,
      password,
    }, locale);
  }

  /**
   * Получить вложения для заказа
   */
  async getOrderAttachments(orderId: number): Promise<EmailAttachment[]> {
    const attachments: EmailAttachment[] = [];

    try {
      this.logger.log(`[DEBUG] Getting attachments for order ${orderId}`);
      
      // Находим заказ с элементами заказа
      const order = await this.orderModel.findByPk(orderId, {
        include: [
          {
            model: this.orderItemModel,
            include: [
              {
                model: this.productLicenseModel,
                include: [{ model: Product }],
              },
            ],
          },
        ],
      });

      if (!order) {
        this.logger.warn(`Order not found: ${orderId}`);
        return attachments;
      }

      this.logger.log(`[DEBUG] Order found, checking order_items`);
      
      const orderItems = order.order_items as (OrderItem & {
        product_license: ProductLicense & { product: Product };
      })[];

      this.logger.log(`[DEBUG] Found ${orderItems?.length || 0} order items`);

      for (const item of orderItems) {
        this.logger.log(`[DEBUG] Processing order item ${item.id}, product_license_id: ${item.product_license_id}`);
        
        const productLicense = item.product_license;
        if (!productLicense) {
          this.logger.warn(`[DEBUG] No product_license for order item ${item.id}`);
          continue;
        }

        const product = productLicense.product;
        this.logger.log(`[DEBUG] Product: ${product?.id}, file_url: "${product?.file_url}"`);
        
        if (!product || !product.file_url) {
          this.logger.warn(`[DEBUG] Skipping - no product or no file_url`);
          continue;
        }

        // file_url хранится как 'files/product/{id}/filename.ext'
        // Путь относительно корня проекта
        const fileUrl = product.file_url;
        
        // В Docker volume монтируется в /app/files (не в public)
        // fileUrl уже содержит 'files/product/...'
        const fullPath = path.join(process.cwd(), fileUrl);
        
        this.logger.log(`[DEBUG] Checking file at: ${fullPath}`);
        this.logger.log(`[DEBUG] process.cwd(): ${process.cwd()}`);

        // Проверяем существование файла
        if (fs.existsSync(fullPath)) {
          const filename = fileUrl.split('/').pop() || 'file';
          this.logger.log(`[DEBUG] File FOUND: ${filename}, size: ${fs.statSync(fullPath).size} bytes`);
          attachments.push({
            filename,
            path: fullPath,
            contentType: this.getMimeType(filename),
          });
          this.logger.log(`Found attachment: ${filename} for order ${orderId}`);
        } else {
          this.logger.warn(`[DEBUG] File NOT FOUND: ${fullPath} for order ${orderId}`);
        }
      }
      
      this.logger.log(`[DEBUG] Total attachments collected: ${attachments.length}`);
    } catch (error) {
      this.logger.error(`Error getting order attachments: ${error}`);
    }

    return attachments;
  }

  /**
   * Отправить подтверждение заказа с файлами
   */
  async sendOrderConfirmationWithFiles(
    email: string,
    orderId: number,
    locale: string = 'ru'
  ): Promise<void> {
    // Проверяем email на валидность
    if (!email || typeof email !== 'string' || !email.trim()) {
      this.logger.warn(`[DEBUG] Invalid or empty email provided for order ${orderId}. Skipping email sending.`);
      return;
    }

    const trimmedEmail = email.trim();
    
    // Простая проверка формата email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      this.logger.warn(`[DEBUG] Email "${trimmedEmail}" has invalid format for order ${orderId}. Skipping email sending.`);
      return;
    }

    try {
      // Получаем вложения
      const attachments = await this.getOrderAttachments(orderId);

      this.logger.log(`[DEBUG] Preparing to send email to ${trimmedEmail} with ${attachments.length} attachments`);
      
      // Получаем HTML из шаблона
      const { subject, body } = this.templateService.render(
        'orderConfirmation',
        locale,
        {
          orderId: String(orderId),
          attachmentsCount: String(attachments.length),
        }
      );

      // Отправляем email с вложениями
      const mailResult = await this.mailerService.sendMail({
        to: trimmedEmail,
        subject,
        html: body,
        attachments: attachments.map((att) => ({
          filename: att.filename,
          path: att.path,
          contentType: att.contentType,
        })),
      }) as unknown;

      this.logger.log(`[DEBUG] Mail sent successfully, response: ${JSON.stringify(mailResult)}`);
      this.logger.log(`Order confirmation sent to ${trimmedEmail} with ${attachments.length} attachments`);
    } catch (error) {
      this.logger.error(`[DEBUG] Failed to send order confirmation to ${trimmedEmail}:`, error);
      throw error;
    }
  }

  /**
   * Сформировать HTML для подтверждения заказа
   */
  private getOrderConfirmationHtml(
    orderId: number,
    attachmentsCount: number,
    locale: string
  ): string {
    const { body } = this.templateService.render(
      'orderConfirmation',
      locale,
      {
        orderId: String(orderId),
        attachmentsCount: String(attachmentsCount),
      }
    );

    return body;
  }

  /**
   * Определить MIME тип по расширению файла
   */
  private getMimeType(filename: string): string {
    const ext = path.extname(filename).toLowerCase();
    const mimeTypes: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.svg': 'image/svg+xml',
      '.mp4': 'video/mp4',
      '.webm': 'video/webm',
      '.mov': 'video/quicktime',
      '.zip': 'application/zip',
      '.rar': 'application/x-rar-compressed',
      '.7z': 'application/x-7z-compressed',
      '.pdf': 'application/pdf',
      '.psd': 'image/vnd.adobe.photoshop',
      '.ai': 'application/postscript',
      '.eps': 'application/eps',
    };
    return mimeTypes[ext] || 'application/octet-stream';
  }
}
