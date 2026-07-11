import { useEffect, useState } from "react";
import { PromptLine } from "./PromptLine";
import { ArticleBody } from "./ArticleBody";
import { Spinner, ErrorState, EmptyState } from "./States";
import { GUIDE_MENU } from "../config/menu";
import { api } from "../lib/api";
import { shareLink } from "../lib/telegram";

// Три вложенных вида внутри одного экрана, без отдельных App-уровневых screen — тот же
// паттерн, что у шпаргалок в EntriesListScreen: список уровней -> уроки уровня -> тело урока.
// `initial` — переход сразу на конкретный урок: карточка "продолжить" на Home (даёт level+slug)
// или диплинк ?start=guide_{slug} от кнопки "поделиться" на самом уроке (даёт только slug,
// level подтягиваем из списка уроков после его загрузки) — см. App.jsx.
export function GuideTrack({ initial, onOpenEntry, onOpenTool, onOpenPrompt }) {
  const [lessons, setLessons] = useState(null); // все уроки, с полем completed
  const [error, setError] = useState(false);
  const [level, setLevel] = useState(initial?.level ?? null); // null = список уровней
  const [lesson, setLesson] = useState(null); // "loading" | объект урока | null
  const [marking, setMarking] = useState(false);

  const load = () => {
    setError(false);
    setLessons(null);
    api.guideLessons().then(setLessons).catch(() => setError(true));
  };

  useEffect(load, []);

  // Прыжок сразу в конкретный урок с Home или по диплинку, один раз после загрузки списка.
  useEffect(() => {
    if (!initial?.slug || !lessons) return;
    if (!initial.level) {
      const found = lessons.find((l) => l.slug === initial.slug);
      if (found) setLevel(found.level);
    }
    openLesson(initial.slug);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessons]);

  const openLesson = (slug) => {
    setLesson("loading");
    api.guideLesson(slug).then(setLesson).catch(() => setLesson(null));
  };

  const lessonsByLevel = (lvl) => (lessons || []).filter((l) => l.level === lvl).sort((a, b) => a.order_in_level - b.order_in_level);

  // Ссылки [текст](entry:slug|tool:owner/repo|prompt:slug) внутри тела урока (ArticleBody) и
  // карточки "Смотри также" зовут этот единый обработчик. Категорию промпта берём из уже
  // загруженного lesson.related_prompts (её отдаёт API) — по этой причине любой промпт,
  // на который ссылаются инлайн в тексте, должен также быть в related_prompts фронтматтера.
  const handleNavigate = (kind, ref) => {
    if (kind === "entry" && onOpenEntry) onOpenEntry(ref);
    if (kind === "tool" && onOpenTool) onOpenTool(ref.replace("/", "__"));
    if (kind === "prompt" && onOpenPrompt) {
      const known = lesson && lesson !== "loading" ? lesson.related_prompts?.find((p) => p.slug === ref) : null;
      onOpenPrompt(known?.category, ref);
    }
  };

  const isLevelUnlocked = (lvl) => {
    if (lvl <= 1) return true;
    const prev = lessonsByLevel(lvl - 1);
    return prev.length > 0 && prev.every((l) => l.completed);
  };

  // --- вид 3: тело урока ---
  if (lesson) {
    const items = level ? lessonsByLevel(level) : [];
    const idx = items.findIndex((l) => l.slug === lesson.slug);
    const next = idx >= 0 ? items[idx + 1] : null;

    // Единая кнопка снизу урока: отмечает пройденным (если ещё не) и сразу ведёт дальше —
    // на следующий урок уровня, а на последнем уроке уровня — обратно к списку уровней.
    const advance = () => {
      const goNext = () => {
        if (next) openLesson(next.slug);
        else {
          setLesson(null);
          setLevel(null);
        }
      };
      if (lesson.completed) {
        goNext();
        return;
      }
      setMarking(true);
      api
        .guideComplete(lesson.slug)
        .then(() => setLessons((ls) => ls.map((l) => (l.slug === lesson.slug ? { ...l, completed: true } : l))))
        .finally(() => {
          setMarking(false);
          goNext();
        });
    };

    const advanceLabel = marking
      ? "..."
      : lesson.completed
        ? next
          ? "дальше →"
          : "✓ к списку уровня"
        : next
          ? "✓ пройдено, дальше →"
          : "✓ уровень пройден — к списку";

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
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                <h1 style={{ color: "var(--text-heading)", fontSize: 22, marginTop: 0 }}>{lesson.title}</h1>
                <span
                  onClick={() => shareLink(`https://t.me/bazadry_bot?start=guide_${lesson.slug}`, lesson.title)}
                  style={{ cursor: "pointer", color: "var(--accent)", whiteSpace: "nowrap", fontFamily: "var(--font-mono)", fontSize: 13 }}
                >
                  ↗ поделиться
                </span>
              </div>
              <ArticleBody bodyMd={lesson.body_md} onNavigate={handleNavigate} />
              {(lesson.related_tools?.length > 0 || lesson.related_prompts?.length > 0) && (
                <div style={{ marginBottom: 20 }}>
                  <span className="segment-label segment-label--example">смотри также</span>
                  {lesson.related_tools?.map((t) => (
                    <div
                      key={t.repo}
                      className="card"
                      onClick={() => onOpenTool && onOpenTool(t.repo.replace("/", "__"))}
                      style={{ cursor: "pointer" }}
                    >
                      <p className="card__title">🛠 {t.name}</p>
                      <p className="card__meta">{t.description_ru}</p>
                    </div>
                  ))}
                  {lesson.related_prompts?.map((p) => (
                    <div
                      key={p.slug}
                      className="card"
                      onClick={() => onOpenPrompt && onOpenPrompt(p.category, p.slug)}
                      style={{ cursor: "pointer" }}
                    >
                      <p className="card__title">⚡ {p.title}</p>
                    </div>
                  ))}
                </div>
              )}
              {lesson.related_entry && onOpenEntry && (
                <button
                  onClick={() => onOpenEntry(lesson.related_entry)}
                  style={{
                    marginTop: 16, marginRight: 10, padding: "10px 18px", borderRadius: 6,
                    fontFamily: "var(--font-mono)", fontSize: 14, background: "transparent",
                    color: "var(--text-muted)", border: "1px solid #26261f", cursor: "pointer",
                  }}
                >
                  📖 читать подробнее в Базе
                </button>
              )}
              <button
                onClick={advance}
                disabled={marking}
                style={{
                  marginTop: 16, padding: "10px 18px", borderRadius: 6, fontFamily: "var(--font-mono)", fontSize: 14,
                  background: "var(--accent)", color: "#0a0a08", border: "1px solid var(--accent)",
                  cursor: marking ? "default" : "pointer",
                }}
              >
                {advanceLabel}
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
            const unlocked = isLevelUnlocked(m.level);
            const clickable = items.length > 0 && unlocked;
            return (
              <div
                key={m.level}
                className="card"
                onClick={() => clickable && setLevel(m.level)}
                style={{ cursor: clickable ? "pointer" : "default", opacity: clickable ? 1 : 0.45 }}
              >
                <span className="tree-item">{i === GUIDE_MENU.length - 1 ? "└──" : "├──"}</span>
                <span className="card__title">
                  {!unlocked && "🔒 "}
                  Уровень {m.level} · {m.label}
                </span>
                <p className="card__meta" style={{ marginTop: 4 }}>{m.desc}</p>
                <div className="guide-progress">
                  <div className="guide-progress__bar">
                    <div className="guide-progress__fill" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="guide-progress__label">
                    {!unlocked ? `сначала уровень ${m.level - 1}` : items.length > 0 ? `${done} из ${items.length}` : "скоро"}
                  </span>
                </div>
              </div>
            );
          })}
      </div>
    </>
  );
}
