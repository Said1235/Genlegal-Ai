"use client";

import { WalletProvider } from "@/lib/genlayer/WalletProvider";
import { ToastProvider } from "@/lib/toast";
import { ThemeProvider } from "@/lib/theme";
import { LanguageProvider } from "@/lib/i18n";
import { NotificationSettingsProvider } from "@/lib/notifications";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <NotificationSettingsProvider>
          <WalletProvider>
            <ToastProvider>{children}</ToastProvider>
          </WalletProvider>
        </NotificationSettingsProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
