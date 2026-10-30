# 🔐 Настройка аутентификации Supabase

## 📋 Что реализовано

✅ **Полная серверная аутентификация:**
- Email/Password регистрация и вход
- OAuth провайдеры (Google, GitHub)
- JWT токены с автоматическим обновлением
- Сброс и обновление пароля
- Управление сессиями
- Защита данных с Row Level Security (RLS)

---

## 🚀 Быстрый старт

### Шаг 1: Создайте проект Supabase

1. Перейдите на [supabase.com](https://supabase.com)
2. Нажмите **"Start your project"**
3. Создайте новый проект:
   - **Name:** `RS-BUILDER`
   - **Database Password:** (сохраните в безопасном месте)
   - **Region:** Выберите ближайший регион
4. Дождитесь создания проекта (~2 минуты)

### Шаг 2: Получите API ключи

1. В панели Supabase перейдите в **Settings → API**
2. Скопируйте:
   - **Project URL** (например: `https://abc123.supabase.co`)
   - **anon public key** (начинается с `eyJ...`)

### Шаг 3: Настройте переменные окружения

Создайте файл `.env` в корне проекта:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

⚠️ **ВАЖНО:** Никогда не коммитьте `.env` файл в Git!

### Шаг 4: Выполните SQL схему

1. В панели Supabase перейдите в **SQL Editor**
2. Нажмите **"New query"**
3. Скопируйте содержимое файла `supabase/schema.sql`
4. Вставьте в редактор и нажмите **"Run"**

### Шаг 5: Настройте OAuth провайдеры (опционально)

#### Google OAuth

1. Перейдите в [Google Cloud Console](https://console.cloud.google.com/)
2. Создайте новый проект или выберите существующий
3. Перейдите в **APIs & Services → Credentials**
4. Нажмите **"Create Credentials" → "OAuth client ID"**
5. Выберите **"Web application"**
6. Добавьте:
   - **Authorized JavaScript origins:** `http://localhost:5173` и ваш production URL
   - **Authorized redirect URIs:** `https://your-project.supabase.co/auth/v1/callback`
7. Скопируйте **Client ID** и **Client Secret**
8. В Supabase перейдите в **Authentication → Providers → Google**
9. Вставьте Client ID и Client Secret
10. Включите провайдер

#### GitHub OAuth

1. Перейдите в [GitHub Developer Settings](https://github.com/settings/developers)
2. Нажмите **"New OAuth App"**
3. Заполните:
   - **Application name:** `RS-BUILDER`
   - **Homepage URL:** `http://localhost:5173`
   - **Authorization callback URL:** `https://your-project.supabase.co/auth/v1/callback`
4. Скопируйте **Client ID** и создайте **Client Secret**
5. В Supabase перейдите в **Authentication → Providers → GitHub**
6. Вставьте Client ID и Client Secret
7. Включите провайдер

### Шаг 6: Настройте Email шаблоны

1. В Supabase перейдите в **Authentication → Email Templates**
2. Настройте шаблоны:
   - **Confirm signup** — подтверждение регистрации
   - **Reset password** — сброс пароля
   - **Magic link** — магическая ссылка (опционально)

### Шаг 7: Настройте URL для редиректа

1. В Supabase перейдите в **Authentication → URL Configuration**
2. Установите:
   - **Site URL:** `http://localhost:5173` (или ваш production URL)
   - **Redirect URLs:** 
     - `http://localhost:5173/auth/callback`
     - `http://localhost:5173/auth/reset-password`

### Шаг 8: Запустите проект

```bash
# Установите зависимости
npm install

# Запустите dev сервер
npm run dev

# Откройте http://localhost:5173
```

---

## 📊 Структура базы данных

### Таблицы

| Таблица | Описание |
|---------|----------|
| `profiles` | Профили пользователей (расширение auth.users) |
| `projects` | Проекты пользователей |
| `api_usage` | История использования API |
| `analytics` | Аналитика событий |
| `security_events` | События безопасности |
| `workflows` | Пользовательские workflow |
| `plugins` | Установленные плагины |

### Row Level Security (RLS)

Все таблицы защищены RLS политиками:
- Пользователи могут видеть только свои данные
- Пользователи могут создавать только свои записи
- Пользователи могут обновлять только свои записи
- Пользователи могут удалять только свои записи

---

## 🔧 Использование в коде

### Регистрация

```typescript
import { signUp } from './lib/supabase-auth';

const result = await signUp('user@example.com', 'password123', 'John Doe');

if (result.success) {
  console.log('User created:', result.user);
} else {
  console.error('Error:', result.error);
}
```

### Вход

```typescript
import { signIn } from './lib/supabase-auth';

const result = await signIn('user@example.com', 'password123');

if (result.success) {
  console.log('Session:', result.session);
  // Сохраните сессию и перенаправьте пользователя
} else {
  console.error('Error:', result.error);
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
  console.log('Current user:', user);
} else {
  console.log('Not authenticated');
}
```

### Выход

```typescript
import { signOut } from './lib/supabase-auth';

await signOut();
// Перенаправьте на страницу входа
```

### Сброс пароля

```typescript
import { resetPassword } from './lib/supabase-auth';

const result = await resetPassword('user@example.com');

if (result.success) {
  console.log('Reset email sent');
} else {
  console.error('Error:', result.error);
}
```

---

## 🔒 Безопасность

### Что уже реализовано

✅ **Хеширование паролей** — bcrypt на стороне сервера  
✅ **JWT токены** — с автоматическим обновлением  
✅ **Row Level Security** — защита данных на уровне БД  
✅ **Email верификация** — подтверждение email при регистрации  
✅ **Rate limiting** — защита от брутфорса (настраивается в Supabase)  
✅ **CORS** — настроен для вашего домена  
✅ **HTTPS** — обязательный для production  

### Дополнительные рекомендации

1. **Включите 2FA** (двухфакторную аутентификацию)
2. **Настройте сильные пароли** (минимум 8 символов, спецсимволы)
3. **Ограничьте частоту запросов** в Supabase Dashboard
4. **Мониторьте логи безопасности** регулярно
5. **Обновляйте зависимости** регулярно

---

## 📈 Мониторинг

### Логи аутентификации

В Supabase перейдите в **Authentication → Users** для просмотра:
- Список пользователей
- Дата регистрации
- Последний вход
- Статус верификации

### Использование API

```sql
-- Посмотреть использование API за последний день
SELECT 
  model,
  COUNT(*) as requests,
  SUM(total_tokens) as tokens,
  SUM(cost_usd) as cost
FROM api_usage
WHERE created_at > NOW() - INTERVAL '1 day'
GROUP BY model;
```

### Активные пользователи

```sql
-- Посмотреть активных пользователей за последний месяц
SELECT 
  p.email,
  p.name,
  COUNT(DISTINCT au.id) as api_calls,
  SUM(au.cost_usd) as total_spent
FROM profiles p
JOIN api_usage au ON p.id = au.user_id
WHERE au.created_at > NOW() - INTERVAL '30 days'
GROUP BY p.id
ORDER BY total_spent DESC;
```

---

## 🐛 Решение проблем

### Проблема: "Invalid API key"

**Решение:**
- Проверьте, что `VITE_SUPABASE_URL` и `VITE_SUPABASE_ANON_KEY` правильные
- Убедитесь, что нет лишних пробелов
- Перезапустите dev сервер

### Проблема: "User not found"

**Решение:**
- Проверьте, что пользователь зарегистрирован
- Убедитесь, что email подтвержден
- Проверьте таблицу `auth.users` в Supabase

### Проблема: "Invalid credentials"

**Решение:**
- Проверьте правильность email и пароля
- Убедитесь, что пароль не менее 6 символов
- Проверьте, что аккаунт не заблокирован

### Проблема: OAuth не работает

**Решение:**
- Проверьте настройки OAuth провайдера в Supabase
- Убедитесь, что redirect URL правильный
- Проверьте, что провайдер включен

---

## 🚀 Production деплой

### 1. Обновите URL

В `.env.production`:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 2. Настройте redirect URLs

В Supabase добавьте ваш production URL:
- `https://your-domain.com/auth/callback`
- `https://your-domain.com/auth/reset-password`

### 3. Настройте CORS

В Supabase → **Authentication → URL Configuration**:
- Site URL: `https://your-domain.com`
- Redirect URLs: добавьте все необходимые URLs

### 4. Включите email верификацию

В Supabase → **Authentication → Providers → Email**:
- Включите **"Confirm email"**

### 5. Настройте rate limiting

В Supabase → **Authentication → Rate Limits**:
- Установите ограничения для защиты от брутфорса

---

## 📚 Дополнительные ресурсы

- [Supabase Docs](https://supabase.com/docs)
- [Auth Guide](https://supabase.com/docs/guides/auth)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [OAuth Providers](https://supabase.com/docs/guides/auth/social-login)

---

## ✅ Чек-лист перед production

- [ ] Supabase проект создан
- [ ] SQL схема выполнена
- [ ] API ключи настроены в `.env`
- [ ] OAuth провайдеры настроены (если нужны)
- [ ] Email шаблоны настроены
- [ ] Redirect URLs добавлены
- [ ] CORS настроен
- [ ] Email верификация включена
- [ ] Rate limiting настроен
- [ ] Тестирование аутентификации пройдено
- [ ] Production URL добавлен в настройки

---

**Готово!** 🎉 Ваша аутентификация настроена и готова к использованию.
