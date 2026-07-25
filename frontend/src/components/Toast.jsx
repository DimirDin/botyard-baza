import { useEffect, useState } from "react";
import { setToastListener } from "../lib/toast";

export function ToastContainer() {
  const [toast, setToast] = useState(null);

  useEffect(() => {
    setToastListener((newToast) => {
      setToast(newToast);
    });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      setToast(null);
    }, 2400);
    return () => clearTimeout(timer);
  }, [toast]);

  if (!toast) return null;

  return (
    <div className="toast-notification" key={toast.id} role="status">
      <span className="toast-notification__icon">
        {toast.type === "success" ? "✓" : toast.type === "error" ? "✕" : "ℹ"}
      </span>
      <span className="toast-notification__text">{toast.message}</span>
    </div>
  );
}
