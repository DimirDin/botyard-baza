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
  return tg?.initDataUnsafe?.start_param || null;
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
