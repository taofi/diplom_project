import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { TemplateService } from './templates/template.service';
import type { TemplateVariables, TemplateName } from './templates/types';

export interface SendEmailOptions {
  to: string;
  subject?: string;
  html?: string;
}

export interface OrderItem {
  name: string;
  price: string;
}

export interface OrderDetails {
  orderId: string;
  items: OrderItem[];
  total: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(
    private readonly mailerService: MailerService,
    private readonly templateService: TemplateService,
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
}
