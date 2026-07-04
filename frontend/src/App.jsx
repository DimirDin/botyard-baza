import { useEffect, useState } from "react";
import { BottomNav } from "./components/BottomNav";
import { ErrorState } from "./components/States";
import { GateScreen } from "./screens/GateScreen";
import { HomeScreen } from "./screens/HomeScreen";
import { EntriesListScreen } from "./screens/EntriesListScreen";
import { EntryScreen } from "./screens/EntryScreen";
import { ToolsListScreen } from "./screens/ToolsListScreen";
import { PromptsListScreen } from "./screens/PromptsListScreen";
import { CalculatorScreen } from "./screens/CalculatorScreen";
import { SearchScreen } from "./screens/SearchScreen";
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

  const TABS = { base: "base", tools: "tools", prompts: "prompts", calc: "calc", search: "search" };
  const activeTab = TABS[screen] || (screen === "entry" ? "base" : null);

  return (
    <>
      {screen === "home" && <HomeScreen onNavigate={navigate} />}
      {screen === "base" && <EntriesListScreen onOpenEntry={(slug) => navigate("entry", slug)} />}
      {screen === "entry" && <EntryScreen slug={screenParam} />}
      {screen === "tools" && <ToolsListScreen />}
      {screen === "prompts" && <PromptsListScreen />}
      {screen === "calc" && <CalculatorScreen />}
      {screen === "search" && <SearchScreen onOpenEntry={(slug) => navigate("entry", slug)} />}

      <BottomNav active={activeTab} onSelect={(tab) => navigate(tab)} />
    </>
  );
}
