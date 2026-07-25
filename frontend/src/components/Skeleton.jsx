export function Skeleton({ lines = 3 }) {
  return (
    <div className="skeleton" aria-hidden="true">
      {Array.from({ length: lines }, (_, i) => (
        <span
          key={i}
          className="skeleton__line"
          style={{ width: i === lines - 1 ? "46%" : "100%" }}
        />
      ))}
    </div>
  );
}

export function SkeletonList({ count = 3 }) {
  return (
    <div className="skeleton-list" role="status" aria-label="Загрузка">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="skeleton-card">
          <span className="skeleton__line skeleton__line--title" />
          <span className="skeleton__line" />
          <span className="skeleton__line" style={{ width: "46%" }} />
        </div>
      ))}
    </div>
  );
}
