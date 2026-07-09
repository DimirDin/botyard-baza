import { useEffect, useState } from "react";
import { BottomNav } from "./components/BottomNav";
import { ErrorState } from "./components/States";
import { GateScreen } from "./screens/GateScreen";
import { HomeScreen } from "./screens/HomeScreen";
import { EntriesListScreen } from "./screens/EntriesListScreen";
import { EntryScreen } from "./screens/EntryScreen";
import { ToolsListScreen } from "./screens/ToolsListScreen";
import { ToolDetail } from "./screens/ToolDetail";
import { PromptsListScreen } from "./screens/PromptsListScreen";
import { CalculatorScreen } from "./screens/CalculatorScreen";
import { FavoritesScreen } from "./screens/FavoritesScreen";
import { SearchScreen } from "./screens/SearchScreen";
import { GuideTrack } from "./components/GuideTrack";
import { api } from "./lib/api";
import { initTelegram, getStartParam, onBackButton, hideBackButton } from "./lib/telegram";

// deep link: entry_{slug} | tool_{id} | prompt_{id} | section_{name} — §16 PROJECT_CONTEXT
function resolveStartParam(param) {
  if (!param) return null;
  const [type, ...rest] = param.split("_");
  const id = rest.join("_");
  if (type === "entry") return { screen: "entry", params: id };
  if (type === "section") return { screen: "base" };
  if (type === "prompt") return { screen: "prompts" };
  if (type === "tool") return { screen: "tools" };
  if (type === "guide") return { screen: "guide", params: id ? { slug: id } : undefined };
  // "Калькулятор" убран из BottomNav, но экран и API остаются рабочими для прямых ссылок.
  if (type === "calc") return { screen: "calc" };
  return null;
}

export default function App() {
  const [gateState, setGateState] = useState("checking"); // checking | blocked | ok | error
  const [home, setHome] = useState(null);
  const [screen, setScreen] = useState("home");
  const [screenParam, setScreenParam] = useState(null);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    initTelegram();
    api
      .gateCheck()
      .then((res) => {
        setGateState(res.subscribed ? "ok" : "blocked");
        if (res.subscribed) {
          const deepLink = resolveStartParam(getStartParam());
          if (deepLink) navigate(deepLink.screen, deepLink.params, false);
        }
      })
      .catch(() => setGateState("error"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (gateState === "ok") api.home().then(setHome).catch(() => {});
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

  if (gateState === "checking") return <div className="spinner">⠋⠙⠸ проверяю доступ...</div>;
  if (gateState === "error") return <ErrorState onRetry={() => window.location.reload()} />;
  if (gateState === "blocked") {
    return <GateScreen counts={home?.counts} onRecheckSuccess={() => setGateState("ok")} />;
  }

  const TABS = { base: "base", tools: "tools", prompts: "prompts", guide: "guide", favorites: "favorites" };
  const activeTab = TABS[screen] || (screen === "entry" ? "base" : screen === "tool" ? "tools" : null);

  return (
    <>
      {screen === "home" && <HomeScreen onNavigate={navigate} />}
      {screen === "base" && (
        <EntriesListScreen
          initial={screenParam && typeof screenParam === "object" ? screenParam : undefined}
          onOpenEntry={(slug) => navigate("entry", slug)}
        />
      )}
      {screen === "entry" && <EntryScreen slug={screenParam} onBack={history.length ? goBack : null} />}
      {screen === "tools" && <ToolsListScreen onOpenTool={(slug) => navigate("tool", slug)} />}
      {screen === "tool" && <ToolDetail slug={screenParam} onBack={history.length ? goBack : null} />}
      {screen === "prompts" && (
        <PromptsListScreen initial={screenParam && typeof screenParam === "object" ? screenParam : undefined} />
      )}
      {screen === "calc" && <CalculatorScreen />}
      {screen === "guide" && (
        <GuideTrack
          initial={screenParam && typeof screenParam === "object" ? screenParam : undefined}
          onOpenEntry={(slug) => navigate("entry", slug)}
        />
      )}
      {screen === "search" && <SearchScreen onOpenEntry={(slug) => navigate("entry", slug)} />}
      {screen === "favorites" && (
        <FavoritesScreen
          onOpenEntry={(slug) => navigate("entry", slug)}
          onOpenTool={(slug) => navigate("tool", slug)}
        />
      )}

      <BottomNav active={activeTab} onSelect={(tab) => navigate(tab)} />
    </>
  );
}
