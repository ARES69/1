# 🎨 OpenCode-Style Design System

**Дата:** 2026  
**Статус:** ✅ ВНЕДРЕНО  
**Стиль:** Terminal-native, monospace-first

---

## 📋 Обзор

Полностью переработан дизайн RS-BUILDER в стиле **OpenCode** — терминальная эстетика с тёплыми тёмными тонами, моноширинным шрифтом везде и минималистичным подходом.

---

## 🎨 Цветовая палитра

### Основные цвета
```css
/* Тёплый тёмный фон (не чистый чёрный) */
--opencode-dark: #201d1d

/* Тёплый белый (не чистый белый) */
--opencode-light: #fdfcfc

/* Тёплый серый */
--opencode-mid: #9a9898

/* Поверхности */
--opencode-surface: #302c2c
--opencode-light-surface: #f1eeee
--opencode-input-bg: #f8f7f7
```

### Семантические цвета (Apple HIG)
```css
/* Синий акцент */
--accent-blue: #007aff
--accent-blue-hover: #0056b3
--accent-blue-active: #004085

/* Красный (опасность) */
--danger-red: #ff3b30
--danger-hover: #d70015
--danger-active: #a50011

/* Зелёный (успех) */
--success-green: #30d158

/* Оранжевый (предупреждение) */
--warning-orange: #ff9f0a
--warning-hover: #cc7f08
--warning-active: #995f06
```

### Границы
```css
/* Тёплая прозрачная граница */
--border-warm: rgba(15, 0, 0, 0.12)

/* Граница вкладок */
--border-tab: #9a9898

/* Контурная граница */
--border-outline: #646262
```

---

## 📝 Типографика

### Шрифт
**Единственный шрифт:** Berkeley Mono (или IBM Plex Mono как fallback)

```css
--font-mono: 'Berkeley Mono', 'IBM Plex Mono', ui-monospace, 
             SFMono-Regular, Menlo, Monaco, Consolas, 
             'Liberation Mono', 'Courier New', monospace;
```

### Иерархия
| Роль | Размер | Вес | Высота строки |
|------|--------|-----|---------------|
| Заголовок 1 | 38px | 700 | 1.50 |
| Заголовок 2 | 16px | 700 | 1.50 |
| Основной текст | 16px | 400 | 1.50 |
| Средний текст | 16px | 500 | 1.50 |
| Подпись | 14px | 400 | 2.00 |

### Принципы
- **Один шрифт, один голос** — моноширинный везде
- **Вес как иерархия** — 700 для заголовков, 500 для интерактивных, 400 для текста
- **Щедрая высота строки** — 1.50 для читаемости
- **Плотный для интерактивных** — 1.00 для вкладок и меток

---

## 🔲 Компоненты

### Кнопки
```css
.btn-primary {
  background: var(--bg);
  color: var(--text);
  border: 1px solid var(--border-hover);
  border-radius: 4px;
  padding: 4px 20px;
  font-family: var(--font-mono);
  font-size: 16px;
  font-weight: 500;
  line-height: 2;
}
```

### Инпуты
```css
.input-terminal {
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 20px;
  font-family: var(--font-mono);
  font-size: 16px;
}
```

### Ссылки
```css
a {
  color: var(--text);
  text-decoration: underline;
  text-underline-offset: 2px;
}

a:hover {
  color: var(--accent);
}
```

### Бейджи
```css
.badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  background: var(--bg-tertiary);
  border: 1px solid var(--border);
}
```

### Карточки
```css
.card-terminal {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 4px;
}

.card-terminal:hover {
  border-color: var(--border-hover);
}
```

---

## 📐 Сетка и отступы

### Базовая единица
**8px** — основа всей системы

### Шкала отступов
```
4px  — микро-отступы
8px  — базовый
12px — малый
16px — стандартный
20px — средний
24px — большой
32px — увеличенный
40px — большой увеличенный
48px — секционный
64px — большой секционный
80px — увеличенный секционный
96px — максимальный секционный
```

### Контейнер
- Максимальная ширина: **900px**
- Центрированный контент
- Щедрые горизонтальные отступы
- Одноколоночный layout

---

## 🎭 Глубина и уровни

| Уровень | Обработка | Использование |
|---------|-----------|---------------|
| Плоский (0) | Без тени, без границы | По умолчанию |
| Граница тонкая (1) | `1px solid rgba(15, 0, 0, 0.12)` | Разделители, инпуты |
| Граница вкладки (2) | `2px solid #9a9898` снизу | Активная вкладка |
| Граница контура (3) | `1px solid #646262` | Контейнеры |

### Философия теней
**Ноль теней.** Глубина создаётся только через границы и сдвиги цвета фона. Это соответствует терминальной эстетике — терминалы не имеют теней.

---

## 🎬 Интерактивность

### Hover состояния
- **Ссылки:** изменение цвета на акцентный
- **Кнопки:** лёгкое осветление фона или усиление границы
- **Трёхстадийная последовательность:** default → hover → active

### Focus состояния
- Граница на основе, без теней
- `outline: 1px solid var(--accent)`
- `outline-offset: 2px`

### Переходы
- Минимальные переходы
- Цвет: 100-150ms
- Нет масштабирования, вращения или сложных трансформаций

---

## 📱 Адаптивность

### Breakpoints
| Имя | Ширина | Изменения |
|-----|--------|-----------|
| Mobile | <640px | Одна колонка, уменьшенные отступы |
| Tablet | 640-1024px | Расширенная ширина контента |
| Desktop | >1024px | Полная ширина (~900px по центру) |

### Стратегия сворачивания
- Заголовок: 38px → 28px → 24px
- Навигация: горизонтальные ссылки → гамбургер
- Отступы секций: 96px → 64px → 48px

---

## 🖥️ Терминальные элементы

### Терминальное окно
```jsx
<div className="rounded-[4px] overflow-hidden border">
  {/* Заголовок терминала */}
  <div className="flex items-center gap-2 px-4 py-2 bg-secondary border-b">
    <div className="flex gap-1.5">
      <div className="w-2.5 h-2.5 rounded-full bg-red" />
      <div className="w-2.5 h-2.5 rounded-full bg-orange" />
      <div className="w-2.5 h-2.5 rounded-full bg-green" />
    </div>
    <span className="terminal-text text-xs">~/path</span>
  </div>
  
  {/* Содержимое терминала */}
  <div className="p-6 bg-primary">
    <div className="terminal-text text-sm">
      <span className="text-green">$</span> command
    </div>
  </div>
</div>
```

### Командная строка
```jsx
<div className="terminal-text text-sm">
  <span style={{ color: 'var(--success-green)' }}>$</span>{' '}
  <span>command</span>{' '}
  <span className="text-muted">— description</span>
</div>
```

---

## 🎯 Ключевые принципы

### 1. Моноширинный везде
Berkeley Mono (или IBM Plex Mono) используется исключительно. Нет вариаций между display, body и code — всё говорит в одном моноширинном регистре.

### 2. Тёплые оттенки
Используйте `#201d1d` вместо `#000000`, `#fdfcfc` вместо `#ffffff`. Тёплый красноватый оттенок едва заметен, но важен.

### 3. Плоский дизайн
Никаких теней, градиентов, эффектов размытия. Только границы и сдвиги цвета фона.

### 4. Минимальные радиусы
4px везде, кроме инпутов (6px). Никаких скруглённых пилюль или больших радиусов.

### 5. Семантические цвета
Следуйте Apple HIG: `#007aff` синий, `#ff3b30` красный, `#30d158` зелёный, `#ff9f0a` оранжевый.

### 6. Тёплые границы
Используйте `rgba(15, 0, 0, 0.12)` — тёплый прозрачный тёмный, не нейтральный серый.

---

## 📊 Обновлённые компоненты

### ✅ Обновлены:
- `src/index.css` — новая цветовая схема и типографика
- `src/components/Header.tsx` — минималистичный терминальный стиль
- `src/components/Footer.tsx` — простой терминальный стиль
- `src/pages/Home.tsx` — терминальный hero, списки функций
- `src/pages/Auth.tsx` — терминальное окно авторизации
- `src/pages/Pricing.tsx` — минималистичные карточки тарифов

### 🔄 В процессе:
- `src/pages/Workspace.tsx` — терминальный интерфейс workspace

---

## 🎨 Сравнение стилей

### До (старый стиль)
```
✗ Градиенты и свечения
✗ Яркие цвета (индиго, фиолетовый)
✗ Sans-serif шрифты
✗ Большие радиусы (8px, 12px)
✗ Тени и глубина
✗ Сложные анимации
```

### После (OpenCode стиль)
```
✓ Плоский терминальный дизайн
✓ Тёплые монохромные тона
✓ Моноширинный шрифт везде
✓ Минимальные радиусы (4px)
✓ Границы вместо теней
✓ Минимальные переходы
```

---

## 🚀 Результат

**Проект теперь выглядит как профессиональный терминальный AI-инструмент!**

### Характеристики:
- ✅ Терминальная эстетика
- ✅ Моноширинный шрифт везде
- ✅ Тёплая тёмная палитра
- ✅ Минималистичный дизайн
- ✅ Профессиональный вид
- ✅ Утилитарный подход

### Размер:
- CSS: 41.76 kB (gzip: 8.27 kB) — уменьшен!
- JavaScript: 569.01 kB (gzip: 164.26 kB)
- Сборка: 7.69s

---

## 📚 Ресурсы

- [OpenCode Design System](https://github.com/nexu-io/open-design/blob/main/design-systems/opencode-ai/DESIGN.md)
- [Apple HIG Colors](https://developer.apple.com/design/human-interface-guidelines/color)
- [Berkeley Mono Font](https://berkeleygraphics.com/typefaces/berkeley-mono/)
- [IBM Plex Mono](https://www.ibm.com/plex/)

---

**Дизайн-система внедрена:** 2026  
**Статус:** ✅ Production-ready  
**Стиль:** Terminal-native, monospace-first, warm dark palette
