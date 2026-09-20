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

// Сессия истекла: Telegram подписывает initData при запуске, backend отвергает
// старше часа. Перезагрузка не помогает — WebView отдаст тот же просроченный
// initData, свежий выдаётся только при новом открытии. Поэтому единственное
// честное действие здесь — закрыть приложение, а не предлагать «Повторить».
export function SessionExpiredState({ onReopen }) {
  return (
    <div className="state-error">
      <p className="state-error__text">Сессия истекла</p>
      <p className="state-error__hint">
        Telegram выдаёт ключ доступа на час. Откройте приложение заново из бота —
        избранное и прогресс гида сохранены.
      </p>
      <button className="btn btn--ghost" onClick={onReopen}>
        Закрыть
      </button>
    </div>
  );
}
