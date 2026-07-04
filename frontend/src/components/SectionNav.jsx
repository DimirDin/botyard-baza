// Двухуровневая навигация раздела: табы секций (иконки) + список групп.
// Используется Базой и Инструментами — структура задаётся в config/menu.js.

export function SectionTabs({ menu, active, onSelect, iconBase }) {
  return (
    <div className="section-tabs">
      {menu.map((s) => (
        <button
          key={s.slug}
          className={`section-tab ${active === s.slug ? "section-tab--active" : ""}`}
          onClick={() => onSelect(s.slug)}
        >
          <img src={`${iconBase}/${s.slug}.png`} alt="" />
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
            <img className="group-row__icon" src={`${iconBase}/${g.slug}.png`} alt="" />
            <span className="group-row__label">{g.label}</span>
            <span className="group-row__count">{count > 0 ? count : "скоро"}</span>
          </div>
        );
      })}
    </div>
  );
}
