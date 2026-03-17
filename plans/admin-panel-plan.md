# План создания админ-панели для управления товарами

## Анализ текущей структуры проекта

### Что ЕСТЬ на бэкенде:

#### Модели БД:
1. **Product** - основная модель товара
   - `type` (ProductType): brush | illustration
   - ~~`price`~~ - **БУДЕТ УДАЛЕНО** (цена = мин. цена из лицензий)
   - `discount_price`, `sku`, `stock`
   - `file_url` - URL файла товара
   - `main_image` - **БУДЕТ УДАЛЕНО** (будет браться из media where is_cover=true)
   - `is_active`, `is_featured`
   - Связи: media, translations, licenses, categories

2. **ProductTranslation** - переводы товара
   - `name`, `description`, `shortDescription`
   - `language` (ru/en)

3. **ProductMedia** - медиа товара
   - `media_type`: image | video
   - `url`, `is_cover`, `sort_order`

4. **ProductLicense** - связь товара с типом лицензии + цена
   - `product_id` - ссылка на товар
   - `license_type_id` - ссылка на тип лицензии
   - `price` - цена для этой лицензии

5. **ProductCategory** - связь товар-категория (M:N)

6. **Category** - категории (теги)
7. **CategoryTranslation** - переводы категорий

8. **LicenseType** - типы лицензий
   - `slug` - individual | commercial | extended
   - `description` - **НУЖНО ДОБАВИТЬ** - файл/описание лицензии

---

## Новая логика работы с товарами

### Цена товара:
- **Старая логика**: `Product.price` - фиксированная цена товара
- **Новая логика**: `min(ProductLicense.price)` - минимальная цена из всех лицензий товара

### Изображение товара:
- **Старая логика**: `Product.main_image` - отдельно сохранённое изображение
- **Новая логика**: `ProductMedia.url` где `is_cover = true`

### Лицензии:
- `LicenseType` - справочник типов лицензий (individual, commercial, extended) + описание
- `ProductLicense` - связь товара с типом лицензии + цена для этой лицензии

---

## Выполненные работы (Backend)

### ✅ 1. Category API - СОЗДАНО
- [`server/src/category/category.module.ts`](server/src/category/category.module.ts) - модуль
- [`server/src/category/category.service.ts`](server/src/category/category.service.ts) - сервис с типизацией
- [`server/src/category/category.controller.ts`](server/src/category/category.controller.ts) - контроллер
- Endpoints:
  - `GET /categories` - все категории
  - `GET /categories/:id` - категория по ID
  - `GET /categories/:id/products` - товары категории
  - `GET /categories/:id/count` - количество товаров
  - `POST /categories` - создать категорию
  - `PATCH /categories/:id` - обновить категорию
  - `DELETE /categories/:id` - удалить категорию

### ✅ 2. LicenseType API - СОЗДАНО
- [`server/src/license-type/license-type.module.ts`](server/src/license-type/license-type.module.ts) - модуль
- [`server/src/license-type/license-type.service.ts`](server/src/license-type/license-type.service.ts) - сервис с типизацией
- [`server/src/license-type/license-type.controller.ts`](server/src/license-type/license-type.controller.ts) - контроллер
- Endpoints:
  - `GET /license-types` - все типы лицензий
  - `GET /license-types/:id` - тип лицензии
  - `GET /license-types/:id/count` - количество товаров
  - `POST /license-types` - создать тип лицензии
  - `PATCH /license-types/:id` - обновить тип лицензии
  - `DELETE /license-types/:id` - удалить тип лицензии

### ✅ 3. AdminGuard - СОЗДАНО
- [`server/src/auth/guards/admin.guard.ts`](server/src/auth/guards/admin.guard.ts) - Guard для проверки роли admin

### ✅ 4. Типы - СОЗДАНО
- [`server/src/types/category/category.types.ts`](server/src/types/category/category.types.ts)
- [`server/src/types/license-type/license-type.types.ts`](server/src/types/license-type/license-type.types.ts)

### ✅ 5. App Module - ОБНОВЛЕН
- Добавлены `CategoryModule` и `LicenseTypeModule`

---

## ПРЕДСТОИТ РЕАЛИЗОВАТЬ

### Этап 1: Миграции БД

#### 1.1 Добавить поле description в license_types
```sql
ALTER TABLE license_types ADD COLUMN description TEXT;
```

#### 1.2 Удалить поле price из products (или сделать deprecated)
- Вариант 1: Удалить поле `price` из products
- Вариант 2: Оставить для совместимости, но не использовать
- Вариант 3: Сделать вычисляемым (через VIEW или в запросах)

#### 1.3 Удалить поле main_image из products
- `main_image` будет браться из `product_media` где `is_cover = true`

### Этап 2: Обновить Product Service

#### 2.1 Обновить ProductRepository
- При получении товара вычислять `price` = `MIN(licenses.price)`
- При получении товара брать `main_image` из media где `is_cover = true`

#### 2.2 Обновить Product Response
```typescript
interface ProductResponse {
  // ...
  price: number;           // вычисляется как min(licenses.price)
  mainImage: string | null; // берется из media where is_cover = true
  licenses: LicenseInfo[];  // все лицензии товара
}
```

### Этап 3: LicenseType - добавить файл описания

#### 3.1 Обновить модель LicenseType
- Добавить поле `description` (текстовое описание лицензии)

#### 3.2 Обновить LicenseTypeService
- Добавить возможность загрузки/удаления файла описания

#### 3.3 Создать endpoint для загрузки файла
```
POST /license-types/:id/file - загрузить файл описания
GET  /license-types/:id/file - получить файл описания
DELETE /license-types/:id/file - удалить файл описания
```

### Этап 4: Frontend

#### 4.1 API клиент
- [`front/src/lib/api-category.ts`](front/src/lib/api-category.ts) - категории
- [`front/src/lib/api-license-type.ts`](front/src/lib/api-license-type.ts) - типы лицензий

#### 4.2 Страницы
- `/[lang]/admin/products` - список товаров
- `/[lang]/admin/products/new` - создание товара
- `/[lang]/admin/products/[id]` - редактирование товара

#### 4.3 Компоненты формы товара
- Выбор типа товара (brush/illustration)
- Загрузка файла товара (file_url)
- Загрузка главного изображения (через media с is_cover)
- Управление медиа-галереей
- Выбор категорий
- Управление лицензиями:
  - Выбор типа лицензии из справочника
  - Установка цены для каждого типа
  - Добавление/удаление лицензий

---

## Чеклист реализации

### Backend - Миграции:
- [ ] Создать миграцию: добавить description в license_types
- [ ] Создать миграцию: удалить price из products (или пометить deprecated)
- [ ] Создать миграцию: удалить main_image из products

### Backend - Product Service:
- [ ] Обновить findById - вычислять price из licenses
- [ ] Обновить findById - брать main_image из media
- [ ] Обновить findAll - добавлять computed поля
- [ ] Обновить Product Response типы

### Backend - LicenseType:
- [ ] Добавить поле description в LicenseType модель
- [ ] Обновить LicenseTypeService - работа с description
- [ ] Создать endpoints для файла описания

### Frontend:
- [ ] Создать api-category.ts
- [ ] Создать api-license-type.ts
- [ ] Создать страницу списка товаров
- [ ] Создать форму товара с новой логикой
- [ ] Реализовать управление лицензиями

---

## Технические детали

### Вычисление цены товара (SQL):
```sql
SELECT 
  p.*,
  (SELECT MIN(price) FROM product_licenses WHERE product_id = p.id) as price
FROM products p
```

### Получение main_image (SQL):
```sql
SELECT 
  p.*,
  (SELECT url FROM product_media WHERE product_id = p.id AND is_cover = true LIMIT 1) as main_image
FROM products p
```

### Структура ProductLicense:
```
ProductLicense {
  id: number
  product_id: number    -> Product
  license_type_id: number -> LicenseType (справочник)
  price: number          -> Цена для этой лицензии
}
```

### Структура LicenseType:
```
LicenseType {
  id: number
  slug: string           -> individual | commercial | extended
  description: string    -> Описание лицензии (файл/текст)
}
```
