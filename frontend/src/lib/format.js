// Компактная запись больших чисел для узких колонок метрик.
// 89716 звёзд в топ-списке главной должны занимать столько же места, сколько 243,
// иначе колонка прыгает и строки перестают читаться как таблица.
export function compactNumber(n) {
  // Number(null) === 0, а не NaN — без явной проверки отсутствующая метрика
  // отрисовалась бы уверенным «0» вместо честного прочерка.
  if (n === null || n === undefined || n === "") return "—";
  const v = Number(n);
  if (!Number.isFinite(v)) return "—";
  const abs = Math.abs(v);
  if (abs < 1000) return String(v);
  if (abs < 10_000) return `${(v / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  if (abs < 1_000_000) return `${Math.round(v / 1000)}k`;
  return `${(v / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
}

// Русское склонение при числительном: 1 копия, 2 копии, 5 копий, 21 копия, 142 копии.
// Хардкод «копий» давал «142 копий» — в русскоязычном продукте это заметная небрежность.
export function plural(n, [one, few, many]) {
  const v = Math.abs(Math.trunc(Number(n) || 0));
  const mod100 = v % 100;
  if (mod100 >= 11 && mod100 <= 14) return many;
  const mod10 = v % 10;
  if (mod10 === 1) return one;
  if (mod10 >= 2 && mod10 <= 4) return few;
  return many;
}
