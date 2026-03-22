import { Injectable } from '@nestjs/common';
import ruTemplates from './locales/ru.json';
import enTemplates from './locales/en.json';
import type { EmailTemplate, EmailTemplates, TemplateVariables, TemplateName } from './types';

@Injectable()
export class TemplateService {
  private templates: Record<string, EmailTemplates> = {
    ru: ruTemplates as EmailTemplates,
    en: enTemplates as EmailTemplates,
  };

  /**
   * Получить шаблон по имени и языку
   */
  getTemplate(templateName: TemplateName, locale: string): EmailTemplate {
    const normalizedLocale = this.normalizeLocale(locale);
    const template = this.templates[normalizedLocale]?.[templateName];

    if (!template) {
      // Fallback на русский
      return this.templates['ru'][templateName];
    }

    return template;
  }

  /**
   * Скомпилировать шаблон с переменными
   */
  compile(template: EmailTemplate, variables: TemplateVariables): { subject: string; body: string } {
    let subject = template.subject;
    let body = template.body;

    // Заменяем все переменные вида {{variable}}
    for (const [key, value] of Object.entries(variables)) {
      if (value !== undefined) {
        const regex = new RegExp(`{{${key}}}`, 'g');
        subject = subject.replace(regex, value);
        body = body.replace(regex, value);
      }
    }

    return { subject, body };
  }

  /**
   * Получить скомпилированный шаблон
   */
  render(
    templateName: TemplateName,
    locale: string,
    variables: TemplateVariables
  ): { subject: string; body: string } {
    const template = this.getTemplate(templateName, locale);
    return this.compile(template, variables);
  }

  /**
   * Нормализовать язык
   */
  private normalizeLocale(locale: string | undefined): string {
    if (!locale) {
      return 'ru';
    }
    const normalized = locale.toLowerCase();
    if (normalized === 'en' || normalized.startsWith('en-')) {
      return 'en';
    }
    return 'ru';
  }
}
