# План исправления: WebSocket уведомления о новых заказах

## Проблема

При создании заказа (offer) через API (`POST /chat/offers`) заказ успешно создаётся в базе данных, однако WebSocket уведомление `offer:created` не отправляется **ни одному** из участников чата, включая создателя заказа.

## Корневая причина

В файле [`server/src/chat/services/offer.service.ts:28`](server/src/chat/services/offer.service.ts:28) вызывается `this.chatGateway.notifyOfferCreated(offer)`, однако:

1. **Метод `notifyOfferCreated` в ChatGateway** ([`server/src/chat/chat.gateway.ts:246-251`](server/src/chat/chat.gateway.ts:246)) рассылает событие только в комнату:
   ```typescript
   notifyOfferCreated(offer: unknown) {
     const chatRoomId = (offer as { chat_room_id?: number })?.chat_room_id;
     if (chatRoomId) {
       this.server.to(`chat:${chatRoomId}`).emit('offer:created', { offer: this.serializeOffer(offer) });
     }
   }
   ```

2. **Проблема**: Уведомление отправляется только если пользователь присоединён к комнате (`joinRoom`). Если пользователь просто открыл страницу чата, но не присоединился к комнате - он не получит уведомление.

3. **Готовое решение в проекте**: На сервере уже есть `ChatNotificationService` с методом `notifyUser`, который использует Redis для отправки уведомлений конкретному пользователю по его ID ([`server/src/chat/services/chat-notification.service.ts:90-108`](server/src/chat/services/chat-notification.service.ts:90)). Этот сервис не используется в `OfferService`.

## Решение

### Вариант 1: Использовать ChatNotificationService (рекомендуется)

В `OfferService` добавить зависимость от `ChatNotificationService` и использовать его для отправки уведомлений:

1. Добавить `ChatNotificationService` в конструктор `OfferService`
2. Изменить вызов уведомления в методе `createOffer`:
   ```typescript
   // Отправить создателю (онлайн или нет - сервис обработает)
   this.chatNotificationService.notifyUser(userId, 'offer:created', { offer: serializedOffer });
   // Отправить автору
   this.chatNotificationService.notifyUser(dto.authorId, 'offer:created', { offer: serializedOffer });
   ```

### Вариант 2: Улучшить ChatGateway.notifyOfferCreated

Добавить в `ChatGateway` логику отправки конкретным пользователям:

```typescript
notifyOfferCreated(offer: unknown, creatorId: number, authorId: number) {
  const chatRoomId = (offer as { chat_room_id?: number })?.chat_room_id;
  const serialized = this.serializeOffer(offer);
  
  // 1. Отправить всем в комнате (как сейчас)
  if (chatRoomId) {
    this.server.to(`chat:${chatRoomId}`).emit('offer:created', { offer: serialized });
  }
  
  // 2. Отправить создателю и автору напрямую через ChatNotificationService
  // (нужно добавить зависимость)
}
```

## План реализации (Вариант 1)

1. **Добавить ChatNotificationService в OfferService**
   - Файл: `server/src/chat/services/offer.service.ts`
   - Добавить импорт и конструктор

2. **Изменить метод createOffer**
   - Использовать `chatNotificationService.notifyUser()` для отправки уведомлений создателю и автору
   - Передавать сериализованные данные офера

3. **Аналогично обновить остальные методы**:
   - `acceptOffer` → `notifyStatusChanged`
   - `rejectOffer` → `notifyStatusChanged`
   - `counterOffer` → `notifyPriceChanged`
   - `confirmPrice` → `notifyStatusChanged`
   - `uploadFiles` → `notifyFilesUploaded`
   - `payOrder` → `notifyPaymentCompleted`

4. **Проверить работу**