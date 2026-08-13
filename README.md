# WorkTracker Frontend

Статичний фронтенд для WorkTracker - облік робочих змін через Telegram бота.

## Деплой на Vercel

1. Підключіть цей репозиторій до Vercel
2. Вкажіть Root Directory: `frontend`
3. Framework Preset: Other
4. Deploy

### Налаштування змінних середовища

У Vercel Dashboard додайте змінну:

```
NEXT_PUBLIC_API_URL=https://your-backend.onrender.com
```

### Локальний запуск

```bash
# Встановіть live-server або будь-який HTTP сервер
npx live-server frontend
```

## Структура

```
frontend/
├── index.html          # Головна сторінка
├── stats.html          # Статистика користувача
├── admin.html          # Адмін-панель
├── css/
│   └── style.css       # Стилі
└── js/
    ├── config.js       # Конфігурація API
    ├── main.js         # Загальні скрипти
    ├── stats.js        # Скрипти статистики
    └── admin.js        # Скрипти адмін-панелі
```

## Налаштування

Перед деплоєм відредагуйте `js/config.js`:

```javascript
const API_CONFIG = {
    BASE_URL: 'https://your-backend.onrender.com',
    BOT_USERNAME: 'YourBotUsername',
    BOT_TOKEN: 'YOUR_BOT_TOKEN_HERE'
};