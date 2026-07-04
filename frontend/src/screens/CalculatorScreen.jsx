import { useEffect, useRef, useState } from "react";
import { PromptLine } from "../components/PromptLine";
import { api } from "../lib/api";

const MODELS = [
  { id: "claude-sonnet-5", label: "Claude Sonnet 5" },
  { id: "claude-opus-4-8", label: "Claude Opus 4.8" },
  { id: "claude-haiku-4-5", label: "Claude Haiku 4.5" },
  { id: "claude-fable-5", label: "Claude Fable 5" },
];

export function CalculatorScreen() {
  const [text, setText] = useState("");
  const [model, setModel] = useState("claude-sonnet-5");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
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
            background: "color-mix(in srgb, var(--seg-gotcha) 10%, transparent)",
            border: "1px solid var(--seg-gotcha)", borderRadius: 6, padding: "10px 12px",
            fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--seg-gotcha)", marginBottom: 16,
          }}
        >
          ≈ приблизительно — это не официальный токенайзер Claude (считаем через tiktoken локально,
          без ключа Anthropic API), реальное число может отличаться, особенно на кириллице.
        </div>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Вставь текст, чтобы прикинуть число токенов..."
          rows={8}
          style={{
            width: "100%", background: "#1a1a18", color: "var(--text-heading)", border: "1px solid #26261f",
            borderRadius: 6, padding: 12, fontFamily: "var(--font-sans)", fontSize: 14, resize: "vertical",
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
              <p style={{ fontSize: 28, color: "var(--text-heading)", margin: 0 }}>≈ {result.tokens} токенов</p>
              <p style={{ color: "var(--text-muted)", fontSize: 13 }}>
                ≈ ${result.cost_estimate_usd} за input по цене {MODELS.find((m) => m.id === model)?.label}
              </p>
              {result.model_tokenizer_note && (
                <p style={{ color: "var(--seg-gotcha)", fontSize: 12 }}>{result.model_tokenizer_note}</p>
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
