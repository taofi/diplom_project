# План исправления отображения сообщений и добавления WebSocket

## Проблема 1: Сообщения не отображаются ✅ ИСПРАВЛЕНО
Сообщения теперь отображаются корректно.

## Проблема 2: Offer не отображается верно

Сервер возвращает:
```json
{
  "id": 1,
  "chat_room_id": 5,
  "message_id": 100,
  "seller_id": 6,
  "description": "фывфывф",
  "price": "22.00",
  "deadline": "2026-03-28T00:00:00.000Z",
  "status": "pending",
  "responded_at": null
}
```

Проблемы:
1. **price** - строка `"22.00"` вместо числа
2. **deadline** - содержит время `T00:00:00.000Z`, нужно отображать только дату
3. **status** - тип `"pending"` должен быть в enum
4. **responded_at** - новое поле, не определено в типах

---

## Этап 1: Исправление типов ChatOffer

### 1.1 Исправление типов
**Файл**: `front/src/types/chat/index.ts`

Нужно обновить интерфейс ChatOffer:
```typescript
export interface ChatOffer {
  id: number;
  chat_room_id: number;
  message_id: number;
  seller_id: number;
  description: string;
  price: number | string;  // <- поддержка строки
  deadline: string;
  status: 'pending' | 'accepted' | 'declined' | 'cancelled';  // <- enum
  responded_at: string | null;  // <- добавить
  // Опциональные поля для отображения
  seller?: ChatUser;
}
```

---

## Этап 2: Исправление OfferCard

### 2.1 Форматирование price
**Файл**: `front/src/components/chat/OfferCard.tsx`

Текущий код (строка ~26):
```typescript
const formatPrice = (price: number) => { ... }
```

Проблема: `offer.price` может быть строкой `"22.00"`, нужно привести к числу:
```typescript
const formatPrice = (price: number | string) => {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
  }).format(numPrice);
};
```

### 2.2 Форматирование deadline
**Файл**: `front/src/components/chat/OfferCard.tsx`

Текущий код (строка ~33):
```typescript
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};
```

Этот код уже форматирует дату без времени, проблема может быть в том, что нужно убедиться что парсинг работает корректно.

---

## Этап 3: WebSocket для создания заказов и изменения статусов

### 3.1 Анализ существующей архитектуры WebSocket
- [`socket.ts`](front/src/lib/socket.ts) - клиент socket.io
- [`ChatContext.tsx`](front/src/context/chat/ChatContext.tsx) - управление состоянием чата

### 3.2 Определение событий WebSocket

#### События от сервера (SERVER → CLIENT):
| Событие | Описание | Данные |
|---------|----------|--------|
| `chat:new_message` | Новое сообщение | `{ roomId, message }` |
| `chat:offer_created` | Создано предложение/заказ | `{ roomId, offer }` |
| `chat:offer_accepted` | Предложение принято | `{ roomId, order }` |
| `chat:offer_declined` | Предложение отклонено | `{ roomId, offerId }` |
| `chat:order_updated` | Обновление статуса заказа | `{ orderId, status }` |

### 3.3 Серверная часть

**Файл**: `server/src/chat/chat.service.ts` - добавить emit после создания/изменения:

```typescript
// После создания оффера
async createOffer(...) {
  const offer = await this.chatOfferRepository.create(offerData);
  
  // Emit событие
  this.chatGateway.server.to(`room:${chatRoomId}`).emit('chat:offer_created', {
    roomId: chatRoomId,
    offer: offer,
  });
  
  return offer;
}

// После принятия оффера
async acceptOffer(offerId: number, buyerId: number) {
  const order = await this.createOrderFromOffer(offerId, buyerId);
  
  this.chatGateway.server.to(`room:${order.chat_room_id}`).emit('chat:offer_accepted', {
    roomId: order.chat_room_id,
    order: order,
  });
  
  return order;
}
```

### 3.4 Клиентская часть

#### 3.4.1 Обновление socket.ts
Добавить методы для подписки на события заказов:
```typescript
subscribeToOfferCreated(callback: (data) => void) { ... }
subscribeToOrderUpdated(callback: (data) => void) { ... }
```

#### 3.4.2 Обновление ChatContext.tsx
Добавить обработчики событий в `useEffect`:
```typescript
useEffect(() => {
  socketClient.on('chat:offer_created', handleOfferCreated);
  socketClient.on('chat:offer_accepted', handleOfferAccepted);
  socketClient.on('chat:order_updated', handleOrderUpdated);
  
  return () => {
    socketClient.off('chat:offer_created', handleOfferCreated);
    socketClient.off('chat:offer_accepted', handleOfferAccepted);
    socketClient.off('chat:order_updated', handleOrderUpdated);
  };
}, []);
```

#### 3.4.3 Обработчики в ChatContext
```typescript
const handleOfferCreated = useCallback((data: { roomId: number; offer: ChatOffer }) => {
  if (data.roomId === currentRoom?.id) {
    setOffers(prev => [...prev, data.offer]);
  }
}, [currentRoom]);

const handleOrderUpdated = useCallback((data: { orderId: number; status: string }) => {
  setOrders(prev => prev.map(order => 
    order.id === data.orderId 
      ? { ...order, status: data.status }
      : order
  ));
}, []);
```

---

## Этап 4: Тестирование

### 4.1 Проверить отображение Offer
- Создать оффер → проверить отображение цены и даты
- Проверить что deadline отображается без времени

### 4.2 Проверить WebSocket
- Создать заказ → проверить появление в чате (без перезагрузки)
- Принять заказ → проверить обновление статуса
- Отклонить заказ → проверить обновление статуса

---

## Файлы для изменения

| Файл | Действие |
|------|----------|
| [`front/src/types/chat/index.ts`](front/src/types/chat/index.ts) | Обновить ChatOffer: price, status, responded_at |
| [`front/src/components/chat/OfferCard.tsx`](front/src/components/chat/OfferCard.tsx) | formatPrice с поддержкой строки |
| [`server/src/chat/chat.service.ts`](server/src/chat/chat.service.ts) | Добавить emit событий |
| [`front/src/lib/socket.ts`](front/src/lib/socket.ts) | Методы подписки |
| [`front/src/context/chat/ChatContext.tsx`](front/src/context/chat/ChatContext.tsx) | Обработчики WebSocket |

---

## Результат

```mermaid
graph LR
    A[Создание заказа] --> B[API Controller]
    B --> C[Chat Service]
    C --> D[(Database)]
    D --> E[WebSocket Gateway]
    E --> F[Socket.io Client]
    F --> G[ChatContext]
    G --> H[ChatWindow UI]
    
    style A fill:#e1f5fe
    style H fill:#e8f5e8