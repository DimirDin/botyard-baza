import { useEffect, useState } from "react";
import { PromptLine } from "../components/PromptLine";
import { Spinner, ErrorState } from "../components/States";
import { RankBars, TrendChart, RatingRow } from "../components/AdminCharts";
import { api } from "../lib/api";

const SECTION_LABEL = { code: "Код", chat: "Chat/Claude.ai", design: "Дизайн", theory: "Теория" };
const FAV_ICON = { entry: "📚", tool: "🛠", prompt: "⚡" };

export function AdminScreen({ onBack }) {
  const [activeTab, setActiveTab] = useState("overview"); // overview | content | users | live
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [users, setUsers] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadData = () => {
    setLoading(true);
    setError(false);
    Promise.all([api.adminStats(), api.adminAnalytics(), api.adminUsers(), api.adminEvents()])
      .then(([statsRes, analyticsRes, usersRes, eventsRes]) => {
        setStats(statsRes);
        setAnalytics(analyticsRes);
        setUsers(usersRes);
        setEvents(eventsRes);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError(true);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadData();
  }, []);

  const getSubRate = () => {
    if (!stats || !stats.total_users) return "0%";
    return `${Math.round((stats.subscribed_users / stats.total_users) * 100)}%`;
  };

  const tabs = [
    { id: "overview", label: "📊 обзор" },
    { id: "content", label: "🔥 интересы" },
    { id: "users", label: `👥 users (${users.length})` },
    { id: "live", label: `📡 live (${events.length})` },
  ];

  return (
    <>
      <PromptLine
        section="admin"
        right={
          onBack && (
            <span onClick={onBack} style={{ cursor: "pointer" }}>
              ✗ назад
            </span>
          )
        }
      />
      <div className="page" style={{ paddingBottom: 32 }}>
        <h1 style={{ color: "var(--text-heading)", fontSize: 22, marginTop: 0, display: "flex", alignItems: "center", gap: 8 }}>
          <span>💻</span> ENGINE ANALYTICS
        </h1>

        {error && <ErrorState onRetry={loadData} />}
        {loading && <Spinner />}

        {!loading && !error && stats && analytics && (
          <>
            {/* Grid of basic stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12, marginBottom: 20 }}>
              <StatCard label="TOTAL_USERS" value={stats.total_users} />
              <StatCard label="SUBSCRIBED" value={stats.subscribed_users} extra={`(${getSubRate()})`} />
              <StatCard label="ACTIVE_DAU" value={stats.dau} />
              <StatCard label="ACTIVE_WAU" value={stats.wau} />
            </div>

            {/* Tabs */}
            <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
              {tabs.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`chip ${activeTab === t.id ? "chip--active" : ""}`}
                  style={{ flex: "1 1 auto", padding: "8px 4px", border: "none", borderRadius: 6, cursor: "pointer", fontFamily: "var(--font-mono)", fontSize: 12 }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {activeTab === "overview" && (
              <OverviewTab stats={stats} analytics={analytics} />
            )}

            {activeTab === "content" && (
              <ContentTab analytics={analytics} />
            )}

            {activeTab === "users" && <UsersTab users={users} />}

            {activeTab === "live" && <LiveTab events={events} />}
          </>
        )}
      </div>
    </>
  );
}

function StatCard({ label, value, extra }) {
  return (
    <div className="card" style={{ padding: 12, margin: 0 }}>
      <p style={{ margin: 0, color: "var(--text-muted-dim)", fontSize: 12, fontFamily: "var(--font-mono)" }}>{label}</p>
      <p style={{ margin: "4px 0 0 0", color: "var(--accent)", fontSize: 20, fontWeight: "bold", fontFamily: "var(--font-mono)" }}>
        {value}
        {extra && <span style={{ fontSize: 13, fontWeight: "normal", color: "var(--text-muted)" }}> {extra}</span>}
      </p>
    </div>
  );
}

function Section({ label, badgeClass = "segment-label--gotcha", children }) {
  return (
    <section style={{ marginBottom: 24 }}>
      <span className={`segment-label ${badgeClass}`}>{label}</span>
      <div className="card" style={{ padding: "16px 12px", marginTop: 8 }}>
        {children}
      </div>
    </section>
  );
}

function OverviewTab({ stats, analytics }) {
  const hasEvents = (analytics.activity_trend || []).some((d) => d.active > 0 || d.new_users > 0);
  return (
    <>
      <Section label="активность за 14 дней" badgeClass="segment-label--why">
        <TrendChart data={analytics.activity_trend} />
        {!hasEvents && (
          <p style={{ margin: "8px 0 0 0", color: "var(--text-muted)", fontSize: 12 }}>
            Пока накапливаем данные — трекинг просмотров только что включён, график заполнится за несколько дней.
          </p>
        )}
      </Section>

      <Section label="feature usage (30d)">
        <RankBars items={stats.feature_usage} labelKey="event" valueKey="count" empty="Данных за 30 дней пока нет" />
      </Section>

      <Section label="traffic sources" badgeClass="segment-label--example">
        <RankBars items={stats.sources} labelKey="source" valueKey="count" color="var(--seg-example)" empty="Пока нет пользователей" />
      </Section>
    </>
  );
}

function ContentTab({ analytics }) {
  return (
    <>
      <Section label="топ статей (просмотры, 30d)">
        <RankBars
          items={analytics.top_entries}
          labelKey="title"
          valueKey="views"
          subLabel={(it) => SECTION_LABEL[it.section] || it.section}
          empty="Пока нет просмотров — данные появятся по мере использования приложения"
        />
      </Section>

      <Section label="топ инструментов (просмотры, 30d)" badgeClass="segment-label--why">
        <RankBars
          items={analytics.top_tools}
          labelKey="name"
          valueKey="views"
          subLabel={(it) => it.category}
          color="var(--seg-why)"
          empty="Пока нет просмотров"
        />
      </Section>

      <Section label="что ищут (30d)" badgeClass="segment-label--example">
        <RankBars items={analytics.top_searches} labelKey="query" valueKey="count" color="var(--seg-example)" empty="Поисковых запросов пока нет" />
      </Section>

      <Section label="интерес по разделам базы (30d)">
        <RankBars
          items={analytics.section_interest.map((s) => ({ ...s, label: SECTION_LABEL[s.section] || s.section }))}
          labelKey="label"
          valueKey="views"
          empty="Пока нет данных"
        />
      </Section>

      <Section label="топ промптов (копирования)" badgeClass="segment-label--gotcha">
        <RankBars items={analytics.top_prompts} labelKey="title" valueKey="copies_count" subLabel={(it) => it.category} color="var(--seg-gotcha)" empty="Промпты ещё не копировали" />
      </Section>

      <Section label="избранное" badgeClass="segment-label--example">
        <RankBars
          items={analytics.top_favorites}
          labelKey="title"
          valueKey="count"
          subLabel={(it) => FAV_ICON[it.item_type] || it.item_type}
          color="var(--seg-example)"
          empty="Пока никто ничего не сохранил в избранное"
        />
      </Section>

      {(analytics.top_liked.length > 0 || analytics.top_disliked.length > 0) && (
        <Section label="рейтинг статей" badgeClass="segment-label--what">
          {analytics.top_liked.length > 0 && (
            <>
              <p style={{ margin: "0 0 8px 0", fontSize: 11, color: "var(--seg-what)", fontFamily: "var(--font-mono)" }}>ЛУЧШИЕ</p>
              {analytics.top_liked.map((e) => (
                <RatingRow key={e.slug} title={e.title} likes={e.likes} dislikes={e.dislikes} />
              ))}
            </>
          )}
          {analytics.top_disliked.length > 0 && (
            <>
              <p style={{ margin: "12px 0 8px 0", fontSize: 11, color: "var(--error)", fontFamily: "var(--font-mono)" }}>ТРЕБУЮТ ДОРАБОТКИ</p>
              {analytics.top_disliked.map((e) => (
                <RatingRow key={e.slug} title={e.title} likes={e.likes} dislikes={e.dislikes} />
              ))}
            </>
          )}
        </Section>
      )}
    </>
  );
}

function UsersTab({ users }) {
  return (
    <div className="card" style={{ padding: 12, overflowX: "auto", maxHeight: 500, overflowY: "auto" }}>
      {users.length > 0 ? (
        users.map((u) => (
          <div
            key={u.tg_id}
            style={{
              padding: "8px 0",
              borderBottom: "1px solid var(--border)",
              fontFamily: "var(--font-mono)",
              fontSize: 12,
              lineHeight: "1.4em",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <div style={{ color: "var(--text-heading)", fontWeight: "bold" }}>
                {u.username ? `@${u.username}` : `tg_id: ${u.tg_id}`}
              </div>
              <div style={{ color: "var(--text-muted)", fontSize: 11, marginTop: 2 }}>
                seen: {u.first_seen?.slice(0, 10)} · active: {u.last_seen?.slice(0, 10)}
              </div>
            </div>
            <div>
              <span className={`chip ${u.is_subscribed ? "chip--editors" : ""}`} style={{ fontSize: 10, padding: "2px 6px" }}>
                {u.is_subscribed ? "sub" : "no_sub"}
              </span>
            </div>
          </div>
        ))
      ) : (
        <p style={{ margin: 0, color: "var(--text-muted)", fontSize: 14 }}>Пользователи отсутствуют</p>
      )}
    </div>
  );
}

function LiveTab({ events }) {
  return (
    <div className="card" style={{ padding: 12, overflowX: "auto", maxHeight: 500, overflowY: "auto" }}>
      {events.length > 0 ? (
        events.map((e) => (
          <div
            key={e.id}
            style={{
              padding: "8px 0",
              borderBottom: "1px solid var(--border)",
              fontFamily: "var(--font-mono)",
              fontSize: 12,
              lineHeight: "1.4em",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-muted-dim)", marginBottom: 2 }}>
              <span>{e.created_at?.slice(11, 19)} ({e.created_at?.slice(0, 10)})</span>
              <span style={{ color: "var(--accent)" }}>{e.username ? `@${e.username}` : `id:${e.tg_id}`}</span>
            </div>
            <div>
              <span style={{ color: "var(--text-heading)", fontWeight: "bold" }}>{e.event}</span>
              {e.payload && Object.keys(e.payload).length > 0 && (
                <span style={{ color: "var(--text-muted)", marginLeft: 6, fontSize: 11 }}>{JSON.stringify(e.payload)}</span>
              )}
            </div>
          </div>
        ))
      ) : (
        <p style={{ margin: 0, color: "var(--text-muted)", fontSize: 14 }}>Событий не зафиксировано</p>
      )}
    </div>
  );
}
