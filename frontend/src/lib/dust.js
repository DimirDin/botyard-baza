// Угольки: тёплые частицы, всплывающие вверх с боковым дрейфом.
// Настроение то же, что у видео-фона, но 3 КБ вместо 439 —
// поэтому именно этот вариант стоит на длинных списках и статьях.

const COLORS = [
  [224, 130, 86],
  [242, 176, 116],
  [255, 214, 160],
];

const AREA_PER_PARTICLE = 2200;

export function createDust({ width, height }) {
  const count = Math.round((width * height) / AREA_PER_PARTICLE);
  return Array.from({ length: count }, () => {
    const bokeh = Math.random() < 0.2;
    return {
      x: Math.random() * width,
      y: Math.random() * height,
      r: bokeh ? 5 + Math.random() * 11 : 0.7 + Math.random() * 1.8,
      bokeh,
      vy: -(0.08 + Math.random() * 0.32),
      sway: 0.2 + Math.random() * 0.5,
      phase: Math.random() * Math.PI * 2,
      alpha: bokeh ? 0.2 + Math.random() * 0.3 : 0.4 + Math.random() * 0.5,
      color: COLORS[(Math.random() * COLORS.length) | 0],
    };
  });
}

export function stepDust(particles, dt, width, height) {
  for (const p of particles) {
    p.y += p.vy * dt;
    p.phase += 0.012 * dt;
    if (p.y < -12) {
      p.y = height + 12;
      p.x = Math.random() * width;
    }
  }
}
