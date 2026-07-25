import { hapticSelection } from "../lib/telegram";

// Версия в query — против кэша WebView Telegram: он держит PNG по пути
// на диске независимо от «Очистить кэш» в приложении.
const ICON_VERSION = Date.now();

const ITEMS = [
  { id: "base", icon: "/icons/footer/base.png", label: "База" },
  { id: "tools", icon: "/icons/footer/tools.png", label: "Софт" },
  { id: "prompts", icon: "/icons/footer/prompts.png", label: "Промпты" },
  { id: "guide", icon: "/icons/footer/guide.png", label: "Гид" },
  { id: "favorites", icon: "/icons/footer/favorites.png", label: "Моё" },
];

export function BottomNav({ active, onSelect }) {
  const select = (id) => {
    hapticSelection();
    onSelect(id);
  };

  return (
    <nav className="bottom-nav">
      {ITEMS.map((item) => (
        <button
          key={item.id}
          className={`bottom-nav__item ${active === item.id ? "bottom-nav__item--active" : ""}`}
          aria-current={active === item.id ? "page" : undefined}
          onClick={() => select(item.id)}
        >
          <img className="bottom-nav__png" src={`${item.icon}?v=${ICON_VERSION}`} alt="" />
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  );
}
