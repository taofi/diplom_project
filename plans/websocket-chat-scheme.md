# Схема WebSocket сообщений чата

## Обзор

Система использует Socket.io с namespace `/chat` и JWT аутентификацией.

## События от Frontend к Backend

### 1. `initChat` - Создание нового чата
**Когда:** При нажатии кнопки "Написать продавцу"  
**Параметры:**
```typescript
{
  sellerId: number;        // ID продавца
  productId?: number;      // ID продукта (опционально)
  userProductId?: number; // ID продукта пользователя (опционально)
}
```

**Ответ:**
```typescript
{ chatId: number }
```

**Обработка на сервере:**
- Создаёт чат в БД с `visibility: PENDING`
- Возвращает ID созданного чата

---

### 2. `joinRoom` - Присоединение к комнате чата
**Когда:** При выборе чата из списка (вызов `selectRoom`)  
**Параметры:**
```typescript
{ roomId: number }
```

**Ответ:**
```typescript
{ success: boolean }
```

**Обработка на сервере:**
1. Клиент присоединяется к room `chat:${roomId}` в Socket.io
2. Сохраняется состояние в Redis (userId + socketId + roomId)
3. Сообщения в комнате помечаются как прочитанные

**Проблема:** На фронтенде НЕ вызывается `setActiveRoom`!

---

### 3. `leaveRoom` - Выход из комнаты чата
**Когда:** При закрытии чата или переключении на другой  
**Параметры:**
```typescript
{ roomId: number }
```

**Обработка на сервере:**
1. Клиент покидает room в Socket.io
2. Очищается состояние в Redis

---

### 4. `sendMessage` - Отправка сообщения
**Когда:** При отправке сообщения пользователем  
**Параметры:**
```typescript
{
  roomId: number;
  content: string;
  type?: string;           // 'text', 'image', 'file'
  attachmentUrl?: string; // URL вложения
}
```

**Ответ:**
```typescript
{ success: boolean; message: ChatMessage }
```

**Обработка на сервере:**
1. `ChatMessageService.sendMessage()` проверяет, что пользователь в комнате
2. Создаёт сообщение в БД через `ChatService.sendMessage()`
3. Рассылает сообщение через `broadcastToRoom()`

---

### 5. `setActiveRoom` - Установка активной комнаты (множественные вкладки)
**Когда:** При переключении между вкладками (НО ФРОНТЕНД НЕ ВЫЗЫВАЕТ!)  
**Параметры:**
```typescript
{
  roomId: number;
  tabId: string;           // Уникальный ID вкладки
}
```

**Обработка на сервере:**
- Сохраняет в Redis: userId → { tabId: roomId }

---

### 6. `clearActiveRoom` - Очистка активной комнаты
**Когда:** При закрытии вкладки  
**Параметры:**
```typescript
{ tabId: string }
```

**Обработка на сервере:**
- Удаляет запись о вкладке из Redis

---

### 7. `typing` - Индикация набора текста
**Когда:** При вводе текста пользователем  
**Параметры:**
```typescript
{
  roomId: number;
  isTyping: boolean;
}
```

**Обработка на сервере:**
- Рассылается всем в комнате, кроме отправителя

---

## События от Backend к Frontend

### 1. `newMessage` - Новое сообщение
**Когда:** После успешной отправки сообщения  
**Параметры:**
```typescript
{ message: ChatMessage }
```

**Обработка на фронтенде:**
```typescript
socketClient.on('newMessage', (data) => {
  // ПРОБЛЕМА: проверка activeRoomIdRef.current
  if (activeRoomIdRef.current === payload.message.chat_room_id) {
    setMessages(prev => [...prev, payload.message]);
  }
});
```

---

### 2. `userTyping` - Индикация набора текста
**Когда:** Другой пользователь начал/закончил печатать  
**Параметры:**
```typescript
{
  roomId: number;
  userId: number;
  isTyping: boolean;
}
```

---

### 3. `offerCreated` - Создан новый оффер
**Когда:** Продавец создал оффер  
**Параметры:**
```typescript
{ offer: ChatOffer }
```

---

### 4. `offerUpdated` - Обновлён оффер
**Когда:** Оффер принят или отклонён  
**Параметры:**
```typescript
{ offer: ChatOffer }
```

---

### 5. `chatRoomCreated` - Создана новая комната
**Когда:** Создан новый чат  
**Параметры:**
```typescript
{ room: ChatRoom }
```

---

### 6. `unreadCountUpdate` - Обновление счётчика непрочитанных
**Когда:** После отправки сообщения или прочтения  
**Параметры:**
```typescript
{
  roomId: number;
  count: number;
}
```

---

### 7. `usersOnline` - Список пользователей онлайн в комнате
**Когда:** При входе пользователя в комнату  
**Параметры:**
```typescript
{
  roomId: number;
  userIds: number[];
}
```

---

### 8. `userOnlineStatus` - Изменение статуса пользователя
**Когда:** Пользователь подключился/отключился  
**Параметры:**
```typescript
{
  userId: number;
  isOnline: boolean;
}
```

---

## Диаграмма потока сообщения

```
[Пользователь A]                 [Socket.io Server]              [Пользователь B]
     |                                  |                               |
     |---- sendMessage(roomId, data) -->|                               |
     |                                  |                               |
     |                                  |---- broadcastToRoom -------->|
     |                                  |      { message }             |
     |                                  |                               |
     |<---- { success, message } -------|                               |
     |                                  |                               |
     |       (if activeRoomId === roomId)                              |
     |              добавить в messages                                |
```

---

## Причина бага

### Проблема
Сообщения добавляются только если `activeRoomIdRef.current === payload.message.chat_room_id`, НО метод `selectRoom` НЕ устанавливает `activeRoomId`!

### Решение
Добавить `setActiveRoomId(roomId)` в метод `selectRoom` после загрузки комнаты.

Также нужно вызывать `socketClient.setActiveRoom(roomId)` для синхронизации с сервером.

---

## Исправление в ChatContext.tsx

В метод `selectRoom` (строка ~229) нужно добавить:

```typescript
// После загрузки комнаты и join к WebSocket
socketClient.joinRoom(roomId);

// Добавить: установить активную комнату
setActiveRoomId(roomId);  // <-- ДОБАВИТЬ

// Также уведомить сервер о активной комнате
socketClient.setActiveRoom(roomId);  // <-- ДОБАВИТЬ