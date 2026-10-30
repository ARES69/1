# 📤 Инструкция по загрузке на GitHub

## Шаг 1: Создайте репозиторий на GitHub

1. Перейдите на [github.com](https://github.com)
2. Войдите в аккаунт (или зарегистрируйтесь)
3. Нажмите на **"+"** в правом верхнем углу → **"New repository"**
4. Заполните форму:
   - **Repository name:** `RS-BUILDER`
   - **Description:** `AI Agent that delivers artifacts, not advice`
   - **Public** или **Private** (на ваш выбор)
   - ❌ НЕ ставьте галочку "Initialize with README" (уже есть)
   - ❌ НЕ ставьте галочку "Add .gitignore" (уже есть)
   - ❌ НЕ выбирайте лицензию (уже есть)
5. Нажмите **"Create repository"**

## Шаг 2: Инициализируйте Git локально

Откройте терминал в директории проекта и выполните:

```bash
# Инициализировать Git репозиторий
git init

# Добавить все файлы
git add .

# Создать первый коммит
git commit -m "Initial commit: RS-BUILDER v2.0 - AI Agent Platform"
```

## Шаг 3: Подключите удалённый репозиторий

Замените `YOUR_USERNAME` на ваш username на GitHub:

```bash
# Добавить remote
git remote add origin https://github.com/YOUR_USERNAME/RS-BUILDER.git

# Переименовать ветку в main
git branch -M main

# Запушить на GitHub
git push -u origin main
```

## Шаг 4: Проверьте результат

1. Обновите страницу репозитория на GitHub
2. Убедитесь, что все файлы загружены
3. Проверьте, что README.md отображается корректно

---

## 🔄 Альтернативный способ: Через GitHub CLI

Если у вас установлен [GitHub CLI](https://cli.github.com/):

```bash
# Авторизоваться
gh auth login

# Создать репозиторий и запушить
gh repo create RS-BUILDER --public --source=. --push
```

---

## 🔄 Альтернативный способ: Через GitHub Desktop

1. Скачайте [GitHub Desktop](https://desktop.github.com/)
2. Откройте приложение
3. **File → Add Local Repository**
4. Выберите директорию проекта
5. Нажмите **"Create Repository"**
6. Введите название: `RS-BUILDER`
7. Нажмите **"Create Repository"**
8. Нажмите **"Publish repository"**
9. Заполните форму и нажмите **"Publish Repository"**

---

## 📝 Что делать после загрузки

### 1. Настройте GitHub Pages (опционально)

```bash
# Установите gh-pages
npm install --save-dev gh-pages
```

Добавьте в `package.json`:

```json
{
  "scripts": {
    "deploy": "gh-pages -d dist"
  }
}
```

Задеплойте:

```bash
npm run build
npm run deploy
```

### 2. Настройте GitHub Actions (CI/CD)

Создайте файл `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run tests
      run: npm test
    
    - name: Build
      run: npm run build
```

### 3. Добавьте бейджи

В README.md добавьте:

```markdown
![Build](https://github.com/YOUR_USERNAME/RS-BUILDER/actions/workflows/ci.yml/badge.svg)
![License](https://img.shields.io/badge/license-MIT-green)
![Version](https://img.shields.io/badge/version-2.0.0-blue)
```

---

## 🛠 Полезные Git команды

```bash
# Статус репозитория
git status

# Добавить изменения
git add .

# Создать коммит
git commit -m "Описание изменений"

# Запушить изменения
git push

# Получить последние изменения
git pull

# Создать новую ветку
git checkout -b feature/new-feature

# Переключиться на ветку
git checkout main

# Посмотреть историю коммитов
git log --oneline

# Отменить последний коммит (сохранить изменения)
git reset --soft HEAD~1
```

---

## ⚠️ Частые проблемы

### Проблема: "fatal: remote origin already exists"

**Решение:**
```bash
git remote remove origin
git remote add origin https://github.com/YOUR_USERNAME/RS-BUILDER.git
```

### Проблема: "Updates were rejected because the remote contains work"

**Решение:**
```bash
git pull origin main --rebase
git push -u origin main
```

### Проблема: "Permission denied (publickey)"

**Решение:**
```bash
# Используйте HTTPS вместо SSH
git remote set-url origin https://github.com/YOUR_USERNAME/RS-BUILDER.git
```

### Проблема: Большие файлы не пушатся

**Решение:**
```bash
# Проверьте .gitignore
# Убедитесь, что node_modules и dist в .gitignore
git rm -r --cached node_modules
git rm -r --cached dist
git commit -m "Remove cached files"
git push
```

---

## 📊 После загрузки

### Обновите профиль

1. Перейдите в настройки репозитория
2. Добавьте:
   - Описание
   - Website (если есть)
   - Topics: `ai`, `builder`, `react`, `typescript`, `llm`
   - Social preview image

### Создайте Release

```bash
# Создайте тег
git tag -a v2.0.0 -m "RS-BUILDER v2.0.0"

# Запушьте тег
git push origin v2.0.0
```

Затем на GitHub:
1. Перейдите в **Releases**
2. Нажмите **"Draft a new release"**
3. Выберите тег `v2.0.0`
4. Заполните описание
5. Нажмите **"Publish release"**

---

## ✅ Чек-лист перед публикацией

- [ ] README.md заполнен
- [ ] LICENSE добавлен
- [ ] .gitignore настроен
- [ ] Все файлы закоммичены
- [ ] Код протестирован локально
- [ ] Нет敏感 данных (API ключи, пароли)
- [ ] Описание репозитория заполнено
- [ ] Topics добавлены
- [ ] GitHub Actions настроены (опционально)

---

## 🎉 Готово!

Ваш проект теперь на GitHub! 🚀

**Следующие шаги:**
1. Поделитесь ссылкой с друзьями
2. Добавьте звезду своему проекту ⭐
3. Начните принимать contributions
4. Продолжайте развивать проект!

---

**Нужна помощь?**
- [GitHub Docs](https://docs.github.com/)
- [Git Handbook](https://guides.github.com/introduction/git-handbook/)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/git)
