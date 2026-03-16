'use client';

import Image from 'next/image';
import { useState } from 'react';

const SERVER_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface ServerImageProps {
  src: string | null | undefined;
  alt: string;
  fill?: boolean;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
}

export function ServerImage({
  src,
  alt,
  fill = false,
  width,
  height,
  className = '',
  priority = false,
}: ServerImageProps) {
  const [isLoading, setIsLoading] = useState(true);

  // Если src null, undefined или пустая строка - показываем noimage
  const isInvalid = !src || src === '' || src === 'null' || src === 'undefined';

  // Fallback на локальный noimage.png
  const fallbackSrc = '/noimage.png';

  // Полный URL к изображению на сервере
  const imageSrc = isInvalid ? fallbackSrc : `${SERVER_URL}/public/${src}`;

  if (fill) {
    return (
      <div className={`relative ${className}`}>
        <Image
          src={imageSrc}
          alt={alt}
          fill
          className={`object-cover transition-opacity duration-300 ${
            isLoading ? 'opacity-0' : 'opacity-100'
          }`}
          onLoad={() => setIsLoading(false)}
          onError={() => setIsLoading(false)}
          priority={priority}
        />
        {isLoading && (
          <div className="absolute inset-0 bg-gray-200 animate-pulse" />
        )}
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} style={{ width, height }}>
      <Image
        src={imageSrc}
        alt={alt}
        width={width || 200}
        height={height || 200}
        className={`object-cover transition-opacity duration-300 ${
          isLoading ? 'opacity-0' : 'opacity-100'
        }`}
        onLoad={() => setIsLoading(false)}
        onError={() => setIsLoading(false)}
        priority={priority}
      />
      {isLoading && (
        <div
          className="absolute inset-0 bg-gray-200 animate-pulse"
          style={{ width: width || 200, height: height || 200 }}
        />
      )}
    </div>
  );
}
