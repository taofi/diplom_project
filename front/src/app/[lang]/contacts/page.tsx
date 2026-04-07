'use client';

import { useState } from 'react';
import { useI18n } from '@/context/i18n/I18nContext';
import { chatApi } from '@/lib/api-chat';
import { useAuth } from '@/context/auth/AuthContext';
import { Button } from '@/components/ui';
import { useRouter } from 'next/navigation';

export default function ContactsPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleStartGeneralChat = async () => {
    if (!user) {
      router.push('/login');
      return;
    }

    try {
      setLoading(true);
      // Для общего чата создаём чат с sellerId = 0 (общий чат с поддержкой)
      // Примечание: в реальном приложении здесь должен быть ID администратора/поддержки
      const chat = await chatApi.createChat(0);
      router.push(`/chat?roomId=${chat.id}`);
    } catch (error) {
      console.error('Failed to start chat:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 mt-20">
      <h1 className="text-4xl font-bold text-text mb-8">
        {t('footer.contacts')}
      </h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Contact Info */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-secondary">
          <h2 className="text-xl font-semibold text-text mb-6">
            {t('footer.aboutLink')}
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-text">Email</p>
                <a href="mailto:nadzin@example.com" className="text-text/70 hover:text-primary transition-colors">
                  nadzin@example.com
                </a>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </div>
              <div>
                <p className="font-medium text-text">YouTube</p>
                <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="text-text/70 hover:text-primary transition-colors">
                  youtube.com/@nadzin
                </a>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>
                </svg>
              </div>
              <div>
                <p className="font-medium text-text">Instagram</p>
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-text/70 hover:text-primary transition-colors">
                  instagram.com/nadzin
                </a>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
