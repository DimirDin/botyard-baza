import { useEffect, useState } from "react";
import { BottomNav } from "./components/BottomNav";
import { ErrorState, Spinner, SessionExpiredState } from "./components/States";
import { GateScreen } from "./screens/GateScreen";
import { HomeScreen } from "./screens/HomeScreen";
import { EntriesListScreen } from "./screens/EntriesListScreen";
import { EntryScreen } from "./screens/EntryScreen";
import { ToolsListScreen } from "./screens/ToolsListScreen";
import { ToolDetail } from "./screens/ToolDetail";
import { ComponentDetail } from "./screens/ComponentDetail";
import { PromptsListScreen } from "./screens/PromptsListScreen";
import { CalculatorScreen } from "./screens/CalculatorScreen";
import { FavoritesScreen } from "./screens/FavoritesScreen";
import { SearchScreen } from "./screens/SearchScreen";
import { GuideTrack } from "./components/GuideTrack";
import { AdminScreen } from "./screens/AdminScreen";
import { AmbientBackground } from "./components/AmbientBackground";
import { api, setAuthErrorHandler } from "./lib/api";
import { initTelegram, getStartParam, onBackButton, hideBackButton, closeApp } from "./lib/telegram";
import { ToastContainer } from "./components/Toast";

// deep link: entry_{slug} | tool_{id} | prompt_{id} | section_{name} — §16 PROJECT_CONTEXT
function resolveStartParam(param) {
  if (!param) return null;
  const [type, ...rest] = param.split("_");
  const id = rest.join("_");
  if (type === "entry") return { screen: "entry", params: id };
  if (type === "section") return { screen: "base" };
  if (type === "prompt") return { screen: "prompts" };
  if (type === "tool") return id ? { screen: "tool", params: id } : { screen: "tools" };
  if (type === "guide") return { screen: "guide", params: id ? { slug: id } : undefined };
  if (type === "search") return { screen: "search" };
  // "Калькулятор" убран из BottomNav, но экран и API остаются рабочими для прямых ссылок.
  if (type === "calc") return { screen: "calc" };
  return null;
}

// src_{ключ} — метка источника трафика (t.me/bazadry_bot?start=src_vcru), не контентный
// deep link: не превращается в навигацию, только отправляется в gate/check при первом визите.
function resolveSourceParam(param) {
  if (!param || !param.startsWith("src_")) return null;
  return param.slice("src_".length) || null;
}

export default function App() {
  const [gateState, setGateState] = useState("checking"); // checking | blocked | ok | error | expired
  const [home, setHome] = useState(null);
  const [user, setUser] = useState(null);
  const [screen, setScreen] = useState("home");
  const [screenParam, setScreenParam] = useState(null);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    // Ставим перехватчик до первого запроса: 401/403 может прилететь
    // от любой ручки в любой момент сессии, а не только на старте.
    //   401 — initData протух (старше часа), нужен перезапуск приложения;
    //   403 — подписки больше нет, место человека на гейте.
    setAuthErrorHandler((status) => {
      setGateState(status === 401 ? "expired" : "blocked");
    });
    initTelegram();
    const startParam = getStartParam();
    api
      .gateCheck(resolveSourceParam(startParam))
      .then((res) => {
        setGateState(res.subscribed ? "ok" : "blocked");
        if (res.user) setUser(res.user);
        if (res.subscribed) {
          const deepLink = resolveStartParam(startParam);
          if (deepLink) navigate(deepLink.screen, deepLink.params, false);
        }
      })
      .catch((err) => {
        // Порядок важен: перехватчик в api.js уже выставил "expired"/"blocked"
        // ДО броска, и безусловный setGateState("error") затирал бы его —
        // человек с протухшей сессией видел бы «Не удалось загрузить».
        if (err?.status !== 401 && err?.status !== 403) setGateState("error");
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Ошибку главной больше не глушим: раньше упавший /api/home оставлял
    // пустой экран без единого признака проблемы. 401/403 уже перехвачены
    // выше и сменят gateState сами, остальное показываем как ошибку.
    if (gateState === "ok") {
      api
        .home()
        .then(setHome)
        .catch((err) => {
          if (err?.status !== 401 && err?.status !== 403) setGateState("error");
        });
    }
  }, [gateState]);

  const navigate = (next, params = null, pushHistory = true) => {
    if (pushHistory) setHistory((h) => [...h, { screen, params: screenParam }]);
    setScreen(next);
    setScreenParam(params);
  };

  const goBack = () => {
    setHistory((h) => {
      if (h.length === 0) return h;
      const prev = h[h.length - 1];
      setScreen(prev.screen);
      setScreenParam(prev.params);
      return h.slice(0, -1);
    });
  };

  useEffect(() => {
    if (history.length === 0) {
      hideBackButton();
      return;
    }
    return onBackButton(goBack);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [history.length]);

  if (gateState === "checking") return <div className="page"><Spinner /></div>;
  if (gateState === "error") return <ErrorState onRetry={() => window.location.reload()} />;
  if (gateState === "expired") return <SessionExpiredState onReopen={closeApp} />;
  if (gateState === "blocked") {
    return (
      <>
        <AmbientBackground screen="gate" />
        <GateScreen counts={home?.counts} onRecheckSuccess={() => setGateState("ok")} />
      </>
    );
  }

  const TABS = { base: "base", tools: "tools", prompts: "prompts", guide: "guide", favorites: "favorites" };
  const activeTab = TABS[screen] || (screen === "entry" ? "base" : screen === "tool" || screen === "component" ? "tools" : null);

  return (
    <>
      <AmbientBackground screen={screen} />
      {screen === "home" && <HomeScreen user={user} onNavigate={navigate} />}
      {screen === "admin" && <AdminScreen onBack={goBack} />}
      {screen === "base" && (
        <EntriesListScreen
          initial={screenParam && typeof screenParam === "object" ? screenParam : undefined}
          onOpenEntry={(slug) => navigate("entry", slug)}
          onNavigate={navigate}
        />
      )}
      {screen === "entry" && <EntryScreen slug={screenParam} onBack={history.length ? goBack : null} />}
      {screen === "tools" && (
        <ToolsListScreen
          initial={screenParam && typeof screenParam === "object" ? screenParam : undefined}
          onOpenTool={(slug) => navigate("tool", slug)}
          onOpenComponent={(slug) => navigate("component", slug)}
          onNavigate={navigate}
        />
      )}
      {screen === "tool" && <ToolDetail slug={screenParam} onBack={history.length ? goBack : null} />}
      {screen === "component" && <ComponentDetail slug={screenParam} onBack={history.length ? goBack : null} />}
      {screen === "prompts" && (
        <PromptsListScreen initial={screenParam && typeof screenParam === "object" ? screenParam : undefined} onNavigate={navigate} />
      )}
      {screen === "calc" && <CalculatorScreen />}
      {screen === "guide" && (
        <GuideTrack
          initial={screenParam && typeof screenParam === "object" ? screenParam : undefined}
          onOpenEntry={(slug) => navigate("entry", slug)}
          onOpenTool={(slug) => navigate("tool", slug)}
          onOpenPrompt={(category, slug) => navigate("prompts", { category, slug })}
          onNavigate={navigate}
        />
      )}
      {screen === "search" && (
        <SearchScreen
          onOpenEntry={(slug) => navigate("entry", slug)}
          onOpenTool={(slug) => navigate("tool", slug)}
          onOpenPrompt={(category, slug) => navigate("prompts", { category, slug })}
          onOpenGuide={(level, slug) => navigate("guide", { level, slug })}
          onOpenComponent={(slug) => navigate("component", slug)}
        />
      )}
      {screen === "favorites" && (
        <FavoritesScreen
          onOpenEntry={(slug) => navigate("entry", slug)}
          onOpenTool={(slug) => navigate("tool", slug)}
          onOpenGuide={(level, slug) => navigate("guide", { level, slug })}
          onNavigate={navigate}
        />
      )}

      {screen !== "admin" && <BottomNav active={activeTab} onSelect={(tab) => navigate(tab)} />}
      <ToastContainer />
    </>
  );
}
