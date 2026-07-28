"use client";
import { useState } from "react";
import { Plus, Minus } from "lucide-react";
import { cx } from "@/lib/utils";

const FAQS = [
  {
    q: "What can GenLegal AI analyze?",
    a: "Smart contracts and website URLs. The contract analyzer evaluates legal documents, NDAs, service agreements, and similar texts. The URL oracle checks websites for phishing, malware, reputation scores, and other threat indicators.",
  },
  {
    q: "How are results generated?",
    a: "AI models analyze the submitted content, and GenLayer validators independently reach consensus before producing the final result. This ensures results are verifiable and tamper-proof on-chain.",
  },
  {
    q: "Can I review previous analyses?",
    a: "Yes. The Documents and History sections let you revisit contract analyses and URL reputation reports. Contract text submitted from your browser is cached locally for quick access.",
  },
  {
    q: "What information does the URL analysis provide?",
    a: "Risk level (Safe / Suspicious / Malicious / Unknown), reputation score (0–100), phishing indicators, malware flags, scam faucet detection, and an AI-generated plain-language summary.",
  },
  {
    q: "Does GenLegal AI replace a professional security audit?",
    a: "No. GenLegal AI is designed to support reviews by providing AI-assisted insights that help users identify relevant information more efficiently. It should be used as a complementary tool alongside professional auditing.",
  },
];

export function FAQSection() {
  const half = Math.ceil(FAQS.length / 2);
  return (
    <section id="faq" className="border-t border-white/5 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-12 text-center">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            →&nbsp; Frequently Asked Questions &nbsp;←
          </h2>
          <p className="mt-2 text-sm text-white/40">Everything you need to know before getting started.</p>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-2">
            {FAQS.slice(0, half).map((f) => <FAQItem key={f.q} {...f} />)}
          </div>
          <div className="space-y-2">
            {FAQS.slice(half).map((f) => <FAQItem key={f.q} {...f} />)}
          </div>
        </div>
      </div>
    </section>
  );
}

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={cx("rounded-xl border transition", open ? "border-accent/30 bg-bg-card" : "border-white/8 bg-bg-card/60")}>
      <button onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-sm font-medium text-white/80 transition hover:text-white">
        <span>{q}</span>
        {open ? <Minus className="h-4 w-4 shrink-0 text-accent-light" /> : <Plus className="h-4 w-4 shrink-0 text-white/30" />}
      </button>
      {open && <p className="border-t border-white/5 px-5 pb-4 pt-3 text-sm leading-relaxed text-white/55 animate-fade-in">{a}</p>}
    </div>
  );
}
