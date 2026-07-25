import { triggerHaptic } from "./telegram";

let toastListener = null;

export function showToast(message, type = "info") {
  if (type === "success") triggerHaptic("success");
  else if (type === "error") triggerHaptic("error");
  else triggerHaptic("selection");

  if (toastListener) toastListener({ id: Date.now(), message, type });
}

export function setToastListener(fn) {
  toastListener = fn;
}
