// Структура меню База/Инструменты/Промпты — двухуровневая: табы секций → группы → материалы.
// Иконки лежат в public/icons/{base,tools,prompts}/... (обработаны из макетов BazaDry).
// Слаги групп статей должны совпадать с frontmatter `group:` в content/entries/*.md,
// категории инструментов/промптов в yaml — со строкой "{tab}/{group}".

export const BASE_MENU = [
  {
    slug: "code",
    label: "code",
    groups: [
      { slug: "claude-code", label: "Claude Code", desc: "CLI-инструмент Anthropic для работы с кодом в терминале. Пишет, рефакторит, тестирует." },
      { slug: "claude-md", label: "CLAUDE.md", desc: "Файл-конфиг проекта. Задаёт правила, контекст и стиль для Claude Code в репозитории." },
      { slug: "mcp", label: "MCP", desc: "Model Context Protocol. Стандарт подключения внешних инструментов (БД, API, файлы) к Claude." },
      { slug: "skills", label: "Skills", desc: "Пользовательские команды-шаблоны. «Напиши тесты в моём стиле» — один тап, не промпт." },
      { slug: "hooks", label: "Hooks", desc: "Автоматические триггеры. Запускают действия до/после команды Claude Code." },
      { slug: "subagents", label: "Subagents", desc: "Делегирование задач дочерним агентам. Разбиение сложной работы на параллельные подзадачи." },
      { slug: "headless-ci", label: "Headless/CI", desc: "Запуск Claude Code без интерактива. В GitHub Actions, Docker, скриптах." },
      { slug: "permissions", label: "Permissions", desc: "Режимы одобрения действий. От «всё разрешено» до «каждый шаг — подтверждение»." },
    ],
  },
  {
    slug: "chat",
    label: "chat",
    groups: [
      { slug: "projects", label: "Projects", desc: "Проекты в Claude.ai с постоянным контекстом. Загруженные файлы помнятся между сессиями." },
      { slug: "artifacts", label: "Artifacts", desc: "Генерация самостоятельных блоков: код, документы, SVG. Редактируются отдельно от диалога." },
      { slug: "memory", label: "Memory", desc: "Персистентная память Claude.ai. Факты о пользователе, которые сохраняются между чатами." },
      { slug: "connectors", label: "Connectors", desc: "Интеграции с внешними сервисами. Google Drive, GitHub — данные в контекст без загрузки." },
      { slug: "research", label: "Research", desc: "Глубокое исследование с поиском по сети. Многошаговый анализ с источниками." },
    ],
  },
  {
    slug: "design",
    label: "design",
    groups: [
      { slug: "ui-generation", label: "UI Generation", desc: "Генерация макетов интерфейсов по описанию. HTML, React, CSS — сразу визуально." },
      { slug: "iterative-design", label: "Iterative Design", desc: "Циклы правок: «сделай кнопку крупнее» → мгновенный перерендер. Не с нуля каждый раз." },
      { slug: "design-systems", label: "Design Systems", desc: "Генерация токенов, цветов, типографики. Единый стиль для всего проекта." },
      { slug: "export", label: "Export", desc: "Выгрузка в код. React, SVG, Figma — из макета в репозиторий одним тапом." },
    ],
  },
  {
    slug: "theory",
    label: "theory",
    groups: [
      { slug: "context-window", label: "Context Window", desc: "Окно контекста модели. Сколько токенов помнит Claude одновременно, как оптимизировать." },
      { slug: "tokenization", label: "Tokenization", desc: "Разбиение текста на токены. Почему кириллица «дороже» латиницы, как считать." },
      { slug: "models", label: "Models", desc: "Сравнение моделей. Sonnet — универсал, Opus — сложные задачи, Haiku — скорость." },
      { slug: "pricing", label: "Pricing", desc: "Цена за миллион токенов. Input/output, кэширование, batch-скидки." },
      { slug: "agentic-patterns", label: "Agentic Patterns", desc: "Паттерны автономных агентов. ReAct, Chain-of-Thought, рефлексия, планирование." },
    ],
  },
  // Раньше отдельный таб футера — перенесено сюда по требованию продукта,
  // контент не меняется, тянется тем же /api/cheatsheets (см. EntriesListScreen).
  {
    slug: "cheat",
    label: "cheat",
    groups: [],
  },
];

// Промпты сгруппированы по действию («что делаю»), не по теме — разработчик думает
// «мне нужно сгенерировать / поревьюить / написать доку», а не «промпт про API».
export const PROMPTS_MENU = [
  {
    slug: "code",
    label: "code",
    groups: [
      { slug: "generate", label: "Generate", desc: "Промпты для генерации кода с нуля. Функции, классы, тесты — по описанию." },
      { slug: "refactor", label: "Refactor", desc: "Промпты для переписывания. Упрощение, оптимизация, приведение к стандарту." },
      { slug: "debug", label: "Debug", desc: "Промпты для поиска багов. Анализ stack trace, логов, странного поведения." },
      { slug: "migrate", label: "Migrate", desc: "Промпты для перевода между языками и фреймворками. Python → Go, REST → GraphQL." },
      { slug: "architect", label: "Architect", desc: "Промпты для проектирования. Выбор стека, структура модулей, паттерны." },
    ],
  },
  {
    slug: "review",
    label: "review",
    groups: [
      { slug: "pr-review", label: "PR Review", desc: "Промпты для ревью пулл-реквестов. Архитектура, логика, стиль — целиком." },
      { slug: "security", label: "Security", desc: "Промпты для аудита безопасности. Уязвимости, инъекции, утечки данных." },
      { slug: "performance", label: "Performance", desc: "Промпты для анализа производительности. Bottlenecks, сложность, оптимизация." },
      { slug: "style", label: "Style", desc: "Промпты для проверки соответствия style guide. Линтинг, форматирование, naming." },
      { slug: "logic", label: "Logic", desc: "Промпты для проверки бизнес-логики. Edge cases, инварианты, корнер-кейсы." },
    ],
  },
  {
    slug: "docs",
    label: "docs",
    groups: [
      { slug: "readme", label: "README", desc: "Промпты для написания README. Структура, бейджи, quickstart, примеры." },
      { slug: "api-docs", label: "API Docs", desc: "Промпты для документирования API. OpenAPI, эндпоинты, параметры, примеры." },
      { slug: "comments", label: "Comments", desc: "Промпты для документирования кода. Docstrings, JSDoc, комментарии к сложным местам." },
      { slug: "changelog", label: "Changelog", desc: "Промпты для генерации changelog. По коммитам, по PR, с semver-группировкой." },
      { slug: "onboarding", label: "Onboarding", desc: "Промпты для гайдов новичкам. Архитектура проекта, где что лежит, как запустить." },
    ],
  },
  {
    slug: "ops",
    label: "ops",
    groups: [
      { slug: "bash", label: "Bash", desc: "Промпты для однострочников и скриптов. Pipeline, обработка логов, автоматизация." },
      { slug: "docker", label: "Docker", desc: "Промпты для Dockerfile и compose. Оптимизация образов, многостадийная сборка." },
      { slug: "ci-cd", label: "CI/CD", desc: "Промпты для GitHub Actions и GitLab CI. Тесты, деплой, уведомления." },
      { slug: "terraform", label: "Terraform", desc: "Промпты для infrastructure as code. AWS, GCP, Kubernetes, модули." },
      { slug: "k8s", label: "K8s", desc: "Промпты для Kubernetes. Манифесты, helm charts, debugging pods, HPA." },
    ],
  },
  {
    slug: "content",
    label: "content",
    groups: [
      { slug: "compress", label: "Compress", desc: "Промпты для сжатия текста. RU→EN, summary, TL;DR, выжимка из документации." },
      { slug: "expand", label: "Expand", desc: "Промпты для развёртывания. Из тезиса — в полноценный текст, из bullet points — в абзацы." },
      { slug: "rewrite", label: "Rewrite", desc: "Промпты для смены стиля. Формальный→разговорный, технический→для бизнеса." },
      { slug: "translate", label: "Translate", desc: "Промпты для технического перевода. Сохранение терминов, адаптация примеров кода." },
      { slug: "structure", label: "Structure", desc: "Промпты для структурирования. Оглавление, mind map, план статьи из хаоса идей." },
    ],
  },
  {
    slug: "steer",
    label: "steer",
    groups: [
      { slug: "general", label: "General", desc: "Как скорректировать агента на середине работы, не переделывая всё с нуля." },
    ],
  },
  {
    slug: "think",
    label: "think",
    groups: [
      { slug: "planning", label: "Планирование", desc: "Промпты для планов: провалы заранее, критический путь, приоритеты, буферы." },
      { slug: "research", label: "Исследование", desc: "Промпты для проверки фактов, источников и утверждений перед тем как на них опираться." },
      { slug: "texts", label: "Тексты", desc: "Промпты для редактуры: сократить, усилить, убрать штампы и лишнее." },
      { slug: "learning", label: "Обучение", desc: "Промпты для разбора сложных тем: через аналогии, ошибки новичков, ментальные модели." },
      { slug: "decisions", label: "Решения", desc: "Промпты для выбора между вариантами: компромиссы, риски, точки отказа." },
      { slug: "communication", label: "Коммуникация", desc: "Промпты для сложных разговоров, переговоров, писем и обратной связи." },
      { slug: "self-check", label: "Самопроверка", desc: "Промпты для проверки своих же выводов и решений на предвзятость и слепые зоны." },
      { slug: "expert-role", label: "Роль-эксперт", desc: "Промпты, ставящие модель в конкретную экспертную роль вместо общего ответа." },
    ],
  },
];

export const TOOLS_MENU = [
  {
    slug: "mcp",
    label: "mcp",
    groups: [
      { slug: "servers", label: "Servers", desc: "Готовые MCP-серверы. Подключают Claude к PostgreSQL, файловой системе, Git и т.д." },
      { slug: "clients", label: "Clients", desc: "Приложения и библиотеки для подключения к MCP-серверам." },
      { slug: "frameworks", label: "Frameworks", desc: "SDK для написания своих MCP-серверов. Шаблоны, SDK, best practices." },
      { slug: "docker", label: "Docker", desc: "Контейнеризированные MCP-серверы. Запуск в изоляции, без установки зависимостей." },
    ],
  },
  {
    slug: "code",
    label: "code",
    groups: [
      { slug: "skills", label: "Skills", desc: "Репозитории готовых skills для Claude Code. Шаблоны команд сообщества." },
      { slug: "hooks", label: "Hooks", desc: "Автоматизация workflow. Pre-commit, post-command, интеграция с линтерами." },
      { slug: "routers", label: "Routers", desc: "Маршрутизация запросов между агентами. Какой агент отвечает за какую задачу." },
      { slug: "monitoring", label: "Monitoring", desc: "Отслеживание использования Claude Code. Токены, время, стоимость по проектам." },
      { slug: "ci-cd", label: "CI/CD", desc: "Интеграция Claude Code в pipelines. Автоматический ревью, генерация тестов на push." },
      { slug: "rules", label: "Rules", desc: "Конфиги правил для CLAUDE.md и подобных файлов. Готовые принципы против типичных багов LLM-кодинга." },
    ],
  },
  {
    slug: "libs",
    label: "libs",
    groups: [
      { slug: "python", label: "Python", desc: "Библиотеки Python для Anthropic API. SDK, async-обёртки, хелперы." },
      { slug: "javascript", label: "JavaScript", desc: "npm-пакеты для интеграции Claude в веб-приложения и Node.js сервисы." },
      { slug: "go", label: "Go", desc: "Go-модули для высокопроизводительных сервисов с Anthropic API." },
      { slug: "rust", label: "Rust", desc: "Rust-крейты для безопасной и быстрой работы с API." },
      { slug: "other", label: "Other", desc: "Ruby, PHP, Elixir и прочие языки. Сообщественные обвязки." },
    ],
  },
  {
    slug: "apps",
    label: "apps",
    groups: [
      { slug: "desktop", label: "Desktop", desc: "Нативные приложения для работы с Claude. Не браузер — отдельное окно." },
      { slug: "web", label: "Web", desc: "Веб-клиенты и альтернативные интерфейсы к Claude.ai." },
      { slug: "vscode", label: "VS Code", desc: "Расширения редактора. Claude прямо в IDE, рядом с кодом." },
      { slug: "editors", label: "Editors", desc: "Интеграции для других редакторов — Neovim, Emacs и т.п. Claude, не выходя из редактора." },
      { slug: "mobile", label: "Mobile", desc: "iOS и Android приложения. Claude в кармане, с голосовым вводом." },
    ],
  },
  {
    slug: "agents",
    label: "agents",
    groups: [
      { slug: "subagents", label: "Subagents", desc: "Коллекции готовых сабагентов. Специализированные мини-агенты для конкретных задач." },
      { slug: "autonomous", label: "Autonomous", desc: "Системы, работающие без человека. Запустил — через час результат." },
      { slug: "multi-agent", label: "Multi-agent", desc: "Фреймворки для оркестрации нескольких агентов. Разделение ролей, коммуникация." },
      { slug: "orchestration", label: "Orchestration", desc: "Управление workflow агентов. DAG, состояния, ретраи, observability." },
      { slug: "workflow", label: "Workflow", desc: "Методология и фреймворки процесса разработки с агентом. Brainstorm → план → TDD → сабагенты." },
      { slug: "other", label: "Other", desc: "Разное, что не укладывается в остальные группы — нишевые skills-наборы, локализованные интеграции." },
    ],
  },
];

// Компоненты Claude Code из каталога aitmpl (baza.cc_components) — двухуровневое меню
// тип→категория, тот же паттерн, что TOOLS_MENU. tab.slug должен совпадать с comp_type,
// group.slug — ровно с полем category в БД (см. content/components/selection.json).
export const COMPONENTS_MENU = [
  {
    slug: "agents",
    label: "Агенты",
    groups: [
      { slug: "development-tools", label: "Разработка", desc: "Ревью кода, отладка, упрощение, исследование кодовой базы." },
      { slug: "devops-infrastructure", label: "DevOps", desc: "Деплой, облако, мониторинг, разбор инцидентов." },
      { slug: "programming-languages", label: "Языки", desc: "Специалисты по конкретным языкам — Go, Rust, Python, TypeScript и т.д." },
      { slug: "database", label: "Базы данных", desc: "Оптимизация запросов, схем, индексов." },
      { slug: "security", label: "Безопасность", desc: "Пентест, аудит уязвимостей." },
    ],
  },
  {
    slug: "commands",
    label: "Команды",
    groups: [
      { slug: "git-workflow", label: "Git", desc: "Слэш-команды для веток, коммитов, PR." },
      { slug: "deployment", label: "Деплой", desc: "CI/CD, релизы, настройка окружений." },
      { slug: "testing", label: "Тесты", desc: "Генерация и запуск тестов." },
      { slug: "security", label: "Безопасность", desc: "Аудит и проверки безопасности одной командой." },
      { slug: "performance", label: "Производительность", desc: "Профилирование и поиск узких мест." },
      { slug: "documentation", label: "Документация", desc: "Генерация README, changelog, доки." },
      { slug: "analysis", label: "Анализ", desc: "Разбор кодовой базы и метрик проекта." },
    ],
  },
  {
    slug: "mcps",
    label: "MCP",
    groups: [
      { slug: "devtools", label: "Инструменты разработки", desc: "MCP-серверы для IDE, линтеров, сборки." },
      { slug: "database", label: "Базы данных", desc: "Подключение Claude к Postgres, MySQL и т.д." },
      { slug: "web", label: "Web", desc: "Доступ к веб-страницам и API из диалога." },
      { slug: "research", label: "Исследования", desc: "Поиск по научным статьям и базам знаний." },
      { slug: "productivity", label: "Продуктивность", desc: "Заметки, задачи, календари." },
      { slug: "filesystem", label: "Файловая система", desc: "Чтение и запись файлов на диске." },
      { slug: "integration", label: "Интеграции", desc: "Связка с внешними сервисами и API." },
      { slug: "browser_automation", label: "Браузер", desc: "Автоматизация браузера и скрейпинг." },
    ],
  },
  {
    slug: "hooks",
    label: "Хуки",
    groups: [
      { slug: "security", label: "Безопасность", desc: "Блокировка опасных команд, защита .env и секретов." },
      { slug: "git", label: "Git", desc: "Автоматика вокруг коммитов и пушей." },
      { slug: "automation", label: "Автоматизация", desc: "Уведомления и триггеры на события Claude Code." },
      { slug: "quality-gates", label: "Контроль качества", desc: "TDD-гейты, проверки перед коммитом." },
      { slug: "monitoring", label: "Мониторинг", desc: "Отслеживание расхода контекста и токенов." },
    ],
  },
  {
    slug: "settings",
    label: "Настройки",
    groups: [
      { slug: "permissions", label: "Разрешения", desc: "Готовые профили permissions для Claude Code." },
      { slug: "statusline", label: "Статус-строка", desc: "Кастомные statusline-конфиги." },
      { slug: "model", label: "Модель", desc: "Быстрые пресеты выбора модели (Haiku/Sonnet)." },
      { slug: "environment", label: "Окружение", desc: "Таймауты, приватность, переменные окружения." },
    ],
  },
  {
    slug: "skills",
    label: "Скиллы",
    groups: [
      { slug: "development", label: "Разработка", desc: "Чистый код, code review, ADR, async-паттерны." },
      { slug: "document-processing", label: "Документы", desc: "Официальные скиллы Anthropic — PDF/DOCX/XLSX/PPTX." },
      { slug: "productivity", label: "Продуктивность", desc: "Планирование, отладка, коммиты, создание скиллов." },
      { slug: "workflow-automation", label: "Автоматизация workflow", desc: "GitHub Actions, n8n-паттерны." },
    ],
  },
  {
    slug: "loops",
    label: "Циклы",
    groups: [
      { slug: "engineering", label: "Инженерные", desc: "Автономные циклы: ticket-to-pr, build-test-fix, ревью, уборка репо." },
    ],
  },
];

// Гид — линейный путь обучения от новичка до мастера, 4 уровня. В отличие от
// БАЗЫ/ИНСТРУМЕНТОВ/ПРОМПТОВ это не таб+группа, а фиксированная последовательность —
// уроки внутри уровня идут по order_in_level (см. baza.guide_lessons).
export const GUIDE_MENU = [
  { level: 1, label: "Новичок", icon: "level-1", desc: "Что такое Claude, первый диалог, Chat/Cowork/Code, модели, файлы." },
  { level: 2, label: "Уверенный пользователь", icon: "level-2", desc: "Проекты, Artifacts, Skills, коннекторы, Research, память, Styles." },
  { level: 3, label: "Продвинутый", icon: "level-3", desc: "Установка, рабочий процесс, код-ревью, CLAUDE.md, субагенты, MCP, Hooks." },
  { level: 4, label: "Мастер", icon: "level-4", desc: "Агентные паттерны, контекст, свои команды, SDK, MCP+Docker, кэш." },
];
