const ITEMS = [
  { id: "base", icon: "📚", label: "База" },
  { id: "tools", icon: "🛠", label: "Инстр." },
  { id: "prompts", icon: "⚡", label: "Промпты" },
  { id: "calc", icon: "🧮", label: "Калькул." },
  { id: "search", icon: "🔍", label: "Поиск" },
];

export function BottomNav({ active, onSelect }) {
  return (
    <nav className="bottom-nav">
      {ITEMS.map((item) => (
        <button
          key={item.id}
          className={`bottom-nav__item ${active === item.id ? "bottom-nav__item--active" : ""}`}
          onClick={() => onSelect(item.id)}
        >
          <span className="bottom-nav__icon">{item.icon}</span>
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  );
}
