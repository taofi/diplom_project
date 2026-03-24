# План исправления Chat Rooms API

## Выполненные изменения

### 1. Исправлен `chat-room.repository.ts`

- Добавлены импорты: `UserProduct`, `ProductLicense`, `LicenseType`
- В метод `findVisibleByUserId` добавлен include для `UserProduct` с вложенным `ProductLicense` и `LicenseType`

### 2. Исправлен `chat.service.ts` - метод `getUserChatRooms`

- Добавлено получение `mainImage` из `product.media[0]?.url`
- Удален массив `media` из ответа
- Добавлено получение `price` из `user_product.product_license.price`
- Добавлено получение `licenseTypeName` через перевод `translationService.getLicenseTypeTranslation()`

### 3. Исправлен `chat.service.ts` - метод `getChatRoomWithMessages`

- Добавлен include для `UserProduct` с `ProductLicense` и `LicenseType`
- Аналогичные изменения как в `getUserChatRooms`

---

## Текущая проблема (до исправлений)

В ответе `GET /chat/rooms` и `GET /chat/rooms/:id` передаются неправильные данные о продукте:

```json
"product": {
    "id": 18,
    "main_image": null,
    "media": [
        { "id": 5, "url": "media/product/18/IMG_20241126_143932_1.jpg", "is_cover": true }
    ]
}
```

**Что нужно исправить:**

1. **`main_image`** - должно браться из `media` с `is_cover: true`, массив `media` не нужен
2. **`product.name`** - должно браться из перевода (`product_translations`)
3. **Тип лицензии** - должен браться из перевода (`license_type_translations`) на основе `user_product_id`
4. **Цена** - должна браться из `ProductLicense`, которая связана с `UserProduct`

---

## Схема данных

```
chat_room
├── id
├── buyer_id
├── seller_id
├── product_id (ссылка на Product)
├── user_product_id (ссылка на UserProduct) → используется для получения лицензии
│
└── user_product (UserProduct)
    └── product_license (ProductLicense)
        ├── license_type_id → LicenseType → translations (LicenseTypeTranslation)
        └── price
```

---

## План исправлений

### 1. Исправить `chat-room.repository.ts`

**Файл:** `server/src/chat/repositories/chat-room.repository.ts`

**Метод:** `findVisibleByUserId` (строки 61-89)

**Изменения:**
- Добавить `include` для `UserProduct` с вложенным `ProductLicense` и `LicenseType`
- Оставить `ProductMedia` с `is_cover: true` для получения `main_image`

```typescript
// Добавить импорты
import { UserProduct } from '../../db/models/user-product.model';
import { ProductLicense } from '../../db/models/product-license.model';
import { LicenseType } from '../../db/models/license-type.model';

// В метод findVisibleByUserId добавить:
include: [
    { model: User, as: 'buyer', attributes: ['id', 'name', 'avatar_url'] },
    { model: User, as: 'seller', attributes: ['id', 'name', 'avatar_url'] },
    {
        model: Product,
        as: 'product',
        include: [
            {
                model: ProductMedia,
                where: { is_cover: true },
                required: false,
                attributes: ['id', 'url', 'is_cover'],
            },
        ],
    },
    // ДОБАВИТЬ: UserProduct для получения лицензии
    {
        model: UserProduct,
        as: 'user_product',
        include: [
            {
                model: ProductLicense,
                include: [LicenseType],
            },
        ],
        required: false,
    },
],
```

---

### 2. Исправить `chat.service.ts`

**Файл:** `server/src/chat/chat.service.ts`

#### 2.1. Метод `getUserChatRooms` (строки 158-186)

**Текущая логика:**
- Получает чаты через репозиторий
- Добавляет `translatedProductName` и `translatedProductDescription`

**Новая логика:**
- Для каждого чата с `user_product_id`:
  1. Получить перевод названия продукта через `translationService.getProductTranslation()`
  2. Получить `main_image` из `product.media[0]?.url`
  3. Получить перевод типа лицензии через `translationService.getLicenseTypeTranslation()`
  4. Получить цену из `user_product.product_license.price`

**Добавляемые поля:**
```typescript
(chat as any).translatedProductName = translation.name;
(chat as any).translatedProductDescription = translation.shortDescription;
(chat as any).mainImage = mediaUrl;           // Из media с is_cover: true
(chat as any).licenseTypeName = licenseTypeTranslation?.name;  // Из перевода
(chat as any).price = Number(productLicense.price);           // Цена покупки
```

#### 2.2. Метод `getChatRoomWithMessages` (строки 191-245)

**Аналогичные изменения:**
- Добавить `UserProduct` в `include` запроса
- Получить перевод названия продукта
- Получить `main_image` из `product.media`
- Получить перевод типа лицензии
- Получить цену из `ProductLicense`

---

### 3. Результат (целевая структура)

```json
"chatRoom": {
    "id": 3,
    "buyer_id": 18,
    "seller_id": 6,
    "product_id": 18,
    "user_product_id": 11,
    "status": "open",
    "visibility": "visible",
    "last_message_at": null,
    "created_at": "2026-03-24T09:50:54.990Z",
    "updated_at": "2026-03-24T09:50:54.990Z",
    "buyer": {
        "id": 18,
        "name": "taofi.stop.lego",
        "avatar_url": null
    },
    "seller": {
        "id": 6,
        "name": "Demo",
        "avatar_url": "/user/6/avatar.png"
    },
    "product": {
        "id": 18,
        "seller_id": 6,
        "type": "brush",
        "file_url": "/files/temp/6/photo_2024-11-25_22-38-03_1.png",
        "price": "0.00",
        "discount_price": null,
        "stock": 0,
        "is_featured": false,
        "main_image": "media/product/18/IMG_20241126_143932_1.jpg",  // ИЗМЕНЕНО: берется из media с is_cover
        "is_active": true,
        "created_at": "2026-03-20T12:50:00.801Z",
        "updated_at": "2026-03-20T12:50:00.801Z",
        // media массив УДАЛЕН
        "translatedName": "Название кисти",  // ДОБАВЛЕНО: из перевода
        "translatedDescription": "Описание", // ДОБАВЛЕНО: из перевода
        "translatedShortDescription": "Краткое" // ДОБАВЛЕНО: из перевода
    },
    // ДОБАВЛЕНО: данные о лицензии
    "licenseTypeName": "Коммерческая лицензия",  // Из перевода license_type_translations
    "price": 29.99,  // Из ProductLicense.price
    "messages": []
}
```

---

## Порядок действий

1. **Исправить `chat-room.repository.ts`**
   - Добавить импорты моделей
   - Добавить `include` для `UserProduct` → `ProductLicense` → `LicenseType`

2. **Исправить `chat.service.ts` - метод `getUserChatRooms`**
   - Получить `main_image` из `product.media[0]?.url`
   - Получить перевод типа лицензии
   - Получить цену из `user_product.product_license.price`

3. **Исправить `chat.service.ts` - метод `getChatRoomWithMessages`**
   - Аналогичные изменения

---

## Аналог в user-product.service.ts

В `server/src/user-product/user-product.service.ts` уже реализована логика получения данных в методе `getUserProducts` (строки 74-129):

```typescript
// Получаем переводы
const productTranslation = await this.translationService.getProductTranslation(
    product.id,
    locale,
);
const licenseTypeTranslation = await this.translationService.getLicenseTypeTranslation(
    licenseType.id,
    locale,
);

// Получаем главное изображение (is_cover = true)
const productImage = await this.translationService.getProductCoverImage(product.id);

results.push({
    productName: productTranslation?.name || `Product #${product.id}`,
    productImage: productImage || product.main_image,
    licenseTypeName: licenseTypeTranslation?.name || `License #${licenseType.id}`,
    price: Number(productLicense.price),
    // ...
});
```

Эту логику нужно адаптировать для `chat.service.ts`.
