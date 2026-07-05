import { useEffect, useRef, useState } from "react";
import { PromptLine } from "../components/PromptLine";
import { ContextBar } from "../components/ContextBar";
import { api } from "../lib/api";

const MODELS = [
  { id: "claude-sonnet-5", label: "Claude Sonnet 5" },
  { id: "claude-opus-4-8", label: "Claude Opus 4.8" },
  { id: "claude-haiku-4-5", label: "Claude Haiku 4.5" },
  { id: "claude-fable-5", label: "Claude Fable 5" },
];

// Демо-текст покрупнее — чтобы на маленьком фрагменте не казалось, что калькулятор
// «сломан» (0-1 токен почти не двигают полосу контекстного окна). Реальный system-prompt
// такого размера — обычный случай, отсюда и наглядность.
const DEMO_TEXT = `Ты — старший инженер, который проводит ревью пул-реквестов перед мержем в основную ветку. Твоя задача — находить настоящие баги, а не придираться к стилю кода: null-указатели, гонки состояний, утечки памяти, некорректная обработка ошибок, SQL-инъекции и другие уязвимости OWASP Top 10, неправильные инварианты в бизнес-логике.

Контекст проекта: backend на FastAPI с асинхронным доступом к PostgreSQL через asyncpg, кэш и rate-limiting — через Redis, frontend — React 18 с Vite. Все защищённые ручки идут через Depends(require_subscribed), контент синхронизируется в БД отдельным пайплайном из YAML и Markdown-файлов, никогда не пишется в базу напрямую мимо него.

Для каждого найденного замечания укажи: файл и номер строки, что именно не так, конкретный сценарий (какие входные данные приведут к падению или неверному результату), и предлагаемое исправление — коротко, без переписывания всего файла. Если замечаний нет — так и скажи, не выдумывай проблемы ради количества. Раздели находки на критичные (блокируют мерж) и на «стоит поправить, но не обязательно сейчас».`;

function PriceCard({ title, price, note }) {
  return (
    <div style={{ background: "#1a1a18", border: "1px solid #26261f", borderRadius: 6, padding: "10px 12px", flex: 1, minWidth: 130 }}>
      <p style={{ margin: 0, fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-muted)" }}>{title}</p>
      <p style={{ margin: "4px 0 0", fontSize: 20, color: "var(--text-heading)" }}>${price}</p>
      {note && <p style={{ margin: "2px 0 0", fontSize: 11, color: "var(--text-muted-dim)" }}>{note}</p>}
    </div>
  );
}

export function CalculatorScreen() {
  const [text, setText] = useState("");
  const [model, setModel] = useState("claude-sonnet-5");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showBatch, setShowBatch] = useState(false);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (!text.trim()) {
      setResult(null);
      return;
    }
    setLoading(true);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      api.calcTokens(text, model).then(setResult).catch(() => setResult(null)).finally(() => setLoading(false));
    }, 400);
    return () => clearTimeout(debounceRef.current);
  }, [text, model]);

  return (
    <>
      <PromptLine section="calc" />
      <div className="page">
        <div
          style={{
            background: "#1a1a18", border: "1px solid #26261f", borderRadius: 6, padding: "10px 12px",
            fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text-body)", marginBottom: 10,
          }}
        >
          Этот калькулятор прикидывает, сколько токенов «съест» твой текст и сколько это будет стоить
          в API — полезно, чтобы понять, влезет ли промпт в контекстное окно модели и во сколько
          обойдётся запрос ещё до отправки. Оценка приблизительная — считаем через tiktoken локально,
          без ключа Anthropic API (его у проекта нет), поэтому реальное число токенов Claude может
          немного отличаться, особенно на кириллице.
        </div>

        <button
          onClick={() => setText(DEMO_TEXT)}
          style={{
            background: "transparent", border: "1px solid var(--accent)", color: "var(--accent)",
            borderRadius: 6, padding: "6px 12px", fontFamily: "var(--font-mono)", fontSize: 12,
            cursor: "pointer", marginBottom: 12,
          }}
        >
          вставить пример текста подлиннее — для наглядности
        </button>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Вставь текст, чтобы прикинуть число токенов..."
          rows={8}
          style={{
            width: "100%", background: "#1a1a18", color: "var(--text-heading)", border: "1px solid #26261f",
            borderRadius: 6, padding: 12, fontFamily: "var(--font-sans)", fontSize: 16, resize: "vertical",
          }}
        />

        <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
          {MODELS.map((m) => (
            <div key={m.id} className={`chip ${model === m.id ? "chip--active" : ""}`} onClick={() => setModel(m.id)}>
              {m.label}
            </div>
          ))}
        </div>

        <div style={{ marginTop: 20, fontFamily: "var(--font-mono)" }}>
          {loading && <span style={{ color: "var(--text-muted)" }}>⠋⠙⠸ считаю...</span>}
          {!loading && result && (
            <>
              <p style={{ fontSize: 30, color: "var(--text-heading)", margin: 0 }}>≈ {result.tokens} токенов</p>
              <p style={{ color: "var(--text-muted)", fontSize: 14, marginBottom: 12 }}>
                цена input по {MODELS.find((m) => m.id === model)?.label}
              </p>
              {result.model_tokenizer_note && (
                <p style={{ color: "var(--seg-gotcha)", fontSize: 13 }}>{result.model_tokenizer_note}</p>
              )}

              {result.price_standard !== undefined && (
                <>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <PriceCard title="обычный запрос" price={result.price_standard} />
                    <PriceCard title="с prompt caching" price={result.price_with_caching} note="−90% на кэш-чтение" />
                    {showBatch && (
                      <PriceCard title="batch API" price={result.price_with_batch} note="−50%, ответ до 24ч" />
                    )}
                  </div>
                  <label style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 10, fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-muted)", cursor: "pointer" }}>
                    <input type="checkbox" checked={showBatch} onChange={(e) => setShowBatch(e.target.checked)} />
                    показать экономию batch API
                  </label>
                </>
              )}

              {result.context_window && (
                <ContextBar
                  label="RU"
                  pct={result.ru_context_pct}
                  tokens={result.tokens}
                  contextWindow={result.context_window}
                  colorVar="--accent"
                />
              )}
              {result.en_tokens !== null && result.en_tokens !== undefined && (
                <>
                  <ContextBar
                    label="EN"
                    pct={result.en_context_pct}
                    tokens={result.en_tokens}
                    contextWindow={result.context_window}
                    colorVar="--seg-why"
                  />
                  {result.ru_vs_en_delta_pct !== null && (
                    <p style={{ color: "var(--text-muted-dim)", fontSize: 12, marginTop: 6 }}>
                      русский текст занимает на {result.ru_vs_en_delta_pct}% токенов больше, чем английский эквивалент
                    </p>
                  )}
                </>
              )}
            </>
          )}
          {!loading && !result && text.trim() === "" && (
            <span style={{ color: "var(--text-muted-dim)" }}>// начни печатать</span>
          )}
        </div>
      </div>
    </>
  );
}
