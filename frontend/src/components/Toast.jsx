import { useEffect } from "react";

export function Toast({ message, error = false, onDone }) {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(onDone, 2000);
    return () => clearTimeout(t);
  }, [message, onDone]);

  if (!message) return null;
  return (
    <div className={`toast ${error ? "toast--error" : ""}`}>
      {error ? "✗" : "✓"} {message} {error ? "(exit 1)" : "(exit 0)"}
    </div>
  );
}
