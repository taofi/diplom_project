# План создания админ-панели для управления категориями, типами лицензий и пользователями

## Анализ текущей структуры проекта

### Что УЖЕ ЕСТЬ:

#### Backend:
1. **Category API** (полностью реализовано)
   - `GET /categories` - все категории с пагинацией
   - `GET /categories/:id` - категория по ID
   - `GET /categories/:id/count` - количество товаров в категории
   - `POST /categories` - создать категорию (требует admin)
   - `PATCH /categories/:id` - обновить категорию (требует admin)
   - `DELETE /categories/:id` - удалить категорию (требует admin)
   - Поддержка локализации через query param `?language=ru|en`

2. **LicenseType API** (полностью реализовано)
   - `GET /license-types` - все типы лицензий
   - `GET /license-types/:id` - тип лицензии по ID
   - `GET /license-types/:id/count` - количество товаров с типом лицензии
   - `POST /license-types` - создать тип лицензии (требует admin)
   - `PATCH /license-types/:id` - обновить тип лицензии (требует admin)
   - `DELETE /license-types/:id` - удалить тип лицензии (требует admin)
   - Поддержка локализации

3. **User модель**
   - Поля: id, email, name, password_hash, avatar_url, role (массив: admin|author|user), locale
   - Метод toJSON для корректной сериализации role

4. **AdminGuard** - проверка роли admin

#### Frontend:
1. **API клиенты**
   - [`front/src/lib/api-category.ts`](front/src/lib/api-category.ts) - категории
   - [`front/src/lib/api-license-type.ts`](front/src/lib/api-license-type.ts) - типы лицензий

2. **Страницы**
   - [`front/src/app/[lang]/admin/products/page.tsx`](front/src/app/[lang]/admin/products/page.tsx) - управление товарами

3. **Типы**
   - [`front/src/types/category/category.types.ts`](front/src/types/category/category.types.ts)
   - [`front/src/types/license-type/license-type.types.ts`](front/src/types/license-type/license-type.types.ts)
   - [`front/src/types/auth/index.ts`](front/src/types/auth/index.ts) - UserRole enum

---

## ЧТО НУЖНО СОЗДАТЬ

### Этап 1: Backend - User API для админа

#### 1.1 Создать UserController с admin endpoints
Файл: [`server/src/user/user.controller.ts`](server/src/user/user.controller.ts)

```
GET /users - получить всех пользователей (с пагинацией и поиском)
  Query params:
    - page: number (по умолчанию 1)
    - limit: number (по умолчанию 20)
    - search: string (поиск по name или email)
  Response: { data: User[], meta: { total, page, limit, totalPages } }

GET /users/:id - получить пользователя по ID

PATCH /users/:id/roles - обновить роли пользователя
  Body: { roles: ('admin'|'author'|'user')[] }

PATCH /users/:id/locale - обновить язык пользователя
  Body: { locale: string }
```

Guard: JwtAuthGuard + AdminGuard

#### 1.2 Обновить UserService
Файл: [`server/src/user/user.service.ts`](server/src/user/user.service.ts)

Добавить методы:
- `findAll(params)` - получить всех пользователей с пагинацией и поиском
- `updateRoles(id, roles)` - обновить роли пользователя
- `updateLocale(id, locale)` - обновить язык пользователя

---

### Этап 2: Frontend - API клиент для пользователей

#### 2.1 Создать API клиент
Файл: [`front/src/lib/api-user.ts`](front/src/lib/api-user.ts)

```typescript
// Типы
interface UserResponse {
  id: number;
  email: string;
  name: string;
  roles: ('admin' | 'author' | 'user')[];
  locale: string;
  avatar_url: string | null;
  created_at: string;
}

interface UsersResponse {
  data: UserResponse[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

interface UpdateUserRolesDto {
  roles: ('admin' | 'author' | 'user')[];
}

// Функции
getUsers(params: { page?: number; limit?: number; search?: string }): Promise<UsersResponse>
getUserById(id: number): Promise<UserResponse>
updateUserRoles(id: number, roles: ('admin'|'author'|'user')[]): Promise<UserResponse>
updateUserLocale(id: number, locale: string): Promise<UserResponse>
```

---

### Этап 3: Frontend - Страница админ-панели

#### 3.1 Создать главную страницу админ-панели
Файл: [`front/src/app/[lang]/admin/page.tsx`](front/src/app/[lang]/admin/page.tsx)

Структура:
- Использовать существующие Tab компоненты или создать простые табы
- Две вкладки:
  1. "Категории и лицензии" - управление категориями и типами лицензий
  2. "Пользователи" - управление пользователями

#### 3.2 Вкладка "Категории и лицензии"
Файл: [`front/src/components/admin/CategoriesLicensesTab.tsx`](front/src/components/admin/CategoriesLicensesTab.tsx)

Использовать существующий UI:
- Tabs из UI компонентов
- Card, Button, Input, Modal

##### Подвкладка "Категории":
- Таблица/список категорий с колонками:
  - ID
  - Название (локаль)
  - Количество иллюстраций (получается через `/categories/:id/count`)
  - Действия (редактировать, удалить)
- Кнопка "Добавить категорию"
- При удалении категории - подтверждение и удаление связи у всех товаров (уже реализовано на бэкенде)

##### Подвкладка "Типы лицензий":
- Таблица/список типов лицензий с колонками:
  - ID
  - Slug
  - Название (локаль)
  - Количество товаров
  - Действия (редактировать, удалить)
- Кнопка "Добавить тип лицензии"

##### Модальное окно добавления/редактирования:
- Выбор языка (ru/en) для локализации
- Поле "Название"
- Для категорий: дополнительные поля (slug, icon, color)
- Для лицензий: поле "Slug" и "Описание"

#### 3.3 Вкладка "Пользователи"
Файл: [`front/src/components/admin/UsersTab.tsx`](front/src/components/admin/UsersTab.tsx)

Компоненты:
- Поиск по имени и email (input с debounce)
- Таблица пользователей с колонками:
  - ID
  - Имя
  - Email
  - Роли (отображать как badge/tags)
  - Язык (отображать флаг или код: RU, EN)
  - Дата создания
  - Действия (изменить роль)
- Пагинация

##### Модальное окно изменения ролей:
- Список чекбоксов для ролей: admin, author, user
- Возможность выбрать одну или несколько ролей

---

### Этап 4: Локализация

#### 4.1 Обновить файлы переводов

[`front/src/locales/ru.json`](front/src/locales/ru.json):
```json
{
  "admin": {
    "title": "Панель администратора",
    "tabs": {
      "categoriesLicenses": "Категории и лицензии",
      "users": "Пользователи"
    },
    "categories": {
      "title": "Категории",
      "add": "Добавить категорию",
      "edit": "Редактировать категорию",
      "name": "Название",
      "slug": "Slug",
      "icon": "Иконка",
      "color": "Цвет",
      "productsCount": "Кол-во товаров",
      "deleteConfirm": "Вы уверены, что хотите удалить категорию? Она будет удалена у всех товаров.",
      "noCategories": "Категории не найдены"
    },
    "licenseTypes": {
      "title": "Типы лицензий",
      "add": "Добавить тип лицензии",
      "edit": "Редактировать тип лицензии",
      "name": "Название",
      "slug": "Slug",
      "description": "Описание",
      "productsCount": "Кол-во товаров",
      "deleteConfirm": "Вы уверены, что хотите удалить тип лицензии?",
      "noLicenseTypes": "Типы лицензий не найдены",
      "cannotDelete": "Нельзя удалить тип лицензии, который используется товарами"
    },
    "users": {
      "title": "Пользователи",
      "searchPlaceholder": "Поиск по имени или email...",
      "name": "Имя",
      "email": "Email",
      "roles": "Роли",
      "locale": "Язык",
      "createdAt": "Создан",
      "changeRoles": "Изменить роли",
      "noUsers": "Пользователи не найдены",
      "roles": {
        "admin": "Администратор",
        "author": "Автор",
        "user": "Пользователь"
      }
    },
    "common": {
      "save": "Сохранить",
      "cancel": "Отмена",
      "delete": "Удалить",
      "edit": "Редактировать",
      "language": "Язык",
      "actions": "Действия"
    }
  }
}
```

[`front/src/locales/en.json`](front/src/locales/en.json) - аналогично на английском

---

### Этап 5: Защита маршрутов

#### 5.1 Проверка роли admin на странице
- [`front/src/app/[lang]/admin/page.tsx`](front/src/app/[lang]/admin/page.tsx) - только для admin
- Использовать существующий ProtectedRoute или проверку в useEffect

---

## Чеклист реализации

### Backend:
- [ ] Создать UserService методы (findAll, updateRoles, updateLocale)
- [ ] Создать UserController endpoints
- [ ] Зарегистрировать новые endpoints в модуле

### Frontend:
- [ ] Создать [`front/src/lib/api-user.ts`](front/src/lib/api-user.ts)
- [ ] Создать [`front/src/app/[lang]/admin/page.tsx`](front/src/app/[lang]/admin/page.tsx) с tabs
- [ ] Создать [`front/src/components/admin/CategoriesLicensesTab.tsx`](front/src/components/admin/CategoriesLicensesTab.tsx)
- [ ] Создать [`front/src/components/admin/UsersTab.tsx`](front/src/components/admin/UsersTab.tsx)
- [ ] Обновить переводы в [`front/src/locales/ru.json`](front/src/locales/ru.json) и [`front/src/locales/en.json`](front/src/locales/en.json)
- [ ] Добавить защиту маршрутов для admin

---

## Технические детали

### Server - UserService.findAll SQL:
```sql
SELECT * FROM users
WHERE 
  (:search IS NULL OR name LIKE %:search% OR email LIKE %:search%)
ORDER BY created_at DESC
LIMIT :limit OFFSET :offset
```

### Frontend - Поиск с debounce:
```typescript
const [searchQuery, setSearchQuery] = useState('');
const [debouncedSearch, setDebouncedSearch] = useState('');

useEffect(() => {
  const timer = setTimeout(() => {
    setDebouncedSearch(searchQuery);
  }, 300);
  return () => clearTimeout(timer);
}, [searchQuery]);

useEffect(() => {
  if (debouncedSearch) {
    fetchUsers({ search: debouncedSearch });
  }
}, [debouncedSearch]);
```

### UI - Роли пользователя:
- Использовать Badge/Tag компоненты для отображения ролей
- Different colors: admin (red), author (blue), user (gray)

### UI - Язык пользователя:
- Отображать как флаги: 🇷🇺 RU, 🇬🇧 EN
- Использовать существующий LanguageSwitcher для выбора
