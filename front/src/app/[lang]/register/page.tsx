'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth/AuthContext';
import { useI18n } from '@/context/i18n/I18nContext';
import { Button, Input, FormField, Alert, Card } from '@/components/ui';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const { register, isLoading } = useAuth();
  const { t, locale } = useI18n();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError(t('errors.passwordsDoNotMatch'));
      return;
    }

    try {
      await register(email, password, name);
      router.push(`/${locale}/profile`);
    } catch {
      setError(t('errors.registrationFailed'));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center w-full px-6">
      <div className="max-w-md w-full">
        <Card padding="lg">
          <h1 className="text-2xl font-bold mb-6 text-center text-primary">
            {t('auth.registerTitle')}
          </h1>
          {error && (
            <Alert variant="error" message={error} className="mb-4" />
          )}

          <form onSubmit={handleSubmit}>
            <FormField label={t('auth.name')} required>
              <Input
                type="text"
                name="name"
                value={name}
                onChange={setName}
                placeholder={t('auth.namePlaceholder')}
                required
              />
            </FormField>

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
              disabled={isLoading}
              loading={isLoading}
              fullWidth
              className="mt-4"
            >
              {t('auth.registerButton')}
            </Button>
          </form>

          <p className="mt-6 text-center text-gray-600">
            {t('auth.hasAccount')}{' '}
            <a href={`/${locale}/login`} className="text-primary hover:underline font-medium">
              {t('auth.login')}
            </a>
          </p>
        </Card>
      </div>
    </div>
  );
}
