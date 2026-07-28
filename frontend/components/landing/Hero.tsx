"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Sparkles, FileText, Globe, Zap, ShieldCheck, Lock, Boxes } from "lucide-react";

const LINES = [
  { delay: 0,    text: "> Initializing analysis engine...",   type: "cmd" },
  { delay: 600,  text: "> Connecting to GenLayer network...", type: "cmd" },
  { delay: 1100, text: "> Loading AI validators...",          type: "ok"  },
  { delay: 1500, text: "> Running security checks...",        type: "ok"  },
  { delay: 2000, text: "> Gathering data and context...",     type: "ok"  },
  { delay: 2500, text: "> Analyzing with AI models...",       type: "ok"  },
  { delay: 3000, text: "> Reaching validator consensus...",   type: "ok"  },
  { delay: 3500, text: "> Analysis completed successfully",   type: "done"},
  { delay: 3700, text: "─────────────────────────────",       type: "div" },
  { delay: 3800, text: "Risk Score  ███████░░░  23/100",      type: "score"},
  { delay: 4100, text: "Risk Level  Low",                     type: "low" },
  { delay: 4300, text: "Status      Verified",                type: "ok"  },
  { delay: 4500, text: "Consensus   Achieved",                type: "ok"  },
  { delay: 4700, text: "Completed in 4.2s  ·  3 risks found",type: "done"},
];
const BADGES = [
  { delay: 1400, text: "Score 23/100", cls: "bg-emerald-500/15 text-emerald-400" },
  { delay: 2800, text: "Low Risk",     cls: "bg-cyan-500/15 text-cyan-400" },
  { delay: 4000, text: "Verified",     cls: "bg-accent/15 text-accent-light" },
];

function lineColor(type: string) {
  switch (type) {
    case "ok":    return "text-emerald-400";
    case "done":  return "text-white/60";
    case "score": return "text-accent-light";
    case "low":   return "text-cyan-400";
    case "cmd":   return "text-white/80";
    default:      return "text-white/20";
  }
}

function Terminal() {
  const [visibleLines, setVisibleLines] = useState<number[]>([]);
  const [visibleBadges, setVisibleBadges] = useState<number[]>([]);
  const [scanning, setScanning] = useState(false);
  const [scanPos, setScanPos] = useState(-10);
  const scrollRef = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  const run = () => {
    LINES.forEach((_, i) => {
      setTimeout(() => {
        setVisibleLines((p) => [...p, i]);
        scrollRef.current?.scrollTo({ top: 9999, behavior: "smooth" });
      }, LINES[i].delay);
    });
    BADGES.forEach((_, i) => {
      setTimeout(() => setVisibleBadges((p) => [...p, i]), BADGES[i].delay);
    });
    setTimeout(() => {
      setScanning(true);
      let pos = -10;
      const id = setInterval(() => {
        pos += 2; setScanPos(pos);
        if (pos > 110) { clearInterval(id); setScanning(false); }
      }, 20);
    }, 2500);
  };

  const restart = () => {
    setVisibleLines([]); setVisibleBadges([]); setScanning(false); setScanPos(-10);
    started.current = false;
    setTimeout(() => { started.current = true; run(); }, 100);
  };

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    run();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="relative w-full max-w-[480px]">
      <div className="pointer-events-none absolute -inset-4 rounded-3xl bg-accent/15 blur-2xl" />
      <div className="dark-surface relative overflow-hidden rounded-2xl border border-white/10 bg-[#07070f] shadow-2xl">
        <div className="flex items-center gap-2 border-b border-white/5 px-4 py-3">
          <span className="h-3 w-3 rounded-full bg-rose-500/80" />
          <span className="h-3 w-3 rounded-full bg-amber-500/80" />
          <span className="h-3 w-3 rounded-full bg-emerald-500/80" />
          <span className="ml-3 text-xs font-medium text-white/30">AI Analysis Terminal</span>
          <span className="ml-auto flex items-center gap-1.5 text-[10px] text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />connected
          </span>
          <button onClick={restart} className="ml-2 text-[10px] text-white/20 hover:text-white/50">restart ↺</button>
        </div>
        {scanning && (
          <div className="pointer-events-none absolute left-0 right-0 z-10 h-[2px] bg-gradient-to-r from-transparent via-accent to-transparent opacity-80"
            style={{ top: `${scanPos}%` }} />
        )}
        <div ref={scrollRef} className="h-64 overflow-y-auto p-4 font-mono text-[12px] leading-[1.6rem] scrollbar-thin">
          {LINES.map((line, i) => visibleLines.includes(i) ? (
            <div key={i} className={`${lineColor(line.type)} animate-fade-in whitespace-pre`}>{line.text}</div>
          ) : null)}
          {visibleLines.length > 0 && visibleLines.length < LINES.length && (
            <span className="inline-block h-3.5 w-2 animate-pulse bg-accent-light/80" />
          )}
        </div>
        <div className="border-t border-white/5 px-4 py-2.5">
          {visibleBadges.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2">
              {BADGES.slice(0, visibleBadges.length).map((b, i) => (
                <span key={i} className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold animate-fade-in ${b.cls}`}>{b.text}</span>
              ))}
            </div>
          ) : <span className="text-[11px] text-white/25">Initializing…</span>}
        </div>
      </div>
    </div>
  );
}

const PILLS = [
  { icon: Zap,        label: "AI-Powered Analysis" },
  { icon: ShieldCheck, label: "Blockchain Verified" },
  { icon: Lock,       label: "Private & Secure"    },
  { icon: Boxes,      label: "Built for Web3"      },
];

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-grid">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 md:grid-cols-2 md:py-24 lg:gap-20 lg:py-28">
        <div className="order-2 text-center md:order-1 md:text-left">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-accent-light">
            <Sparkles className="h-3 w-3" />AI-POWERED · BLOCKCHAIN VERIFIED
          </div>
          <p className="text-sm font-semibold uppercase tracking-widest text-white/40 mb-2">AI Security Analysis for Web3</p>
          <h1 className="text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl lg:text-[3.2rem]">
            Analyze Smart Contracts.<br />
            <span className="text-gradient">Verify Website Reputation.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-lg text-[15px] leading-relaxed text-white/60 md:mx-0">
            GenLegal AI is an AI-powered Web3 security assistant that helps analyze smart contracts and evaluate website reputation using GenLayer consensus. Detect potential risks, understand technical content, and make more informed decisions before interacting with contracts or external links.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 md:justify-start">
            <Link href="/dashboard/analyze/smart-contract"
              className="group relative flex items-center gap-2 overflow-hidden rounded-xl bg-accent-gradient px-5 py-3 text-sm font-semibold text-white shadow-glow transition hover:opacity-90">
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-500 group-hover:translate-x-full" />
              <FileText className="h-4 w-4" />Analyze Smart Contract
            </Link>
            <Link href="/dashboard/analyze/url"
              className="group relative flex items-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-cyan-600 to-accent px-5 py-3 text-sm font-semibold text-white shadow-glow transition hover:opacity-90">
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-500 group-hover:translate-x-full" />
              <Globe className="h-4 w-4" />Verify Website URL
            </Link>
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-3 md:justify-start">
            {PILLS.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2 rounded-lg border border-white/8 bg-white/[0.03] px-3.5 py-2 text-xs font-medium text-white/60">
                <Icon className="h-3.5 w-3.5 text-accent-light" />{label}
              </div>
            ))}
          </div>
        </div>
        <div className="order-1 flex justify-center md:order-2 md:justify-end">
          <Terminal />
        </div>
      </div>
    </section>
  );
}
