'use client';

import { useI18n } from '@/context/i18n/I18nContext';
import { FormField, Section } from '@/components/ui';
import { FileUploader } from './FileUploader';
import { MediaUploader, type MediaItem } from './MediaUploader';

interface FileStockSectionProps {
  fileUrl: string;
  onFileUrlChange: (value: string) => void;
  media: MediaItem[];
  onMediaChange: (items: MediaItem[]) => void;
}

export function FileStockSection({
  fileUrl,
  onFileUrlChange,
  media,
  onMediaChange,
}: FileStockSectionProps) {
  const { t } = useI18n();

  return (
    <>
      {/* Секция медиа (изображения) */}
      <Section title={t('admin.products.media')}>
        <MediaUploader
          value={media}
          onChange={onMediaChange}
          maxItems={10}
          maxSize={5}
        />
      </Section>

      {/* Секция исходного файла */}
      <Section title={t('admin.products.sourceFile')}>
        <div className="space-y-4">
          <FormField label={t('admin.products.file')}>
            <FileUploader
              value={fileUrl}
              onChange={onFileUrlChange}
              maxSize={50}
              label={t('admin.products.fileHelp')}
            />
          </FormField>
        </div>
      </Section>
    </>
  );
}
