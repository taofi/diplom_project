# План рефакторинга ProductForm

## Анализ текущего состояния

### Страница `front/src/app/[lang]/admin/products/new/page.tsx`
Содержит:
- Все state управления формой (name, description, type, fileUrl, media, isActive, isFeatured)
- State категорий и лицензий
- Загрузку данных (categories, license types) через useEffect
- Проверку прав админа
- Обработчики: addLicense, removeLicense, updateLicense, toggleCategory
- Логику отправки handleSubmit
- Визуальную обертку (заголовок, контейнер)

### Компонент `front/src/components/admin/ProductForm.tsx`
Содержит:
- Только UI - принимает все значения и колбеки через props
- Собирает подкомпоненты: BasicInfoSection, FileStockSection, CategorySelector, LicenseManager, StatusSection, FormButtons

---

## Цель рефакторинга

Сделать `ProductForm` универсальным компонентом для:
1. **Создания** нового продукта (текущий функционал)
2. **Редактирования** существующего продукта (новый функционал)

---

## Новый интерфейс ProductForm

```typescript
interface ProductFormProps {
  // Режим работы формы
  mode?: 'create' | 'edit';
  
  // Продукт для редактирования (опционально)
  product?: ProductResponse;
  
  // Колбек отправки - возвращает готовые данные для API
  onSubmit: (data: CreateProductDto | UpdateProductDto) => Promise<void>;
  
  // Колбек отмены
  onCancel: () => void;
  
  // Опциональные пропы для переопределения
  loading?: boolean;
  error?: string;
}
```

### Что перемещается внутрь ProductForm:

1. **Все state управления формой:**
   - name, description, type, fileUrl, media, isActive, isFeatured
   - categories, selectedCategories
   - licenseTypes, licenses

2. **Загрузка данных:**
   - useEffect для загрузки categories и licenseTypes
   - Инициализация начальной лицензии

3. **Обработчики:**
   - addLicense(), removeLicense(), updateLicense()
   - toggleCategory()
   - Внутренний handleSubmit с валидацией

4. **Валидация:**
   - Проверка обязательных полей
   - Проверка лицензий

---

## Изменения в подкомпонентах

### 1. FormButtons.tsx
Добавить проп `mode`:
```typescript
interface FormButtonsProps {
  mode?: 'create' | 'edit';
  loading: boolean;
  onCancel: () => void;
}
```
- Если mode === 'edit': текст кнопки = t('admin.products.update')
- Если mode === 'create': текст кнопки = t('admin.products.create')

### 2. CategorySelector.tsx
Добавить обработку пустых категорий (показать сообщение "Категории загружаются..." или "Нет доступных категорий")

---

## Изменения в странице new/page.tsx

После рефакторинга страница упростится до:

```typescript
export default function NewProductPage() {
  const { t, locale } = useI18n();
  const router = useRouter();

  const handleSubmit = async (data: CreateProductDto) => {
    await createProduct(data, locale);
    router.push(`/${locale}/admin/products`);
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <div className="min-h-screen mt-20 py-8">
      <div className="max-w-4xl mx-auto px-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {t('admin.products.createNew')}
          </h1>
        </div>
        
        <ProductForm 
          mode="create"
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
}
```

---

## Пример использования для редактирования (новый функционал)

```typescript
// front/src/app/[lang]/admin/products/[id]/page.tsx
export default function EditProductPage({ params }: { params: { id: string } }) {
  const { t, locale } = useI18n();
  const router = useRouter();
  
  // Загрузка продукта...
  const { product, loading } = useProduct(parseInt(params.id));

  const handleSubmit = async (data: UpdateProductDto) => {
    await updateProduct(parseInt(params.id), data, locale);
    router.push(`/${locale}/admin/products/${params.id}`);
  };

  if (loading) return <Spinner />;

  return (
    <div className="min-h-screen mt-20 py-8">
      <div className="max-w-4xl mx-auto px-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {t('admin.products.edit')}
          </h1>
        </div>
        
        <ProductForm 
          mode="edit"
          product={product}
          onSubmit={handleSubmit}
          onCancel={() => router.back()}
        />
      </div>
    </div>
  );
}
```

---

## Инициализация формы при редактировании

При получении пропса `product`, ProductForm должен:

1. **Заполнить основные поля:**
   - name = product.name
   - description = product.description || ''
   - type = product.type
   - fileUrl = product.fileUrl
   - isActive = product.isActive
   - isFeatured = product.isFeatured

2. **Заполнить категории:**
   - selectedCategories = product.categories?.map(c => c.id) || []

3. **Заполнить медиа:**
   - media = product.media?.map(m => ({
       id: m.id.toString(),
       url: m.url,
       isCover: m.isCover,
       // ... другие поля
     })) || []

4. **Заполнить лицензии:**
   - licenses = product.licenses?.map((l, index) => ({
       id: l.id.toString(),
       licenseTypeId: l.licenseTypeId,
       price: l.price.toString(),
     })) || []

---

## порядок выполнения

1. **Обновить ProductForm.tsx**
   - Добавить все state внутрь компонента
   - Добавить загрузку данных (categories, licenseTypes)
   - Добавить обработчики
   - Добавить валидацию
   - Добавить поддержку product prop
   - Упростить интерфейс props

2. **Обновить FormButtons.tsx**
   - Добавить проп mode
   - Изменить текст кнопки в зависимости от mode

3. **Обновить new/page.tsx**
   - Упростить до минимума
   - Использовать новый интерфейс ProductForm

4. **Создать страницу редактирования** (опционально)
   - front/src/app/[lang]/admin/products/[id]/page.tsx
   - Использовать ProductForm с mode="edit" и product prop

---

## Mermaid диаграмма - Новая архитектура

```mermaid
flowchart TD
    A[Страница new/page.tsx] -->|mode: create| B[ProductForm]
    A[Страница new/page.tsx] -->|onSubmit: CreateProductDto| C[API createProduct]
    
    D[Страница edit/[id]/page.tsx] -->|mode: edit| E[ProductForm]
    D[Страница edit/[id]/page.tsx] -->|product prop| E
    E -->|onSubmit: UpdateProductDto| F[API updateProduct]
    
    B --> G[State: name, description, type...]
    B --> H[State: categories, licenses]
    B --> I[useEffect: загрузка данных]
    B --> J[handleSubmit: валидация]
    
    G --> K[BasicInfoSection]
    H --> L[CategorySelector]
    H --> M[LicenseManager]
    G --> N[FileStockSection]
    G --> O[StatusSection]
    K --> P[FormButtons]
    L --> P
    M --> P
    N --> P
    O --> P
```
