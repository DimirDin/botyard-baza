export function getReadingTime(text = "") {
  if (!text) return "1 мин чтения";
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const mins = Math.max(1, Math.round(words / 180));
  return `~${mins} мин чтения`;
}
