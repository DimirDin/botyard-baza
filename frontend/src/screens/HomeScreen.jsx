import { useEffect, useState } from "react";
import { PromptLine } from "../components/PromptLine";
import { StatsBar } from "../components/StatsBar";
import { Spinner, ErrorState } from "../components/States";
import { api } from "../lib/api";
import { FeedbackForm } from "../components/FeedbackForm";

export function HomeScreen({ user, onNavigate }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);
  const [guide, setGuide] = useState(null); // прогресс гида, для карточки "продолжить"

  const load = () => {
    setError(false);
    setData(null);
    api.home().then(setData).catch(() => setError(true));
    api.guideProgress().then(setGuide).catch(() => {});
  };

  useEffect(load, []);

  return (
    <>
      <PromptLine
        section="home"
        right={
          user?.is_admin && (
            <span
              onClick={() => onNavigate("admin")}
              style={{
                color: "var(--accent)",
                cursor: "pointer",
                border: "1px solid var(--accent)",
                padding: "2px 6px",
                borderRadius: 4,
                fontSize: 12,
                fontFamily: "var(--font-mono)",
              }}
            >
              🔒 admin
            </span>
          )
        }
      />
      <div className="page">
        {error && <ErrorState onRetry={load} />}
        {!error && !data && <Spinner />}
        {data && (
          <>
            <StatsBar stats={data.stats} />

            {guide?.next_lesson && (
              <section style={{ marginBottom: 24 }}>
                <span className="segment-label segment-label--gotcha">
                  {guide.completed > 0 ? "продолжить гид" : "начать гид"}
                </span>
                <div
                  className="card"
                  onClick={() => onNavigate("guide", { level: guide.next_lesson.level, slug: guide.next_lesson.slug })}
                  style={{ cursor: "pointer" }}
                >
                  <p className="card__title">{guide.next_lesson.title}</p>
                  <p className="card__meta">
                    Уровень {guide.next_lesson.level} · пройдено {guide.completed} из {guide.total}
                  </p>
                  <div className="guide-progress" style={{ marginTop: 8 }}>
                    <div className="guide-progress__bar">
                      <div className="guide-progress__fill" style={{ width: `${guide.percent}%` }} />
                    </div>
                  </div>
                </div>
              </section>
            )}

            <section style={{ marginBottom: 24 }}>
              <span className="segment-label segment-label--why">новое на неделе</span>
              {data.recent_entries.length === 0 && <p style={{ color: "var(--text-muted)" }}>пока пусто</p>}
              {data.recent_entries.map((e) => (
                <div key={e.slug} className="card" onClick={() => onNavigate("entry", e.slug)} style={{ cursor: "pointer" }}>
                  <p className="card__title">{e.title}</p>
                  <p className="card__meta">обновлено {e.updated_at?.slice(0, 10)}</p>
                </div>
              ))}
            </section>

            {data.tools_of_week?.length > 0 && (
              <section style={{ marginBottom: 24 }}>
                <span className="segment-label segment-label--gotcha">🔥 инструменты недели</span>
                {data.tools_of_week.map((t) => (
                  <div
                    key={t.repo}
                    className="card"
                    onClick={() => onNavigate("tool", t.repo.replace("/", "__"))}
                    style={{ cursor: "pointer" }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                      <p className="card__title">{t.name}</p>
                      {t.badge === "editors_choice" && <span className="chip chip--editors">выбор редакции</span>}
                    </div>
                    <p style={{ color: "var(--text-body)", fontSize: 15, margin: "6px 0" }}>{t.description_ru}</p>
                    <p className="card__meta">
                      ⭐ {t.stars} <span style={{ color: "var(--seg-what)" }}>▲ +{t.growth}⭐ за неделю</span>
                    </p>
                  </div>
                ))}
              </section>
            )}

            <section style={{ marginBottom: 24 }}>
              <span className="segment-label segment-label--example">топ промптов</span>
              {data.top_prompts.map((p) => (
                <div
                  key={p.slug}
                  className="card"
                  onClick={() => onNavigate("prompts", { category: p.category, slug: p.slug })}
                  style={{ cursor: "pointer" }}
                >
                  <p className="card__title">{p.title}</p>
                  <p className="card__meta">{p.copies_count} копирований</p>
                </div>
              ))}
            </section>

            <section style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <div className="chip" onClick={() => onNavigate("base")}>📚 {data.counts.entries_count} статей</div>
              <div className="chip" onClick={() => onNavigate("tools")}>🛠 {data.counts.tools_count} инструментов</div>
              <div className="chip" onClick={() => onNavigate("prompts")}>⚡ {data.counts.prompts_count} промптов</div>
              <div className="chip" onClick={() => onNavigate("base", { tab: "cheat" })}>📋 шпаргалки</div>
              <div className="chip" onClick={() => onNavigate("favorites")}>⭐ избранное</div>
            </section>

            <section style={{ marginTop: 20 }}>
              <FeedbackForm />
            </section>
          </>
        )}
      </div>
    </>
  );
}
