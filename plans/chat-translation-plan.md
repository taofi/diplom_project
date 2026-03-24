# План: Добавление перевода названия товара в API чата

## Текущее состояние

Сейчас API возвращает:
```json
{
  "chatRoom": {
    "product": {
      "id": 24,
      "name": "Original Name",      // оригинальное имя
      "translatedName": "Перевод"  // добавлено как translatedName
    }
  }
}
```

## Проблема

- Поле `name` содержит оригинальное имя товара (из таблицы products)
- Перевод доступен в отдельном поле `translatedName`
- Фронтенд хочет использовать перевод напрямую в поле `name`

## Решение

### Вариант 1: Заменить name на перевод (рекомендуемый)

Сервер получит locale пользователя и:
1. Если есть перевод для этой locale → использует его в поле `name`
2. Если нет перевода → оставит оригинальное имя

```typescript
// В chat.service.ts - getChatRoomWithMessages
if (chatRoom.product_id && locale) {
  const translation = await this.translationService.getProductTranslation(chatRoom.product_id, locale);
  if (translation && translation.name) {
    (chatRoom.product as any).name = translation.name;
  }
}
```

### Вариант 2: Использовать другое поле (alternative)

Оставить оригинальное имя и добавить перевод как основное поле:
```typescript
// Переименовываем translatedName → name для использования на фронтенде
(chatRoom.product as any).name = translation.name || (chatRoom.product as any).name;
```

## Реализация (Вариант 1)

### 1. Изменить chat.service.ts

```typescript
// Получаем перевод названия товара если есть товар и locale
if (chatRoom.product_id && locale) {
  const translation = await this.translationService.getProductTranslation(chatRoom.product_id, locale);
  if (translation && translation.name) {
    // Заменяем оригинальное имя на перевод
    (chatRoom.product as any).name = translation.name;
  }
}
```

### 2. Обновить фронтенд

Убрать использование `translatedName`, так как `name` уже будет содержать перевод.

## Как передается locale

Сейчас locale передается в query параметре:
```
GET /api/chat/rooms/:id?locale=ru
```

Нужно убедиться что фронтенд передает текущую locale пользователя при запросе чата.

## Фронтенд: где получить locale

locale доступен через I18nContext:
```typescript
import { useI18n } from '@/context/i18n/I18nContext';

const { locale } = useI18n();
// При запросе чата: chatApi.getChatRoom(roomId, { locale })
```

## TODO

- [ ] Изменить chat.service.ts - использовать перевод в поле name
- [ ] Проверить фронтенд - передает ли locale при запросе чата
- [ ] Протестировать
