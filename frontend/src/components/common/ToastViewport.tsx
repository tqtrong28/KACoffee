import { useToastStore } from "../../features/toast/toastStore";

export function ToastViewport() {
  const { items, dismissToast } = useToastStore();

  return (
    <div className="toast-viewport" aria-live="polite" aria-atomic="true">
      {items.map((toast) => (
        <div key={toast.id} className={`toast-card ${toast.tone}`}>
          <span>{toast.message}</span>
          <button type="button" className="toast-close" onClick={() => dismissToast(toast.id)}>
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
