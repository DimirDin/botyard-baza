import { useEffect, useState } from "react";
import { PromptLine } from "../components/PromptLine";
import { Spinner, ErrorState } from "../components/States";
import { api } from "../lib/api";

export function AdminScreen({ onBack }) {
  const [activeTab, setActiveTab] = useState("events"); // events | users
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadData = () => {
    setLoading(true);
    setError(false);
    Promise.all([
      api.adminStats(),
      api.adminUsers(),
      api.adminEvents()
    ])
      .then(([statsRes, usersRes, eventsRes]) => {
        setStats(statsRes);
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

        {!loading && !error && stats && (
          <>
            {/* Grid of basic stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12, marginBottom: 20 }}>
              <div className="card" style={{ padding: 12, margin: 0 }}>
                <p style={{ margin: 0, color: "var(--text-muted-dim)", fontSize: 12, fontFamily: "var(--font-mono)" }}>TOTAL_USERS</p>
                <p style={{ margin: "4px 0 0 0", color: "var(--accent)", fontSize: 20, fontWeight: "bold", fontFamily: "var(--font-mono)" }}>
                  {stats.total_users}
                </p>
              </div>
              <div className="card" style={{ padding: 12, margin: 0 }}>
                <p style={{ margin: 0, color: "var(--text-muted-dim)", fontSize: 12, fontFamily: "var(--font-mono)" }}>SUBSCRIBED</p>
                <p style={{ margin: "4px 0 0 0", color: "var(--accent)", fontSize: 20, fontWeight: "bold", fontFamily: "var(--font-mono)" }}>
                  {stats.subscribed_users} <span style={{ fontSize: 13, fontWeight: "normal", color: "var(--text-muted)" }}>({getSubRate()})</span>
                </p>
              </div>
              <div className="card" style={{ padding: 12, margin: 0 }}>
                <p style={{ margin: 0, color: "var(--text-muted-dim)", fontSize: 12, fontFamily: "var(--font-mono)" }}>ACTIVE_DAU</p>
                <p style={{ margin: "4px 0 0 0", color: "var(--accent)", fontSize: 20, fontWeight: "bold", fontFamily: "var(--font-mono)" }}>
                  {stats.dau}
                </p>
              </div>
              <div className="card" style={{ padding: 12, margin: 0 }}>
                <p style={{ margin: 0, color: "var(--text-muted-dim)", fontSize: 12, fontFamily: "var(--font-mono)" }}>ACTIVE_WAU</p>
                <p style={{ margin: "4px 0 0 0", color: "var(--accent)", fontSize: 20, fontWeight: "bold", fontFamily: "var(--font-mono)" }}>
                  {stats.wau}
                </p>
              </div>
            </div>

            {/* Feature Usage Analytics */}
            <section style={{ marginBottom: 24 }}>
              <span className="segment-label segment-label--gotcha">feature usage (30d)</span>
              <div className="card" style={{ padding: "16px 12px", marginTop: 8 }}>
                {stats.feature_usage && stats.feature_usage.length > 0 ? (
                  stats.feature_usage.map((f) => {
                    const maxCount = stats.feature_usage[0].count || 1;
                    const percent = Math.round((f.count / maxCount) * 100);
                    return (
                      <div key={f.event} style={{ marginBottom: 12 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontFamily: "var(--font-mono)" }}>
                          <span style={{ color: "var(--text-body)" }}>{f.event}</span>
                          <span style={{ color: "var(--accent)" }}>{f.count}</span>
                        </div>
                        <div className="guide-progress" style={{ marginTop: 4 }}>
                          <div className="guide-progress__bar" style={{ height: 6 }}>
                            <div className="guide-progress__fill" style={{ width: `${percent}%`, height: 6 }} />
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p style={{ margin: 0, color: "var(--text-muted)", fontSize: 14 }}>Данных за 30 дней пока нет</p>
                )}
              </div>
            </section>

            {/* Tabs for details */}
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              <button
                onClick={() => setActiveTab("events")}
                className={`chip ${activeTab === "events" ? "chip--active" : ""}`}
                style={{ flex: 1, padding: "8px 0", border: "none", borderRadius: 6, cursor: "pointer", fontFamily: "var(--font-mono)" }}
              >
                📡 live log ({events.length})
              </button>
              <button
                onClick={() => setActiveTab("users")}
                className={`chip ${activeTab === "users" ? "chip--active" : ""}`}
                style={{ flex: 1, padding: "8px 0", border: "none", borderRadius: 6, cursor: "pointer", fontFamily: "var(--font-mono)" }}
              >
                👥 users ({users.length})
              </button>
            </div>

            {/* TAB: Events log */}
            {activeTab === "events" && (
              <div className="card" style={{ padding: 12, overflowX: "auto", maxHeight: 400, overflowY: "auto" }}>
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
                        <span style={{ color: "var(--accent)" }}>
                          {e.username ? `@${e.username}` : `id:${e.tg_id}`}
                        </span>
                      </div>
                      <div>
                        <span style={{ color: "var(--text-heading)", fontWeight: "bold" }}>{e.event}</span>
                        {e.payload && Object.keys(e.payload).length > 0 && (
                          <span style={{ color: "var(--text-muted)", marginLeft: 6, fontSize: 11 }}>
                            {JSON.stringify(e.payload)}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p style={{ margin: 0, color: "var(--text-muted)", fontSize: 14 }}>Событий не зафиксировано</p>
                )}
              </div>
            )}

            {/* TAB: Users list */}
            {activeTab === "users" && (
              <div className="card" style={{ padding: 12, overflowX: "auto", maxHeight: 400, overflowY: "auto" }}>
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
                        alignItems: "center"
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
            )}
          </>
        )}
      </div>
    </>
  );
}
