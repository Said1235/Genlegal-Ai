"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cx } from "@/lib/utils";

const FAQS = [
  {
    q: "What kind of code can GenLegal AI analyze?",
    a: "GenLegal AI analyzes smart contract source code - Solidity, Vyper, Python-based GenLayer Intelligent Contracts, and other text-based smart contract languages. Simply paste the source or upload a .txt file.",
  },
  {
    q: "How does the AI analysis work?",
    a: "Your code is submitted to an Intelligent Contract deployed on GenLayer's network. A leader validator sends it to a large language model, which summarizes it, flags vulnerabilities, and assigns a risk score. Independent validators then verify the result through GenLayer's Optimistic Democracy consensus before the analysis is stored on-chain.",
  },
  {
    q: "What does the Risk Score mean?",
    a: "The Risk Score is a number from 0 to 100 reflecting the overall security risk found in the code. Scores below 34 are Low Risk (green), 34-66 Medium Risk (amber), and 67-100 High Risk (red). The score is based on specific issues found, such as reentrancy, unchecked external calls, missing access control, or integer overflow.",
  },
  {
    q: "Is the analysis 100% accurate?",
    a: "GenLegal AI uses advanced AI models to review code, but no AI system is 100% accurate and this is not static analysis or formal verification - it's an LLM reading the code the way a human reviewer would. It may miss subtle bugs or misjudge severity. Use it as a fast first pass, not a substitute for a professional security audit.",
  },
  {
    q: "Are results instant?",
    a: "The AI analysis itself is fast, but because results are verified by GenLayer's validator network (Optimistic Democracy consensus), the full process typically takes between 10 and 60 seconds depending on network conditions. You can monitor progress in real time on the Analyze screen.",
  },
  {
    q: "Where is my analysis stored?",
    a: "Analysis results - including the summary, vulnerabilities, recommendations, and risk score - are stored on GenLayer's StudioNet blockchain, making them tamper-proof and permanently accessible. The original source code is cached locally in your browser and is not stored on-chain.",
  },
  {
    q: "How can I review a previously analyzed contract?",
    a: "Go to the Documents section. Every analysis submitted from any wallet is listed there. You can search by title, analysis ID, wallet address, or transaction hash. Click any result to see the full details, including the original source if it was submitted from this browser.",
  },
  {
    q: "Can I download the analysis report?",
    a: 'Yes. After any analysis completes, a "Download JSON" button is available. It exports a structured JSON file containing the summary, vulnerabilities, recommendations, risk score, metadata, and transaction hash - useful for records or feeding into other tools.',
  },
  {
    q: "What information is stored on the blockchain?",
    a: "The AI analysis result is stored on-chain: title, language, summary, vulnerabilities list, recommendations list, risk score (0-100), risk level, submitter wallet address, and timestamp. The original source code is NOT stored on-chain - only in your browser's local cache.",
  },
  {
    q: "How does GenLegal AI protect my data?",
    a: "The original source code never leaves your browser in plaintext except to be sent to the GenLayer network for analysis. Results stored on-chain are the AI output only, not the raw code. All transactions are public on the GenLayer blockchain, so avoid submitting proprietary code if on-chain visibility is a concern.",
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-white/5 last:border-0">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-4 py-4 text-left text-sm font-medium text-white/80 transition hover:text-white"
      >
        <span>{q}</span>
        <ChevronDown className={cx("h-4 w-4 shrink-0 text-white/30 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <p className="pb-4 text-sm leading-relaxed text-white/55 animate-fade-in">{a}</p>
      )}
    </div>
  );
}

export function FAQSection() {
  const half = Math.ceil(FAQS.length / 2);
  const left  = FAQS.slice(0, half);
  const right = FAQS.slice(half);

  return (
    <section className="border-t border-white/5 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <h2 className="text-center text-2xl font-bold tracking-tight sm:text-3xl">
          — <span className="text-gradient">Frequently Asked Questions</span> —
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-sm leading-relaxed text-white/50">
          Everything you need to know before getting started.
        </p>

        <div className="mt-10 grid gap-x-10 lg:grid-cols-2">
          <div className="rounded-2xl border border-white/8 bg-bg-card/60 px-6 py-2">
            {left.map((item) => <FAQItem key={item.q} {...item} />)}
          </div>
          <div className="rounded-2xl border border-white/8 bg-bg-card/60 px-6 py-2 mt-4 lg:mt-0">
            {right.map((item) => <FAQItem key={item.q} {...item} />)}
          </div>
        </div>

        {/* Disclaimer box */}
        <div className="mt-8 rounded-2xl border border-accent/20 bg-accent/5 px-6 py-5">
          <p className="text-center text-sm leading-relaxed text-white/60">
            <span className="font-semibold text-accent-light">Note: </span>
            GenLegal AI combines AI and automated analysis to give a quick read on a smart contract's
            security, surfacing potential vulnerabilities and summarizing what the code does. AI-generated
            analyses are a support tool and do not replace a professional security audit.
          </p>
        </div>
      </div>
    </section>
  );
}
