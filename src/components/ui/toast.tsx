"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

type ToastItem = {
  id: string;
  message: string;
};

type ToastContextValue = {
  toast: (message: string) => void;
  toasts: ToastItem[];
  dismiss: (id: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const toast = useCallback((message: string) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev, { id, message }]);
    setTimeout(() => dismiss(id), 2600);
  }, [dismiss]);

  const value = useMemo(() => ({ toast, toasts, dismiss }), [toast, toasts, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return ctx.toast;
}

function ToastViewport({
  toasts,
  onDismiss,
}: {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}) {
  return (
    <div className="pointer-events-none fixed right-4 top-4 z-50 flex flex-col gap-2">
      {toasts.map((item) => (
        <div
          key={item.id}
          className="pointer-events-auto rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-sm text-ink shadow"
          onClick={() => onDismiss(item.id)}
          role="status"
          aria-live="polite"
        >
          {item.message}
        </div>
      ))}
    </div>
  );
}
