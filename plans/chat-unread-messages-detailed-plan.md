# Детальный план реализации: Этапы 3-4

## Этап 3: ChatService и Controller (REST API)

### 3.1 Обновить ChatService - добавить методы для работы с непрочитанными

**Файл**: `server/src/chat/chat.service.ts`

**Текущее состояние**: 
- Уже есть `markMessagesAsRead(chatRoomId, userId)` - работает
- Нужно добавить: `getUnreadCountForRoom`, `getAllUnreadCounts`

**Добавить методы**:

```typescript
/**
 * Получить количество непрочитанных сообщений в конкретном чате
 */
async getUnreadCountForRoom(chatRoomId: number, userId: number): Promise<number> {
  return this.chatMessageModel.count({
    where: {
      chat_room_id: chatRoomId,
      sender_id: { [Op.ne]: userId },
      is_read: false,
    },
  });
}

/**
 * Получить все непрочитанные сообщения для пользователя (по всем чатам)
 * Возвращает Map<roomId, count>
 */
async getAllUnreadCounts(userId: number): Promise<Map<number, number>> {
  // 1. Получаем все видимые чаты пользователя
  const chats = await this.chatRoomRepository.findVisibleByUserId(userId);
  
  // 2. Для каждого чата считаем непрочитанные
  const result = new Map<number, number>();
  
  for (const chat of chats) {
    const count = await this.getUnreadCountForRoom(chat.id, userId);
    if (count > 0) {
      result.set(chat.id, count);
    }
  }
  
  return result;
}

/**
 * Пометить конкретный чат как прочитанный (REST endpoint)
 */
async markRoomAsRead(chatRoomId: number, userId: number): Promise<void> {
  return this.markMessagesAsRead(chatRoomId, userId);
}
```

**Обновить `getUserChatRooms`**:
- Добавить поле `unreadCount` в каждый чат при возврате

```typescript
// В методе getUserChatRooms, внутри transformedChats.map
// Добавить подсчет непрочитанных:
const unreadCount = await this.getUnreadCountForRoom(chat.id, userId);
chatResponse.unreadCount = unreadCount;
```

### 3.2 Добавить эндпоинты в ChatController

**Файл**: `server/src/chat/chat.controller.ts`

**Новые эндпоинты**:

```typescript
/**
 * GET /chat/rooms/unread
 * Получить все непрочитанные сообщения пользователя
 * Возвращает: { roomId: count, ... }
 */
@Get('rooms/unread')
async getUnreadCounts(@CurrentUserId() userId: number) {
  const unreadMap = await this.chatService.getAllUnreadCounts(userId);
  // Конвертируем Map в объект
  return Object.fromEntries(unreadMap);
}

/**
 * POST /chat/rooms/:id/read
 * Пометить чат как прочитанный
 */
@Post('rooms/:id/read')
@HttpCode(HttpStatus.OK)
async markAsRead(
  @CurrentUserId() userId: number,
  @Param('id') id: string,
) {
  await this.chatService.markRoomAsRead(parseInt(id, 10), userId);
  return { success: true };
}
```

---

## Этап 4: Frontend - Socket клиент

### 4.1 Обновить Socket клиент

**Файл**: `front/src/lib/socket.ts`

**Текущее состояние**: Есть базовые методы (connect, joinRoom, sendMessage, typing)

**Добавить**:

```typescript
// ==================== Tab Support ====================

/**
 * Получить уникальный ID для текущей вкладки
 * Использует sessionStorage для сохранения между перезагрузками
 */
getTabId(): string {
  let tabId = sessionStorage.getItem('chat_tab_id');
  if (!tabId) {
    tabId = `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('chat_tab_id', tabId);
  }
  return tabId;
}

/**
 * Установить активную комнату для текущей вкладки
 * Вызывается при открытии чата
 */
setActiveRoom(roomId: number) {
  this.emit('setActiveRoom', { 
    roomId,
    tabId: this.getTabId()  // передаём ID вкладки
  });
}

/**
 * Очистить активную комнату (вкладка закрыта или пользователь на странице списка)
 */
clearActiveRoom() {
  this.emit('clearActiveRoom', { 
    tabId: this.getTabId() 
  });
}

// ==================== Event Listeners ====================

/**
 * Подписаться на обновление счётчика непрочитанных
 * Событие: unreadCountUpdate
 */
onUnreadUpdate(callback: (data: { roomId: number; count: number }) => void) {
  this.on('unreadCountUpdate', callback);
}

/**
 * Подписаться на изменения списка онлайн пользователей в комнате
 * Событие: usersOnline
 */
onUsersOnline(callback: (data: { roomId: number; userIds: number[] }) => void) {
  this.on('usersOnline', callback);
}

/**
 * Подписаться на изменение онлайн статуса пользователя
 * Событие: userOnlineStatus
 */
onUserOnlineStatus(callback: (data: { userId: number; isOnline: boolean }) => void) {
  this.on('userOnlineStatus', callback);
}

/**
 * Подписаться на новое сообщение (с проверкой roomId)
 * Событие: newMessage
 */
onNewMessage(callback: (data: { message: ChatMessage; roomId: number }) => void) {
  this.on('newMessage', callback);
}
```

### 4.2 Использование в ChatContext

**Файл**: `front/src/context/chat/ChatContext.tsx`

**Изменения**:

```typescript
// При выборе чата - установить активную комнату
useEffect(() => {
  if (selectedRoomId) {
    socketClient.setActiveRoom(selectedRoomId);
  } else {
    socketClient.clearActiveRoom();
  }
}, [selectedRoomId]);

// Слушать обновления непрочитанных
useEffect(() => {
  socketClient.onUnreadUpdate((data) => {
    setUnreadCounts(prev => ({
      ...prev,
      [data.roomId]: data.count
    }));
  });
  
  return () => {
    socketClient.off('unreadCountUpdate');
  };
}, []);
```

### 4.3 API для получения непрочитанных

**Файл**: `front/src/lib/api-chat.ts`

**Добавить**:

```typescript
/**
 * GET /chat/rooms/unread
 * Получить все непрочитанные сообщения
 */
export async function getUnreadCounts(): Promise<Record<number, number>> {
  const response = await fetch(`${API_URL}/chat/rooms/unread`, {
    headers: {
      'Authorization': `Bearer ${getAccessToken()}`,
    },
  });
  if (!response.ok) throw new Error('Failed to get unread counts');
  return response.json();
}

/**
 * POST /chat/rooms/:id/read
 * Пометить чат как прочитанный
 */
export async function markRoomAsRead(roomId: number): Promise<void> {
  const response = await fetch(`${API_URL}/chat/rooms/${roomId}/read`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${getAccessToken()}`,
    },
  });
  if (!response.ok) throw new Error('Failed to mark as read');
}
```

---

## Порядок реализации

### Неделя 1: Backend (Этап 3)
- [ ] Добавить методы в ChatService
- [ ] Обновить getUserChatRooms для включения unreadCount
- [ ] Добавить эндпоинты в ChatController

### Неделя 2: Frontend Socket (Этап 4)
- [ ] Обновить socket.ts с методами для tab support
- [ ] Добавить методы API в api-chat.ts
- [ ] Интегрировать в ChatContext