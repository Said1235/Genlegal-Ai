"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Sparkles, Upload, PlayCircle, Zap, ShieldCheck, Lock } from "lucide-react";

// ── Terminal animation script ──────────────────────────────────────────────

const LINES = [
  { delay: 0,    text: "> Uploading ServiceAgreement.txt...", type: "cmd" },
  { delay: 700,  text: "████████████████ 100%", type: "bar" },
  { delay: 1200, text: "✔ Reading document structure...", type: "ok" },
  { delay: 1700, text: "✔ Extracting clauses...", type: "ok" },
  { delay: 2100, text: "✔ Analyzing obligations...", type: "ok" },
  { delay: 2500, text: "✔ Running AI risk scan...", type: "ok" },
  { delay: 3000, text: "─────────────────────────────", type: "div" },
  { delay: 3100, text: "⚠ HIGH   Unlimited liability clause", type: "high" },
  { delay: 3500, text: "⚠ MEDIUM Auto-renewal clause present", type: "med" },
  { delay: 3900, text: "✔ LOW    Payment terms defined", type: "low" },
  { delay: 4300, text: "─────────────────────────────", type: "div" },
  { delay: 4400, text: "Risk Score  ████████░░  82/100", type: "score" },
  { delay: 4800, text: "Completed in 4.8s  ·  3 risks found", type: "done" },
];

const FINDINGS = [
  { delay: 1800, icon: "✓", text: "Party identification", color: "text-emerald-400" },
  { delay: 2300, icon: "✓", text: "Payment schedule", color: "text-emerald-400" },
  { delay: 2900, icon: "⚠", text: "External call detected", color: "text-amber-400" },
  { delay: 3400, icon: "✓", text: "Termination clause", color: "text-emerald-400" },
  { delay: 3800, icon: "✗", text: "Missing data protection", color: "text-rose-400" },
];

function lineColor(type: string) {
  switch (type) {
    case "ok":    return "text-emerald-400";
    case "high":  return "text-rose-400";
    case "med":   return "text-amber-400";
    case "low":   return "text-emerald-400";
    case "score": return "text-accent-light";
    case "done":  return "text-white/60";
    case "bar":   return "text-accent-light";
    case "cmd":   return "text-white/80";
    default:      return "text-white/20";
  }
}

// ── Animated terminal component ────────────────────────────────────────────

function AITerminal() {
  const [visibleLines, setVisibleLines] = useState<number[]>([]);
  const [visibleFindings, setVisibleFindings] = useState<number[]>([]);
  const [scanPos, setScanPos] = useState(-10);
  const [scanning, setScanning] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const hasStarted = useRef(false);

  const restart = () => {
    setVisibleLines([]);
    setVisibleFindings([]);
    setScanPos(-10);
    setScanning(false);
    hasStarted.current = false;
    // small delay then kick off again
    setTimeout(() => { hasStarted.current = true; run(); }, 200);
  };

  const run = () => {
    LINES.forEach((_, i) => {
      setTimeout(() => {
        setVisibleLines((p) => [...p, i]);
        scrollRef.current?.scrollTo({ top: 9999, behavior: "smooth" });
      }, LINES[i].delay);
    });

    FINDINGS.forEach((_, i) => {
      setTimeout(() => {
        setVisibleFindings((p) => [...p, i]);
      }, FINDINGS[i].delay);
    });

    // scan line animation triggered once at ~3s
    setTimeout(() => {
      setScanning(true);
      let pos = -10;
      const id = setInterval(() => {
        pos += 2;
        setScanPos(pos);
        if (pos > 110) { clearInterval(id); setScanning(false); }
      }, 20);
    }, 3000);
  };

  useEffect(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;
    run();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="relative w-full max-w-[480px]">
      {/* Glow */}
      <div className="pointer-events-none absolute -inset-4 rounded-3xl bg-accent/15 blur-2xl" />

      {/* Terminal window */}
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#07070f] shadow-2xl">
        {/* Title bar */}
        <div className="flex items-center gap-2 border-b border-white/5 px-4 py-3">
          <span className="h-3 w-3 rounded-full bg-rose-500/80" />
          <span className="h-3 w-3 rounded-full bg-amber-500/80" />
          <span className="h-3 w-3 rounded-full bg-emerald-500/80" />
          <span className="ml-3 text-xs font-medium text-white/30">AI Analysis Terminal</span>
          <button
            onClick={restart}
            className="ml-auto text-[10px] text-white/25 transition hover:text-accent-light"
          >
            restart ↺
          </button>
        </div>

        {/* Scan line overlay */}
        {scanning && (
          <div
            className="pointer-events-none absolute left-0 right-0 z-10 h-[2px] bg-gradient-to-r from-transparent via-accent to-transparent opacity-80"
            style={{ top: `${scanPos}%` }}
          />
        )}

        {/* Output */}
        <div
          ref={scrollRef}
          className="h-64 overflow-y-auto p-4 font-mono text-[12px] leading-6 scrollbar-thin"
        >
          {LINES.map((line, i) =>
            visibleLines.includes(i) ? (
              <div key={i} className={`${lineColor(line.type)} animate-fade-in whitespace-pre`}>
                {line.text}
              </div>
            ) : null
          )}
          {visibleLines.length > 0 && visibleLines.length < LINES.length && (
            <span className="inline-block h-3.5 w-2 animate-pulse bg-accent-light/80" />
          )}
        </div>

        {/* Bottom badge row */}
        <div className="border-t border-white/5 px-4 py-2.5">
          {visibleLines.length >= LINES.length ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-400">
                🟢 Score 82/100
              </span>
              <span className="rounded-full bg-amber-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-amber-400">
                ⚠ 1 Medium
              </span>
              <span className="rounded-full bg-rose-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-rose-400">
                🔴 1 High
              </span>
            </div>
          ) : (
            <span className="text-[11px] text-white/25">Analyzing…</span>
          )}
        </div>
      </div>

      {/* Floating findings */}
      <div className="pointer-events-none absolute -right-3 top-16 space-y-2 sm:-right-8">
        {FINDINGS.map((f, i) =>
          visibleFindings.includes(i) ? (
            <div
              key={i}
              className="flex animate-slide-in items-center gap-2 rounded-lg border border-white/10 bg-[#0d0d1a]/90 px-3 py-1.5 text-[11px] font-medium shadow-lg backdrop-blur"
            >
              <span className={f.color}>{f.icon}</span>
              <span className="text-white/70">{f.text}</span>
            </div>
          ) : null
        )}
      </div>
    </div>
  );
}

// ── Hero ───────────────────────────────────────────────────────────────────

const PILLS = [
  { icon: Zap, label: "AI-Powered Analysis" },
  { icon: ShieldCheck, label: "Blockchain Verified" },
  { icon: Lock, label: "Private & Secure" },
];

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-grid">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 md:grid-cols-2 md:py-24 lg:gap-20 lg:py-28">
        {/* Left: copy */}
        <div className="order-2 text-center md:order-1 md:text-left">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-1.5 text-xs font-medium text-accent-light">
            <Sparkles className="h-3.5 w-3.5" />
            AI-Powered Legal Analysis on Blockchain
          </div>

          <h1 className="text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl lg:text-[3.4rem]">
            Understand Contracts.
            <br />
            <span className="text-gradient">Avoid Risks.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-lg text-[15px] leading-relaxed text-white/60 md:mx-0">
            GenLegal AI uses advanced AI and blockchain technology to analyze contracts, identify
            obligations, and highlight risks in seconds.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 md:justify-start">
            <Link
              href="/dashboard/analyze"
              className="group relative flex items-center gap-2 overflow-hidden rounded-xl bg-accent-gradient px-5 py-3 text-sm font-semibold text-white shadow-glow transition hover:opacity-90"
            >
              {/* shimmer on hover */}
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-500 group-hover:translate-x-full" />
              <Upload className="h-4 w-4" />
              Analyze a Contract
            </Link>
            <Link
              href="/dashboard"
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-5 py-3 text-sm font-semibold text-white/80 transition hover:bg-white/[0.07]"
            >
              <PlayCircle className="h-4 w-4" />
              View Demo
            </Link>
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-3 md:justify-start">
            {PILLS.map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex items-center gap-2 rounded-lg border border-white/8 bg-white/[0.03] px-3.5 py-2 text-xs font-medium text-white/60"
              >
                <Icon className="h-3.5 w-3.5 text-accent-light" />
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* Right: AI terminal */}
        <div className="order-1 flex justify-center md:order-2 md:justify-end">
          <AITerminal />
        </div>
      </div>
    </section>
  );
}
