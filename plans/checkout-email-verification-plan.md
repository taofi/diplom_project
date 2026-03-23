# План: Верификация email и автоматическое создание аккаунта на checkout

## Обзор задачи

Реализовать на странице checkout для неавторизованного пользователя обязательную верификацию email перед оформлением заказа. После подтверждения кода автоматически создавать аккаунт с отправкой пароля на email и автоматическим входом.

---

## 1. Backend - API для верификации email при checkout

### 1.1 Создать новый контроллер `CheckoutVerificationController`

**Путь:** `server/src/auth/checkout-verification.controller.ts`

**Эндпоинты:**
- `POST /auth/checkout/send-code` - отправить код верификации на email
- `POST /auth/checkout/verify-code` - подтвердить код и создать аккаунт

### 1.2 Методы контроллера

#### 1.2.1 `sendCode` (POST /auth/checkout/send-code)

**Входящие данные:**
```typescript
{
  email: string;  // Email для верификации
  locale?: string;  // Язык пользователя (ru/en)
}
```

**Логика:**
1. Проверить валидность email
2. Проверить, не существует ли уже пользователь с таким email
3. Если существует - вернуть ошибку "Пользователь уже существует"
4. Если не существует - сгенерировать 6-значный код
5. Сохранить код в Redis с TTL 15 минут (или 5 минут для checkout)
6. Отправить email с кодом верификации
7. Вернуть успешный ответ

**Ответ:**
```typescript
{
  success: true;
  message: 'Код отправлен';
  expiresIn: 300;  // секунд
}
```

#### 1.2.2 `verifyCode` (POST /auth/checkout/verify-code)

**Входящие данные:**
```typescript
{
  email: string;       // Email для верификации
  code: string;        // 6-значный код
}
```

**Логика:**
1. Проверить валидность email и кода
2. Проверить код в Redis
3. Если код неверный или истек - вернуть ошибку
4. Если код верный:
   - Удалить код из Redis
   - Сгенерировать пароль (12 символов, буквы+цифры)
   - Создать пользователя с email и сгенерированным паролем
   - Имя пользователя = часть email до @
   - Отправить email с паролем (отдельный шаблон!)
   - Сгенерировать JWT токены
   - Вернуть токены и данные пользователя (автоматический вход)

**Ответ при успехе:**
```typescript
{
  success: true;
  user: {
    id: number;
    email: string;
    name: string;
    roles: string[];
    locale: string;
    avatar_url: string | null;
  };
  accessToken: string;
  refreshToken: string;
}
```

**Ответ при ошибке:**
```typescript
{
  success: false;
  message: 'Неверный или истекший код';
  error: 'INVALID_CODE';
}
```

---

## 2. Frontend - Обновление страницы checkout

### 2.1 Состояния компонента

Добавить новые состояния:
```typescript
const [emailVerified, setEmailVerified] = useState(false);
const [showCodeInput, setShowCodeInput] = useState(false);
const [verificationCode, setVerificationCode] = useState('');
const [isSendingCode, setIsSendingCode] = useState(false);
const [isVerifying, setIsVerifying] = useState(false);
const [resendTimer, setResendTimer] = useState(0);
const [verificationError, setVerificationError] = useState('');
```

### 2.2 UI элементы для верификации

**Блок 1 - Поле Email:**
- Поле ввода email (уже существует)
- Кнопка "Отправить код" - появляется когда email валиден
- Состояние загрузки при отправке

**Блок 2 - Ввод кода:**
- Поле для 6-значного кода (появляется после отправки кода)
- Таймер обратного отсчета для повторной отправки (60 сек)
- Кнопка "Повторить код" - активна после истечения таймера

**Блок 3 - Кнопка оформления заказа:**
- `disabled={!emailVerified}` когда email не подтвержден
- Показать статус верификации

### 2.3 API функции (front)

**Путь:** `front/src/lib/api-checkout-verification.ts`

```typescript
export const checkoutVerificationApi = {
  // Отправить код верификации
  async sendVerificationCode(email: string, locale?: string): Promise<void> {
    // POST /auth/checkout/send-code
  },

  // Подтвердить код и создать аккаунт
  async verifyAndCreateAccount(
    email: string, 
    code: string
  ): Promise<{
    user: User;
    accessToken: string;
    refreshToken: string;
  }> {
    // POST /auth/checkout/verify-code
  },
};
```

### 2.4 Обработка событий

#### Отправка кода:
1. Пользователь вводит email
2. При изменении email сбрасываем `emailVerified = false`
3. Когда email валиден - показываем кнопку "Отправить код"
4. При клике - вызов API, showCodeInput = true, startTimer(60)

#### Подтверждение кода:
1. Пользователь вводит 6-значный код
2. При клике "Подтвердить" - вызов API verifyAndCreateAccount
3. При успехе:
   - Сохранить токены
   - setEmailVerified(true)
   - Вызвать login из AuthContext с полученными данными
4. При ошибке - показать сообщение "Неверный код"

#### Таймер:
1. При sendCode запустить setInterval
2. Каждую секунду уменьшать resendTimer
3. При 0 - остановить интервал, показать кнопку "Повторить код"

---

## 3. Backend - Отправка пароля при создании аккаунта

### 3.1 Новый шаблон email "accountCreated"

**Путь:** `server/src/email/templates/locales/ru.json` и `en.json`

```json
{
  "accountCreated": {
    "subject": "Ваш аккаунт на Nadzin создан",
    "body": "..."
  }
}
```

### 3.2 Метод в EmailService

```typescript
async sendAccountCreated(
  email: string,
  name: string,
  password: string,
  locale: string = 'ru'
): Promise<void> {
  await this.sendTemplatedEmail(email, 'accountCreated', {
    name,
    email,
    password,
  }, locale);
}
```

### 3.3 Генерация пароля

Использовать существующую функцию или создать новую в auth.service.ts:

```typescript
function generatePassword(length: number = 12): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}
```

---

## 4. Backend - Отправка email с заказом и файлами

### 4.1 Обновить CheckoutController

**Путь:** `server/src/checkout/checkout.controller.ts`

Добавить вызов emailService.sendPurchaseConfirmation с вложениями после успешного checkout.

### 4.2 Метод для отправки писем с вложениями

Обновить EmailService:

```typescript
async sendEmailWithAttachments(
  to: string,
  subject: string,
  html: string,
  attachments: Array<{
    filename: string;
    path: string;  // путь к файлу на сервере
  }>
): Promise<void> {
  await this.mailerService.sendMail({
    to,
    subject,
    html,
    attachments: attachments.map(att => ({
      filename: att.filename,
      path: att.path,
    })),
  });
}
```

### 4.3 Обновить шаблон purchaseConfirmation

Добавить информацию о ссылках для скачивания или вложения файлов.

---

## 5. Переводы (i18n)

### 5.1 Добавить ключи в ru.json и en.json

```json
{
  "checkout": {
    "verification": {
      "sendCode": "Отправить код",
      "codePlaceholder": "Введите 6-значный код",
      "verify": "Подтвердить",
      "resendCode": "Повторить код",
      "resendIn": "Повторить через {seconds} сек",
      "codeSent": "Код отправлен на {email}",
      "emailVerified": "Email подтвержден",
      "invalidCode": "Неверный или истекший код",
      "userExists": "Пользователь с таким email уже существует",
      "codeExpired": "Код истек. Отправьте новый.",
      "placeOrderDisabled": "Подтвердите email для оформления заказа"
    }
  },
  "email": {
    "accountCreated": {
      "subject": "Ваш аккаунт создан",
      "body": "..."
    }
  }
}
```

---

## 6. Порядок реализации

### Этап 1: Backend (auth controller)
1. Создать CheckoutVerificationController
2. Добавить метод sendCode с генерацией и отправкой кода
3. Добавить метод verifyCode с созданием аккаунта и отправкой пароля
4. Создать шаблон email accountCreated
5. Обновить EmailService

### Этап 2: Frontend (API)
1. Создать api-checkout-verification.ts
2. Добавить типы для API ответов

### Этап 3: Frontend (страница checkout)
1. Обновить checkout/page.tsx с новыми состояниями
2. Добавить UI элементы верификации
3. Реализовать логику таймера
4. Интегрировать с AuthContext

### Этап 4: Email с заказом
1. Обновить checkout controller для отправки email
2. Добавить поддержку вложений

### Этап 5: Тестирование и полировка
1. Тестирование полного flow
2. Обработка ошибок
3. UI/UX улучшения

---

## 7. Технические детали

### Redis ключи
- `verification:{email}` - код верификации (TTL 300 сек)

### Валидация
- Email: стандартная валидация
- Code: ровно 6 цифр
- Таймер: 60 секунд между повторными отправками

### Безопасность
- Ограничение попыток ввода кода (3 попытки, затем блокировка на 15 минут)
- Rate limiting на отправку кодов

### Flow пользователя
1. Неавторизованный пользователь на checkout
2. Заполняет email → появляется кнопка "Отправить код"
3. Нажимает "Отправить код" → появляется поле для ввода кода
4. Вводит код → нажимает "Подтвердить"
5. Сервер создает аккаунт, отправляет пароль, возвращает JWT
6. Frontend сохраняет токены, логинит пользователя
7. Кнопка "Оформить заказ" становится активной
8. Пользователь оформляет заказ → получа email с заказом и файлами