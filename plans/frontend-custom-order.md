# Фронтенд архитектура: Система заказов на редактирование

## Обзор

Фронтенд построен на Next.js с использованием React и TypeScript. Новые компоненты интегрируются в существующую систему чата.

---

## 1. TypeScript Types

### Файл: `front/src/types/chat/offer.types.ts`

```typescript
// Новые типы для системы заказов

export enum OfferStatus {
  WAITING_AUTHOR = 'waiting_author',
  WAITING_USER = 'waiting_user',
  REJECTED = 'rejected',
  IN_PROGRESS = 'in_progress',
  AWAITING_PAYMENT = 'awaiting_payment',
  COMPLETED = 'completed',
}

export interface Offer {
  id: number;
  chat_room_id: number;
  creator_id: number;
  author_id: number;
  description: string;
  price: number;
  original_price: number | null;
  status: OfferStatus;
  preview_url: string | null;
  source_files_urls: string[] | null;
  is_paid: boolean;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
  // Relations (populated from server)
  creator?: ChatUser;
  author?: ChatUser;
}

export interface OfferWithFiles extends Offer {
  // Файлы доступны только после проверки на сервере
  available_preview?: string | null;
  available_sources?: string[] | null;
}
```

---

## 2. API клиент

### Файл: `front/src/lib/api-offer.ts`

```typescript
import { api } from './api';
import type { Offer, OfferWithFiles } from '@/types/chat/offer.types';

export const offerApi = {
  // Создать заказ
  create: async (data: {
    chatRoomId: number;
    authorId: number;
    description: string;
    price: number;
  }): Promise<Offer> => {
    const response = await api.post('/chat/offers', data);
    return response.data;
  },

  // Получить заказ
  get: async (id: number): Promise<Offer> => {
    const response = await api.get(`/chat/offers/${id}`);
    return response.data;
  },

  // Принять заказ (Автор)
  accept: async (id: number): Promise<Offer> => {
    const response = await api.post(`/chat/offers/${id}/accept`);
    return response.data;
  },

  // Отклонить заказ
  reject: async (id: number): Promise<Offer> => {
    const response = await api.post(`/chat/offers/${id}/reject`);
    return response.data;
  },

  // Изменить цену (Автор)
  counter: async (id: number, newPrice: number): Promise<Offer> => {
    const response = await api.post(`/chat/offers/${id}/counter`, { newPrice });
    return response.data;
  },

  // Подтвердить цену (Заказчик)
  confirmPrice: async (id: number): Promise<Offer> => {
    const response = await api.post(`/chat/offers/${id}/confirm-price`);
    return response.data;
  },

  // Загрузить файлы (Автор)
  uploadFiles: async (id: number, data: {
    previewUrl: string;
    sourceFilesUrls: string[];
  }): Promise<Offer> => {
    const response = await api.post(`/chat/offers/${id}/files`, data);
    return response.data;
  },

  // Оплатить заказ (Заказчик)
  pay: async (id: number, simulateSuccess = true): Promise<Offer> => {
    const response = await api.post(`/chat/offers/${id}/pay`, { simulateSuccess });
    return response.data;
  },

  // Получить доступные файлы (с проверкой)
  getFiles: async (id: number): Promise<{
    preview_url: string | null;
    source_files_urls: string[] | null;
  }> => {
    const response = await api.get(`/chat/offers/${id}/files`);
    return response.data;
  },

  // Получить все заказы комнаты
  getByRoom: async (roomId: number): Promise<Offer[]> => {
    const response = await api.get(`/chat/offers/rooms/${roomId}/offers`);
    return response.data;
  },
};
```

---

## 3. Компоненты

### 3.1 CreateOrderModal — Создание заказа

**Файл**: `front/src/components/chat/CreateOrderModal.tsx`

```
┌─────────────────────────────────────────┐
│  Создание заказа на редактирование      │
├─────────────────────────────────────────┤
│                                         │
│  Описание заказа:                       │
│  ┌─────────────────────────────────┐    │
│  │                                 │    │
│  │  Что нужно сделать...           │    │
│  │                                 │    │
│  └─────────────────────────────────┘    │
│                                         │
│  Предложенная цена:                     │
│  ┌─────────────────┐                    │
│  │  5000           │ RUB               │
│  └─────────────────┘                    │
│                                         │
│  [Отмена]        [Создать заказ]        │
└─────────────────────────────────────────┘
```

**Логика**:
- Поля: description (textarea), price (input number)
- Валидация: description не пустой, price > 0
- При отправке: POST /chat/offers
- При успехе: закрыть модал, показать уведомление, обновить чат

### 3.2 OfferCard — Карточка заказа

**Файл**: `front/src/components/chat/OfferCard.tsx` (переработка)

```
┌─────────────────────────────────────────┐
│  Заказ #123                  [В работе] │
├─────────────────────────────────────────┤
│                                         │
│  Описание:                              │
│  Отредактировать фото согласно ТЗ       │
│                                         │
│  Цена: 5000 ₽                          │
│                                         │
│  ─────────────────────────────────      │
│                                         │
│  [Принять]  [Изменить цену]  [Отклонить]│
│                                         │
└─────────────────────────────────────────┘
```

**Логика отображения по статусу**:

| Статус | Заказчик видит | Автор видит |
|--------|----------------|-------------|
| waiting_author | Описание, цена, кнопка "Отменить" | Описание, цена, кнопки "Принять", "Изменить цену", "Отклонить" |
| waiting_user | Описание, старая/новая цена, кнопки "Принять", "Отклонить" | Инфо "Ожидает подтверждения" |
| in_progress | Только описание и цена | Описание, цена, форма загрузки файлов |
| awaiting_payment | Превью (размыто), исходники скрыты, кнопка "Оплатить" | Инфо "Ожидает оплаты", кнопка "Отменить" |
| completed | Превью полное, исходники доступны | Инфо "Завершён" |
| rejected | Инфо "Отклонён" | Инфо "Отклонён" |

### 3.3 FileUploadForm — Форма загрузки файлов

**Файл**: `front/src/components/chat/FileUploadForm.tsx`

```
┌─────────────────────────────────────────┐
│  Загрузка результата работы             │
├─────────────────────────────────────────┤
│                                         │
│  Превью (изображение):                  │
│  ┌─────────────────────────────────┐    │
│  │  📁 Выберите файл...             │    │
│  └─────────────────────────────────┘    │
│  └─ Принимает: jpg, png, webp            │
│                                         │
│  Исходные файлы:                         │
│  ┌─────────────────────────────────┐    │
│  │  📁 Выберите файлы...            │    │
│  └─────────────────────────────────┘    │
│  └─ Принимает: zip, rar, psd, ai, pdf   │
│                                         │
│  [Отмена]        [Загрузить]            │
└─────────────────────────────────────────┘
```

**Логика**:
- Два input type="file"
- При загрузке: использовать uploadApi (уже есть в проекте)
- После загрузки: получить URL файлов
- POST /chat/offers/:id/files с URLs

### 3.4 PaymentButton — Кнопка оплаты

**Файл**: `front/src/components/chat/PaymentButton.tsx`

```
┌─────────────────────────────────────────┐
│  💰 К оплате: 5000 ₽                    │
│  ┌─────────────────────────────────┐    │
│  │      [ОПЛАТИТЬ ЗАКАЗ]           │    │
│  └─────────────────────────────────┘    │
│  После оплаты вы получите исходные файлы │
└─────────────────────────────────────────┘
```

**Логика**:
- Видна только для заказчика в статусе awaiting_payment
- При клике: POST /chat/offers/:id/pay
- При успехе: показать исходники, обновить статус

### 3.5 ProtectedFilesViewer — Просмотр защищённых файлов

**Файл**: `front/src/components/chat/ProtectedFilesViewer.tsx`

```
┌─────────────────────────────────────────┐
│  Файлы заказа                            │
├─────────────────────────────────────────┤
│                                         │
│  Превью:                                 │
│  ┌─────────────────────────────────┐    │
│  │                                 │    │
│  │      [Изображение]              │    │
│  │                                 │    │
│  └─────────────────────────────────┘    │
│                                         │
│  Исходные файлы:                         │
│  ┌─────────────────────────────────┐    │
│  │  📄 design-project.psd    25MB  │    │
│  │  📄 source-images.zip     150MB │    │
│  │  [Скачать все]                   │    │
│  └─────────────────────────────────┘    │
│                                         │
└─────────────────────────────────────────┘
```

**Логика**:
- GET /chat/offers/:id/files (сервер проверит доступ)
- Если is_paid=false: показать "Заблокировано до оплаты"
- Если is_paid=true: показать ссылки на скачивание

---

## 4. Хуки (React Hooks)

### 4.1 useOffer — Управление заказом

**Файл**: `front/src/hooks/useOffer.ts`

```typescript
import { useState, useCallback } from 'react';
import { offerApi } from '@/lib/api-offer';
import type { Offer, OfferStatus } from '@/types/chat/offer.types';

interface UseOfferReturn {
  offer: Offer | null;
  isLoading: boolean;
  error: string | null;
  actions: {
    create: (data: CreateOfferData) => Promise<void>;
    accept: () => Promise<void>;
    reject: () => Promise<void>;
    counter: (newPrice: number) => Promise<void>;
    confirmPrice: () => Promise<void>;
    uploadFiles: (previewUrl: string, sources: string[]) => Promise<void>;
    pay: () => Promise<void>;
    refresh: () => Promise<void>;
  };
}

export function useOffer(offerId: number | null): UseOfferReturn {
  const [offer, setOffer] = useState<Offer | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const actions = {
    create: async (data: CreateOfferData) => {
      setIsLoading(true);
      try {
        const newOffer = await offerApi.create(data);
        setOffer(newOffer);
      } catch (e) {
        setError(e.message);
      } finally {
        setIsLoading(false);
      }
    },
    // ... другие методы аналогично
  };

  return { offer, isLoading, error, actions };
}
```

### 4.2 useOffers — Список заказов комнаты

**Файл**: `front/src/hooks/useOffers.ts`

```typescript
import { useState, useEffect, useCallback } from 'react';
import { offerApi } from '@/lib/api-offer';
import { useSocket } from '@/lib/socket';
import type { Offer } from '@/types/chat/offer.types';

export function useOffers(roomId: number) {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const socket = useSocket();

  // Загрузка при монтировании
  useEffect(() => {
    loadOffers();
  }, [roomId]);

  // WebSocket подписка
  useEffect(() => {
    if (!socket) return;

    const handleOfferCreated = (data: { offer: Offer }) => {
      setOffers(prev => [data.offer, ...prev]);
    };

    const handleStatusChanged = (data: { offer: Offer }) => {
      setOffers(prev => prev.map(o => o.id === data.offer.id ? data.offer : o));
    };

    socket.on('offer:created', handleOfferCreated);
    socket.on('offer:statusChanged', handleStatusChanged);
    socket.on('offer:priceChanged', handleStatusChanged);
    socket.on('offer:filesUploaded', handleStatusChanged);
    socket.on('offer:paid', handleStatusChanged);

    return () => {
      socket.off('offer:created', handleOfferCreated);
      socket.off('offer:statusChanged', handleStatusChanged);
      socket.off('offer:priceChanged', handleStatusChanged);
      socket.off('offer:filesUploaded', handleStatusChanged);
      socket.off('offer:paid', handleStatusChanged);
    };
  }, [socket]);

  const loadOffers = async () => {
    setIsLoading(true);
    try {
      const data = await offerApi.getByRoom(roomId);
      setOffers(data);
    } catch (e) {
      console.error('Failed to load offers:', e);
    } finally {
      setIsLoading(false);
    }
  };

  return { offers, isLoading, reload: loadOffers };
}
```

---

## 5. Интеграция с ChatWindow

### Модификация `front/src/components/chat/ChatWindow.tsx`

```typescript
// Добавить импорт
import { OfferCard } from './OfferCard';
import { CreateOrderButton } from './CreateOrderButton';

// В рендере сообщений:
// Для типа сообщения ORDER рендерим OfferCard
{message.message_type === 'order' && (
  <OrderCard 
    offer={message.offer}  // ID заказа из message
    currentUserId={currentUser.id}
  />
)}
```

### Добавить кнопку создания заказа

```typescript
// В области ввода сообщения
<div className="chat-actions">
  <CreateOrderButton 
    chatRoomId={room.id}
    authorId={isSeller ? currentUser.id : otherUser.id}
  />
</div>
```

---

## 6. Словари (i18n)

### Файл: `front/src/locales/ru.json` (дополнение)

```json
{
  "chat": {
    "createOrder": "Создать заказ",
    "orderTitle": "Заказ на редактирование",
    "orderDescription": "Описание заказа",
    "orderPrice": "Предложенная цена",
    "createOrderButton": "Создать заказ",
    "cancelOrder": "Отменить заказ",
    "acceptOrder": "Принять",
    "rejectOrder": "Отклонить",
    "changePrice": "Изменить цену",
    "confirmPrice": "Принять цену",
    "newPrice": "Новая цена",
    "uploadResult": "Загрузить результат",
    "preview": "Превью",
    "sourceFiles": "Исходные файлы",
    "payOrder": "Оплатить заказ",
    "downloadFiles": "Скачать файлы",
    "waitingAuthor": "Ожидает реакции автора",
    "waitingUser": "Ожидает вашего подтверждения",
    "inProgress": "В работе",
    "awaitingPayment": "Ожидает оплаты",
    "completed": "Завершён",
    "rejected": "Отклонён",
    "filesBlocked": "Доступно после оплаты",
    "paymentRequired": "Для доступа к исходникам необходимо оплатить заказ",
    "originalPrice": "Исходная цена",
    "newPriceLabel": "Новая цена"
  }
}
```

---

## 7. Структура файлов

```
front/src/
├── components/chat/
│   ├── CreateOrderModal.tsx      # Модалка создания заказа
│   ├── OrderCard.tsx             # Карточка заказа (переработка)
│   ├── FileUploadForm.tsx       # Форма загрузки файлов
│   ├── PaymentButton.tsx        # Кнопка оплаты
│   └── ProtectedFilesViewer.tsx  # Просмотр защищённых файлов
├── hooks/
│   ├── useOffer.ts               # Хук управления одним заказом
│   └── useOffers.ts             # Хук списка заказов
├── lib/
│   └── api-offer.ts              # API клиент для заказов
└── types/chat/
    └── offer.types.ts            # TypeScript типы
```

---

## 8. Сценарии использования

### Сценарий 1: Заказчик создаёт заказ

1. Заказчик открывает чат с автором
2. Нажимает кнопку "Создать заказ"
3. Заполняет форму (описание, цена)
4. Нажимает "Создать"
5. В чате появляется карточка заказа со статусом "waiting_author"
6. Автор получает WebSocket уведомление

### Сценарий 2: Автор принимает заказ

1. Автор видит карточку заказа
2. Нажимает "Принять"
3. Статус меняется на "in_progress"
4. У автора появляется форма загрузки файлов
5. Заказчик видит обновлённый статус

### Сценарий 3: Автор загружает результат

1. Автор заполняет форму (превью + исходники)
2. Нажимает "Загрузить результат"
3. Статус меняется на "awaiting_payment"
4. Заказчик видит превью (размытое) и кнопку оплаты

### Сценарий 4: Заказчик оплачивает

1. Заказчик видит превью работы
2. Нажимает "Оплатить заказ"
3. API вызывает /pay (имитация)
4. Статус меняется на "completed"
5. Заказчик видит исходники
6. Автор получает уведомление об оплате