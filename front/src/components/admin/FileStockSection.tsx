'use client';

import { useI18n } from '@/context/i18n/I18nContext';
import { Input, FormField, Section } from '@/components/ui';

interface FileStockSectionProps {
  fileUrl: string;
  onFileUrlChange: (value: string) => void;
  price: string;
  onPriceChange: (value: string) => void;
  stock: number;
  onStockChange: (value: number) => void;
  discountPrice: string;
  onDiscountPriceChange: (value: string) => void;
}

export function FileStockSection({
  fileUrl,
  onFileUrlChange,
  price,
  onPriceChange,
  stock,
  onStockChange,
  discountPrice,
  onDiscountPriceChange,
}: FileStockSectionProps) {
  const { t } = useI18n();

  return (
    <Section title={t('admin.products.fileStock')}>
      <div className="space-y-4">
        <FormField label={t('admin.products.fileUrl')} required>
          <Input
            type="url"
            name="fileUrl"
            value={fileUrl}
            onChange={onFileUrlChange}
            required
            placeholder="https://..."
          />
        </FormField>

        <div className="grid grid-cols-3 gap-4">
          <FormField label={t('admin.products.price')} required>
            <Input
              type="number"
              name="price"
              value={price}
              onChange={onPriceChange}
              required
              min={0}
              step={0.01}
            />
          </FormField>

          <FormField label={t('admin.products.stock')}>
            <Input
              type="number"
              name="stock"
              value={stock}
              onChange={(value) => onStockChange(Number(value))}
              min={0}
            />
          </FormField>

          <FormField label={t('admin.products.discountPrice')}>
            <Input
              type="number"
              name="discountPrice"
              value={discountPrice}
              onChange={onDiscountPriceChange}
              min={0}
              step={0.01}
            />
          </FormField>
        </div>
      </div>
    </Section>
  );
}
