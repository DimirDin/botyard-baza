// Шапка экрана. Кнопка действия стоит слева осознанно: в полноэкранном
// режиме правый верхний угол занимают плавающие «✕» и «⋮» Telegram.
export function AppHeader({ title, subtitle = null, action = null }) {
  return (
    <header className="app-header">
      {action && <div className="app-header__action">{action}</div>}
      <div className="app-header__text">
        <h1 className="app-header__title">{title}</h1>
        {subtitle && <span className="app-header__subtitle">{subtitle}</span>}
      </div>
    </header>
  );
}
