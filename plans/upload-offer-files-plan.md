# План: Загрузка файлов и превью для заказов (Offer)

## Цель
Добавить модальное окно на фронтенде для загрузки превью и исходных файлов, а также обновить бэкенд для обработки multipart-загрузки файлов.

## Требования к путям сохранения

### Превью (preview)
- Путь сохранения: `server/public/media/offer/{id}/{filename}`
- URL в БД: `media/offer/{id}/{filename}`
- Доступ: публичный через `/public` (ServeStaticModule)

### Исходные файлы (source_files)
- Путь сохранения: `server/files/offer/{id}/{filename}`
- URL в БД: `offer/{id}/{filename}`
- Доступ: через `/files` (ServeStaticModule)

## Логика работы

1. **Открытие** - Исполнитель нажимает кнопку "Загрузить файлы" в OfferCard
2. **Выбор** - В модальном окне выбирает превью (1 файл) и исходные файлы (несколько файлов)
3. **Предпросмотр** - Видит выбранное превью и список файлов
4. **Сохранение** - Нажимает "Сохранить" → файлы отправляются на сервер

---

# Этапы реализации

## Этап 1: Подготовка бэкенда (серверная часть)

### 1.1 Обновить ChatModule - добавить CommonModule
**Файл:** `server/src/chat/chat.module.ts`
- Добавить импорт `CommonModule` для доступа к `FileService`

### 1.2 Обновить ChatOffersController
**Файл:** `server/src/chat/chat-offers.controller.ts`
- Изменить метод `uploadFiles` для приёма multipart
- Добавить `@UseInterceptors(FileInterceptor('preview'))`
- Добавить `@UseInterceptors(FilesInterceptor('files', 10))`
- Инжектировать `FileService`
- Вызвать сервис с файлами напрямую

### 1.3 Обновить OfferService
**Файл:** `server/src/chat/services/offer.service.ts`
- Изменить метод `uploadFiles` для приёма `MulterFile`
- Использовать `FileService.saveOfferPreview()` для сохранения превью
- Использовать `FileService.saveOfferSourceFile()` для сохранения файлов
- Формировать URL для БД

### 1.4 Обновить OfferRepository (при необходимости)
**Файл:** `server/src/chat/repositories/offer.repository.ts`
- Проверить метод `setFiles` на совместимость

---

## Этап 2: Подготовка фронтенда (клиентская часть)

### 2.1 Обновить API
**Файл:** `front/src/lib/api-chat.ts`
- Добавить метод `uploadOfferFiles` с FormData

### 2.2 Обновить типы
**Файл:** `front/src/types/chat/offer.types.ts`
- При необходимости обновить `UploadFilesDto`

### 2.3 Добавить локали
**Файлы:** 
- `front/src/locales/ru.json`
- `front/src/locales/en.json`
- Добавить тексты для модального окна

---

## Этап 3: Создание модального окна

### 3.1 Создать компонент UploadFilesModal
**Файл:** `front/src/components/chat/UploadFilesModal.tsx` (НОВЫЙ)
- Зона для превью (drag & drop)
- Зона для файлов (drag & drop)
- Предпросмотр превью
- Список файлов с возможностью удаления
- Кнопки "Сохранить" и "Отмена"
- Состояния загрузки и ошибок

---

## Этап 4: Интеграция модального окна

### 4.1 Обновить OfferCard
**Файл:** `front/src/components/chat/OfferCard.tsx`
- Добавить состояние `isModalOpen`
- Добавить обработчик открытия модального окна
- Рендерить `UploadFilesModal` внутри компонента

### 4.2 Обновить OffersPanel
**Файл:** `front/src/components/chat/OffersPanel.tsx`
- Передать необходимые пропсы для открытия модального окна

---

## Этап 5: Тестирование

### 5.1 Тест загрузки файлов
- Проверить загрузку превью
- Проверить загрузку нескольких файлов
- Проверить пути сохранения на сервере

### 5.2 Тест отображения
- Проверить предпросмотр превью
- Проверить список файлов

### 5.3 Тест интеграции
- Проверить обновление статуса offer после загрузки
- Проверить WebSocket уведомления

---

# Список файлов для изменения

## Сервер (server/)

| Файл | Действие | Описание |
|------|----------|----------|
| `server/src/chat/chat.module.ts` | Изменить | Добавить CommonModule |
| `server/src/chat/chat-offers.controller.ts` | Изменить | Обновить uploadFiles для multipart |
| `server/src/chat/services/offer.service.ts` | Изменить | Логика сохранения файлов |
| `server/src/chat/repositories/offer.repository.ts` | Проверить | Метод setFiles |

## Клиент (front/)

| Файл | Действие | Описание |
|------|----------|----------|
| `front/src/lib/api-chat.ts` | Изменить | Добавить метод uploadOfferFiles |
| `front/src/locales/ru.json` | Изменить | Добавить локали |
| `front/src/locales/en.json` | Изменить | Добавить локали |
| `front/src/components/chat/UploadFilesModal.tsx` | Создать | Новое модальное окно |
| `front/src/components/chat/OfferCard.tsx` | Изменить | Интегрировать модальное окно |
| `front/src/components/chat/OffersPanel.tsx` | Изменить | Передать пропсы |

---

# Диаграмма потока данных

```mermaid
graph TD
    A[Пользователь] --> B[OfferCard - кнопка "Загрузить"]
    B --> C[UploadFilesModal - модальное окно]
    C --> D[Выбор превью и файлов]
    D --> E[Нажатие "Сохранить"]
    E --> F[api-chat.uploadOfferFiles]
    F --> G[POST /chat/offers/:id/files]
    G --> H[chat-offers.controller.ts]
    H --> I[FileService.saveOfferPreview]
    H --> J[FileService.saveOfferSourceFile]
    I --> K[public/media/offer/{id}/]
    J --> L[files/offer/{id}/]
    K --> M[preview_url в БД]
    L --> N[source_files_urls в БД]
    M --> O[WebSocket уведомление]
    N --> O
    O --> P[Обновление UI]
```

---

# Примечание

- Поле `preview_url` уже существует в модели `Offer` (строка 77-79)
- Поле `source_files_urls` уже существует в модели `Offer` (строка 81-83)
- Методы `saveOfferPreview` и `saveOfferSourceFile` уже есть в `FileService`
- ServeStaticModule уже настроен для `/public` и `/files`
