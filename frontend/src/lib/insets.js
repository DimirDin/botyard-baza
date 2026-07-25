// Отступы берём только у Telegram: env(safe-area-inset-*) внутри вебвью
// работает ненадёжно, поэтому Telegram и завёл собственные значения.
// Никаких констант высоты чёлки — на Android вырез другой.

function num(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

export function readInsets(tg) {
  const safe = tg?.safeAreaInset ?? {};
  const content = tg?.contentSafeAreaInset ?? {};
  return {
    safeTop: num(safe.top),
    safeBottom: num(safe.bottom),
    contentTop: num(content.top),
  };
}

export function applyInsets(root, insets) {
  if (!root?.style) return;
  root.style.setProperty("--safe-top", `${insets.safeTop}px`);
  root.style.setProperty("--safe-bottom", `${insets.safeBottom}px`);
  root.style.setProperty("--content-safe-top", `${insets.contentTop}px`);
}
