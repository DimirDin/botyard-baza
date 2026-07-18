// Лёгкий батч-трекер: копит события и шлёт через POST /api/events (см. backend/app/routers/events.py).
// Fire-and-forget — аналитика никогда не должна ломать UX, ошибки сети молча глотаются.
import { api } from "./api";

const FLUSH_DELAY_MS = 2000;
const MAX_BATCH = 5;

let queue = [];
let timer = null;

function flush() {
  clearTimeout(timer);
  timer = null;
  if (!queue.length) return;
  const batch = queue.splice(0, queue.length);
  api.logEvents(batch).catch(() => {});
}

export function trackEvent(event, payload = {}) {
  queue.push({ event, payload });
  if (queue.length >= MAX_BATCH) {
    flush();
    return;
  }
  clearTimeout(timer);
  timer = setTimeout(flush, FLUSH_DELAY_MS);
}

if (typeof window !== "undefined") {
  window.addEventListener("pagehide", flush);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flush();
  });
}
