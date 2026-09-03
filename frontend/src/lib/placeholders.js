// Разбор и подстановка плейсхолдеров вида {код}, {стек} в теле промпта.
// Вынесено из компонента: чистые функции рядом с React-компонентом ломают fast refresh,
// плюс их удобно тестировать отдельно.
//
// В библиотеке 456 промптов и 60+ разных имён плейсхолдеров. Приводить их все
// к десятку канонических рискованно для смысла самих промптов, поэтому парсер
// принимает любое имя, а UI подставляет человеческую подпись только знакомым.

const PLACEHOLDER_RE = /\{([^{}\n]{1,40})\}/g;

export function extractPlaceholders(body) {
  const seen = [];
  for (const m of String(body || "").matchAll(PLACEHOLDER_RE)) {
    if (!seen.includes(m[1])) seen.push(m[1]);
  }
  return seen;
}

export function fillPlaceholders(body, values) {
  // Незаполненное поле оставляем как {плейсхолдер} — так промпт можно скопировать
  // частично заполненным и дописать руками, а не получить дыру в тексте.
  return String(body || "").replace(PLACEHOLDER_RE, (full, name) => {
    const v = values[name];
    return v && v.trim() ? v : full;
  });
}
