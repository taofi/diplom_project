# План исправления скролла в чате

## Проблема

При пролистывании окна диалога (ChatWindow) и достижении конца, скролл передаётся на родительское окно страницы. Также при нажатии кнопки "скролл до конца" пролистывается весь диалог и страница. Половина чата скрывается снизу страницы.

## Требование

- Когда мышь внутри окна диалога → скроллится только окно диалога
- Когда мышь выходит за пределы окна диалога → можно скроллить страницу

## Текущая структура

```
layout.tsx (min-h-screen)
├── Header (fixed)
├── main (flex-1)
│   └── chat/page.tsx
│       └── div.h-[calc(100vh-250px)]
│           ├── ChatList (overflow-y-auto)
│           └── ChatWindow (h-full)
│               ├── Header (flex-none)
│               ├── Messages (flex-1 overflow-y-auto) ← основная проблема
│               └── Input (flex-none)
```

## Анализ проблемы

1. **page.tsx (строка 131)**: `h-[calc(100vh-250px)]` - высота зависит от viewport
2. **ChatWindow.tsx**: Уже добавлен `overscroll-contain`, но этого недостаточно
3. **scrollToBottom**: Использует `scrollIntoView()`, который может вызывать скролл всей страницы
4. **Нет отслеживания hover-состояния** для блокировки propagation скролла

## План исправления

### Шаг 1: Добавить состояние hover для чата

В `front/src/app/[lang]/chat/page.tsx`:

- Добавить state `isChatHovered` (boolean)
- Передавать `setIsChatHovered` в компоненты ChatList и ChatWindow
- Добавить обработчики `onMouseEnter` и `onMouseLeave` на контейнеры

### Шаг 2: Модифицировать ChatWindow

В `front/src/components/chat/ChatWindow.tsx`:

- Принять проп `isHovered: boolean`
- Добавить обработчик `onWheel` с `e.stopPropagation()` когда `isHovered === true`
- Исправить функцию `scrollToBottom` - использовать `scrollTop` вместо `scrollIntoView`

### Шаг 3: Модифицировать ChatList

В `front/src/components/chat/ChatList.tsx`:

- Принять проп `isHovered: boolean`
- Добавить обработчик `onWheel` с `e.stopPropagation()` когда `isHovered === true`

### Шаг 4: Проверить и протестировать

- Проверить что скролл работает только внутри чата при наведении
- Проверить что кнопка scrollToBottom работает корректно
- Проверить что страница скроллится когда мышь не на чате

## Технические детали

### Обработчик wheel с предотвращением propagation

```tsx
const handleWheel = (e: React.WheelEvent) => {
  if (isHovered) {
    e.stopPropagation();
  }
};
```

### Исправленная функция scrollToBottom

```tsx
const scrollToBottom = useCallback(() => {
  const container = messagesContainerRef.current;
  if (container) {
    container.scrollTo({
      top: container.scrollHeight,
      behavior: 'smooth'
    });
  }
}, []);
```

### Добавление hover-состояния в page.tsx

```tsx
const [isChatHovered, setIsChatHovered] = useState(false);

// На контейнере чата:
onMouseEnter={() => setIsChatHovered(true)}
onMouseLeave={() => setIsChatHovered(false)}
```

## Файлы для изменения

1. `front/src/app/[lang]/chat/page.tsx` - добавить hover-состояние
2. `front/src/components/chat/ChatWindow.tsx` - добавить обработчик wheel + исправить scrollToBottom
3. `front/src/components/chat/ChatList.tsx` - добавить обработчик wheel
