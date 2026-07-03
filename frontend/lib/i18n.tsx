"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type Lang = "en" | "es";
const STORAGE_KEY = "genlegal_language";

/**
 * Scope note: this covers the highest-traffic chrome (sidebar navigation,
 * every page's title/subtitle, and the entire Settings page) rather than
 * 100% of every string in the app. Translating every label in every card
 * and table across 8 pages is a much larger, ongoing i18n effort - exactly
 * the kind of "hard / needs more infrastructure" scope that was explicitly
 * cut earlier. This gives a real, working language switch rather than a
 * half-translated app that only looks complete.
 */
const DICTIONARY = {
  "nav.dashboard": { en: "Dashboard", es: "Panel" },
  "nav.analyze": { en: "Analyze Contract", es: "Analizar Contrato" },
  "nav.documents": { en: "Documents", es: "Documentos" },
  "nav.history": { en: "History", es: "Historial" },
  "nav.analytics": { en: "Analytics", es: "Estadísticas" },
  "nav.settings": { en: "Settings", es: "Configuración" },
  "nav.disconnect": { en: "Disconnect Wallet", es: "Desconectar Billetera" },
  "nav.about": { en: "About GenLegal AI", es: "Acerca de GenLegal AI" },

  "common.connectWallet": { en: "Connect Wallet", es: "Conectar Billetera" },
  "common.home": { en: "Home", es: "Inicio" },

  "dashboard.title": { en: "Dashboard", es: "Panel" },
  "dashboard.subtitle": { en: "Overview of your contract analyses", es: "Resumen de tus análisis de contratos" },
  "dashboard.newAnalysis": { en: "Analyze New Contract", es: "Analizar Nuevo Contrato" },

  "analyze.title": { en: "Analyze Contract", es: "Analizar Contrato" },
  "analyze.subtitle": {
    en: "Paste your contract text below. The AI will analyze it and store the results on GenLayer.",
    es: "Pega el texto de tu contrato abajo. La IA lo analizará y guardará los resultados en GenLayer.",
  },

  "documents.title": { en: "Documents", es: "Documentos" },
  "documents.subtitle": {
    en: "Search every analysis stored on-chain by name, ID, wallet, or transaction hash.",
    es: "Busca cualquier análisis guardado en la blockchain por nombre, ID, billetera o hash de transacción.",
  },

  "history.title": { en: "History", es: "Historial" },
  "history.subtitle": {
    en: "The full chronological record of every analysis ever submitted to this contract.",
    es: "El registro cronológico completo de todos los análisis enviados a este contrato.",
  },

  "analytics.title": { en: "Analytics", es: "Estadísticas" },
  "analytics.subtitle": {
    en: "Aggregate stats across every analysis on-chain - no wallet required.",
    es: "Estadísticas agregadas de todos los análisis en la blockchain - no requiere billetera.",
  },

  "settings.title": { en: "Settings", es: "Configuración" },
  "settings.subtitle": {
    en: "Wallet, network, appearance, and application information.",
    es: "Billetera, red, apariencia e información de la aplicación.",
  },
  "settings.appearance": { en: "Appearance", es: "Apariencia" },
  "settings.dark": { en: "Dark", es: "Oscuro" },
  "settings.light": { en: "Light", es: "Claro" },
  "settings.system": { en: "System", es: "Sistema" },
  "settings.wallet": { en: "Wallet", es: "Billetera" },
  "settings.connectedWallet": { en: "Connected Wallet", es: "Billetera Conectada" },
  "settings.noWallet": { en: "No wallet connected.", es: "Ninguna billetera conectada." },
  "settings.language": { en: "Language", es: "Idioma" },
  "settings.notifications": { en: "Notifications", es: "Notificaciones" },
  "settings.enableNotifications": { en: "Enable Notifications", es: "Activar Notificaciones" },
  "settings.transactionAlerts": { en: "Transaction Alerts", es: "Alertas de Transacción" },
  "settings.analysisCompletedAlerts": { en: "Analysis Completed Alerts", es: "Alertas de Análisis Completado" },
  "settings.blockchain": { en: "Blockchain", es: "Blockchain" },
  "settings.network": { en: "Network", es: "Red" },
  "settings.rpcEndpoint": { en: "RPC Endpoint", es: "Endpoint RPC" },
  "settings.contractAddress": { en: "Contract Address", es: "Dirección del Contrato" },
  "settings.sdkVersion": { en: "genlayer-js SDK", es: "SDK genlayer-js" },
  "settings.application": { en: "Application", es: "Aplicación" },
  "settings.appVersion": { en: "Application Version", es: "Versión de la Aplicación" },
  "settings.connectionStatus": { en: "Connection Status", es: "Estado de Conexión" },
  "settings.connected": { en: "Connected", es: "Conectado" },
  "settings.notConnected": { en: "Not Connected", es: "No Conectado" },
  "settings.saveSettings": { en: "Save Settings", es: "Guardar Configuración" },
  "settings.saved": { en: "Settings saved successfully.", es: "Configuración guardada exitosamente." },
} as const;

export type DictKey = keyof typeof DICTIONARY;

interface Ctx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: DictKey) => string;
}

const LanguageContext = createContext<Ctx | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Lang | null;
    if (stored === "en" || stored === "es") setLangState(stored);
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem(STORAGE_KEY, l);
  };

  const t = (key: DictKey) => DICTIONARY[key]?.[lang] ?? DICTIONARY[key]?.en ?? key;

  return <LanguageContext.Provider value={{ lang, setLang, t }}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within a LanguageProvider");
  return ctx;
}
