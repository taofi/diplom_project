'use client';

import Image from 'next/image';
import { useState } from 'react';
import noimage from '../../public/noimage.png'; 

const SERVER_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

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
  width = 200,
  height = 200,
  className = '',
  priority = false,
}: ServerImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  const isInvalid = !src || src === '' || src === 'null' || src === 'undefined';
  const cleanSrc = !src ? '' : src.replace(/^\/+/, '');
  const normalizedSrc = cleanSrc.startsWith('public/')
    ? cleanSrc.slice('public/'.length)
    : cleanSrc;
  const isExternal = normalizedSrc.startsWith('http://') || normalizedSrc.startsWith('https://') || normalizedSrc.startsWith('data:');
  const resolvedSrc = isExternal ? normalizedSrc : `${SERVER_URL}/public/${normalizedSrc}`;
  const isFallback = isInvalid || failedSrc === resolvedSrc;
  const displaySrc = isFallback ? noimage : resolvedSrc;

  return (
    <div 
      className={`relative overflow-hidden flex  items-center justify-center  ${className}`} 
      style={!fill ? { width, height } : { width: '100%', height: '100%' }}
      key={src} 
    >
      <Image
        src={displaySrc}
        alt={alt}
        fill={fill && !isFallback}
        width={!fill || isFallback ? (isFallback ? width / 2 : width) : undefined}
        height={!fill || isFallback ? (isFallback ? height / 2 : height) : undefined}
        unoptimized={!isFallback}
        className={`transition-opacity duration-300 ${
          isFallback ? 'object-contain' : 'object-cover'
        } ${isLoading ? 'opacity-0' : 'opacity-100'}`}
        
        onLoad={() => setIsLoading(false)}
        onError={() => {
          console.error('Next.js Image failed to load:', displaySrc);
          setFailedSrc(resolvedSrc);
          setIsLoading(false);
        }}
        priority={priority}
      />
      
      {isLoading && (
        <div className="absolute inset-0  animate-pulse z-10" />
      )}
    </div>
  );
}