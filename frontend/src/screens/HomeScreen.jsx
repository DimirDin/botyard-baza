import { useEffect, useState } from "react";
import { AppHeader } from "../components/AppHeader";
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
      <AppHeader
        title="База"
        subtitle="без воды · @claudedry"
        action={
          user?.is_admin && (
            <span className="chip" onClick={() => onNavigate("admin")}>
              админка
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
              <section className="sect">
                <span className="segment-label segment-label--gotcha">
                  {guide.completed > 0 ? "продолжить гид" : "начать гид"}
                </span>
                <div
                  className="card"
                  onClick={() => onNavigate("guide", { level: guide.next_lesson.level, slug: guide.next_lesson.slug })}
                >
                  <div className="card__pad">
                    <div className="card__row">
                      <p className="card__title">{guide.next_lesson.title}</p>
                      <span className="badge">{guide.percent}%</span>
                    </div>
                    <p className="card__meta">
                      Уровень {guide.next_lesson.level} · пройдено {guide.completed} из {guide.total} уроков
                    </p>
                    <div className="guide-progress">
                      <div className="guide-progress__bar">
                        <div className="guide-progress__fill" style={{ width: `${guide.percent}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )}

            <section className="sect">
              <span className="segment-label segment-label--why">новое на неделе</span>
              {data.recent_entries.length === 0 && <p style={{ color: "var(--text-3)" }}>пока пусто</p>}
              <div className="stack">
                {data.recent_entries.map((e, i) => (
                  <div key={e.slug} className="card" onClick={() => onNavigate("entry", e.slug)}>
                    <div className={`card__cover ${["", "card__cover--green", "card__cover--violet"][i % 3]}`.trim()} />
                    <div className="card__pad">
                      <p className="card__title">{e.title}</p>
                      <p className="card__meta">обновлено {e.updated_at?.slice(0, 10)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {data.tools_of_week?.length > 0 && (
              <section className="sect">
                <span className="segment-label segment-label--gotcha">инструменты недели</span>
                <div className="stack">
                  {data.tools_of_week.map((t) => (
                    <div
                      key={t.repo}
                      className="card"
                      onClick={() => onNavigate("tool", t.repo.replace("/", "__"))}
                    >
                      <div className="card__pad">
                        <div className="card__row">
                          <p className="card__title">{t.name}</p>
                          {t.badge === "editors_choice" && <span className="chip chip--editors">выбор редакции</span>}
                        </div>
                        <p className="card__desc">{t.description_ru}</p>
                        <p className="card__meta">
                          ★ {t.stars} <span style={{ color: "var(--seg-what)" }}>▲ +{t.growth}★ за неделю</span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section className="sect">
              <span className="segment-label segment-label--example">топ промптов</span>
              <div className="stack">
                {data.top_prompts.map((p) => (
                  <div
                    key={p.slug}
                    className="card"
                    onClick={() => onNavigate("prompts", { category: p.category, slug: p.slug })}
                  >
                    <div className="card__pad">
                      <p className="card__title">{p.title}</p>
                      <p className="card__meta">{p.copies_count} копирований</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <div className="chip" onClick={() => onNavigate("base")}>{data.counts.entries_count} статей</div>
              <div className="chip" onClick={() => onNavigate("tools")}>{data.counts.tools_count} инструментов</div>
              <div className="chip" onClick={() => onNavigate("prompts")}>{data.counts.prompts_count} промптов</div>
              <div className="chip" onClick={() => onNavigate("base", { tab: "cheat" })}>шпаргалки</div>
              <div className="chip" onClick={() => onNavigate("favorites")}>избранное</div>
              <div className="chip" onClick={() => onNavigate("search")}>поиск</div>
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
