import { useEffect, useRef, useState } from "react";

// Живые счётчики Home — powerline-сегменты, цвета из design tokens (§13 PROJECT_CONTEXT).
// Только собственные, честные числа из своей БД/Redis — никакой внешней "рыночной" статистики тут.
function useCountUp(target, duration = 1000) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (target == null) return;
    let raf;
    let start = null;
    const step = (ts) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setValue(Math.round(eased * target));
      if (progress < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return value;
}

function Segment({ color, value, label }) {
  const count = useCountUp(value);
  if (value == null) return null;
  return (
    <span
      className="chip stat"
      style={{
        cursor: "default",
        background: `color-mix(in srgb, ${color} 18%, transparent)`,
        color,
      }}
    >
      {count.toLocaleString("ru-RU")} {label}
    </span>
  );
}

export function StatsBar({ stats }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!ref.current || visible) return;
    const el = ref.current;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [visible]);

  if (!stats) return null;

  return (
    <section ref={ref} style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24 }}>
      {visible && (
        <>
          <Segment color="#6fcf97" value={stats.entries_count} label="статей" />
          <Segment color="#5aa9e6" value={stats.tools_count} label="инструментов" />
          <Segment color="#b98af0" value={stats.prompts_count} label="промптов" />
          <Segment color="#e0714f" value={stats.total_copies} label="копирований" />
          <Segment color="#d97757" value={stats.subscribers} label="подписчиков" />
        </>
      )}
    </section>
  );
}
