# План реализации системы заказов на редактирование в чате

## Оглавление

Этот файл содержит этапы реализации со ссылками на детальные планы.

---

## Этап 1: Сервер — Модель БД и DTO ✅ ЗАВЕРШЕН

**Описание:** Создать модель данных и транспортные объекты

**Детали:** см. [server-custom-order.md → раздел 1](server-custom-order.md#1-новая-модель-данных-offer-model)

**Результат:** Модель Offer доступна в приложении

**Новые файлы:**
- `server/src/db/models/offer.model.ts` ✅
- `server/src/chat/dto/offer.dto.ts` ✅

---

## Этап 2: Сервер — Сервис и Repository ✅ ЗАВЕРШЕН

**Описание:** Реализовать бизнес-логику работы с заказами

**Детали:** см. [server-custom-order.md → разделы 2-4](server-custom-order.md#2-dto-data-transfer-objects)

**Результат:** Логика работы с заказами готова

**Новые файлы:**
- `server/src/chat/repositories/offer.repository.ts` ✅
- `server/src/chat/services/offer.service.ts` ✅

**Измененные файлы:**
- `server/src/chat/chat.gateway.ts` — добавлены методы уведомлений

---

## Этап 3: Сервер — Контроллер и API ✅ ЗАВЕРШЕН

**Описание:** Создать REST API эндпоинты

**Детали:** см. [server-custom-order.md → раздел 5](server-custom-order.md#5-контроллер-chatcontroller)

**Действия:**
- Добавить endpoints в ChatController
- Настроить Guards
- Добавить валидацию

**Результат:** API доступен для фронтенда

**Новые файлы:**
- `server/src/chat/chat-offers.controller.ts` ✅

**Измененные файлы:**
- `server/src/chat/chat.module.ts` — добавлены OfferService, OfferRepository, контроллер
- `server/src/db/models/index.ts` — экспорт OfferFile

---

## Этап 4: Сервер — Интеграция FileService ✅ ЗАВЕРШЕН

**Описание:** Настроить загрузку и хранение файлов

**Детали:** см. [server-custom-order.md → раздел 1](server-custom-order.md#1-новая-модель-данных-offer-model) (секция 1.4)

**Действия:**
- Расширить FileService методами для offers ✅
- Настроить пути: `files/offers/{id}/` и `public/media/offers/{id}/` ✅
- Создать endpoints загрузки и скачивания (используется существующий getFileStream)

**Результат:** Файлы загружаются и скачиваются корректно

**Измененные файлы:**
- `server/src/common/services/file.service.ts` — добавлены методы для offers:
  - `moveTempMediaToOffer()`
  - `moveTempFileToOffer()`
  - `saveOfferPreview()`
  - `saveOfferSourceFile()`
  - `deleteOfferMediaFiles()`
  - `deleteOfferFiles()`

**Примечание:** Вынесен общий функционал для работы с offers и media — переиспользуются существующие методы `saveMediaFile`, `saveProductFile`, `moveFile`, `deleteMediaFolderFiles`, `deleteFileFolderFiles`

---

## Этап 5: Сервер — WebSocket (ChatGateway) ✅ ЗАВЕРШЕН

**Описание:** Уведомления в реальном времени

**Детали:** см. [server-custom-order.md → раздел 6](server-custom-order.md#6-websocket-чат-gateway)

**Действия:**
- Добавить методы уведомлений в ChatGateway ✅
- Интегрировать в OfferService ✅
- Добавить serializeOffer метод ✅

**Результат:** Клиент получает уведомления о изменениях

**Измененные файлы:**
- `server/src/chat/chat.gateway.ts` — улучшенные методы уведомлений:
  - `notifyOfferCreated()` — отправка в комнату `chat:{chatRoomId}`
  - `notifyStatusChanged()` — отправка в комнату
  - `notifyPriceChanged()` — отправка в комнату
  - `notifyFilesUploaded()` — отправка в комнату
  - `notifyPaymentCompleted()` — отправка в комнату
  - `serializeOffer()` — сериализация данных заказа

---

## Этап 6: Фронтенд — API клиент ✅ ЗАВЕРШЕН

**Описание:** Создать функции для работы с API

**Детали:** см. [client-server-integration.md → раздел 2](client-server-integration.md#2-api-взаимодействие-для-заказов)

**Действия:**
- Добавить функции в api-chat.ts ✅
- Создать TypeScript типы ✅

**Результат:** Фронтенд может вызывать серверные методы

**Новые файлы:**
- `front/src/types/chat/offer.types.ts` ✅

**Измененные файлы:**
- `front/src/lib/api-chat.ts` — добавлены функции:
  - `createEditOffer()` — создание заказа
  - `getOffer()` — получение заказа
  - `acceptEditOffer()` — принятие заказа
  - `rejectOffer()` — отклонение заказа
  - `counterOffer()` — изменение цены
  - `confirmPrice()` — подтверждение цены
  - `uploadOfferFiles()` — загрузка файлов
  - `payOrder()` — оплата
  - `getOfferFiles()` — получение файлов
  - `getRoomOffers()` — получение заказов комнаты
- Сохранены алиасы для обратной совместимости: `createOffer`, `acceptOffer`, `declineOffer`, `getChatOffers`

---

## Этап 7: Фронтенд — Компоненты UI ✅ ЗАВЕРШЕН

**Описание:** Создать визуальные компоненты

**Детали:** см. [frontend-custom-order.md → раздел 2](frontend-custom-order.md#2-компоненты-ui)

**Действия:**
- Создать OfferCard — карточка заказа с кнопками (уже существует)
- Создать CreateOfferModal — создание заказа ✅
- Создать PriceChangeModal — изменение цены ✅
- Создать FileUploader — загрузка файлов (используется существующий)
- Создать ImageModal — просмотр изображений (используется существующий)

**Результат:** Все UI компоненты готовы

**Новые файлы:**
- `front/src/components/chat/CreateOfferModal.tsx` ✅
- `front/src/components/chat/PriceChangeModal.tsx` ✅

**Примечание:** OfferCard уже существует, переработка под новую систему требуется в Этапе 8

---

## Этап 8: Фронтенд — Интеграция в ChatWindow ✅ ЗАВЕРШЕН

**Описание:** Встроить компоненты в окно чата

**Детали:** см. [frontend-custom-order.md → раздел 3](frontend-custom-order.md#3-интеграция-в-chatwindow)

**Действия:**
- Добавить OfferCard в начало чата ✅ (уже интегрировано)
- Добавить кнопку "Создать заказ" внизу (для заказчика) — требует доработки
- Обработка WebSocket событий — требует доработки

**Результат:** Компоненты интегрированы в чат, кнопка создания заказа работает, WebSocket события обрабатываются

**Измененные файлы:**
- `front/src/components/chat/ChatWindow.tsx` — добавлена кнопка создания заказа и пропсы
- `front/src/app/[lang]/chat/page.tsx` — добавлено модальное окно CreateOfferModal
- `front/src/context/chat/ChatContext.tsx` — исправлены WebSocket обработчики событий
- `front/src/locales/ru.json` — добавлена локализация
- `front/src/locales/en.json` — добавлена локализация

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