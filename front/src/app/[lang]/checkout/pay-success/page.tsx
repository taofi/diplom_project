'use client';

import { useEffect } from 'react';

export default function PaySuccessPage() {
  useEffect(() => {


    // 2. Пытаемся закрыть текущую вкладку
    window.close();

    // 3. Fallback: если браузер блокирует close() (например, вкладка открыта не через JS),
    // можно просто сделать редирект или написать текст
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p>Оплата прошла успешно! Это окно закроется автоматически...</p>
    </div>
  );
}