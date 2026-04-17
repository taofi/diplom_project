'use client';

import { useState } from 'react';
import { useI18n } from '@/context/i18n/I18nContext';
import { forgotPassword } from '@/lib/api-auth';
import { Button, Input, FormField, Alert, Card } from '@/components/ui';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { t, locale } = useI18n();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      setIsSubmitting(true);
      await forgotPassword(email);
      setIsSuccess(true);
    } catch {
      setError(t('auth.resetRequestError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center w-full px-6">
      <div className="max-w-md w-full">
        <Card padding="lg">
          <h1 className="text-2xl font-bold mb-6 text-center text-primary">
            {t('auth.forgotPasswordTitle')}
          </h1>

          {error && <Alert variant="error" message={error} className="mb-4" />}
          {isSuccess && (
            <Alert variant="success" message={t('auth.resetRequestSuccess')} className="mb-4" />
          )}

          <form onSubmit={handleSubmit}>
            <FormField label={t('auth.email')} required>
              <Input
                type="email"
                name="email"
                value={email}
                onChange={setEmail}
                placeholder={t('auth.emailPlaceholder')}
                required
              />
            </FormField>

            <Button
              type="submit"
              disabled={isSubmitting}
              loading={isSubmitting}
              fullWidth
              className="mt-4"
            >
              {t('auth.sendResetLink')}
            </Button>
          </form>

          <p className="mt-6 text-center text-gray-600">
            <a href={`/${locale}/login`} className="text-primary hover:underline font-medium">
              {t('auth.backToLogin')}
            </a>
          </p>
        </Card>
      </div>
    </div>
  );
}
