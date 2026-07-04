// Двухуровневая навигация раздела: табы секций (иконки) + список групп.
// Используется Базой и Инструментами — структура задаётся в config/menu.js.

// Версия сборки как query-параметр — иначе WKWebView/Android WebView в Telegram
// кэширует PNG по пути на диске независимо от "Очистить кэш" в приложении,
// и обновлённые иконки не доходят до пользователя без переустановки.
const ICON_VERSION = Date.now();

export function SectionTabs({ menu, active, onSelect, iconBase }) {
  return (
    <div className="section-tabs">
      {menu.map((s) => (
        <button
          key={s.slug}
          className={`section-tab ${active === s.slug ? "section-tab--active" : ""}`}
          onClick={() => onSelect(s.slug)}
        >
          <img src={`${iconBase}/${s.slug}.png?v=${ICON_VERSION}`} alt="" />
          <span>{s.label}</span>
        </button>
      ))}
    </div>
  );
}

export function GroupList({ groups, counts, onOpen, iconBase }) {
  return (
    <div>
      {groups.map((g, i) => {
        const count = counts?.[g.slug] ?? 0;
        return (
          <div key={g.slug} className="group-row" onClick={() => count > 0 && onOpen(g.slug)}
               style={{ opacity: count > 0 ? 1 : 0.45, cursor: count > 0 ? "pointer" : "default" }}>
            <span className="tree-item">{i === groups.length - 1 ? "└──" : "├──"}</span>
            <img className="group-row__icon" src={`${iconBase}/${g.slug}.png?v=${ICON_VERSION}`} alt="" />
            <span className="group-row__text">
              <span className="group-row__label">{g.label}</span>
              {g.desc && <span className="group-row__desc">{g.desc}</span>}
            </span>
            <span className="group-row__count">{count > 0 ? count : "скоро"}</span>
          </div>
        );
      })}
    </div>
  );
}
