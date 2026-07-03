"use client";

import { Inbox, AlertTriangle, RefreshCw } from "lucide-react";

export function EmptyState({ icon: Icon = Inbox, message }: { icon?: typeof Inbox; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center text-white/35">
      <Icon className="h-8 w-8" />
      <p className="max-w-xs text-sm">{message}</p>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-rose-500/20 bg-rose-500/5 py-12 text-center">
      <AlertTriangle className="h-7 w-7 text-rose-400" />
      <p className="max-w-sm text-sm text-rose-200/80">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-1 flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2 text-xs font-medium text-white/70 transition hover:bg-white/5"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Retry
        </button>
      )}
    </div>
  );
}
