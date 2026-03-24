# План: Рефакторинг языковых утилит и исправление перевода в чате

## Текущее состояние (выполнено)

### ЭТАП 1-5: Рефакторинг языковых утилит ✅
- [x] Создан `server/src/translation/utils/language.utils.ts`
- [x] Создан `server/src/translation/utils/index.ts`
- [x] Обновлён `translation.service.ts` - корректный импорт
- [x] Обновлены импорты в product модуле (product-response.types.ts, product.types.ts)
- [x] Обновлён `user-product.controller.ts` - удалён дублирующий метод normalizeLocale
- [x] Удалён старый файл `product/utils/language.utils.ts`

### Исправлена функция normalizeLanguage ✅
- Теперь правильно извлекает язык из заголовка Accept-Language
- "ru,en-US;q=0.9" → "ru"

### Добавлен Accept-Language в axios ✅
- В `front/src/lib/api.ts` добавлен заголовок Accept-Language

---

## НОВАЯ ЗАДАЧА: Исправить перевод в чате

### Проблема
1. [`chat.controller.ts`](server/src/chat/chat.controller.ts:70) - метод `getChatRoom` НЕ принимает `accept-language` заголовок
2. [`chat.service.ts`](server/src/chat/chat.service.ts:173) - метод `getChatRoomWithMessages` принимает `locale` но не использует `normalizeLanguage`
3. Перевод названия товара не передаётся в ответе

### Решение

#### ЭТАП 1: Обновить chat.controller.ts

Добавить использование заголовка `accept-language` в методе `getChatRoom`:

**Было:**
```typescript
@Get('rooms/:id')
async getChatRoom(
  @Param('id') id: string,
  @Query('page') page?: string,
  @Query('limit') limit?: string,
) {
  return this.chatService.getChatRoomWithMessages(
    parseInt(id, 10),
    page ? parseInt(page, 10) : 1,
    limit ? parseInt(limit, 10) : 50,
  );
}
```

**Стало:**
```typescript
import { normalizeLanguage } from '../translation/utils/language.utils';

@Get('rooms/:id')
async getChatRoom(
  @Param('id') id: string,
  @Query('page') page?: string,
  @Query('limit') limit?: string,
  @Headers('accept-language') locale?: string,
) {
  const normalizedLocale = normalizeLanguage(locale);
  return this.chatService.getChatRoomWithMessages(
    parseInt(id, 10),
    page ? parseInt(page, 10) : 1,
    limit ? parseInt(limit, 10) : 50,
    normalizedLocale,
  );
}
```

#### ЭТАП 2: Обновить chat.service.ts

Добавить использование `normalizeLanguage` и расширить возвращаемые данные о продукте:

**Изменения в `getChatRoomWithMessages`:**
```typescript
import { normalizeLanguage } from '../translation/utils/language.utils';

// В методе:
const normalizedLang = normalizeLanguage(locale);

// Получаем перевод названия товара если есть товар
if (chatRoom.product_id && locale) {
  const translation = await this.translationService.getProductTranslation(
    chatRoom.product_id, 
    normalizedLang,
  );
  if (translation) {
    // Добавляем переведенные поля к продукту
    (chatRoom.product as any).translatedName = translation.name;
    (chatRoom.product as any).translatedDescription = translation.description;
    (chatRoom.product as any).translatedShortDescription = translation.shortDescription;
  }
}
```

#### ЭТАП 3: Проверить getUserChatRooms

Также добавить locale для списка чатов:

**Изменения в `getUserChatRooms` controller:**
```typescript
@Get('rooms')
async getUserChatRooms(
  @CurrentUserId() userId: number,
  @Query('page') page?: string,
  @Query('limit') limit?: string,
  @Headers('accept-language') locale?: string,
) {
  const normalizedLocale = normalizeLanguage(locale);
  return this.chatService.getUserChatRooms(
    userId,
    page ? parseInt(page, 10) : 1,
    limit ? parseInt(limit, 10) : 20,
    normalizedLocale,
  );
}
```

---

## Файлы для изменения

| Файл | Изменение |
|------|-----------|
| [`server/src/chat/chat.controller.ts`](server/src/chat/chat.controller.ts) | Добавить импорт normalizeLanguage, использовать accept-language заголовок |
| [`server/src/chat/chat.service.ts`](server/src/chat/chat.service.ts) | Использовать normalizeLanguage, расширить данные перевода |

---

## Mermaid диаграмма

```mermaid
flowchart TD
    A[chat.controller.ts] --> B[Добавить accept-language заголовок]
    B --> C[Нормализовать язык через normalizeLanguage]
    C --> D[Передать locale в chat.service.ts]
    D --> E[chat.service.ts - использовать normalizeLanguage]
    E --> F[Получить перевод продукта с правильным языком]
    F --> G[Вернуть translatedName, translatedDescription]
