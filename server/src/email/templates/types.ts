
export interface EmailTemplate {
  subject: string;
  body: string;
}


export interface EmailTemplates {
  verificationCode: EmailTemplate;
  welcome: EmailTemplate;
  passwordReset: EmailTemplate;
  purchaseConfirmation: EmailTemplate;
  accountCreated: EmailTemplate;
  orderConfirmation: EmailTemplate;
}


export interface TemplateVariables {
  name?: string;
  email?: string;

  code?: string;
  expires?: string;

  resetLink?: string;

  orderId?: string;
  orderItems?: string;
  totalPrice?: string;

  password?: string;

  attachmentsCount?: string;
}


export type TemplateName = keyof EmailTemplates;


