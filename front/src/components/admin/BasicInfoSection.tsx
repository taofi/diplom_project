'use client';

import { useI18n } from '@/context/i18n/I18nContext';
import { ProductType } from '@/types/product';
import { Input, Select, FormField, Section } from '@/components/ui';
import { MarkdownEditorField } from './MarkdownEditorField';

interface BasicInfoSectionProps {
  name: string;
  onNameChange: (value: string) => void;
  description: string;
  onDescriptionChange: (value: string) => void;
  type: ProductType;
  onTypeChange: (value: ProductType) => void;
}

const typeOptions = [
  { value: ProductType.BRUSH, label: 'product.types.brush' },
  { value: ProductType.ILLUSTRATION, label: 'product.types.illustration' },
];

export function BasicInfoSection({
  name,
  onNameChange,
  description,
  onDescriptionChange,
  type,
  onTypeChange,
}: BasicInfoSectionProps) {
  const { t } = useI18n();

  return (
    <Section title={t('admin.products.basicInfo')}>
      <div className="space-y-4">
        <FormField label={t('admin.products.name')} required>
          <Input
            type="text"
            name="name"
            value={name}
            onChange={onNameChange}
            required
          />
        </FormField>

        <FormField label={t('admin.products.description')}>
          <MarkdownEditorField
            value={description}
            onChange={onDescriptionChange}
          />
        </FormField>

        <FormField label={t('admin.products.type')} required>
          <Select
            name="type"
            value={type}
            onChange={(value) => onTypeChange(value as ProductType)}
            options={typeOptions.map(opt => ({ value: opt.value, label: t(opt.label) }))}
            required
          />
        </FormField>
      </div>
    </Section>
  );
}
