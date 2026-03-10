# Архитектура Backend (Next.js API)

## Общая структура проекта

```
server/
├── .env                          # Переменные окружения
├── .env.local                    # Локальные переменные
├── .env.development
├── .env.production
├── next.config.ts                # Конфигурация Next.js
├── package.json
├── tsconfig.json
├── src/
│   ├── app/
│   │   ├── api/                  # API роуты
│   │   │   ├── v1/
│   │   │   │   ├── auth/
│   │   │   │   │   ├── login/
│   │   │   │   │   │   └── route.ts
│   │   │   │   │   ├── register/
│   │   │   │   │   │   └── route.ts
│   │   │   │   │   ├── refresh/
│   │   │   │   │   │   └── route.ts
│   │   │   │   │   └── logout/
│   │   │   │   │       └── route.ts
│   │   │   │   ├── users/
│   │   │   │   │   ├── route.ts       # GET /api/v1/users
│   │   │   │   │   └── [id]/
│   │   │   │   │       └── route.ts   # GET/PUT/DELETE /api/v1/users/:id
│   │   │   │   └── ...
│   │   └── layout.tsx
│   ├── lib/
│   │   ├── auth/                 # Авторизация и JWT
│   │   │   ├── jwt.ts            # JWT helpers
│   │   │   ├── password.ts       # Хеширование паролей
│   │   │   └── middleware.ts     # Auth middleware
│   │   ├── db/                   # База данных
│   │   │   ├── index.ts          # Подключение к PostgreSQL
│   │   │   ├── schema.ts         # Схема Drizzle ORM
│   │   │   ├── migrations/       # Миграции
│   │   │   └── repositories/     # Репозитории
│   │   │       ├── user.repository.ts
│   │   │       └── index.ts
│   │   ├── exceptions/           # Кастомные исключения
│   │   │   ├── BaseException.ts
│   │   │   ├── ValidationException.ts
│   │   │   ├── AuthenticationException.ts
│   │   │   ├── AuthorizationException.ts
│   │   │   ├── NotFoundException.ts
│   │   │   └── index.ts
│   │   ├── response/             # Форматирование ответов
│   │   │   ├── ApiResponse.ts
│   │   │   └── errorHandler.ts
│   │   ├── validation/           # Валидация
│   │   │   ├── schemas/          # Zod схемы
│   │   │   │   ├── auth.schema.ts
│   │   │   │   └── user.schema.ts
│   │   │   └── validate.ts
│   │   └── utils/
│   │       └── helpers.ts
│   ├── types/
│   │   ├── api.ts                # API типы
│   │   ├── user.ts               # Типы пользователя
│   │   └── index.ts
│   └── config/
│       └── index.ts              # Конфигурация приложения
└── docker-compose.yml            # PostgreSQL в Docker
```

## Диаграмма архитектуры

```mermaid
flowchart TB
    subgraph Client["Frontend Client"]
        Req["HTTP Request<br/>Authorization: Bearer JWT"]
    end

    subgraph ServerApp["Next.js Server"]
        subgraph ApiRoutes["API Routes<br/>app/api/v1/"]
            AuthRoutes["/auth/*<br/>- login<br/>- register<br/>- refresh<br/>- logout"]
            UserRoutes["/users/*<br/>- CRUD операции"]
            OtherRoutes["/other/*"]
        end

        subgraph MiddlewareLayer["Middleware Layer"]
            Cors["CORS Middleware"]
            AuthMW["Auth Middleware<br/>- проверка JWT<br/>- извлечение user"]
            ErrorMW["Error Middleware<br/>- перехват исключений"]
        end

        subgraph ControllerLayer["Controller Layer"]
            AuthCtrl["Auth Controllers<br/>обработка запросов"]
            UserCtrl["User Controllers"]
        end

        subgraph ServiceLayer["Service Layer"]
            AuthSvc["Auth Service<br/>- логика авторизации<br/>- генерация JWT"]
            UserSvc["User Service<br/>- бизнес-логика"]
        end

        subgraph RepositoryLayer["Repository Layer"]
            UserRepo["User Repository<br/>- SQL запросы<br/>- CRUD операции"]
        end

        subgraph DatabaseLayer["Database Layer"]
            DB[("PostgreSQL<br/>users, sessions...")]
            Drizzle["Drizzle ORM"]
        end

        subgraph ExceptionLayer["Exception Layer"]
            BaseExc["BaseException"]
            AuthExc["AuthenticationException"]
            ValidExc["ValidationException"]
            NotFoundExc["NotFoundException"]
        end

        subgraph ResponseLayer["Response Layer"]
            ApiResp["ApiResponse<br/>- success<br/>- data/error<br/>- meta"]
            ErrHandler["Error Handler<br/>- форматирование ошибок"]
        end
    end

    Req --> Cors
    Cors --> AuthMW
    AuthMW --> ErrorMW
    
    ErrorMW --> AuthRoutes
    ErrorMW --> UserRoutes
    
    AuthRoutes --> AuthCtrl
    UserRoutes --> UserCtrl
    
    AuthCtrl --> AuthSvc
    UserCtrl --> UserSvc
    
    AuthSvc --> UserRepo
    UserSvc --> UserRepo
    
    AuthSvc -.-> BaseExc
    UserSvc -.-> ValidExc
    UserRepo -.-> NotFoundExc
    
    UserRepo --> Drizzle
    Drizzle --> DB
    
    AuthExc --> ErrHandler
    ValidExc --> ErrHandler
    NotFoundExc --> ErrHandler
    
    ErrHandler --> ApiResp
    AuthCtrl --> ApiResp
    UserCtrl --> ApiResp
    
    ApiResp --> Client
```

## Компоненты архитектуры

### 1. Environment Configuration (.env)

```env
# Server
PORT=3001
NODE_ENV=development

# Database (PostgreSQL)
DATABASE_URL=postgresql://user:password@localhost:5432/myapp
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=myapp
DATABASE_USER=user
DATABASE_PASSWORD=password

# JWT
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
JWT_ISSUER=myapp
JWT_AUDIENCE=myapp-client

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 2. JWT Authentication Flow

```mermaid
sequenceDiagram
    participant C as Client
    participant S as Server
    participant DB as PostgreSQL

    Note over C,DB: Регистрация
    C->>S: POST /api/v1/auth/register<br/>{email, password, name}
    S->>S: Валидация данных
    S->>S: Хеширование пароля (bcrypt)
    S->>DB: INSERT INTO users
    DB-->>S: User создан
    S-->>C: 201 Created<br/>{success: true, data: user}

    Note over C,DB: Логин
    C->>S: POST /api/v1/auth/login<br/>{email, password}
    S->>DB: SELECT * FROM users WHERE email=?
    DB-->>S: User найден
    S->>S: Проверка пароля (bcrypt.compare)
    S->>S: Генерация Access Token (JWT, 15min)
    S->>S: Генерация Refresh Token (JWT, 7d)
    S->>DB: Сохранение Refresh Token
    S-->>C: 200 OK<br/>{accessToken, refreshToken, user}

    Note over C,DB: Защищенный запрос
    C->>S: GET /api/v1/users<br/>Authorization: Bearer <accessToken>
    S->>S: Проверка JWT (verify)
    S->>DB: SELECT * FROM users
    DB-->>S: Users список
    S-->>C: 200 OK<br/>{success: true, data: users}

    Note over C,DB: Обновление токена
    C->>S: POST /api/v1/auth/refresh<br/>{refreshToken}
    S->>S: Проверка Refresh Token
    S->>DB: SELECT * FROM refresh_tokens
    DB-->>S: Token найден и валиден
    S->>S: Генерация новых токенов
    S-->>C: 200 OK<br/>{accessToken, refreshToken}
```

### 3. Database Layer (PostgreSQL + Drizzle)

**Schema (Drizzle ORM):**
```typescript
// users table
const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  role: varchar('role', { length: 50 }).default('user'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// refresh_tokens table
const refreshTokens = pgTable('refresh_tokens', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});
```

### 4. Custom Exceptions (Кастомные исключения)

**BaseException** - базовый класс для всех исключений:
```typescript
class BaseException extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number,
    public details?: Record<string, string[]>
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}
```

**Специфические исключения:**
- `ValidationException` (400) - ошибки валидации
- `AuthenticationException` (401) - не авторизован
- `AuthorizationException` (403) - нет доступа
- `NotFoundException` (404) - ресурс не найден
- `ConflictException` (409) - конфликт данных
- `InternalServerException` (500) - внутренняя ошибка

### 5. Unified Response Format (Единый формат ответов)

**Успешный ответ:**
```typescript
{
  success: true,
  data: {
    id: 1,
    email: "user@example.com",
    name: "John Doe"
  },
  meta: {
    timestamp: "2024-01-01T12:00:00Z",
    requestId: "uuid-v4"
  }
}
```

**Ошибка:**
```typescript
{
  success: false,
  error: {
    code: "VALIDATION_ERROR",
    message: "Validation failed",
    details: {
      email: ["Email is required"],
      password: ["Password must be at least 8 characters"]
    }
  },
  meta: {
    timestamp: "2024-01-01T12:00:00Z",
    requestId: "uuid-v4"
  }
}
```

### 6. API Response Class

```typescript
class ApiResponse {
  static success<T>(data: T, meta?: object) {
    return {
      success: true,
      data,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: generateRequestId(),
        ...meta
      }
    };
  }

  static error(error: BaseException) {
    return {
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: generateRequestId()
      }
    };
  }
}
```

### 7. Error Handler Middleware

```typescript
export function errorHandler(error: Error) {
  if (error instanceof BaseException) {
    return NextResponse.json(
      ApiResponse.error(error),
      { status: error.statusCode }
    );
  }

  // Неизвестная ошибка
  const internalError = new InternalServerException(
    'Internal server error'
  );
  
  return NextResponse.json(
    ApiResponse.error(internalError),
    { status: 500 }
  );
}
```

### 8. Folder Structure Pattern

**Feature-Based Organization:**
```
app/api/v1/
├── auth/
│   ├── _services/
│   │   └── auth.service.ts
│   ├── _validators/
│   │   └── auth.validator.ts
│   ├── login/route.ts
│   ├── register/route.ts
│   └── refresh/route.ts
└── users/
    ├── _services/
    │   └── user.service.ts
    ├── _validators/
    │   └── user.validator.ts
    ├── route.ts          # GET /api/v1/users
    └── [id]/
        └── route.ts      # GET/PUT/DELETE /api/v1/users/:id
```

## Зависимости (package.json)

```json
{
  "dependencies": {
    "next": "^15.x",
    "react": "^19.x",
    "drizzle-orm": "^0.x",
    "postgres": "^3.x",
    "bcrypt": "^5.x",
    "jsonwebtoken": "^9.x",
    "zod": "^3.x",
    "uuid": "^9.x"
  },
  "devDependencies": {
    "drizzle-kit": "^0.x",
    "@types/bcrypt": "^5.x",
    "@types/jsonwebtoken": "^9.x",
    "@types/uuid": "^9.x"
  }
}
```
