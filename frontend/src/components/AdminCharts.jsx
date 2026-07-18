// Лёгкие ручные SVG-графики для админ-аналитики — без внешних chart-библиотек,
// чтобы не тащить новую npm-зависимость ради одного экрана (см. AdminScreen.jsx).

export function RankBars({ items, labelKey = "label", valueKey = "count", subLabel, empty, color = "var(--accent)" }) {
  if (!items || items.length === 0) {
    return <p style={{ margin: 0, color: "var(--text-muted)", fontSize: 14 }}>{empty || "Нет данных"}</p>;
  }
  const max = items.reduce((m, it) => Math.max(m, Number(it[valueKey]) || 0), 1);
  return (
    <>
      {items.map((it, i) => {
        const value = Number(it[valueKey]) || 0;
        const percent = Math.round((value / max) * 100);
        const sub = typeof subLabel === "function" ? subLabel(it) : null;
        return (
          <div key={i} style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8, fontSize: 13, fontFamily: "var(--font-mono)" }}>
              <span
                style={{
                  color: "var(--text-body)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  minWidth: 0,
                }}
              >
                {it[labelKey]}
                {sub && <span style={{ color: "var(--text-muted-dim)" }}> · {sub}</span>}
              </span>
              <span style={{ color, flexShrink: 0 }}>{value.toLocaleString("ru-RU")}</span>
            </div>
            <div className="guide-progress" style={{ marginTop: 4 }}>
              <div className="guide-progress__bar" style={{ height: 6 }}>
                <div className="guide-progress__fill" style={{ width: `${percent}%`, height: 6, background: color }} />
              </div>
            </div>
          </div>
        );
      })}
    </>
  );
}

// Линейный график активности: активные пользователи (сплошная) + новые регистрации (пунктир).
export function TrendChart({ data, height = 130 }) {
  if (!data || data.length === 0) return null;

  const width = 320;
  const padX = 8;
  const padY = 18;
  const maxVal = Math.max(1, ...data.map((d) => Math.max(d.active, d.new_users)));
  const stepX = data.length > 1 ? (width - padX * 2) / (data.length - 1) : 0;
  const toY = (v) => height - padY - (v / maxVal) * (height - padY * 2);
  const toX = (i) => padX + i * stepX;

  const linePath = (key) =>
    data.map((d, i) => `${i === 0 ? "M" : "L"} ${toX(i).toFixed(1)} ${toY(d[key]).toFixed(1)}`).join(" ");

  const areaPath =
    linePath("active") +
    ` L ${toX(data.length - 1).toFixed(1)} ${height - padY} L ${toX(0).toFixed(1)} ${height - padY} Z`;

  const firstDay = data[0]?.day?.slice(5) || "";
  const lastDay = data[data.length - 1]?.day?.slice(5) || "";

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} style={{ display: "block" }}>
        <line x1={padX} y1={height - padY} x2={width - padX} y2={height - padY} stroke="var(--border, #26261f)" strokeWidth="1" />
        <path d={areaPath} fill="var(--accent)" opacity="0.08" stroke="none" />
        <path d={linePath("new_users")} fill="none" stroke="var(--seg-why)" strokeWidth="1.5" strokeDasharray="3,3" />
        <path d={linePath("active")} fill="none" stroke="var(--accent)" strokeWidth="2" />
        {data.map((d, i) => (
          <circle key={i} cx={toX(i)} cy={toY(d.active)} r="2" fill="var(--accent)" />
        ))}
      </svg>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontFamily: "var(--font-mono)",
          fontSize: 11,
          color: "var(--text-muted-dim)",
          marginTop: 2,
        }}
      >
        <span>{firstDay}</span>
        <span style={{ display: "flex", gap: 12 }}>
          <span style={{ color: "var(--accent)" }}>● активные</span>
          <span style={{ color: "var(--seg-why)" }}>┄ новые</span>
        </span>
        <span>{lastDay}</span>
      </div>
    </div>
  );
}

// Горизонтальная шкала likes/dislikes для одной статьи (сегменты в одну сторону от нуля).
export function RatingRow({ title, likes, dislikes }) {
  const max = Math.max(1, likes, dislikes);
  return (
    <div style={{ marginBottom: 12 }}>
      <div
        style={{
          fontSize: 13,
          fontFamily: "var(--font-mono)",
          color: "var(--text-body)",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          marginBottom: 4,
        }}
      >
        {title}
      </div>
      <div style={{ display: "flex", gap: 6, alignItems: "center", fontFamily: "var(--font-mono)", fontSize: 12 }}>
        <span style={{ color: "var(--seg-what)", width: 28, textAlign: "right" }}>👍{likes}</span>
        <div style={{ flex: 1, height: 6, background: "color-mix(in srgb, var(--seg-what) 12%, transparent)", borderRadius: 3, overflow: "hidden", display: "flex" }}>
          <div style={{ width: `${(likes / max) * 50}%`, background: "var(--seg-what)", marginLeft: "auto" }} />
          <div style={{ width: "1px", background: "var(--text-muted-dim)" }} />
          <div style={{ width: `${(dislikes / max) * 50}%`, background: "var(--error)" }} />
        </div>
        <span style={{ color: "var(--error)", width: 28 }}>👎{dislikes}</span>
      </div>
    </div>
  );
}
