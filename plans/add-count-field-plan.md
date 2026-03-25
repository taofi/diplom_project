# План реализации: добавление поля count для UserProduct

## Требования
- Поле `count` в `UserProduct` - общее количество единиц товара, купленных пользователем
- При повторной покупке - обновлять существующую запись, увеличивая count
- В корзине - увеличивать quantity в существующей записи
- При загрузке профиля отображать количество купленных единиц товара

---

## Этап 1: Серверная часть - Модели данных

### 1.1 Добавить поле count в UserProduct
**Файл:** `server/src/db/models/user-product.model.ts`

```typescript
// Добавить после поля purchased_at
@Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 1 })
declare count: number;
```

### 1.2 Проверить OrderItem на наличие quantity
**Файл:** `server/src/db/models/order-item.model.ts`

Убедиться, что есть поле quantity (уже существует в CartItem, нужно проверить OrderItem).

---

## Этап 2: Серверная часть - DTO

### 2.1 Обновить AddCartItemDto
**Файл:** `server/src/cart/dto/add-cart-item.dto.ts`

```typescript
export class AddCartItemDto {
  @IsInt()
  @Min(1)
  productId: number;

  @IsInt()
  @Min(1)
  licenseTypeId: number;

  @IsInt()
  @Min(1)
  @IsOptional()
  quantity?: number; // Добавить поле
}
```

### 2.2 Обновить UserProductResponse DTO
**Файл:** `server/src/user-product/dto/user-product.dto.ts`

```typescript
export class UserProductResponse {
  id: number;
  productId: number;
  productName: string;
  productImage: string | null;
  licenseTypeId: number;
  licenseTypeName: string;
  price: number;
  purchasedAt: Date;
  fileUrl: string;
  sellerId: number;
  count: number; // Добавить поле
}
```

---

## Этап 3: Серверная часть - Cart

### 3.1 Обновить CartService
**Файл:** `server/src/cart/cart.service.ts`

#### 3.1.1 Обновить метод `addItem`:
- При добавлении товара, который уже есть в корзине, увеличивать quantity
- Использовать переданное quantity из DTO

#### 3.1.2 Обновить метод `updateItemQuantity`:
- Разрешить изменение quantity (убрать заглушку с quantity: 1)

#### 3.1.3 Обновить метод `getCartCount`:
- Учитывать quantity при подсчёте (сумма всех quantity)

#### 3.1.4 Обновить метод `createOrderFromCart` в OrderService:
- Передавать quantity из CartItem в OrderItem

### 3.2 Обновить CartController
**Файл:** `server/src/cart/cart.controller.ts`

- Убедиться, что PATCH endpoint работает с quantity

---

## Этап 4: Серверная часть - Order

### 4.1 Обновить OrderService
**Файл:** `server/src/order/order.service.ts`

#### 4.1.1 В методе `createOrderFromCart`:
- При создании OrderItem передавать quantity из CartItem
- Рассчитывать totalAmount с учётом quantity (цена * quantity)

#### 4.1.2 В методе `transferGuestOrdersToUser`:
- При создании UserProduct учитывать quantity из OrderItem

---

## Этап 5: Серверная часть - UserProduct

### 5.1 Обновить UserProductService
**Файл:** `server/src/user-product/user-product.service.ts`

#### 5.1.1 В методе `getUserProducts`:
- Добавить поле count в ответ

#### 5.1.2 Создать новый метод для создания/обновления UserProduct:
```typescript
async addOrUpdateUserProduct(
  userId: number,
  productLicenseId: number,
  orderId: number,
  quantity: number
): Promise<UserProduct> {
  // Найти существующий UserProduct
  // Если есть - обновить count (увеличить на quantity)
  // Если нет - создать новый с count = quantity
}
```

### 5.2 Обновить OrderService - создание UserProduct
**Файл:** `server/src/order/order.service.ts`

При создании заказа (после оплаты):
- Искать существующий UserProduct по user_id и product_license_id
- Если найден - обновить count (count + quantity)
- Если не найден - создать новый с count = quantity

---

## Этап 6: Фронтенд - API

### 6.1 Обновить интерфейс UserProductResponse
**Файл:** `front/src/lib/api-user-products.ts`

```typescript
export interface UserProductResponse {
  id: number;
  productId: number;
  productName: string;
  productImage: string | null;
  licenseTypeId: number;
  licenseTypeName: string;
  price: number;
  purchasedAt: string;
  fileUrl: string;
  sellerId: number;
  count: number; // Добавить поле
}
```

### 6.2 Обновить CartContext
**Файл:** `front/src/context/cart/CartContext.tsx`

- Обновить метод addItem для передачи quantity
- Обновить метод updateItemQuantity
- Обновить типы CartItem

---

## Этап 7: Фронтенд - UI

### 7.1 Обновить страницу товара
**Файл:** `front/src/app/[lang]/product/[id]/page.tsx`

- Добавить компонент выбора количества (input с +/- кнопками)
- Передавать quantity в addItem

### 7.2 Обновить страницу корзины
**Файл:** `front/src/app/[lang]/cart/page.tsx`

- Добавить UI для изменения quantity в каждом товаре
- Обновить расчёт total с учётом quantity (цена * quantity)
- Обновить handleQuantityChange для вызова updateItemQuantity

### 7.3 Обновить компонент CartItem
**Файл:** `front/src/components/cart/CartItem.tsx`

- Добавить UI управления quantity
- Передавать onQuantityChange в компонент

### 7.4 Обновить PurchasedProducts
**Файл:** `front/src/components/profile/PurchasedProducts.tsx`

- Отображать количество купленных единиц товара (count)
- Показать "x единиц" рядом с названием товара

---

## Этап 8: Миграция БД

### 8.1 Создать миграцию для добавления поля count
```sql
ALTER TABLE user_products ADD COLUMN count INTEGER NOT NULL DEFAULT 1;
```

### 8.2 Проверить OrderItem на наличие quantity
```sql
-- Если нет, добавить:
ALTER TABLE order_items ADD COLUMN quantity INTEGER NOT NULL DEFAULT 1;
```

---

## Порядок реализации

1. **Модели данных** (1.1)
2. **DTO** (2.1, 2.2)
3. **Cart** (3.1, 3.2)
4. **Order** (4.1)
5. **UserProduct** (5.1, 5.2)
6. **Frontend API** (6.1, 6.2)
7. **Frontend UI** (7.1, 7.2, 7.3, 7.4)
8. **Миграция БД** (8.1, 8.2)

---

## Важные замечания

1. При загрузке профиля загружается только 1 экземпляр (это уже реализовано - загружается один UserProduct на товар, но с полем count)
2. При повторной покупке того же товара (same product_license) - обновлять существующую запись UserProduct, увеличивая count
3. В корзине при добавлении товара, который уже есть - увеличивать quantity в существующей записи
