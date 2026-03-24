# Подробный план: ChatContext улучшения + ChatWindow онлайн статус

## Текущее состояние

- ✅ Этапы 1-4 плана `chat-unread-messages-plan.md` выполнены
- ✅ Этап 5: ChatContext улучшения - **ВЫПОЛНЕН**
- ✅ Этап 6: ChatWindow онлайн статус - **ВЫПОЛНЕН**

---

## Следующий шаг: Этап 7 - Тестирование и интеграция

## Этап 5: Улучшения ChatContext

### Цель
Добавить в ChatContext поддержку активной комнаты, определения роли пользователя, отслеживания онлайн статуса и управления непрочитанными.

### 5.1 Обновить типы (front/src/types/chat/index.ts)

**Добавить поле `isOnline` в ChatUser:**
```typescript
export interface ChatUser {
  id: number;
  name: string;
  email?: string;
  avatar?: string;
  isOnline?: boolean; // Добавить
}
```

**Обновить ChatRoom для включения онлайн статуса участников:**
```typescript
export interface ChatRoom {
  // ... существующие поля
  buyerIsOnline?: boolean; // Добавить
  sellerIsOnline?: boolean; // Добавить
}
```

### 5.2 Обновить ChatContextType (front/src/context/chat/ChatContext.tsx)

**Добавить новые поля:**
```typescript
interface ChatContextType {
  // ... существующие поля
  activeRoomId: number | null;        // ID текущей открытой комнаты
  currentUserRole: 'buyer' | 'seller' | null; // Роль в текущей комнате
  totalUnreadCount: number;            // Общее количество непрочитанных
  onlineUsers: Set<number>;            // Множество ID онлайн пользователей
  
  // Новые методы
  setActiveRoom: (roomId: number | null) => void;
  markRoomAsRead: (roomId: number) => Promise<void>;
  refreshUnreadCounts: () => Promise<void>;
  updateOnlineUsers: (userIds: number[]) => void;
}
```

### 5.3 Реализовать методы в ChatContext

**setActiveRoom(roomId: number | null):**
- Устанавливает activeRoomId
- Отправляет событие на сервер: `socket.emit('setActiveRoom', { roomId })`
- Если roomId не null, вызывает markRoomAsRead для этой комнаты

**markRoomAsRead(roomId: number):**
- Вызывает API: `POST /api/chat/rooms/${roomId}/read`
- Обновляет локальное состояние unread counts
- Отправляет событие на сервер для синхронизации

**refreshUnreadCounts():**
- Вызывает API: `GET /api/chat/rooms/unread`
- Обновляет totalUnreadCount и состояние комнат

**updateOnlineUsers(userIds: number[]):**
- Обновляет множество onlineUsers
- Оповещает компоненты об изменении

### 5.4 Добавить socket слушатели в ChatContext

```typescript
useEffect(() => {
  if (!socket) return;
  
  // Непрочитанные обновления
  socket.on('unreadCountUpdate', (data: { roomId: number; count: number }) => {
    // Обновить unreadCount для конкретной комнаты
  });
  
  // Список онлайн пользователей
  socket.on('usersOnline', (userIds: number[]) => {
    updateOnlineUsers(userIds);
  });
  
  // Изменение статуса конкретного пользователя
  socket.on('userOnlineStatus', (data: { userId: number; isOnline: boolean }) => {
    if (data.isOnline) {
      onlineUsers.add(data.userId);
    } else {
      onlineUsers.delete(data.userId);
    }
    // Trigger re-render
  });
  
  return () => {
    socket.off('unreadCountUpdate');
    socket.off('usersOnline');
    socket.off('userOnlineStatus');
  };
}, [socket]);
```

### 5.5 Исправление логики добавления сообщений

**Текущая проблема:** Сообщения добавляются даже если комната не активна
**Решение:** Проверять roomId перед добавлением

```typescript
// В handleNewMessage:
if (message.chat_room_id === activeRoomId) {
  setMessages(prev => [...prev, message]);
}
```

---

## Этап 6: ChatWindow - отображение онлайн статуса

### Цель
Добавить визуальный индикатор онлайн статуса в заголовке чата.

### 6.1 Обновить ChatWindowProps

```typescript
interface ChatWindowProps {
  // ... существующие поля
  otherUserIsOnline?: boolean; // Добавить
}
```

### 6.2 Обновить компонент ChatWindow

**Изменить определение otherUser (строка 133):**
```typescript
// Сейчас:
const otherUser = room?.seller || room?.buyer;

// Нужно с учетом роли:
const otherUser = currentUserRole === 'buyer' ? room?.seller : room?.buyer;
```

**Добавить индикатор онлайн статуса в заголовок (строка 170-175):**
```typescript
<div className="flex items-center gap-2">
  <h3 className="font-semibold text-gray-900">
    {room.translatedProductName || ...}
  </h3>
  {otherUserIsOnline && (
    <span className="w-2.5 h-2.5 bg-green-500 rounded-full" title={t('chat.online')} />
  )}
</div>
{otherUser && (
  <p className="text-sm text-gray-500">
    {t('chat.chatWith')}: {otherUser.name}
    {otherUserIsOnline && <span className="text-green-600"> • {t('chat.online')}</span>}
  </p>
)}
```

### 6.3 Передача пропса в ChatPage

**В front/src/app/[lang]/chat/page.tsx:**
```typescript
<ChatWindow
  // ... существующие пропсы
  otherUserIsOnline={
    currentUserRole === 'buyer' 
      ? room.sellerIsOnline 
      : room.buyerIsOnline
  }
/>
```

---

## Зависимости между этапами

```
Этап 5 (ChatContext)
    │
    ├─ 5.1 Типы → Этап 6 (ChatWindow)
    ├─ 5.2 Контекст
    ├─ 5.3 Методы → Этап 6 (использует activeRoomId)
    ├─ 5.4 Socket listeners → Этап 6 (получает onlineUsers)
    └─ 5.5 Исправление логики

Этап 6 (ChatWindow)
    │
    ├─ 6.1 Props → требует 5.1 (типы с isOnline)
    ├─ 6.2 Компонент → использует 5.2 (activeRoomId, currentUserRole)
    └─ 6.3 Интеграция → требует 5.4 (socket для получения статуса)
```

---

## Mermaid диаграмма потока данных

```mermaid
flowchart TD
    A[Пользователь открывает чат] --> B[ChatContext.setActiveRoom]
    B --> C[Socket: setActiveRoom событие]
    C --> D[Сервер: ChatStateService.setActiveRoom]
    D --> E[Redis: обновление hash chat:user:{id}:active_rooms]
    
    F[Сервер: определяет online users] --> G[Socket: usersOnline событие]
    G --> H[ChatContext.updateOnlineUsers]
    H --> I[Обновление Set onlineUsers]
    
    J[Новое сообщение] --> K[ChatContext.handleNewMessage]
    K --> L{roomId === activeRoomId?}
    L -->|Да| M[Добавить в messages]
    L -->|Нет| N[Только обновить unreadCount]
    
    O[Пользователь читает сообщения] --> P[ChatContext.markRoomAsRead]
    P --> Q[API: POST /chat/rooms/:id/read]
    Q --> R[Сервер: обновляет БД и Redis]
    
    style A fill:#e1f5fe
    style F fill:#e8f5e9
    style O fill:#fff3e0
```

---

## Файлы для изменения

### Frontend:
1. `front/src/types/chat/index.ts` - добавить isOnline поля
2. `front/src/context/chat/ChatContext.tsx` - добавить состояние и методы
3. `front/src/components/chat/ChatWindow.tsx` - добавить индикатор
4. `front/src/app/[lang]/chat/page.tsx` - передать пропсы

### Backend (если нужно):
1. `server/src/chat/chat.service.ts` - добавить buyerIsOnline/sellerIsOnline
2. `server/src/chat/chat.gateway.ts` - emit usersOnline периодически