"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";

export interface NotificationSettings {
  enabled: boolean;
  transactionAlerts: boolean;
  analysisCompletedAlerts: boolean;
}

const DEFAULTS: NotificationSettings = {
  enabled: true,
  transactionAlerts: true,
  analysisCompletedAlerts: true,
};

const STORAGE_KEY = "genlegal_notification_settings";

interface Ctx {
  settings: NotificationSettings;
  setSettings: (s: NotificationSettings) => void;
  /** True if this specific kind of notification should actually fire. */
  isEnabled: (kind: "transaction" | "analysisCompleted" | "general") => boolean;
}

const NotificationSettingsContext = createContext<Ctx | undefined>(undefined);

export function NotificationSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettingsState] = useState<NotificationSettings>(DEFAULTS);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setSettingsState({ ...DEFAULTS, ...JSON.parse(stored) });
    } catch {
      // ignore malformed storage
    }
  }, []);

  const setSettings = (s: NotificationSettings) => {
    setSettingsState(s);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  };

  const isEnabled = (kind: "transaction" | "analysisCompleted" | "general") => {
    if (!settings.enabled) return false;
    if (kind === "transaction") return settings.transactionAlerts;
    if (kind === "analysisCompleted") return settings.analysisCompletedAlerts;
    return true;
  };

  return (
    <NotificationSettingsContext.Provider value={{ settings, setSettings, isEnabled }}>
      {children}
    </NotificationSettingsContext.Provider>
  );
}

export function useNotificationSettings() {
  const ctx = useContext(NotificationSettingsContext);
  if (!ctx) throw new Error("useNotificationSettings must be used within a NotificationSettingsProvider");
  return ctx;
}
