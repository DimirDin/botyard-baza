import { useMemo, useState } from "react";
import { showToast } from "../lib/toast";
import { hapticSuccess } from "../lib/telegram";
import { extractPlaceholders, fillPlaceholders } from "../lib/placeholders";

// Реестр известных плейсхолдеров: подпись, тип поля и подсказка.
// Незнакомые плейсхолдеры конструктор всё равно отрисует — подписью станет само имя.
// Так фича работает для всех промптов сразу, а не только для нормализованных:
// в библиотеке 84 разных плейсхолдера, приводить их все к десятку было бы
// рискованно для смысла самих промптов.
const KNOWN = {
  "код": { label: "Код", multiline: true, hint: "вставь фрагмент кода" },
  "текст": { label: "Текст", multiline: true, hint: "исходный текст" },
  "описание": { label: "Описание", multiline: true, hint: "что нужно сделать" },
  "задача": { label: "Задача", multiline: true, hint: "формулировка задачи" },
  "стек": { label: "Стек", multiline: false, hint: "например: FastAPI + Postgres" },
  "язык": { label: "Язык / фреймворк", multiline: false, hint: "например: Python 3.12" },
  "лог": { label: "Лог / ошибка", multiline: true, hint: "stack trace или вывод" },
  "diff": { label: "Diff", multiline: true, hint: "вывод git diff" },
  "openapi": { label: "OpenAPI-схема", multiline: true, hint: "спецификация эндпоинтов" },
  "аудитория": { label: "Аудитория", multiline: false, hint: "для кого текст" },
  "формат": { label: "Формат", multiline: false, hint: "например: Google-style" },
  "style_guide": { label: "Style guide", multiline: true, hint: "правила стиля проекта" },
  "список": { label: "Список", multiline: true, hint: "перечисление пунктов" },
  "требования": { label: "Требования", multiline: true, hint: "ограничения и критерии" },
};

export function PromptComposer({ prompt, onClose, onCopied }) {
  const names = useMemo(() => extractPlaceholders(prompt.body), [prompt.body]);
  const [values, setValues] = useState({});

  const filledCount = names.filter((n) => values[n]?.trim()).length;
  const result = fillPlaceholders(prompt.body, values);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(result);
      hapticSuccess();
      showToast(
        filledCount === names.length
          ? "Промпт собран и скопирован"
          : `Скопировано, ${names.length - filledCount} поля не заполнено`,
        "success",
      );
      onCopied?.();
      onClose?.();
    } catch {
      showToast("Не удалось скопировать", "error");
    }
  };

  return (
    <div className="card" style={{ marginTop: 10, border: "1px solid var(--accent)" }}>
      <div className="card__pad">
        <div className="card__row" style={{ marginBottom: 10 }}>
          <p className="card__title" style={{ margin: 0 }}>
            Подставить значения
          </p>
          <span className="card__meta">
            {filledCount} / {names.length}
          </span>
        </div>

        {names.map((name) => {
          const meta = KNOWN[name] || { label: name, multiline: name.length > 18, hint: "" };
          const common = {
            value: values[name] || "",
            placeholder: meta.hint,
            onChange: (e) => setValues((v) => ({ ...v, [name]: e.target.value })),
            style: {
              width: "100%",
              background: "var(--surface-2)",
              color: "var(--text)",
              border: "1px solid var(--line)",
              borderRadius: "var(--r-sm)",
              padding: "8px 10px",
              fontFamily: meta.multiline ? "var(--font-mono)" : "inherit",
              fontSize: 13,
              boxSizing: "border-box",
            },
          };
          return (
            <label key={name} style={{ display: "block", marginBottom: 10 }}>
              <span
                className="card__meta"
                style={{ display: "block", marginBottom: 4, fontFamily: "var(--font-mono)" }}
              >
                {meta.label}
              </span>
              {meta.multiline ? <textarea rows={4} {...common} /> : <input type="text" {...common} />}
            </label>
          );
        })}

        <details style={{ marginBottom: 10 }}>
          <summary className="card__meta" style={{ cursor: "pointer" }}>
            предпросмотр
          </summary>
          <p
            style={{
              color: "var(--text-2)",
              fontSize: 13,
              whiteSpace: "pre-wrap",
              marginTop: 8,
              fontFamily: "var(--font-mono)",
            }}
          >
            {result}
          </p>
        </details>

        <div className="card__row">
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              color: "var(--text-3)",
              border: "1px solid var(--line)",
              borderRadius: 4,
              padding: "6px 12px",
              fontFamily: "var(--font-mono)",
              fontSize: 13,
            }}
          >
            отмена
          </button>
          <button
            onClick={copy}
            style={{
              background: "var(--accent)",
              color: "#111110",
              border: "none",
              borderRadius: 4,
              padding: "6px 12px",
              fontFamily: "var(--font-mono)",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            скопировать
          </button>
        </div>
      </div>
    </div>
  );
}
