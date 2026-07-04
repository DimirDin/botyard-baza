export function Spinner() {
  return <div className="spinner">⠋⠙⠸ $ fetching...</div>;
}

export function EmptyState({ text = "пока пусто здесь" }) {
  return <div className="state-empty">// {text}</div>;
}

export function ErrorState({ onRetry }) {
  return (
    <div className="state-error">
      ✗ exit code 1 — не удалось загрузить
      {onRetry && <div><button onClick={onRetry}>повторить</button></div>}
    </div>
  );
}
