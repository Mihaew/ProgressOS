import { createSignal, For } from "solid-js";

export const [toasts, setToasts] = createSignal([]);
let nextId = 0;

export const addToast = (message, type = "info", duration = 4000) => {
  const id = nextId++;
  setToasts(prev => [...prev, { id, message, type }]);
  if (duration > 0) {
    setTimeout(() => removeToast(id), duration);
  }
  return id;
};

export const removeToast = (id) => {
  setToasts(prev => prev.filter(t => t.id !== id));
};


const ICONS = {
  info:    "ℹ",
  success: "✓",
  warning: "⚠",
  error:   "✕",
};

export default function Toast() {
  return (
    <div class="toast-stack">
      <For each={toasts()}>
        {(toast) => (
          <div class={`toast-item toast-item--${toast.type}`} role="alert">
            <span class="toast-item__icon">{ICONS[toast.type] ?? ICONS.info}</span>
            <span class="toast-item__message">{toast.message}</span>
            <button class="toast-item__close" onClick={() => removeToast(toast.id)} aria-label="Dismiss">✕</button>
          </div>
        )}
      </For>
    </div>
  );
}