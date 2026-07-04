"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";

export type ThemeMode = "dark" | "light" | "system";
const STORAGE_KEY = "genlegal_theme";

function resolveSystemPrefersLight(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-color-scheme: light)").matches;
}

function applyThemeClass(mode: ThemeMode) {
  const isLight = mode === "light" || (mode === "system" && resolveSystemPrefersLight());
  document.documentElement.classList.toggle("light", isLight);
}

interface ThemeContextValue {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>("dark");

  useEffect(() => {
    const stored = (localStorage.getItem(STORAGE_KEY) as ThemeMode | null) || "dark";
    setModeState(stored);
    applyThemeClass(stored);

    const mq = window.matchMedia("(prefers-color-scheme: light)");
    const onChange = () => {
      const current = (localStorage.getItem(STORAGE_KEY) as ThemeMode | null) || "dark";
      if (current === "system") applyThemeClass("system");
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    localStorage.setItem(STORAGE_KEY, next);
    applyThemeClass(next);
  }, []);

  return <ThemeContext.Provider value={{ mode, setMode }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}
