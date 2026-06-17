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

  
  getTemplate(templateName: TemplateName, locale: string): EmailTemplate {
    const normalizedLocale = this.normalizeLocale(locale);
    const template = this.templates[normalizedLocale]?.[templateName];

    if (!template) {
      return this.templates['ru'][templateName];
    }

    return template;
  }

  
  compile(template: EmailTemplate, variables: TemplateVariables): { subject: string; body: string } {
    let subject = template.subject;
    let body = template.body;

    for (const [key, value] of Object.entries(variables)) {
      if (value !== undefined) {
        const regex = new RegExp(`{{${key}}}`, 'g');
        subject = subject.replace(regex, value);
        body = body.replace(regex, value);
      }
    }

    return { subject, body };
  }

  
  render(
    templateName: TemplateName,
    locale: string,
    variables: TemplateVariables
  ): { subject: string; body: string } {
    const template = this.getTemplate(templateName, locale);
    return this.compile(template, variables);
  }

  
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


