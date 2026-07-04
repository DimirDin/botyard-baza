import { useState } from "react";
import { PromptLine } from "../components/PromptLine";
import { Spinner } from "../components/States";
import { api } from "../lib/api";

export function GateScreen({ counts, onRecheckSuccess }) {
  const [checking, setChecking] = useState(false);
  const [failed, setFailed] = useState(false);

  const handleSubscribeClick = () => {
    window.open("https://t.me/claudedry", "_blank");
  };

  const handleRecheck = async () => {
    setChecking(true);
    setFailed(false);
    try {
      const res = await api.gateRecheck();
      if (res.subscribed) {
        onRecheckSuccess();
      } else {
        setFailed(true);
      }
    } catch {
      setFailed(true);
    } finally {
      setChecking(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <PromptLine section="gate" dirty />
      <div className="page" style={{ display: "flex", flexDirection: "column", justifyContent: "center", flex: 1 }}>
        <pre style={{ fontFamily: "var(--font-mono)", color: "var(--text-muted)", fontSize: 14, lineHeight: 1.8 }}>
{`baza/
├── entries    (${counts?.entries_count ?? "…"} статей)
├── tools      (${counts?.tools_count ?? "…"} инструментов)
└── prompts    (${counts?.prompts_count ?? "…"} промптов)`}
        </pre>

        <p style={{ color: "var(--text-heading)", fontSize: 17, marginTop: 24 }}>
          Доступ открыт подписчикам <b>@claudedry</b>.
        </p>

        <button
          onClick={handleSubscribeClick}
          style={{
            marginTop: 16, padding: "12px 20px", background: "var(--accent)", color: "#111110",
            border: "none", borderRadius: 6, fontWeight: 600, fontSize: 16,
          }}
        >
          Подписаться на @claudedry
        </button>

        <button
          onClick={handleRecheck}
          disabled={checking}
          style={{
            marginTop: 10, padding: "12px 20px", background: "transparent", color: "var(--text-heading)",
            border: "1px solid #333", borderRadius: 6, fontFamily: "var(--font-mono)", fontSize: 15,
          }}
        >
          {checking ? <Spinner /> : "$ ./access --recheck"}
        </button>

        {failed && (
          <p style={{ color: "var(--error)", fontFamily: "var(--font-mono)", fontSize: 14, marginTop: 10 }}>
            ✗ подписка не найдена — попробуй ещё раз через пару секунд
          </p>
        )}
      </div>
    </div>
  );
}
