import { useState } from "react";
import { api } from "../lib/api";
import { hapticSuccess, hapticError } from "../lib/telegram";

// Фидбэк уходит прямо из Mini App через backend (POST /api/feedback), а не через
// диплинк в чат с ботом — openTelegramLink/window.open ненадёжны в Menu Button
// режиме (см. историю бага: кнопка либо не открывала чат, либо давала
// «такого пользователя не существует»). Так — без выхода из приложения вообще.
export function FeedbackForm() {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [status, setStatus] = useState("idle"); // idle | sending | sent | error

  const submit = () => {
    if (!text.trim()) return;
    setStatus("sending");
    api.sendFeedback(text.trim())
      .then(() => {
        setStatus("sent");
        hapticSuccess();
        setText("");
      })
      .catch(() => {
        setStatus("error");
        hapticError();
      });
  };

  if (!open) {
    return (
      <div className="card" onClick={() => setOpen(true)} style={{ cursor: "pointer", textAlign: "center" }}>
        <p className="card__title">💬 Предложить инструмент или промпт</p>
        <p className="card__meta">напиши прямо здесь — уйдёт на модерацию</p>
      </div>
    );
  }

  if (status === "sent") {
    return (
      <div className="card" style={{ textAlign: "center" }}>
        <p className="card__title">✓ Спасибо!</p>
        <p className="card__meta">Передал на модерацию.</p>
      </div>
    );
  }

  return (
    <div className="card">
      <p className="card__title" style={{ marginBottom: 8 }}>💬 Предложить инструмент или промпт</p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Ссылка на GitHub или текст промпта, можно с парой слов зачем"
        rows={3}
        style={{
          width: "100%",
          background: "#1a1a18",
          border: "1px solid #2c2c28",
          borderRadius: 6,
          color: "var(--text-body)",
          fontFamily: "var(--font-mono)",
          fontSize: 16, // iOS/Telegram WebView зумит страницу при фокусе на input с font-size < 16px
          padding: 8,
          resize: "vertical",
          boxSizing: "border-box",
        }}
      />
      {status === "error" && (
        <p style={{ color: "var(--seg-gotcha)", fontSize: 13, marginTop: 6 }}>Не отправилось, попробуй ещё раз.</p>
      )}
      <div style={{ display: "flex", gap: 8, marginTop: 8, justifyContent: "flex-end" }}>
        <button className="chip" style={{ border: "none" }} onClick={() => setOpen(false)}>отмена</button>
        <button
          className="chip chip--active"
          style={{ border: "none" }}
          onClick={submit}
          disabled={status === "sending" || !text.trim()}
        >
          {status === "sending" ? "отправка…" : "отправить"}
        </button>
      </div>
    </div>
  );
}
