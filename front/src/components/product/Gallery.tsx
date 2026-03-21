'use client';

import { useState } from 'react';
import { ServerImage } from '../Image';
import type { MediaInfo } from '@/types/product';

interface GalleryProps {
  media: MediaInfo[];
  productName: string;
}

export function Gallery({ media, productName }: GalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Filter только изображения
  const images = media.filter((m) => m.mediaType === 'image');

  // Если нет изображений, показываем заглушку
  if (images.length === 0) {
    return (
      <div className="bg-gray-100 rounded-lg flex items-center justify-center aspect-square">
        <span className="text-gray-400">Нет изображений</span>
      </div>
    );
  }

  return (
    <div className="flex gap-4">
      {/* Thumbnails - вертикальная полоса */}
      <div className="flex flex-col gap-2 overflow-y-auto max-h-[500px] w-20 flex-shrink-0">
        {images.map((item, index) => (
          <button
            key={item.id}
            onClick={() => setSelectedIndex(index)}
            className={`w-16 h-16 rounded overflow-hidden border-2 transition-all hover:opacity-80 ${
              index === selectedIndex
                ? 'border-primary ring-2 ring-primary/30'
                : 'border-transparent'
            }`}
          >
            <ServerImage
              src={item.url}
              alt={`${productName} - ${index + 1}`}
              fill
              className="object-cover"
            />
          </button>
        ))}
      </div>

      {/* Main Preview */}
      <div className="flex-1 bg-gray-100 rounded-lg overflow-hidden aspect-square relative">
        <ServerImage
          src={images[selectedIndex]?.url}
          alt={productName}
          fill
          className="object-contain"
          priority
        />
      </div>
    </div>
  );
}
