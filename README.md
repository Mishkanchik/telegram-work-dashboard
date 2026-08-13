# WorkTracker Frontend

Статичний фронтенд для WorkTracker - облік робочих змін через Telegram бота.

## Деплой на Vercel

1. Підключіть цей репозиторій до Vercel
2. Root Directory: `/` (корінь)
3. Framework Preset: Other
4. Deploy

### Локальний запуск

```bash
npx live-server
```

## Структура

```
├── index.html          # Головна сторінка
├── stats.html          # Статистика користувача
├── admin.html          # Адмін-панель
├── css/
│   └── style.css       # Стилі
└── js/
    ├── config.js       # Конфігурація API (BASE_URL бекенду)
    ├── main.js         # Загальні скрипти
    ├── stats.js        # Скрипти статистики
    └── admin.js        # Скрипти адмін-панелі
```

## Налаштування

`js/config.js` має вказувати на backend:

```javascript
const API_CONFIG = {
    BASE_URL: 'https://telegram-work-dashboard-back.onrender.com'
};
```

Бекенд репозиторій: https://github.com/Mishkanchik/telegram-work-dashboard-back