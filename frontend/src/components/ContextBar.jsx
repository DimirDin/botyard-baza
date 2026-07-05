// Переиспользуемая полоса заполнения контекстного окна — RU и EN бары
// в CalculatorScreen рендерят по инстансу этого компонента (§10 части 1 PROJECT_CONTEXT).
export function ContextBar({ label, pct, tokens, contextWindow, colorVar = "--accent" }) {
  const width = Math.min(pct, 100);
  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>
        <span>{label}</span>
        <span>{tokens} · {pct}% от {contextWindow.toLocaleString("ru-RU")}</span>
      </div>
      <div style={{ height: 6, borderRadius: 3, background: "#232320", overflow: "hidden" }}>
        <div
          style={{
            width: `${width}%`,
            height: "100%",
            background: `var(${colorVar})`,
            borderRadius: 3,
            transition: "width 200ms ease",
          }}
        />
      </div>
    </div>
  );
}
