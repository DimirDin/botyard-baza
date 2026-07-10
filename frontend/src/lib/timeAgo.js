export function timeAgo(isoDate) {
  if (!isoDate) return null;
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const days = Math.floor(diffMs / 86_400_000);

  if (days < 1) return "обновлено сегодня";
  if (days < 30) return `обновлено ${days} дн. назад`;
  const months = Math.floor(days / 30);
  if (months < 12) return `обновлено ${months} мес. назад`;
  const years = Math.floor(months / 12);
  return `обновлено ${years} г. назад`;
}
