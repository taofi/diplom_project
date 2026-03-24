# План реализации системы заказов на редактирование в чате

## Оглавление

Этот файл содержит этапы реализации со ссылками на детальные планы.

---

## Этап 1: Сервер — Модель БД и DTO

**Описание:** Создать модель данных и транспортные объекты

**Детали:** см. [server-custom-order.md → раздел 1](server-custom-order.md#1-новая-модель-данных-offer-model)

**Результат:** Модель Offer доступна в приложении

**Новые файлы:**
- `server/src/db/models/offer.model.ts`
- `server/src/chat/dto/offer.dto.ts`

---

## Этап 2: Сервер — Сервис и Repository

**Описание:** Реализовать бизнес-логику работы с заказами

**Детали:** см. [server-custom-order.md → разделы 2-4](server-custom-order.md#2-dto-data-transfer-objects)

**Результат:** Логика работы с заказами готова

**Новые файлы:**
- `server/src/chat/repositories/offer.repository.ts`
- `server/src/chat/services/offer.service.ts`

---

## Этап 3: Сервер — Контроллер и API

**Описание:** Создать REST API эндпоинты

**Детали:** см. [server-custom-order.md → раздел 5](server-custom-order.md#5-контроллер-chatcontroller)

**Действия:**
- Добавить endpoints в ChatController
- Настроить Guards
- Добавить валидацию

**Результат:** API доступен для фронтенда

---

## Этап 4: Сервер — Интеграция FileService

**Описание:** Настроить загрузку и хранение файлов

**Детали:** см. [server-custom-order.md → раздел 1](server-custom-order.md#1-новая-модель-данных-offer-model) (секция 1.4)

**Действия:**
- Расширить FileService методами для offers
- Настроить пути: `files/offers/{id}/` и `public/media/offers/{id}/`
- Создать endpoints загрузки и скачивания

**Результат:** Файлы загружаются и скачиваются корректно

**Изменяемые файлы:**
- `server/src/common/services/file.service.ts`
- `server/src/types/base/file.types.ts`

---

## Этап 5: Сервер — WebSocket (ChatGateway)

**Описание:** Уведомления в реальном времени

**Детали:** см. [server-custom-order.md → раздел 6](server-custom-order.md#6-websocket-чат-gateway)

**Действия:**
- Добавить методы уведомлений в ChatGateway
- Интегрировать в OfferService

**Результат:** Клиент получает уведомления о изменениях

---

## Этап 6: Фронтенд — API клиент

**Описание:** Создать функции для работы с API

**Детали:** см. [client-server-integration.md → раздел 2](client-server-integration.md#2-api-взаимодействие-для-заказов)

**Действия:**
- Добавить функции в api-chat.ts
- Создать TypeScript типы

**Результат:** Фронтенд может вызывать серверные методы

**Новые файлы:**
- `front/src/types/chat/offer.types.ts`

**Изменяемые файлы:**
- `front/src/lib/api-chat.ts`

---

## Этап 7: Фронтенд — Компоненты UI

**Описание:** Создать визуальные компоненты

**Детали:** см. [frontend-custom-order.md → раздел 2](frontend-custom-order.md#2-компоненты-ui)

**Действия:**
- Создать OfferCard — карточка заказа с кнопками
- Создать CreateOfferModal — создание заказа
- Создать PriceChangeModal — изменение цены
- Создать FileUploader — загрузка файлов
- Создать ImageModal — просмотр изображений

**Результат:** Все UI компоненты готовы

**Новые файлы:**
- `front/src/components/chat/OfferCard.tsx`
- `front/src/components/chat/CreateOfferModal.tsx`
- `front/src/components/chat/PriceChangeModal.tsx`
- `front/src/components/chat/FileUploader.tsx`
- `front/src/components/chat/ImageModal.tsx`

---

## Этап 8: Фронтенд — Интеграция в ChatWindow

**Описание:** Встроить компоненты в окно чата

**Детали:** см. [frontend-custom-order.md → раздел 3](frontend-custom-order.md#3-интеграция-в-chatwindow)

**Действия:**
- Добавить OfferCard в начало чата
- Добавить кнопку "Создать заказ" внизу (для заказчика)
- Обработка WebSocket событий

**Результат:** Заказы интегрированы в чат

**Изменяемые файлы:**
- `front/src/components/chat/ChatWindow.tsx`

---

## Этап 9: Фронтенд — ChatContext обновление

**Описание:** Добавить управление заказами в контекст

**Детали:** см. [frontend-custom-order.md → раздел 4](frontend-custom-order.md#4-контекст-состояния-chatcontext)

**Действия:**
- Добавить состояние offers
- Добавить методы управления
- Интегрировать WebSocket

**Результат:** Управление заказами через контекст

**Изменяемые файлы:**
- `front/src/context/chat/ChatContext.tsx`

---

## Этап 10: Тестирование и Polishing

**Описание:** Проверить работу и исправить ошибки

**Действия:**
- Функциональное тестирование всех сценариев
- Тестирование прав доступа
- UI тестирование
- Локализация (i18n)
- Обработка ошибок

**Результат:** Система готова к использованию

---

## Связанные файлы планов

| Файл | Описание |
|------|----------|
| [server-custom-order.md](server-custom-order.md) | Детальная серверная архитектура |
| [frontend-custom-order.md](frontend-custom-order.md) | Детальная фронтенд архитектура |
| [client-server-integration.md](client-server-integration.md) | API и WebSocket взаимодействие |

---

## Краткое резюме

### Сервер (Этапы 1-5)
- Модель БД + DTO → Repository → Service → Controller → FileService → WebSocket
- 2 новых файла, 5 изменяемых

### Фронтенд (Этапы 6-9)
- API → UI компоненты → ChatWindow → Context
- 6 новых файлов, 3 изменяемых

### Тестирование (Этап 10)
- Функциональное + UI тестирование