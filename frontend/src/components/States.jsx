import { SkeletonList } from "./Skeleton";

// Имя Spinner сохранено: его импортируют 13 экранов. Изменилось только то,
// что он рисует — скелетоны вместо braille-спиннера, чтобы контент
// не прыгал в момент подстановки данных.
export function Spinner() {
  return <SkeletonList count={3} />;
}

export function EmptyState({ text = "Пока пусто" }) {
  return <div className="state-empty">{text}</div>;
}

export function ErrorState({ onRetry }) {
  return (
    <div className="state-error">
      <p className="state-error__text">Не удалось загрузить</p>
      {onRetry && (
        <button className="btn btn--ghost" onClick={onRetry}>
          Повторить
        </button>
      )}
    </div>
  );
}
