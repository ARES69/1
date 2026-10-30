# 🔐 Аутентификация — Полная реализация

## ✅ Что было добавлено

### Серверная аутентификация с Supabase

**Проблема:** Раньше использовалась только клиентская авторизация через localStorage, что небезопасно для production.

**Решение:** Полноценная серверная аутентификация с Supabase Auth.

---

## 🎯 Реализованные функции

### 1. **Email/Password аутентификация**
- ✅ Регистрация с валидацией
- ✅ Вход с проверкой credentials
- ✅ Хеширование паролей (bcrypt на сервере)
- ✅ Email верификация
- ✅ Сброс пароля через email
- ✅ Обновление пароля

### 2. **OAuth провайдеры**
- ✅ Google OAuth
- ✅ GitHub OAuth
- ✅ Автоматический callback handling
- ✅ Создание профиля при первом входе

### 3. **Управление сессиями**
- ✅ JWT токены
- ✅ Автоматическое обновление токенов
- ✅ Persist session в localStorage
- ✅ Автоматический logout при истечении
- ✅ Auth state listener

### 4. **Безопасность**
- ✅ Row Level Security (RLS)
- ✅ Защита данных на уровне БД
- ✅ Rate limiting (настраивается в Supabase)
- ✅ CORS защита
- ✅ HTTPS обязательный

### 5. **Профили пользователей**
- ✅ Автоматическое создание профиля при регистрации
- ✅ Хранение credits
- ✅ Аватар (из OAuth)
- ✅ Обновление профиля

---

## 📁 Новые файлы

### Модули
- `src/lib/supabase-auth.ts` — Supabase Auth клиент и функции

### Страницы
- `src/pages/Auth.tsx` — Обновленная страница входа/регистрации
- `src/pages/AuthCallback.tsx` — Обработка OAuth callback
- `src/pages/ForgotPassword.tsx` — Запрос сброса пароля
- `src/pages/ResetPassword.tsx` — Установка нового пароля

### База данных
- `supabase/schema.sql` — SQL схема для Supabase

### Конфигурация
- `.env.example` — Пример переменных окружения

### Документация
- `AUTH_SETUP.md` — Подробная инструкция по настройке

---

## 🗄️ Структура базы данных

### Таблица `profiles`
```sql
- id (UUID, FK to auth.users)
- email (TEXT, UNIQUE)
- name (TEXT)
- avatar_url (TEXT)
- credits (INTEGER, DEFAULT 50)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### Таблица `projects`
```sql
- id (UUID)
- user_id (UUID, FK to profiles)
- name (TEXT)
- description (TEXT)
- files (JSONB)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### Таблица `api_usage`
```sql
- id (UUID)
- user_id (UUID, FK to profiles)
- project_id (UUID, FK to projects)
- model (TEXT)
- prompt_tokens (INTEGER)
- completion_tokens (INTEGER)
- total_tokens (INTEGER)
- cost_usd (DECIMAL)
- created_at (TIMESTAMP)
```

### Дополнительные таблицы
- `analytics` — аналитика событий
- `security_events` — события безопасности
- `workflows` — пользовательские workflow
- `plugins` — установленные плагины

---

## 🔧 Использование

### Регистрация

```typescript
import { signUp } from './lib/supabase-auth';

const result = await signUp('user@example.com', 'password123', 'John Doe');

if (result.success) {
  // Пользователь создан, перенаправить на страницу входа
  navigate('/login');
} else {
  // Показать ошибку
  setError(result.error);
}
```

### Вход

```typescript
import { signIn } from './lib/supabase-auth';

const result = await signIn('user@example.com', 'password123');

if (result.success) {
  // Сохранить сессию и перенаправить
  navigate('/workspace');
} else {
  setError(result.error);
}
```

### OAuth вход

```typescript
import { signInWithOAuth } from './lib/supabase-auth';

// Google
await signInWithOAuth('google');

// GitHub
await signInWithOAuth('github');
```

### Получение текущего пользователя

```typescript
import { getCurrentUser } from './lib/supabase-auth';

const user = await getCurrentUser();

if (user) {
  console.log('User:', user.email, user.name, user.credits);
} else {
  // Пользователь не авторизован
  navigate('/login');
}
```

### Выход

```typescript
import { signOut } from './lib/supabase-auth';

await signOut();
navigate('/login');
```

### Сброс пароля

```typescript
import { resetPassword } from './lib/supabase-auth';

const result = await resetPassword('user@example.com');

if (result.success) {
  // Показать сообщение об отправке email
} else {
  setError(result.error);
}
```

### Обновление пароля

```typescript
import { updatePassword } from './lib/supabase-auth';

const result = await updatePassword('newPassword123');

if (result.success) {
  // Пароль обновлен
} else {
  setError(result.error);
}
```

---

## 🎨 UI компоненты

### Страница Auth (`/login`, `/signup`)

**Возможности:**
- Переключение между входом и регистрацией
- OAuth кнопки (Google, GitHub)
- Валидация формы
- Показ/скрытие пароля
- Обработка ошибок
- Loading состояния

### Страница ForgotPassword (`/forgot-password`)

**Возможности:**
- Ввод email
- Валидация email
- Отправка reset email
- Успешное сообщение
- Возврат к login

### Страница ResetPassword (`/auth/reset-password`)

**Возможности:**
- Проверка validity reset token
- Ввод нового пароля
- Подтверждение пароля
- Валидация совпадения
- Обновление пароля
- Редирект на login

### Страница AuthCallback (`/auth/callback`)

**Возможности:**
- Обработка OAuth callback
- Проверка сессии
- Обработка ошибок
- Редирект на workspace

---

## 🔒 Безопасность

### Что реализовано

1. **Хеширование паролей**
   - bcrypt на стороне Supabase
   - Минимум 6 символов
   - Невозможно восстановить оригинальный пароль

2. **JWT токены**
   - Access token (короткоживущий)
   - Refresh token (долгоживущий)
   - Автоматическое обновление

3. **Row Level Security (RLS)**
   - Пользователи видят только свои данные
   - Защита на уровне базы данных
   - Невозможно обойти через API

4. **Email верификация**
   - Подтверждение email при регистрации
   - Защита от fake email
   - Возможность отключить в настройках

5. **Rate limiting**
   - Защита от брутфорса
   - Настраивается в Supabase Dashboard
   - Блокировка после N попыток

6. **CORS**
   - Разрешены только ваши домены
   - Защита от CSRF
   - Настройка в Supabase

---

## 📊 Мониторинг

### Просмотр пользователей

В Supabase Dashboard → **Authentication → Users**:
- Список всех пользователей
- Email и имя
- Дата регистрации
- Последний вход
- Статус верификации

### Логи аутентификации

В Supabase Dashboard → **Logs**:
- Успешные входы
- Неудачные попытки
- OAuth входы
- Сбросы пароля

### Использование API

```sql
-- Посмотреть использование API пользователем
SELECT 
  model,
  COUNT(*) as requests,
  SUM(total_tokens) as tokens,
  SUM(cost_usd) as cost
FROM api_usage
WHERE user_id = 'user-uuid'
  AND created_at > NOW() - INTERVAL '30 days'
GROUP BY model;
```

---

## 🚀 Production checklist

### Перед деплоем

- [ ] Supabase проект создан
- [ ] SQL схема выполнена
- [ ] OAuth провайдеры настроены
- [ ] Email шаблоны настроены
- [ ] Redirect URLs добавлены
- [ ] CORS настроен
- [ ] Email верификация включена
- [ ] Rate limiting настроен
- [ ] Production URL добавлен
- [ ] Тестирование пройдено

### После деплоя

- [ ] Проверить регистрацию
- [ ] Проверить вход
- [ ] Проверить OAuth
- [ ] Проверить сброс пароля
- [ ] Проверить обновление профиля
- [ ] Проверить RLS политики
- [ ] Настроить мониторинг
- [ ] Настроить алерты

---

## 🐛 Решение проблем

### Проблема: "Invalid API key"

**Решение:**
```bash
# Проверьте .env файл
cat .env

# Убедитесь, что нет лишних пробелов
# Перезапустите dev сервер
npm run dev
```

### Проблема: "User not found"

**Решение:**
1. Проверьте таблицу `auth.users` в Supabase
2. Убедитесь, что email подтвержден
3. Проверьте логи в Supabase Dashboard

### Проблема: OAuth не работает

**Решение:**
1. Проверьте настройки OAuth в Supabase
2. Убедитесь, что redirect URL правильный
3. Проверьте, что провайдер включен
4. Проверьте Client ID и Secret

### Проблема: "Invalid credentials"

**Решение:**
1. Проверьте правильность email и пароля
2. Убедитесь, что пароль не менее 6 символов
3. Проверьте, что аккаунт не заблокирован
4. Попробуйте сбросить пароль

---

## 📚 Дополнительные ресурсы

- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [OAuth Providers](https://supabase.com/docs/guides/auth/social-login)
- [Email Templates](https://supabase.com/docs/guides/auth/auth-email-templates)

---

## ✅ Итого

**Было:**
- ❌ Клиентская авторизация через localStorage
- ❌ Небезопасное хранение паролей
- ❌ Нет серверной валидации
- ❌ Нет защиты от брутфорса
- ❌ Нет JWT токенов
- ❌ Нет OAuth

**Стало:**
- ✅ Серверная аутентификация с Supabase
- ✅ Безопасное хеширование паролей
- ✅ JWT токены с автоматическим обновлением
- ✅ OAuth (Google, GitHub)
- ✅ Email верификация
- ✅ Сброс пароля
- ✅ Row Level Security
- ✅ Rate limiting
- ✅ Полная документация

**Результат:** Production-ready аутентификация! 🎉
