// Видео крутится только на витрине: гейт-экран и Главная. На списках и
// статьях — canvas-пыль, она стоит 3 КБ вместо 439 и не мешает читать.
export const VIDEO_SCREENS = ["gate", "home"];

export function resolveVariant({ screen, enabled, reducedMotion }) {
  if (reducedMotion || !enabled) return "wash";
  return VIDEO_SCREENS.includes(screen) ? "video" : "dust";
}
