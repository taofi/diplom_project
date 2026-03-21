# План исправления проблемы авторизации

## Диагностика проблемы

После анализа кода были выявлены следующие симптомы и причины:

### Симптомы
1. После перезагрузки страницы данные о пользователе удаляются
2. Ошибка `Runtime TypeError: Cannot read properties of undefined (reading 'includes')` на страницах с правами доступа
3. `auth/me` возвращает пустой список или неполные данные
4. Пользователь считается залогиненным (`isAuthenticated: true`), но данных о пользователе нет

### Корневая причина

**Главная проблема в [`jwt-auth.guard.ts`](server/src/auth/guards/jwt-auth.guard.ts:65-72):**

Guard получает данные пользователя через `getProfile()`, но **не присваивает их в `request.user`**! Он только добавляет `sub`:

```typescript
const user = await this.authService.getProfile(payload.sub);
// ...
(request.user as unknown as Record<string, unknown>).sub = user.id;
// user данные НЕ присваиваются в request.user!
```

Это приводит к тому, что:
1. При вызове `/auth/me` декоратор `@CurrentUser()` читает `request.user`
2. `request.user` содержит только `{ sub: userId }`, без данных пользователя
3. [`auth.controller.ts:63-73`](server/src/auth/auth.controller.ts:63) возвращает пустой объект или неполные данные

### Вторичная проблема

В [`AuthContext.tsx:153-155`](front/src/context/auth/AuthContext.tsx:153) проверка ролей:

```typescript
const isAdmin = state.user?.roles?.includes('admin') ?? false;
```

Хотя есть optional chaining, проблема в том, что когда `getCurrentUser()` возвращает:
- Пустой объект `{}`
- Объект без поля `roles`
- `null` (если запрос совсем не удался)

То состояние устанавливается как `isAuthenticated: true`, но `user` неполный или пустой.

---

## План исправления

### Этап 1: Исправить JwtAuthGuard (КРИТИЧНО)

**Файл:** `server/src/auth/guards/jwt-auth.guard.ts`

**Проблема:** Строки 65-72 - guard не передает user в request

**Исправление:**
```typescript
// Было:
const user = await this.authService.getProfile(payload.sub);
// ...
(request.user as unknown as Record<string, unknown>).sub = user.id;

// Стало:
const user = await this.authService.getProfile(payload.sub);
// Присваиваем полный объект пользователя в request
request.user = user;
```

### Этап 2: Проверить auth.controller.ts

**Файл:** `server/src/auth/auth.controller.ts`

Убедиться, что метод `getProfile()` правильно возвращает данные:
- Проверить, что декоратор `@CurrentUser()` получает полные данные
- Убедиться, что возвращаемый объект содержит все необходимые поля

### Этап 3: Улучшить обработку на фронтенде

**Файл:** `front/src/context/auth/AuthContext.tsx`

**Проблема:** После перезагрузки `initAuth()` может получить пустой ответ от `/auth/me`

**Действия:**
1. Добавить проверку на валидность ответа от `getCurrentUser()`
2. Если ответ пустой или не содержит обязательных полей (например, `id`), считать пользователя неавторизованным
3. Очищать токены при получении невалидных данных

**Пример исправления в `initAuth()`:**
```typescript
if (token) {
  try {
    const user = await getCurrentUser();
    // Проверяем, что получили валидные данные пользователя
    if (!user || !user.id) {
      removeTokens();
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
      return;
    }
    setState({
      user,
      isAuthenticated: true,
      isLoading: false,
    });
  } catch (error) {
    // ... существующая обработка ошибок
  }
}
```

### Этап 4: Добавить защитную проверку ролей

**Файл:** `front/src/context/auth/AuthContext.tsx`

Добавить проверку на наличие массива roles:
```typescript
const isAdmin = state.user?.roles?.includes('admin') ?? false;
// Добавить проверку:
const hasValidRoles = Array.isArray(state.user?.roles);
```

---

## Порядок выполнения

1. **Сначала исправить JwtAuthGuard** - это главная причина
2. Протестировать `/auth/me` вручную
3. Затем исправить фронтенд для более надежной обработки

---

## Вспомогательные файлы для проверки

- `server/src/auth/auth.service.ts:198-209` - метод `getProfile()`
- `server/src/db/models/user.model.ts:94-106` - метод `toJSON()` для сериализации
- `server/src/auth/decorators/current-user.decorator.ts` - декоратор для получения user
