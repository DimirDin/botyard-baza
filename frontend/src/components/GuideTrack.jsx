import { useEffect, useState } from "react";
import { PromptLine } from "./PromptLine";
import { ArticleBody } from "./ArticleBody";
import { Spinner, ErrorState, EmptyState } from "./States";
import { GUIDE_MENU } from "../config/menu";
import { api } from "../lib/api";

// Три вложенных вида внутри одного экрана, без отдельных App-уровневых screen — тот же
// паттерн, что у шпаргалок в EntriesListScreen: список уровней -> уроки уровня -> тело урока.
export function GuideTrack() {
  const [lessons, setLessons] = useState(null); // все уроки, с полем completed
  const [error, setError] = useState(false);
  const [level, setLevel] = useState(null); // null = список уровней
  const [lesson, setLesson] = useState(null); // "loading" | объект урока | null
  const [marking, setMarking] = useState(false);

  const load = () => {
    setError(false);
    setLessons(null);
    api.guideLessons().then(setLessons).catch(() => setError(true));
  };

  useEffect(load, []);

  const openLesson = (slug) => {
    setLesson("loading");
    api.guideLesson(slug).then(setLesson).catch(() => setLesson(null));
  };

  const markComplete = () => {
    if (!lesson || lesson === "loading") return;
    setMarking(true);
    api
      .guideComplete(lesson.slug)
      .then(() => {
        setLesson((l) => ({ ...l, completed: true }));
        setLessons((ls) => ls.map((l) => (l.slug === lesson.slug ? { ...l, completed: true } : l)));
      })
      .finally(() => setMarking(false));
  };

  const lessonsByLevel = (lvl) => (lessons || []).filter((l) => l.level === lvl).sort((a, b) => a.order_in_level - b.order_in_level);

  // --- вид 3: тело урока ---
  if (lesson) {
    return (
      <>
        <PromptLine
          section={`guide/${level}`}
          right={<span onClick={() => setLesson(null)} style={{ cursor: "pointer" }}>✗ назад</span>}
        />
        <div className="page">
          {lesson === "loading" && <Spinner />}
          {lesson !== "loading" && (
            <>
              <h1 style={{ color: "var(--text-heading)", fontSize: 22, marginTop: 0 }}>{lesson.title}</h1>
              <ArticleBody bodyMd={lesson.body_md} />
              <button
                onClick={markComplete}
                disabled={lesson.completed || marking}
                style={{
                  marginTop: 16, padding: "10px 18px", borderRadius: 6, fontFamily: "var(--font-mono)", fontSize: 14,
                  background: lesson.completed ? "transparent" : "var(--accent)",
                  color: lesson.completed ? "var(--accent)" : "#0a0a08",
                  border: "1px solid var(--accent)",
                  cursor: lesson.completed ? "default" : "pointer",
                }}
              >
                {lesson.completed ? "✓ пройдено" : marking ? "..." : "отметить пройденным"}
              </button>
            </>
          )}
        </div>
      </>
    );
  }

  // --- вид 2: список уроков уровня ---
  if (level) {
    const items = lessonsByLevel(level);
    const meta = GUIDE_MENU.find((m) => m.level === level);
    return (
      <>
        <PromptLine section={`guide/${level}`} right={<span onClick={() => setLevel(null)} style={{ cursor: "pointer" }}>✗ назад</span>} />
        <div className="page">
          <p style={{ fontFamily: "var(--font-mono)", color: "var(--text-muted)", fontSize: 14, marginTop: 0 }}>
            {meta?.label} ({items.filter((i) => i.completed).length} из {items.length})
          </p>
          {items.length === 0 && <EmptyState />}
          {items.map((l) => (
            <div key={l.slug} className="card" onClick={() => openLesson(l.slug)} style={{ cursor: "pointer" }}>
              <span className="card__title">
                {l.completed ? "✓ " : ""}
                {l.title}
              </span>
              <p className="card__meta" style={{ marginTop: 4 }}>{l.summary}</p>
            </div>
          ))}
        </div>
      </>
    );
  }

  // --- вид 1: список уровней с прогресс-баром ---
  return (
    <>
      <PromptLine section="guide" />
      <div className="page">
        {error && <ErrorState onRetry={load} />}
        {!error && !lessons && <Spinner />}
        {lessons &&
          GUIDE_MENU.map((m, i) => {
            const items = lessonsByLevel(m.level);
            const done = items.filter((it) => it.completed).length;
            const pct = items.length ? Math.round((done / items.length) * 100) : 0;
            return (
              <div
                key={m.level}
                className="card"
                onClick={() => items.length > 0 && setLevel(m.level)}
                style={{ cursor: items.length > 0 ? "pointer" : "default", opacity: items.length > 0 ? 1 : 0.45 }}
              >
                <span className="tree-item">{i === GUIDE_MENU.length - 1 ? "└──" : "├──"}</span>
                <span className="card__title">
                  Уровень {m.level} · {m.label}
                </span>
                <p className="card__meta" style={{ marginTop: 4 }}>{m.desc}</p>
                <div className="guide-progress">
                  <div className="guide-progress__bar">
                    <div className="guide-progress__fill" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="guide-progress__label">
                    {items.length > 0 ? `${done} из ${items.length}` : "скоро"}
                  </span>
                </div>
              </div>
            );
          })}
      </div>
    </>
  );
}
