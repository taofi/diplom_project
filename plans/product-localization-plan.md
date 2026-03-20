# План реализации локализации Product

## Обзор задачи

Реализовать систему локализации для товаров с поддержкой:
1. Публичная часть (каталог, карточка товара) - работает как раньше с языковым параметром
2. Админ-панель - форма с табами для редактирования переводов (ru/en)
3. Отправка всех переводов одним массивом при создании/обновлении
4. Отдельная функция API для получения всех переводов (ru + en) для страницы редактирования

## Архитектура

```mermaid
flowchart TD
    subgraph Frontend
        F1[ProductForm] --> F2[LanguageTabs]
        F2 --> F3[Tabs: RU | EN]
        F3 --> F4[Поля для выбранного языка]
        F4 --> F5[Отправка: translations: [{language, name, description}]]
    end
    
    subgraph Backend
        B1[ProductController] --> B2[ProductService]
        B2 --> B3[ProductTranslationService]
        B3 --> B4[ProductRepository]
        B4 --> B5[product_translations table]
    end
    
    F5 -->|POST /products| B1
    F5 -->|PATCH /products/:id| B1
```

## Этапы реализации

---

## Этап 1: Серверная часть

### 1.1 Добавить поле `language` в ProductQueryDto

**Файл:** `server/src/product/dto/product-query.dto.ts`

```typescript
@IsOptional()
@IsString()
language?: string;
```

### 1.2 Создать ProductTranslationService

**Файл:** `server/src/product/product-translation.service.ts`

Методы:
- `getTranslation(product, language)` - получение перевода для конкретного языка
- `setTranslation(productId, translation)` - сохранение нового перевода
- `updateTranslation(productId, translation)` - обновление существующего перевода
- `deleteTranslation(productId, language)` - удаление перевода
- `getAllTranslations(productId)` - получить все переводы для продукта

### 1.3 Модифицировать ProductRepository

**Файл:** `server/src/product/repositories/product.repository.ts`

Добавить методы:
- `findByIdWithTranslation(id, language)` - получить продукт с переводом для языка
- `findAllForListWithTranslation(query, language)` - получить список с переводами

### 1.4 Модифицировать ProductService

**Файл:** `server/src/product/product.service.ts`

- Использовать ProductTranslationService для работы с переводами
- При `findAll` и `findById` применять переводы на основе языка из запроса
- При `create` и `update` сохранять все переводы из массива translations

---

## Этап 2: Фронтенд часть

> **Важно:** Публичная часть (каталог, карточка товара) остается без изменений!
> Функции `getProducts`, `getProductById` работают как раньше с языковым параметром.

### 2.1 Создать компонент LanguageTabs

**Файл:** `front/src/components/admin/LanguageTabs.tsx`

Компонент для переключения языков с табами:
- Props: `languages`, `activeLanguage`, `onChange`
- Стили: активный таб выделен, неактивные - серые
- Поддержка языков: ru, en

### 2.2 Создать типы для работы с переводами

**Файл:** `front/src/types/product/translation.types.ts`

```typescript
interface ProductTranslationForm {
  language: 'ru' | 'en';
  name: string;
  description: string;
  shortDescription?: string;
}

interface ProductFormData {
  // Общие поля
  type: ProductType;
  fileUrl: string;
  // ...другие поля
  // Переводы
  translations: ProductTranslationForm[];
}
```

### 2.3 Добавить функцию API для получения всех переводов

**Файл:** `front/src/lib/api-product.ts`

```typescript
/**
 * Получить товар со всеми переводами для админ-панели
 * @param productId - ID товара
 * @returns Товар с массивом всех переводов
 */
export async function getProductWithAllTranslations(
  productId: number
): Promise<ProductResponse & { allTranslations: TranslationDto[] }> {
  const response = await api.get<ProductResponse>(`/products/${productId}/translations`);
  return response.data;
}
```

### 2.4 Модифицировать ProductForm

**Файл:** `front/src/components/admin/ProductForm.tsx`

Изменения:
- Добавить состояние `activeLanguage` (по умолчанию 'ru')
- Хранить переводы для всех языков: `translations: { ru: {...}, en: {...} }`
- Добавить компонент LanguageTabs
- При переключении таба - переключаться между данными переводов
- При отправке формы - формировать массив translations со всеми языками

### 2.5 Модифицировать страницу редактирования

**Файл:** `front/src/app/[lang]/admin/products/[id]/page.tsx`

- Использовать новую функцию `getProductWithAllTranslations` для загрузки всех переводов
- Передавать все переводы в ProductForm
- **Публичная часть не меняется** - каталог и карточка товара работают как раньше

### 2.6 Обновить страницу создания

**Файл:** `front/src/app/[lang]/admin/products/new/page.tsx`

- Использовать новую версию ProductForm с tabs

---

## Детали реализации API

### Публичный API (без изменений)

```
GET /products?language=ru     -> возвращает товары с переводом на русский
GET /products?language=en     -> возвращает товары с переводом на английский
GET /products/:id?language=ru -> возвращает товар с переводом на русский
```

### Админ API (новые эндпоинты)

```
GET /products/:id/translations -> возвращает товар со ВСЕМИ переводами (ru + en)
```

**Ответ:**
```json
{
  "id": 1,
  "translations": {
    "ru": { "name": "...", "description": "..." },
    "en": { "name": "...", "description": "..." }
  }
}
```

### Создание товара с переводами

```typescript
POST /products
{
  "type": "brush",
  "fileUrl": "/files/...",
  "translations": [
    {
      "language": "ru",
      "name": "Название товара",
      "description": "Описание на русском"
    },
    {
      "language": "en",
      "name": "Product Name",
      "description": "Description in English"
    }
  ],
  "licenses": [...]
}
```

### Обновление товара с переводами

```typescript
PATCH /products/:id
{
  "translations": [
    {
      "language": "ru",
      "name": "Новое название на русском",
      "description": "Новое описание на русском"
    },
    {
      "language": "en",
      "name": "New English Name",
      "description": "New English Description"
    }
  ]
}
```

---

## UI/UX Форма редактирования товара

```mermaid
flowchart LR
    subgraph Форма товара
        T1[Табы: RU | EN]
        T1 -->|RU| F1[Поля для RU]
        T1 -->|EN| F2[Поля для EN]
        
        F1 --> N1[Название]
        F1 --> D1[Описание]
        
        F2 --> N2[Name]
        F2 --> D2[Description]
    end
    
    style T1 fill:#e0f2fe,stroke:#0284c7
    style F1 fill:#f0fdf4,stroke:#16a34a
    style F2 fill:#faf5ff,stroke:#9333ea
```

---

## Ожидаемый результат

1. **Публичная часть:** товары отображаются на выбранном языке, при смене языка данные перезагружаются
2. **Админ-панель:** форма с табами ru/en для ввода переводов
3. **API:** поддержка языкового параметра для всех операций с товарами
