'use client';

import Image from 'next/image';
import { useEffect } from 'react';

interface ImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  src: string;
  alt?: string;
}

const SERVER_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export function ImageModal({ isOpen, onClose, src, alt = 'Preview' }: ImageModalProps) {
  // Обработчик закрытия по Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Блокируем скролл body
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Формируем полный URL для изображения
  const fullSrc = src.startsWith('http') ? src : `${SERVER_URL}/public/${src}`;

  return (
    <div 
      className="fixed inset-0 z-2050 flex items-center justify-center"
      onClick={onClose}
    >
      {/* Затемнение фона */}
      <div className="absolute inset-0 bg-black/80" />
      
      {/* Кнопка закрытия */}
      <button
        onClick={onClose}
        className="absolute top-20 right-4 z-10 text-white hover:text-gray-300 transition-colors"
      >
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Изображение */}
      <div 
        className="relative max-w-[90vw] max-h-[90vh] z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <Image
          src={fullSrc}
          alt={alt}
          width={1200}
          height={800}
          className="max-w-full max-h-[80vh] object-contain"
          unoptimized
        />
      </div>
    </div>
  );
}