'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth/AuthContext';
import { useI18n } from '@/context/i18n/I18nContext';
import { Button, Input, FormField, Alert, Card } from '@/components/ui';

interface LoginPageProps {
  params: { lang: string };
}

export default function LoginPage({ params }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, isLoading } = useAuth();
  const { t, locale } = useI18n();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await login(email, password);
      router.push(`/${locale}/profile`);
    } catch {
      setError(t('errors.invalidCredentials'));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center w-full px-6">
      <div className="max-w-md w-full">
        <Card padding="lg">
          <h1 className="text-2xl font-bold mb-6 text-center text-primary">
            {t('auth.loginTitle')}
          </h1>
          {error && (
            <Alert variant="error" message={error} className="mb-4" />
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

            <FormField label={t('auth.password')} required>
              <Input
                type="password"
                name="password"
                value={password}
                onChange={setPassword}
                placeholder={t('auth.passwordPlaceholder')}
                showPasswordToggle
                required
              />
            </FormField>

            <div className="text-right mb-4">
              <a
                href={`/${locale}/forgot-password`}
                className="text-primary hover:underline text-sm font-medium"
              >
                {t('auth.forgotPassword')}
              </a>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              loading={isLoading}
              fullWidth
              className="mt-4"
            >
              {t('auth.loginButton')}
            </Button>
          </form>

          <p className="mt-6 text-center text-gray-600">
            {t('auth.noAccount')}{' '}
            <a href={`/${locale}/register`} className="text-primary hover:underline font-medium">
              {t('auth.register')}
            </a>
          </p>
        </Card>
      </div>
    </div>
  );
}
