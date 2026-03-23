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

      const orderItems = order.order_items as (OrderItem & {
        product_license: ProductLicense & { product: Product };
      })[];

      for (const item of orderItems) {
        const productLicense = item.product_license;
        if (!productLicense) continue;

        const product = productLicense.product;
        if (!product || !product.file_url) continue;

        // file_url хранится как 'files/product/{id}/filename.ext'
        // Путь относительно корня проекта
        const fileUrl = product.file_url;
        const fullPath = path.join(process.cwd(), fileUrl);

        // Проверяем существование файла
        if (fs.existsSync(fullPath)) {
          const filename = fileUrl.split('/').pop() || 'file';
          attachments.push({
            filename,
            path: fullPath,
            contentType: this.getMimeType(filename),
          });
          this.logger.log(`Found attachment: ${filename} for order ${orderId}`);
        } else {
          this.logger.warn(`File not found: ${fullPath} for order ${orderId}`);
        }
      }
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
    try {
      // Получаем вложения
      const attachments = await this.getOrderAttachments(orderId);

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
      await this.mailerService.sendMail({
        to: email,
        subject,
        html: body,
        attachments: attachments.map((att) => ({
          filename: att.filename,
          path: att.path,
          contentType: att.contentType,
        })),
      });

      this.logger.log(`Order confirmation sent to ${email} with ${attachments.length} attachments`);
    } catch (error) {
      this.logger.error(`Failed to send order confirmation to ${email}:`, error);
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
