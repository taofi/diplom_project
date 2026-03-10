# API Contract - Единый формат взаимодействия

## Общая архитектура системы

```mermaid
flowchart TB
    subgraph Frontend["Frontend (Next.js 16)"]
        direction TB
        
        subgraph F_Pages["App Router"]
            F_Layout["Layout + Providers"]
            F_Localized["[locale]/pages"]
            F_NotFound["not-found.tsx"]
        end
        
        subgraph F_Lib["Libraries"]
            F_ApiClient["ApiClient Class"]
            F_Endpoints["Endpoint Handlers"]
            F_Errors["Error Handler"]
        end
        
        subgraph F_State["State Management"]
            F_User["UserProvider"]
            F_I18n["I18nProvider"]
        end
    end

    subgraph Network["Network"]
        HTTP["HTTP/REST API<br/>JSON Format"]
    end

    subgraph Backend["Backend (Next.js API)"]
        direction TB
        
        subgraph B_Routes["API Routes<br/>app/api/v1"]
            B_Auth["/auth/*"]
            B_Users["/users/*"]
        end
        
        subgraph B_Middleware["Middleware"]
            B_Cors["CORS"]
            B_AuthMW["Auth Middleware"]
            B_ErrorMW["Error Handler"]
        end
        
        subgraph B_Lib["Libraries"]
            B_JWT["JWT Service"]
            B_Validation["Zod Validation"]
            B_Exceptions["Custom Exceptions"]
        end
        
        subgraph B_DB["Data Layer"]
            B_Repo["Repositories"]
            B_Drizzle["Drizzle ORM"]
            B_Postgres[("PostgreSQL")]
        end
    end

    F_Pages --> F_ApiClient
    F_User --> F_ApiClient
    F_ApiClient --> HTTP
    
    HTTP --> B_Cors
    B_Cors --> B_AuthMW
    B_AuthMW --> B_ErrorMW
    B_ErrorMW --> B_Routes
    
    B_Routes --> B_JWT
    B_Routes --> B_Validation
    B_Routes --> B_Exceptions
    B_Routes --> B_Repo
    
    B_Repo --> B_Drizzle
    B_Drizzle --> B_Postgres
```

## Единый формат API ответов

### Успешный ответ (200-299)

```typescript
interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta: {
    timestamp: string;      // ISO 8601 формат
    requestId: string;      // UUID v4
    page?: number;          // для пагинации
    limit?: number;         // для пагинации
    total?: number;         // для пагинации
  };
}
```

**Пример:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe",
    "role": "user"
  },
  "meta": {
    "timestamp": "2024-01-15T10:30:00.000Z",
    "requestId": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

### Ответ с ошибкой (400-599)

```typescript
interface ApiErrorResponse {
  success: false;
  error: {
    code: string;           // машиночитаемый код ошибки
    message: string;        // человекочитаемое сообщение
    details?: Record<string, string[]>;  // детали валидации
  };
  meta: {
    timestamp: string;
    requestId: string;
  };
}
```

**Пример валидации (400):**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": {
      "email": ["Email is required", "Invalid email format"],
      "password": ["Password must be at least 8 characters"]
    }
  },
  "meta": {
    "timestamp": "2024-01-15T10:30:00.000Z",
    "requestId": "550e8400-e29b-41d4-a716-446655440001"
  }
}
```

**Пример аутентификации (401):**
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid or expired token"
  },
  "meta": {
    "timestamp": "2024-01-15T10:30:00.000Z",
    "requestId": "550e8400-e29b-41d4-a716-446655440002"
  }
}
```

## HTTP Status Codes

| Code | Использование |
|------|---------------|
| 200 | Успешный GET, PUT, PATCH |
| 201 | Успешное создание (POST) |
| 204 | Успешное удаление (DELETE) без тела |
| 400 | Ошибка валидации (ValidationException) |
| 401 | Не авторизован (AuthenticationException) |
| 403 | Нет доступа (AuthorizationException) |
| 404 | Ресурс не найден (NotFoundException) |
| 409 | Конфликт данных (ConflictException) |
| 422 | Ошибка бизнес-логики |
| 429 | Слишком много запросов (Rate Limit) |
| 500 | Внутренняя ошибка сервера |

## Error Codes (машиночитаемые коды)

| Code | HTTP Status | Описание |
|------|-------------|----------|
| `VALIDATION_ERROR` | 400 | Ошибка валидации входных данных |
| `BAD_REQUEST` | 400 | Некорректный запрос |
| `UNAUTHORIZED` | 401 | Требуется авторизация |
| `TOKEN_EXPIRED` | 401 | Токен истек |
| `INVALID_TOKEN` | 401 | Невалидный токен |
| `FORBIDDEN` | 403 | Недостаточно прав |
| `NOT_FOUND` | 404 | Ресурс не найден |
| `USER_NOT_FOUND` | 404 | Пользователь не найден |
| `CONFLICT` | 409 | Конфликт данных (дубликат) |
| `EMAIL_EXISTS` | 409 | Email уже существует |
| `INTERNAL_ERROR` | 500 | Внутренняя ошибка сервера |

## API Endpoints

### Authentication

| Method | Endpoint | Описание | Auth Required |
|--------|----------|----------|---------------|
| POST | `/api/v1/auth/register` | Регистрация | No |
| POST | `/api/v1/auth/login` | Логин | No |
| POST | `/api/v1/auth/refresh` | Обновление токена | No |
| POST | `/api/v1/auth/logout` | Выход | Yes |
| GET | `/api/v1/auth/me` | Текущий пользователь | Yes |

### Users

| Method | Endpoint | Описание | Auth Required |
|--------|----------|----------|---------------|
| GET | `/api/v1/users` | Список пользователей | Yes |
| GET | `/api/v1/users/:id` | Пользователь по ID | Yes |
| PUT | `/api/v1/users/:id` | Обновление пользователя | Yes |
| DELETE | `/api/v1/users/:id` | Удаление пользователя | Yes |

## JWT Token Flow

```mermaid
sequenceDiagram
    participant C as Client (Frontend)
    participant API as API Server
    participant DB as PostgreSQL
    participant Redis as Redis (опционально)

    Note over C,Redis: Авторизация
    
    C->>API: POST /auth/login<br/>{email, password}
    API->>DB: SELECT user WHERE email=?
    DB-->>API: User
    API->>API: bcrypt.compare(password)
    API->>API: generateAccessToken()<br/>expires: 15min
    API->>API: generateRefreshToken()<br/>expires: 7d
    API->>DB: INSERT refresh_token
    API-->>C: 200 OK<br/>{accessToken, refreshToken, user}
    
    Note over C,Redis: Защищенный запрос
    
    C->>API: GET /users<br/>Authorization: Bearer <accessToken>
    API->>API: verifyAccessToken()
    API->>DB: SELECT users
    DB-->>API: Users
    API-->>C: 200 OK<br/>{success, data: users}
    
    Note over C,Redis: Токен истек
    
    C->>API: GET /users<br/>Authorization: Bearer <expiredToken>
    API->>API: verifyAccessToken() -> Error!
    API-->>C: 401 UNAUTHORIZED<br/>{error: {code: "TOKEN_EXPIRED"}}
    
    Note over C,Redis: Обновление токена
    
    C->>API: POST /auth/refresh<br/>{refreshToken}
    API->>DB: SELECT refresh_token WHERE token=?
    DB-->>API: Token найден
    API->>API: verifyRefreshToken()
    API->>API: generateAccessToken()
    API->>API: generateRefreshToken()
    API->>DB: DELETE old refresh_token
    API->>DB: INSERT new refresh_token
    API-->>C: 200 OK<br/>{accessToken, refreshToken}
```

## Frontend Error Handling Strategy

```mermaid
flowchart TD
    subgraph Request["API Request"]
        Req["makeRequest"]
    end

    subgraph Handling["Error Handling"]
        Catch["catch error"]
        CheckType{"Тип ошибки?"}
        
        ApiErr["ApiError"]
        NetErr["NetworkError"]
        ValErr["ValidationError"]
        AuthErr["AuthError"]
    end

    subgraph Actions["Actions"]
        ShowToast["Показать toast"]
        ShowFormErr["Показать ошибки формы"]
        RedirectLogin["Редирект на /login"]
        Retry["Повторить запрос"]
    end

    Req --> Catch
    Catch --> CheckType
    
    CheckType -->|ValidationException| ValErr
    CheckType -->|AuthenticationException| AuthErr
    CheckType -->|Network error| NetErr
    CheckType -->|Other| ApiErr
    
    ValErr --> ShowFormErr
    AuthErr --> RedirectLogin
    NetErr --> Retry
    ApiErr --> ShowToast
```

## CORS Configuration

```typescript
// next.config.ts для Server
const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGINS || '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Request-ID',
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Max-Age': '86400',
};
```

## Headers

### Request Headers

```
Content-Type: application/json
Authorization: Bearer <jwt_token>
X-Request-ID: <uuid>                    // опционально, для трассировки
Accept-Language: ru, en                // для i18n
```

### Response Headers

```
Content-Type: application/json
X-Request-ID: <uuid>                   // ID запроса из meta
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 99
```
