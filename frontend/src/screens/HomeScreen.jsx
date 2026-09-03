import { useEffect, useState } from "react";
import { AppHeader } from "../components/AppHeader";
import { StatsBar } from "../components/StatsBar";
import { Spinner, ErrorState } from "../components/States";
import { api } from "../lib/api";
import { FeedbackForm } from "../components/FeedbackForm";
import { compactNumber, plural } from "../lib/format";

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
              <div className="sect__head">
                <span className="segment-label segment-label--why">свежее в базе</span>
                <span className="sect__more" onClick={() => onNavigate("base")}>
                  все {data.counts.entries_count} →
                </span>
              </div>
              {(data.recent_entries ?? []).length === 0 ? (
                <p style={{ color: "var(--text-3)" }}>пока пусто</p>
              ) : (
                <div className="toplist">
                  {(data.recent_entries ?? []).slice(0, 10).map((e, i) => (
                    <div key={e.slug} className="toplist__row" onClick={() => onNavigate("entry", e.slug)}>
                      <span className="toplist__rank">{i + 1}</span>
                      <span className="toplist__title">{e.title}</span>
                      <span className="toplist__meta">{e.updated_at?.slice(0, 10)}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {(data.top_tools ?? []).length > 0 && (
              <section className="sect">
                <div className="sect__head">
                  <span className="segment-label segment-label--gotcha">топ-10 инструментов</span>
                  <span className="sect__more" onClick={() => onNavigate("tools")}>
                    все {data.counts.tools_count} →
                  </span>
                </div>
                <div className="toplist">
                  {data.top_tools.slice(0, 10).map((t, i) => (
                    <div
                      key={t.repo}
                      className="toplist__row"
                      onClick={() => onNavigate("tool", t.repo.replace("/", "__"))}
                    >
                      <span className="toplist__rank">{i + 1}</span>
                      {/* repo, а не name: в один столбец «ai» или «agents» без владельца
                          не опознать, а описания в компактной строке нет */}
                      <span className="toplist__title">{t.repo}</span>
                      <span className="toplist__meta">★ {compactNumber(t.stars)}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section className="sect">
              <div className="sect__head">
                <span className="segment-label segment-label--example">топ-5 промптов</span>
                <span className="sect__more" onClick={() => onNavigate("prompts")}>
                  все {data.counts.prompts_count} →
                </span>
              </div>
              <div className="toplist">
                {(data.top_prompts ?? []).slice(0, 5).map((p, i) => (
                  <div
                    key={p.slug}
                    className="toplist__row"
                    onClick={() => onNavigate("prompts", { category: p.category, slug: p.slug })}
                  >
                    <span className="toplist__rank">{i + 1}</span>
                    <span className="toplist__title">{p.title}</span>
                    <span className="toplist__meta">
                      {compactNumber(p.copies_count)} {plural(p.copies_count, ["копия", "копии", "копий"])}
                    </span>
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
