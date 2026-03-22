/**
 * Интерфейс одного шаблона email
 */
export interface EmailTemplate {
  subject: string;
  body: string;
}

/**
 * Все доступные типы шаблонов
 */
export interface EmailTemplates {
  verificationCode: EmailTemplate;
  welcome: EmailTemplate;
  passwordReset: EmailTemplate;
  purchaseConfirmation: EmailTemplate;
}

/**
 * Переменные для подстановки в шаблоны
 */
export interface TemplateVariables {
  // Общие
  name?: string;
  email?: string;

  // verificationCode
  code?: string;
  expires?: string;

  // passwordReset
  resetLink?: string;

  // purchaseConfirmation
  orderId?: string;
  orderItems?: string;
  totalPrice?: string;
}

/**
 * Ключи шаблонов
 */
export type TemplateName = keyof EmailTemplates;
