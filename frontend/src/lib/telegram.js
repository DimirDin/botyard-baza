const tg = window.Telegram?.WebApp;

export function initTelegram() {
  if (!tg) return;
  tg.ready();
  tg.expand();
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

export function shareLink(url, text) {
  const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
  tg?.openTelegramLink ? tg.openTelegramLink(shareUrl) : window.open(shareUrl, "_blank");
}

// Открывает чат с ботом на диплинке "feedback" — бот дальше сам ведёт диалог
// (просит прислать инструмент/промпт текстом и форвардит в технический чат).
// Именно чат с ботом, а не API из Mini App — так пользователь может прислать
// длинный текст/ссылку в привычном интерфейсе, без формы внутри WebView.
export function openFeedbackChat(botUsername = "bazadry_bot") {
  const url = `https://t.me/${botUsername}?start=feedback`;
  tg?.openTelegramLink ? tg.openTelegramLink(url) : window.open(url, "_blank");
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
