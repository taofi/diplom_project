# Анализ ошибок чата и план исправлений

## Проблема 1: Ошибка отправки сообщения

### Описание ошибки
```
ValidationError [SequelizeValidationError]: notNull Violation: ChatMessage.chat_room_id cannot be null,
notNull Violation: ChatMessage.sender_id cannot be null
```

### Причина
При создании сообщения через WebSocket передаются правильные параметры:
- `roomId` (число) - ID чата
- `userId` (число) - ID отправителя из токена

Однако в [`CreateChatMessageDto`](server/src/chat/dto/create-chat-message.dto.ts) используются поля `chatRoomId` и `senderId` (camelCase), а модель БД [`ChatMessage`](server/src/db/models/chat-message.model.ts) ожидает `chat_room_id` и `sender_id` (snake_case).

Sequelize не может автоматически маппить поля DTO в snake_case без дополнительной настройки.

### Исправление
Нужно изменить маппинг в [`chat.service.ts`](server/src/chat/chat.service.ts:280), строка 280-286:

**Было:**
```typescript
const messageDto: CreateChatMessageDto = {
  chatRoomId: roomId,
  senderId,
  content,
  type,
  mediaUrl: attachmentUrl,
};
```

**Стало:**
```typescript
const messageDto: CreateChatMessageDto = {
  chatRoomId: roomId,
  senderId,
  content,
  type,
  mediaUrl: attachmentUrl,
};

// Дополнительно маппим для Sequelize
const messageData = {
  chat_room_id: messageDto.chatRoomId,
  sender_id: messageDto.senderId,
  message: messageDto.content,
  message_type: messageDto.type,
  attachment_url: messageDto.mediaUrl,
};

const message = await this.chatMessageRepository.create(messageData);
```

## Проблема 2: ChatRoom не возвращает имя автора

### Описание
API возвращает объект:
```json
{
    "chatRoom": {
        "id": 1,
        "buyer_id": 18,
        "seller_id": 6,
        "product_id": 24,
        ...
    },
    "messages": [],
    "total": 0
}
```

В ответе отсутствуют:
- Имя покупателя (`buyer.name`)
- Имя продавца (`seller.name`)
- Информация об отправителе в сообщениях (`sender`)

### Причина
В методе [`getChatRoomWithMessages`](server/src/chat/chat.service.ts:169) запрос не включает связанные модели для `buyer`, `seller` и `sender`.

### Исправление
Добавить `include` с моделями User в запрос чата и сообщений:

```typescript
// В chat.service.ts - getChatRoomWithMessages
const chatRoom = await this.chatRoomRepository.findById(chatRoomId, {
  include: [
    { model: User, as: 'buyer', attributes: ['id', 'name', 'avatar_url'] },
    { model: User, as: 'seller', attributes: ['id', 'name', 'avatar_url'] },
  ],
});

const messages = await this.chatMessageRepository.findAndCountAll({
  page,
  limit,
  chatRoomId,
  include: [
    { model: User, as: 'sender', attributes: ['id', 'name', 'avatar_url'] },
  ],
});
```

## План исправлений

### Этап 1: Исправление маппинга полей при отправке сообщения
1. Изменить [`chat.service.ts`](server/src/chat/chat.service.ts) метод `sendMessage`
2. Создать объект с snake_case полями перед вызовом репозитория

### Этап 2: Добавление связанных данных в ответ API
1. Изменить [`chat.service.ts`](server/src/chat/chat.service.ts) метод `getChatRoomWithMessages`
2. Добавить include для buyer/seller в запрос чата
3. Добавить include для sender в запрос сообщений

### Этап 3: Проверка
1. Протестировать отправку сообщения через WebSocket
2. Проверить получение chatRoom с именами авторов
