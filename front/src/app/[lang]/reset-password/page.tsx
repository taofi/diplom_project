'use client';

import { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useI18n } from '@/context/i18n/I18nContext';
import { resetPassword } from '@/lib/api-auth';
import { Button, Input, FormField, Alert, Card } from '@/components/ui';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { t, locale } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();

  const token = useMemo(() => searchParams.get('token') || '', [searchParams]);
  const email = useMemo(() => searchParams.get('email') || '', [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!token || !email) {
      setError(t('auth.resetTokenInvalid'));
      return;
    }

    if (password !== confirmPassword) {
      setError(t('errors.passwordsDoNotMatch'));
      return;
    }

    try {
      setIsSubmitting(true);
      await resetPassword(email, token, password);
      router.push(`/${locale}/login`);
    } catch {
      setError(t('auth.resetPasswordError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center w-full px-6">
      <div className="max-w-md w-full">
        <Card padding="lg">
          <h1 className="text-2xl font-bold mb-6 text-center text-primary">
            {t('auth.resetPasswordTitle')}
          </h1>

          {error && <Alert variant="error" message={error} className="mb-4" />}
          {!token || !email ? (
            <Alert variant="error" message={t('auth.resetTokenInvalid')} className="mb-4" />
          ) : null}

          <form onSubmit={handleSubmit}>
            <FormField label={t('auth.password')} required>
              <Input
                type="password"
                name="password"
                value={password}
                onChange={setPassword}
                placeholder={t('auth.passwordPlaceholder')}
                minLength={8}
                showPasswordToggle
                required
              />
            </FormField>

            <FormField label={t('auth.confirmPassword')} required>
              <Input
                type="password"
                name="confirmPassword"
                value={confirmPassword}
                onChange={setConfirmPassword}
                placeholder={t('auth.confirmPasswordPlaceholder')}
                minLength={8}
                showPasswordToggle
                required
              />
            </FormField>

            <Button
              type="submit"
              disabled={isSubmitting || !token || !email}
              loading={isSubmitting}
              fullWidth
              className="mt-4"
            >
              {t('auth.setNewPassword')}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
