'use client';

import { useI18n } from '@/context/i18n/I18nContext';
import { Button } from '@/components/ui';
import { ServerImage } from '@/components/Image';
import { X, Star } from 'lucide-react';
import { MediaItem } from './MediaUploader';

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
      <ServerImage
        src={imageSrc}
        alt={`Media ${index + 1}`}
        fill
        className="object-cover"
      />

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
        {!item.isCover && (
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
