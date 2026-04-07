'use client';

import { useEffect, useState } from 'react';
import { ServerImage } from '../Image';
import { MediaType, type MediaInfo } from '@/types/product';

interface GalleryProps {
  media: MediaInfo[];
  productName: string;
}

export function Gallery({ media, productName }: GalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [aspectRatio, setAspectRatio] = useState(1);
  const [isImageVisible, setIsImageVisible] = useState(true);

  const galleryMedia = media.filter(
    (m) => m.mediaType === MediaType.IMAGE || m.mediaType === MediaType.VIDEO,
  );
  const selectedMedia = galleryMedia[selectedIndex];
  const selectedMediaUrl = selectedMedia?.url;
  const isSelectedVideo = selectedMedia?.mediaType === MediaType.VIDEO;
  const serverUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  const selectedMediaSrc = selectedMediaUrl
    ? `${serverUrl}/public/${selectedMediaUrl}`
    : null;

  useEffect(() => {
    if (!selectedMediaUrl) {
      setAspectRatio(1);
      return;
    }

    if (isSelectedVideo) {
      setAspectRatio(16 / 9);
      return;
    }

    if (!selectedMediaSrc) {
      setAspectRatio(1);
      return;
    }

    const img = new Image();
    img.src = selectedMediaSrc;
    img.onload = () => {
      if (img.naturalWidth > 0 && img.naturalHeight > 0) {
        setAspectRatio(img.naturalWidth / img.naturalHeight);
      } else {
        setAspectRatio(1);
      }
    };
    img.onerror = () => setAspectRatio(1);
  }, [selectedMediaUrl, selectedMediaSrc, isSelectedVideo]);

  useEffect(() => {
    setIsImageVisible(false);
    const frameId = requestAnimationFrame(() => setIsImageVisible(true));
    return () => cancelAnimationFrame(frameId);
  }, [selectedMediaUrl]);

  if (galleryMedia.length === 0) {
    return (
      <div className="bg-gray-100 rounded-lg flex items-center justify-center aspect-square">
        <span className="text-gray-400">Нет медиа</span>
      </div>
    );
  }

  return (
    <div className="flex gap-4">
      {/* Thumbnails - вертикальная полоса */}
      <div className="flex flex-col gap-2 overflow-y-auto max-h-[500px] w-20 flex-shrink-0">
        {galleryMedia.map((item, index) => (
          <button
            key={item.id}
            onMouseEnter={() => setSelectedIndex(index)}
            onFocus={() => setSelectedIndex(index)}
            onClick={() => setSelectedIndex(index)}
            className={`w-16 h-16 rounded overflow-hidden border-2 transition-all duration-300 hover:opacity-90 hover:scale-105 ${
              index === selectedIndex
                ? 'border-primary ring-2 ring-primary/30'
                : 'border-transparent'
            }`}
          >
            {item.mediaType === MediaType.VIDEO ? (
              <div className="relative w-full h-full bg-black/90 flex items-center justify-center">
                <video
                  src={`${serverUrl}/public/${item.url}`}
                  className="absolute inset-0 h-full w-full object-cover opacity-80"
                  preload="metadata"
                  muted
                  playsInline
                />
                <span className="relative text-white text-lg">▶</span>
              </div>
            ) : (
              <ServerImage
                src={item.url}
                alt={`${productName} - ${index + 1}`}
                fill
                className="object-cover"
              />
            )}
          </button>
        ))}
      </div>

      {/* Main Preview */}
      <div
        className="flex-1 bg-gray-100 rounded-lg overflow-hidden relative w-full"
        style={{ aspectRatio }}
      >
        <div
          className={`absolute inset-0 transition-all duration-300 ${
            isImageVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-[0.98]'
          }`}
        >
          {isSelectedVideo ? (
            <video
              key={selectedMediaUrl}
              src={selectedMediaSrc || undefined}
              className="h-full w-full object-contain bg-black"
              controls
              playsInline
              preload="metadata"
            />
          ) : (
            <ServerImage
              src={selectedMediaUrl}
              alt={productName}
              fill
              priority
            />
          )}
        </div>
      </div>
    </div>
  );
}
