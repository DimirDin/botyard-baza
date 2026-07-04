// Структура меню База/Инструменты — двухуровневая: табы разделов → группы → материалы.
// Иконки лежат в public/icons/{base,tools}/... (обработаны из макетов BazaDry).
// Слаги групп статей должны совпадать с frontmatter `group:` в content/entries/*.md,
// категории инструментов в tools.yaml — со строкой "{tab}/{group}".

export const BASE_MENU = [
  {
    slug: "code",
    label: "code",
    groups: [
      { slug: "claude-code", label: "Claude Code" },
      { slug: "claude-md", label: "CLAUDE.md" },
      { slug: "mcp", label: "MCP" },
      { slug: "skills", label: "Skills" },
      { slug: "hooks", label: "Hooks" },
      { slug: "subagents", label: "Subagents" },
      { slug: "headless-ci", label: "Headless/CI" },
      { slug: "permissions", label: "Permissions" },
    ],
  },
  {
    slug: "chat",
    label: "chat",
    groups: [
      { slug: "projects", label: "Projects" },
      { slug: "artifacts", label: "Artifacts" },
      { slug: "memory", label: "Memory" },
      { slug: "connectors", label: "Connectors" },
      { slug: "research", label: "Research" },
    ],
  },
  {
    slug: "design",
    label: "design",
    groups: [
      { slug: "ui-generation", label: "UI Generation" },
      { slug: "iterative-design", label: "Iterative Design" },
      { slug: "design-systems", label: "Design Systems" },
      { slug: "export", label: "Export" },
    ],
  },
  {
    slug: "theory",
    label: "theory",
    groups: [
      { slug: "context-window", label: "Context Window" },
      { slug: "tokenization", label: "Tokenization" },
      { slug: "models", label: "Models" },
      { slug: "pricing", label: "Pricing" },
      { slug: "agentic-patterns", label: "Agentic Patterns" },
    ],
  },
];

export const TOOLS_MENU = [
  {
    slug: "mcp",
    label: "mcp",
    groups: [
      { slug: "servers", label: "Servers" },
      { slug: "clients", label: "Clients" },
      { slug: "frameworks", label: "Frameworks" },
      { slug: "docker", label: "Docker" },
    ],
  },
  {
    slug: "code",
    label: "code",
    groups: [
      { slug: "skills", label: "Skills" },
      { slug: "hooks", label: "Hooks" },
      { slug: "routers", label: "Routers" },
      { slug: "monitoring", label: "Monitoring" },
      { slug: "ci-cd", label: "CI/CD" },
    ],
  },
  {
    slug: "libs",
    label: "libs",
    groups: [
      { slug: "python", label: "Python" },
      { slug: "javascript", label: "JavaScript" },
      { slug: "go", label: "Go" },
      { slug: "rust", label: "Rust" },
      { slug: "other", label: "Other" },
    ],
  },
  {
    slug: "apps",
    label: "apps",
    groups: [
      { slug: "desktop", label: "Desktop" },
      { slug: "web", label: "Web" },
      { slug: "vscode", label: "VS Code" },
      { slug: "mobile", label: "Mobile" },
    ],
  },
  {
    slug: "agents",
    label: "agents",
    groups: [
      { slug: "subagents", label: "Subagents" },
      { slug: "autonomous", label: "Autonomous" },
      { slug: "multi-agent", label: "Multi-agent" },
      { slug: "orchestration", label: "Orchestration" },
    ],
  },
];
