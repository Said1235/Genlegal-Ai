"use client";

import React, { createContext, useCallback, useContext, useState, ReactNode } from "react";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";
import { cx } from "./utils";

type ToastType = "success" | "error" | "info";
interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);
let nextId = 1;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((message: string, type: ToastType = "info") => {
    const id = nextId++;
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
    }, 3500);
  }, []);

  const dismiss = (id: number) => setToasts((t) => t.filter((x) => x.id !== id));

  const icons: Record<ToastType, typeof CheckCircle2> = {
    success: CheckCircle2,
    error: XCircle,
    info: Info,
  };
  const colors: Record<ToastType, string> = {
    success: "border-emerald-500/30 text-emerald-300",
    error: "border-rose-500/30 text-rose-300",
    info: "border-accent/30 text-accent-light",
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="pointer-events-none fixed bottom-5 right-5 z-[100] flex w-[min(90vw,360px)] flex-col gap-2">
        {toasts.map((t) => {
          const Icon = icons[t.type];
          return (
            <div
              key={t.id}
              className={cx(
                "pointer-events-auto flex items-start gap-2.5 rounded-xl border bg-bg-card/95 px-4 py-3 text-sm shadow-lg backdrop-blur",
                colors[t.type]
              )}
            >
              <Icon className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <span className="flex-1 text-white/85">{t.message}</span>
              <button onClick={() => dismiss(t.id)} className="text-white/30 hover:text-white/60">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
}
