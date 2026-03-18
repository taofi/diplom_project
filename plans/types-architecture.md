# План создания централизованной системы типов

## Анализ текущего состояния

### Проблемы:
1. **Множественные `as any` в репозиториях** - при создании и обновлении сущностей
2. **Дублирование интерфейсов** - каждый репозиторий определяет свои Query типы локально
3. **Нет统一的 типов для сущностей с загруженными отношениями**
4. **Разрозненные DTO** - нет согласованной структуры

## Архитектура системы типов

```
server/src/types/
├── index.ts                    # Главный экспорт
├── base/
│   ├── entity-base.ts          # Базовый интерфейс для всех сущностей
│   └── repository.types.ts      # Базовые типы для репозиториев
├── product/
│   ├── index.ts
│   ├── product.types.ts         # Типы для Product
│   ├── product-query.types.ts  # Типы запросов
│   └── product-relations.types.ts # Типы с отношениями
├── user/
│   ├── index.ts
│   ├── user.types.ts
│   └── user-relations.types.ts
├── order/
│   ├── index.ts
│   ├── order.types.ts
│   └── order-relations.types.ts
├── cart/
│   ├── index.ts
│   └── cart.types.ts
├── chat/
│   ├── index.ts
│   ├── chat-room.types.ts
│   └── chat-message.types.ts
└── common/
    ├── index.ts
    ├── pagination.types.ts     # Пагинация
    └── query.types.ts          # Общие типы запросов
```

## Детальная структура

### 1. Базовые типы (base/)

```typescript
// entity-base.ts
interface EntityBase {
  id: number;
  createdAt?: Date;
  updatedAt?: Date;
}

// repository.types.ts
interface RepositoryFindOptions<T> {
  where?: Partial<T>;
  include?: IncludeOptions[];
  order?: OrderItem[];
  limit?: number;
  offset?: number;
}

interface PaginationParams {
  page?: number;
  limit?: number;
}

interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
```

### 2. Иерархия наследования типов

```
EntityBase (id, createdAt, updatedAt)
    │
    ├── ProductBase ──────────┬──► ProductWithRelations
    │                         │    (seller, categories, translations, media, licenses)
    │                         │
    ├── UserBase ─────────────┼──► UserWithRelations
    │                         │    (products, orders, cart_items)
    │                         │
    ├── OrderBase ────────────┼──► OrderWithRelations  
    │                         │    (user, order_items, payment, promo_code)
    │                         │
    ├── CategoryBase ─────────┼──► CategoryWithRelations
    │                         │    (translations, products)
    │                         │
    ├── CartItemBase ─────────┼──► CartItemWithRelations
    │                         │    (user, product_license)
    │                         │
    ├── ChatRoomBase ─────────┼──► ChatRoomWithRelations
    │                         │    (buyer, seller, product, messages)
    │                         │
    └── BlogPostBase ─────────┴──► BlogPostWithRelations
                                   (author, translations, media)
```

### 3. Примеры типов с отношениями

```typescript
// product/product-relations.types.ts

// Базовые поля Product (snake_case из БД)
type ProductFields = {
  id: number;
  seller_id: number;
  name: string;
  description: string | null;
  price: number;
  discount_price: number | null;
  sku: string | null;
  type: ProductType;
  file_url: string;
  stock: number;
  is_active: boolean;
  is_featured: boolean;
  main_image: string | null;
  created_at: Date;
  updated_at: Date;
};

// Продукт с загруженными отношениями
type ProductWithRelations = ProductFields & {
  seller?: User;
  categories?: Category[];
  translations?: ProductTranslation[];
  media?: ProductMedia[];
  licenses?: (ProductLicense & {
    license_type?: LicenseType;
  })[];
};

// DTO для ответа - использует camelCase
type ProductResponse = {
  id: number;
  sellerId: number;
  name: string;
  // ... все поля в camelCase
  seller?: SellerInfo;
  categories?: CategoryInfo[];
  translations?: TranslationInfo[];
  media?: MediaInfo[];
  licenses?: LicenseInfo[];
};
```

## Реализация

### Шаг 1: Создание базовых типов
- Создать `types/base/entity-base.ts`
- Создать `types/base/repository.types.ts`
- Создать `types/common/pagination.types.ts`

### Шаг 2: Создание доменных типов
- Создать `types/product/` с полным набором типов
- Создать `types/user/`
- Создать `types/order/`
- Создать остальные домены

### Шаг 3: Обновление репозиториев
- Импортировать типы из `types/`
- Убрать `as any`
- Использовать типизированные методы

### Шаг 4: Обновление DTO
- Использовать统一的 типы
- Избавиться от локальных определений

## Пример использования

```typescript
// В репозитории
import { ProductWithRelations, ProductFields } from '../../types/product';

async findById(id: number): Promise<ProductWithRelations | null> {
  return this.productModel.findByPk(id, {
    include: [
      { model: User, as: 'seller' },
      { model: Category },
      // ...
    ],
  });
}

// При создании - типизированный ввод
async create(data: CreateProductDto): Promise<ProductWithRelations> {
  const product = await this.productModel.create({
    ...data, // Уже типизировано через DTO
  } as ProductFields);
  return product;
}
```

## Преимущества

1. **Единая точка истины** - все типы в одном месте
2. **Type safety** - полная типизация без `any`
3. **Наследование** - не нужно дублировать общие поля
4. **Легкость изменений** - изменение в одном месте
5. **Автодополнение** - IDE подсказывает все поля
6. **Реиспользование** - типы можно импортировать в разных модулях
