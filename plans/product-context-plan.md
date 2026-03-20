# План: Создание ProductContext для управления продуктами

## Анализ структуры проекта

### Server (NestJS)
**Путь:** `server/src/product/`

**Эндпоинты API:**
- `GET /products` - получить все продукты с фильтрацией
- `GET /products/:id` - получить продукт по ID
- `GET /products/my` - получить мои продукты (для продавца)
- `POST /products` - создать продукт (требует JWT)
- `PATCH /products/:id` - обновить продукт (требует JWT)
- `DELETE /products/:id` - удалить продукт (требует JWT)
- `PATCH /products/:id/activate` - активировать продукт
- `PATCH /products/:id/deactivate` - деактивировать продукт
- `GET /products/:id/media` - получить медиа продукта
- `POST /products/:id/media` - добавить медиа
- `DELETE /products/:id/media/:mediaId` - удалить медиа
- `GET /products/:id/licenses` - получить лицензии
- `POST /products/:id/licenses` - добавить лицензию
- `DELETE /products/:id/licenses/:licenseId` - удалить лицензию

### Front - Существующая структура

#### Types (уже существуют)
**Путь:** `front/src/types/product/`
- `enums.ts` - MediaType, ProductType
- `product.types.ts` - ProductBase, CreateProductDto, UpdateProductDto
- `product-query.types.ts` - ProductQueryParams, ProductListResponse
- `product-relations.types.ts` - ProductResponse, MediaInfo, LicenseInfo
- `index.ts` - экспорт всех типов

#### API (уже существует)
**Путь:** `front/src/lib/api-product.ts`
- Функции для получения, создания, обновления, удаления продуктов
- Функции для работы с медиа и лицензиями
- Уже использует正确的 типы из `@/types/product`

#### Admin Products Page (требует обновления)
**Путь:** `front/src/app/[lang]/admin/products/page.tsx`
- Текущая страница использует `getProducts`, `deleteProduct`, `activateProduct`, `deactivateProduct` напрямую из `api-product.ts`
- Есть логика фильтрации, пагинации, поиска

## Задачи

### 1. Создание ProductContext
**Новый файл:** `front/src/context/product/ProductContext.tsx`

**Компоненты:**
- `ProductProvider` - провайдер контекста
- `useProducts` - хук для использования контекста

**Состояние контекста:**
- `products` - массив продуктов
- `loading` - состояние загрузки
- `error` - ошибка
- `pagination` - мета-информация о пагинации
- `filters` - текущие фильтры

**Функции контекста:**
- `fetchProducts(params)` - получить продукты
- `fetchProductById(id)` - получить продукт по ID
- `createProduct(data)` - создать продукт
- `updateProduct(id, data)` - обновить продукт
- `deleteProduct(id)` - удалить продукт
- `activateProduct(id)` - активировать продукт
- `deactivateProduct(id)` - деактивировать продукт
- `setFilters(filters)` - установить фильтры
- `clearFilters()` - очистить фильтры

### 2. Обновление страницы Admin Products
**Файл:** `front/src/app/[lang]/admin/products/page.tsx`

**Изменения:**
- Импортировать `useProducts` из контекста
- Заменить прямые вызовы API на вызовы через контекст
- Использовать `setFilters` и `clearFilters` для управления фильтрами

### 3. Реэкспорт в lib/api.ts
**Файл:** `front/src/lib/api.ts`

**Добавить:**
- Реэкспорт функций из `api-product.ts` для的统一ного доступа

## Реализация

### Шаг 1: Создать файл контекста
```
front/src/context/product/ProductContext.tsx
```

### Шаг 2: Обновить страницу admin/products
```
front/src/app/[lang]/admin/products/page.tsx
```

### Шаг 3: Добавить реэкспорт в api.ts
```
front/src/lib/api.ts
```
