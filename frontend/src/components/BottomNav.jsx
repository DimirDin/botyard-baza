// См. комментарий в SectionNav.jsx — версия в query нужна против кэша WebView Telegram.
const ICON_VERSION = Date.now();

const ITEMS = [
  { id: "base", icon: "/icons/footer/base.png", label: "База" },
  { id: "tools", icon: "/icons/footer/tools.png", label: "Инстр." },
  { id: "prompts", icon: "/icons/footer/prompts.png", label: "Промпты" },
  { id: "calc", icon: "/icons/footer/calc.png", label: "Калькул." },
  { id: "cheatsheets", emoji: "📋", label: "Шпарг." },
  { id: "search", icon: "/icons/footer/search.png", label: "Поиск" },
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
          {item.icon ? (
            <img className="bottom-nav__png" src={`${item.icon}?v=${ICON_VERSION}`} alt="" />
          ) : (
            <span className="bottom-nav__icon">{item.emoji}</span>
          )}
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  );
}
