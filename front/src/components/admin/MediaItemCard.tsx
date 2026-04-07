'use client';

import { useI18n } from '@/context/i18n/I18nContext';
import { Button } from '@/components/ui';
import { ServerImage } from '@/components/Image';
import { X, Star } from 'lucide-react';
import { MediaItem } from './MediaUploader';
import { MediaType } from '@/types/product';

interface MediaItemCardProps {
  item: MediaItem;
  index: number;
  onRemove: (index: number) => void;
  onSetCover: (index: number) => void;
}

export function MediaItemCard({
  item,
  index,
  onRemove,
  onSetCover,
}: MediaItemCardProps) {
  const { t } = useI18n();
  const serverUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  const isVideo = item.mediaType === MediaType.VIDEO;

  // Extract just the filename from full URL if needed
  const imageSrc = item.url.includes('/public/') 
    ? item.url.split('/public/')[1] 
    : item.url;

  return (
    <div
      className={`relative aspect-square rounded-lg overflow-hidden group ${
        item.isCover ? 'ring-2 ring-primary' : ''
      }`}
    >
      {isVideo ? (
        <div className="absolute inset-0 bg-black">
          <video
            src={`${serverUrl}/public/${imageSrc}`}
            className="h-full w-full object-cover"
            preload="metadata"
            muted
            playsInline
          />
          <div className="absolute inset-0 flex items-center justify-center text-white text-2xl">
            ▶
          </div>
        </div>
      ) : (
        <ServerImage
          src={imageSrc}
          alt={`Media ${index + 1}`}
          fill
          className="object-cover"
        />
      )}

      {/* Cover badge */}
      {item.isCover && (
        <div className="absolute top-2 left-2 bg-primary text-white text-xs px-2 py-1 rounded flex items-center gap-1 z-10">
          <Star className="w-3 h-3 fill-current" />
          {t('admin.products.cover') || 'Главное'}
        </div>
      )}

      {/* Action buttons overlay */}
      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
        {/* Set as cover button */}
        {!item.isCover && !isVideo && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onSetCover(index)}
            title={t('admin.products.setAsCover') || 'Сделать главным'}
          >
            <Star className="w-4 h-4" />
          </Button>
        )}

        {/* Remove button */}
        <Button
          variant="danger"
          size="sm"
          onClick={() => onRemove(index)}
          title={t('common.delete') || 'Удалить'}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

export default MediaItemCard;
