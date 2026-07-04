"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Wallet,
  Copy,
  Globe,
  Server,
  FileCode2,
  Github,
  Info,
  Loader2,
  LogOut,
  Moon,
  Sun,
  Monitor,
  Save,
  Wifi,
  WifiOff,
} from "lucide-react";
import { DisconnectModal } from "@/components/dashboard/DisconnectModal";
import { useWallet } from "@/lib/genlayer/WalletProvider";
import { useToast } from "@/lib/toast";
import { useTheme, type ThemeMode } from "@/lib/theme";
import { useLanguage, type Lang } from "@/lib/i18n";
import { useNotificationSettings } from "@/lib/notifications";
import { GENLAYER_CHAIN, GENLAYER_NETWORK, getContractAddress } from "@/lib/genlayer/client";
import { copyToClipboard, formatAddress, cx } from "@/lib/utils";
import { GITHUB_REPO_URL, APP_VERSION } from "@/lib/constants";

const GENLAYER_JS_VERSION = "1.1.8";

export default function SettingsPage() {
  const { t } = useLanguage();

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight">{t("settings.title")}</h1>
        <p className="mt-1 text-sm text-white/40">{t("settings.subtitle")}</p>
      </div>
      <AppearanceSection />
      <WalletSection />
      <LanguageSection />
      <NotificationsSection />
      <BlockchainSection />
      <AboutSection />
    </div>
  );
}

// ── Appearance ─────────────────────────────────────────────────────────────

function AppearanceSection() {
  const { mode, setMode } = useTheme();
  const { t } = useLanguage();
  const { showToast } = useToast();
  const [pending, setPending] = useState<ThemeMode>(mode);

  useEffect(() => { setPending(mode); }, [mode]);

  const THEMES: { key: ThemeMode; icon: typeof Moon; label: string }[] = [
    { key: "dark", icon: Moon, label: t("settings.dark") },
    { key: "light", icon: Sun, label: t("settings.light") },
    { key: "system", icon: Monitor, label: t("settings.system") },
  ];

  const save = () => {
    setMode(pending);
    showToast(t("settings.saved"), "success");
  };

  return (
    <Section icon={Sun} title={t("settings.appearance")}>
      <div className="flex gap-2">
        {THEMES.map(({ key, icon: Icon, label }) => (
          <button
            key={key}
            onClick={() => setPending(key)}
            className={cx(
              "flex flex-1 flex-col items-center gap-2 rounded-xl border py-3 text-xs font-medium transition",
              pending === key
                ? "border-accent bg-accent/10 text-accent-light"
                : "border-white/8 text-white/40 hover:border-white/20 hover:text-white/70"
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>
      <SaveButton onClick={save} dirty={pending !== mode} />
    </Section>
  );
}

// ── Wallet ──────────────────────────────────────────────────────────────────

function WalletSection() {
  const { address, isConnected, isLoading, connectWallet, disconnectWallet } = useWallet();
  const { showToast } = useToast();
  const { t } = useLanguage();
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const copyAddress = async () => {
    if (!address) return;
    await copyToClipboard(address);
    showToast("Address copied to clipboard.", "success");
  };

  const handleDisconnect = () => {
    try {
      disconnectWallet();
      setConfirmOpen(false);
      showToast("Wallet disconnected successfully.", "success");
      router.push("/");
    } catch {
      showToast("Unable to disconnect wallet.", "error");
    }
  };

  return (
    <Section icon={Wallet} title={t("settings.wallet")}>
      {isConnected ? (
        <div className="space-y-4">
          <InfoRow label={t("settings.connectedWallet")}>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span className="font-mono text-sm text-white/85">{formatAddress(address, 8)}</span>
              <button
                onClick={copyAddress}
                title="Copy full address"
                className="text-white/40 transition hover:text-accent-light"
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
            </div>
          </InfoRow>
          <button
            onClick={() => setConfirmOpen(true)}
            className="flex items-center gap-2 rounded-lg border border-rose-500/30 px-4 py-2 text-sm font-medium text-rose-300 transition hover:bg-rose-500/10"
          >
            <LogOut className="h-3.5 w-3.5" />
            {t("nav.disconnect")}
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <span className="text-sm text-white/50">{t("settings.noWallet")}</span>
          <button
            onClick={connectWallet}
            disabled={isLoading}
            className="flex items-center gap-2 rounded-lg bg-accent-gradient px-4 py-2 text-sm font-semibold text-white shadow-glow transition hover:opacity-90"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wallet className="h-4 w-4" />}
            {t("common.connectWallet")}
          </button>
        </div>
      )}
      <DisconnectModal open={confirmOpen} onCancel={() => setConfirmOpen(false)} onConfirm={handleDisconnect} />
    </Section>
  );
}

// ── Language ────────────────────────────────────────────────────────────────

function LanguageSection() {
  const { lang, setLang, t } = useLanguage();
  const { showToast } = useToast();
  const [pending, setPending] = useState<Lang>(lang);

  useEffect(() => { setPending(lang); }, [lang]);

  const LANGS: { key: Lang; label: string; flag: string }[] = [
    { key: "en", label: "English", flag: "🇺🇸" },
    { key: "es", label: "Español", flag: "🇪🇸" },
  ];

  const save = () => {
    setLang(pending);
    showToast(t("settings.saved"), "success");
  };

  return (
    <Section icon={Globe} title={t("settings.language")}>
      <div className="flex gap-2">
        {LANGS.map(({ key, label, flag }) => (
          <button
            key={key}
            onClick={() => setPending(key)}
            className={cx(
              "flex flex-1 items-center justify-center gap-2 rounded-xl border py-3 text-sm font-medium transition",
              pending === key
                ? "border-accent bg-accent/10 text-accent-light"
                : "border-white/8 text-white/40 hover:border-white/20 hover:text-white/70"
            )}
          >
            <span>{flag}</span>
            {label}
          </button>
        ))}
      </div>
      <SaveButton onClick={save} dirty={pending !== lang} />
    </Section>
  );
}

// ── Notifications ────────────────────────────────────────────────────────────

function NotificationsSection() {
  const { settings, setSettings } = useNotificationSettings();
  const { showToast } = useToast();
  const { t } = useLanguage();
  const [pending, setPending] = useState(settings);

  useEffect(() => { setPending(settings); }, [settings]);

  const toggle = (key: keyof typeof pending) => {
    setPending((p) => ({ ...p, [key]: !p[key] }));
  };

  const save = () => {
    setSettings(pending);
    showToast(t("settings.saved"), "success");
  };

  const dirty = JSON.stringify(pending) !== JSON.stringify(settings);

  return (
    <Section icon={Info} title={t("settings.notifications")}>
      <SwitchRow
        label={t("settings.enableNotifications")}
        checked={pending.enabled}
        onChange={() => toggle("enabled")}
      />
      <SwitchRow
        label={t("settings.transactionAlerts")}
        checked={pending.transactionAlerts}
        onChange={() => toggle("transactionAlerts")}
        disabled={!pending.enabled}
      />
      <SwitchRow
        label={t("settings.analysisCompletedAlerts")}
        checked={pending.analysisCompletedAlerts}
        onChange={() => toggle("analysisCompletedAlerts")}
        disabled={!pending.enabled}
      />
      <SaveButton onClick={save} dirty={dirty} />
    </Section>
  );
}

// ── Blockchain ───────────────────────────────────────────────────────────────

function BlockchainSection() {
  const { isConnected } = useWallet();
  const { t } = useLanguage();

  return (
    <Section icon={Server} title={t("settings.blockchain")}>
      <InfoRow label={t("settings.network")} icon={Server}>
        <span className="text-sm text-white/80">{GENLAYER_CHAIN.name}</span>
      </InfoRow>
      <InfoRow label={t("settings.rpcEndpoint")}>
        <span className="max-w-[180px] truncate text-right font-mono text-xs text-white/60 sm:max-w-none">
          {GENLAYER_NETWORK.rpcUrls[0]}
        </span>
      </InfoRow>
      <InfoRow label={t("settings.contractAddress")} icon={FileCode2}>
        <span className="max-w-[120px] truncate text-right font-mono text-xs text-white/60 sm:max-w-[200px]">
          {getContractAddress() || "Not configured"}
        </span>
      </InfoRow>
      <InfoRow label={t("settings.sdkVersion")}>
        <span className="text-sm text-white/60">v{GENLAYER_JS_VERSION}</span>
      </InfoRow>
      <InfoRow label={t("settings.connectionStatus")}>
        <span className={cx("flex items-center gap-1.5 text-sm", isConnected ? "text-emerald-400" : "text-white/40")}>
          {isConnected
            ? <><Wifi className="h-3.5 w-3.5" />{t("settings.connected")}</>
            : <><WifiOff className="h-3.5 w-3.5" />{t("settings.notConnected")}</>
          }
        </span>
      </InfoRow>
    </Section>
  );
}

// ── About ────────────────────────────────────────────────────────────────────

function AboutSection() {
  const { t } = useLanguage();

  return (
    <Section icon={Info} title="About">
      <InfoRow label={t("settings.appVersion")}>
        <span className="text-sm text-white/60">v{APP_VERSION}</span>
      </InfoRow>
      <InfoRow label="Developer">
        <span className="text-sm text-white/60">GenLegal AI</span>
      </InfoRow>
      <InfoRow label="Source">
        <a
          href={GITHUB_REPO_URL}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 text-sm text-accent-light hover:underline"
        >
          <Github className="h-3.5 w-3.5" />
          GitHub
        </a>
      </InfoRow>
      <InfoRow label="License">
        <span className="text-sm text-white/60">MIT</span>
      </InfoRow>
    </Section>
  );
}

// ── Shared primitives ────────────────────────────────────────────────────────

function Section({ icon: Icon, title, children }: { icon: typeof Wallet; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-bg-card/60 p-5">
      <h3 className="mb-4 flex items-center gap-2 text-[15px] font-semibold">
        <Icon className="h-4 w-4 text-accent-light" />
        {title}
      </h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function InfoRow({
  label,
  icon: Icon,
  children,
}: {
  label: string;
  icon?: typeof Wallet;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-white/5 pb-3 last:border-0 last:pb-0">
      <span className="flex items-center gap-2 text-sm text-white/40">
        {Icon && <Icon className="h-3.5 w-3.5" />}
        {label}
      </span>
      {children}
    </div>
  );
}

function SwitchRow({
  label,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-white/5 pb-3 last:border-0 last:pb-0">
      <span className={cx("text-sm", disabled ? "text-white/25" : "text-white/70")}>{label}</span>
      <button
        role="switch"
        aria-checked={checked}
        onClick={onChange}
        disabled={disabled}
        className={cx(
          "flex h-6 w-11 shrink-0 items-center rounded-full px-0.5 transition-colors focus-visible:outline-accent",
          checked && !disabled ? "bg-accent" : "bg-white/20",
          disabled && "cursor-not-allowed opacity-40"
        )}
      >
        <span
          className={cx(
            "h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200",
            checked ? "translate-x-[22px]" : "translate-x-0"
          )}
        />
      </button>
    </div>
  );
}

function SaveButton({ onClick, dirty }: { onClick: () => void; dirty: boolean }) {
  return (
    <div className="flex justify-end pt-1">
      <button
        onClick={onClick}
        className={cx(
          "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition",
          dirty
            ? "bg-accent-gradient text-white shadow-glow hover:opacity-90"
            : "border border-white/10 text-white/30"
        )}
      >
        <Save className="h-3.5 w-3.5" />
        Save Settings
      </button>
    </div>
  );
}
