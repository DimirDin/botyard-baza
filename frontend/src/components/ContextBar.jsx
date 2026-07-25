// Переиспользуемая полоса заполнения контекстного окна — RU и EN бары
// в CalculatorScreen рендерят по инстансу этого компонента (§10 части 1 PROJECT_CONTEXT).
export function ContextBar({ label, pct, tokens, contextWindow, colorVar = "--accent" }) {
  const width = Math.min(pct, 100);
  return (
    <div className="context-bar">
      <div className="context-bar__head">
        <span>{label}</span>
        <span>{tokens} · {pct}% от {contextWindow.toLocaleString("ru-RU")}</span>
      </div>
      <div className="context-bar__track">
        <div className="context-bar__fill" style={{ width: `${width}%`, background: `var(${colorVar})` }} />
      </div>
    </div>
  );
}
