import { readInsets, applyInsets } from "./insets";

const tg = window.Telegram?.WebApp;

function syncInsets() {
  applyInsets(document.documentElement, readInsets(tg));
}

function syncFullscreen() {
  document.documentElement.setAttribute(
    "data-fullscreen",
    tg?.isFullscreen ? "on" : "off"
  );
  // Кнопки Telegram переезжают вместе с режимом, поэтому инсеты
  // перечитываем здесь же, не дожидаясь отдельного события.
  syncInsets();
}

export function initTelegram() {
  if (!tg) return;
  tg.ready();
  tg.expand();

  // 7.7: без этого свайп вниз по статье закрывает приложение.
  // В полноэкранном режиме это критично — экран большой, свайпают часто.
  if (tg.isVersionAtLeast("7.7")) tg.disableVerticalSwipes();

  if (tg.isVersionAtLeast("8.0")) {
    tg.onEvent("fullscreenChanged", syncFullscreen);
    tg.onEvent("fullscreenFailed", syncFullscreen);
    tg.onEvent("safeAreaChanged", syncInsets);
    tg.onEvent("contentSafeAreaChanged", syncInsets);
    tg.requestFullscreen();
    syncFullscreen();
  } else {
    // Фуллскрина как понятия до 8.0 нет — не читаем tg.isFullscreen,
    // чтобы не полагаться на его (неопределённое на старых клиентах) значение.
    document.documentElement.setAttribute("data-fullscreen", "off");
  }
}

export function hapticSelection() {
  tg?.HapticFeedback?.selectionChanged();
}

export function getInitData() {
  return tg?.initData || "";
}

export function getStartParam() {
  // start_param приходит только из Main Mini App (t.me/bot?startapp=...), который
  // в BotFather не настроен. Наш рабочий путь — /start в боте → web_app-кнопка
  // с ?startapp=... в URL, поэтому читаем и query-параметр как fallback.
  return (
    tg?.initDataUnsafe?.start_param ||
    new URLSearchParams(window.location.search).get("startapp") ||
    null
  );
}

export function hapticSuccess() {
  tg?.HapticFeedback?.notificationOccurred("success");
}

export function hapticError() {
  tg?.HapticFeedback?.notificationOccurred("error");
}

export function hapticImpact(style = "light") {
  tg?.HapticFeedback?.impactOccurred(style);
}

export function triggerHaptic(type = "selection") {
  if (type === "selection") hapticSelection();
  else if (type === "impactLight" || type === "light") hapticImpact("light");
  else if (type === "success") hapticSuccess();
  else if (type === "error") hapticError();
}

export function openLink(url) {
  // tg.openLink — системный браузер; обычный <a>/window.open открывает GitHub внутри вебвью
  tg?.openLink ? tg.openLink(url) : window.open(url, "_blank");
}

export function shareLink(url, text) {
  const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
  tg?.openTelegramLink ? tg.openTelegramLink(shareUrl) : window.open(shareUrl, "_blank");
}

export function onBackButton(handler) {
  if (!tg) return () => {};
  tg.BackButton.onClick(handler);
  tg.BackButton.show();
  return () => {
    tg.BackButton.offClick(handler);
    tg.BackButton.hide();
  };
}

export function hideBackButton() {
  tg?.BackButton?.hide();
}
