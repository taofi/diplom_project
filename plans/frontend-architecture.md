# Архитектура Frontend (Next.js)

## Общая структура проекта

```
front/
├── .env                          # Переменные окружения
├── .env.local                    # Локальные переменные (не в git)
├── .env.development              # Переменные для разработки
├── .env.production               # Переменные для продакшена
├── next.config.ts                # Конфигурация Next.js
├── next-i18next.config.ts        # Конфигурация i18n
├── middleware.ts                 # Middleware для i18n и auth
├── src/
│   ├── app/
│   │   ├── [locale]/             # Локализованные роуты
│   │   │   ├── layout.tsx        # Корневой layout с i18n
│   │   │   ├── page.tsx          # Главная страница
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   ├── register/
│   │   │   │   └── page.tsx
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx
│   │   │   └── ...
│   │   ├── api/                  # API роуты (если нужны)
│   │   ├── not-found.tsx         # Глобальная 404 страница
│   │   └── error.tsx             # Глобальный обработчик ошибок
│   ├── components/
│   │   ├── providers/
│   │   │   ├── UserProvider.tsx       # Провайдер пользователя
│   │   │   ├── I18nProvider.tsx       # Провайдер локализации
│   │   │   └── QueryProvider.tsx      # React Query провайдер
│   │   ├── ui/                   # UI компоненты
│   │   ├── auth/                 # Компоненты авторизации
│   │   └── shared/               # Общие компоненты
│   ├── lib/
│   │   ├── api/                  # API клиент
│   │   │   ├── ApiClient.ts      # Базовый класс API клиента
│   │   │   ├── endpoints/        # Обработчики эндпоинтов
│   │   │   │   ├── auth.ts
│   │   │   │   ├── user.ts
│   │   │   │   └── index.ts
│   │   │   └── errors/           # Обработка ошибок
│   │   │       ├── ApiError.ts
│   │   │       └── errorHandler.ts
│   │   ├── i18n/                 # Настройки i18n
│   │   │   ├── config.ts
│   │   │   └── locales/
│   │   │       ├── en/
│   │   │       │   └── common.json
│   │   │       └── ru/
│   │   │           └── common.json
│   │   ├── utils/
│   │   │   └── helpers.ts
│   │   └── constants/
│   │       └── index.ts
│   ├── hooks/
│   │   ├── useUser.ts            # Хук для работы с пользователем
│   │   ├── useAuth.ts            # Хук авторизации
│   │   └── useLocale.ts          # Хук для локализации
│   ├── types/
│   │   ├── api.ts                # Типы API
│   │   ├── user.ts               # Типы пользователя
│   │   └── index.ts
│   └── styles/
│       └── globals.css
└── public/
    └── locales/                  # JSON файлы переводов
        ├── en/
        │   └── common.json
        └── ru/
            └── common.json
```

## Диаграмма архитектуры

```mermaid
flowchart TB
    subgraph Client["Браузер"]
        Browser["User Browser"]
    end

    subgraph NextApp["Next.js App"]
        subgraph Middleware["Middleware Layer"]
            MW1["i18n Middleware<br/>- определение locale<br/>- редирект на /<locale>"]
            MW2["Auth Middleware<br/>- проверка токена<br/>- защита роутов"]
        end

        subgraph AppLayer["App Layer"]
            Layout["Root Layout<br/>- UserProvider<br/>- I18nProvider<br/>- QueryProvider"]
            Pages["Localized Pages<br/>/[locale]/..."]
            NotFound["not-found.tsx<br/>404 Страница"]
            ErrorPage["error.tsx<br/>Обработчик ошибок"]
        end

        subgraph ComponentLayer["Component Layer"]
            UserComp["User Component<br/>- единый компонент<br/>для работы с пользователем"]
            UI["UI Components"]
        end

        subgraph HooksLayer["Hooks Layer"]
            UseUser["useUser Hook"]
            UseAuth["useAuth Hook"]
            UseLocale["useLocale Hook"]
        end

        subgraph LibLayer["Library Layer"]
            subgraph ApiLayer["API Layer"]
                ApiClient["ApiClient Class<br/>- baseURL<br/>- interceptors<br/>- error handling"]
                Endpoints["Endpoint Handlers<br/>auth.ts, user.ts..."]
                ApiErrors["ApiError Classes<br/>- обработка ошибок"]
            end

            subgraph I18nLayer["i18n Layer"]
                I18nConfig["i18n Config"]
                Locales["Locales<br/>en, ru..."]
            end
        end
    end

    subgraph External["External"]
        ServerAPI["Server API<br/>/api/v1"]
    end

    Browser --> MW1
    MW1 --> MW2
    MW2 --> Layout
    Layout --> Pages
    Pages --> UserComp
    Pages --> UI
    
    UserComp --> UseUser
    UseUser --> ApiClient
    UseAuth --> ApiClient
    UseLocale --> I18nConfig
    
    ApiClient --> ApiErrors
    ApiClient --> Endpoints
    Endpoints --> ServerAPI
```

## Компоненты архитектуры

### 1. Environment Configuration (.env)

```env
# Server API
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001/api/v1
NEXT_PUBLIC_SERVER_URL=http://localhost:3001

# Authentication
NEXT_PUBLIC_JWT_STORAGE_KEY=auth_token

# App Config
NEXT_PUBLIC_APP_NAME=MyApp
NEXT_PUBLIC_DEFAULT_LOCALE=ru
NEXT_PUBLIC_SUPPORTED_LOCALES=ru,en
```

### 2. API Client Architecture

**BaseApiClient** - абстрактный класс для всех API запросов:
- Интерцепторы запросов/ответов
- Централизованная обработка ошибок
- Автоматическое добавление токена авторизации
- Типизация запросов и ответов

**Endpoint Handlers** - классы-наследники для конкретных доменов:
- AuthApi - авторизация
- UserApi - работа с пользователем
- и т.д.

### 3. i18n (Internationalization)

Использование next-intl или next-i18next:
- Middleware для определения локали
- Автоматический редирект на `/{locale}/...`
- Хранение переводов в JSON файлах
- Поддержка SSR

### 4. UserProvider

Единый компонент для работы с пользователем:
- Хранение состояния пользователя (React Context)
- Методы: login, logout, updateUser, refreshToken
- Автоматическая синхронизация между вкладками

### 5. Error Handling

Единый формат ошибок между frontend и backend:
```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
  meta?: {
    timestamp: string;
    requestId: string;
  };
}
```

### 6. 404 Page

- Глобальный `not-found.tsx` в app/
- Локализованный контент через i18n
- Ссылки на главную страницу
