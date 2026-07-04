"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cx } from "@/lib/utils";

const FAQS = [
  {
    q: "What types of contracts can GenLegal AI analyze?",
    a: "GenLegal AI can analyze any text-based legal or smart contract document, including service agreements, NDAs, employment contracts, lease agreements, master service agreements, DeFi protocols, DAOs, and more. Simply paste the text or upload a .txt file.",
  },
  {
    q: "How does the AI analysis work?",
    a: "Your contract is submitted to an Intelligent Contract deployed on GenLayer's network. A leader validator sends the text to a large language model, which extracts obligations, identifies risks, and assigns a risk score. Independent validators then verify the result through GenLayer's Optimistic Democracy consensus before the analysis is stored on-chain.",
  },
  {
    q: "What does the Risk Score mean?",
    a: "The Risk Score is a number from 0 to 100 reflecting the overall level of risk identified in the contract. Scores below 34 are classified as Low Risk (green), 34–66 as Medium Risk (amber), and 67–100 as High Risk (red). The score is based on specific clauses found — such as unlimited liability, automatic renewal, one-sided indemnification, or missing data protections.",
  },
  {
    q: "Is the analysis result 100% accurate?",
    a: "GenLegal AI uses advanced AI models to analyze contracts, but no AI system is 100% accurate. Language models (LLMs) may sometimes misinterpret or miss details, especially if the contract is ambiguous, incomplete, or poorly structured. We recommend reviewing all findings carefully, providing clear and well-structured contracts, and using the analysis as a support tool — not as legal advice. For critical decisions, always consult with a legal professional.",
  },
  {
    q: "Are results instant?",
    a: "The AI analysis itself is fast, but because results are verified by GenLayer's validator network (Optimistic Democracy consensus), the full process typically takes between 10 and 60 seconds depending on network conditions. You can monitor progress in real time on the Analyze screen.",
  },
  {
    q: "Where is my analysis stored?",
    a: "Analysis results — including the summary, obligations, risks, and risk score — are stored on GenLayer's StudioNet blockchain, making them tamper-proof and permanently accessible. The original contract text is cached locally in your browser for privacy and is not stored on-chain.",
  },
  {
    q: "How can I review a previously analyzed contract?",
    a: "Go to the Documents section. Every analysis submitted from any wallet is listed there. You can search by document name, analysis ID, wallet address, or transaction hash. Click any result to see the full details, including the original contract text if it was submitted from this browser.",
  },
  {
    q: "Can I download the analysis report?",
    a: 'Yes. After any analysis completes, a "Download JSON" button is available. It exports a structured JSON file containing the summary, obligations, risks, risk score, metadata, and transaction hash — useful for records, audits, or integrating results into other tools.',
  },
  {
    q: "What information is stored on the blockchain?",
    a: "The AI analysis result is stored on-chain: title, contract type, summary, obligations list, risks list, risk score (0–100), risk level, submitter wallet address, and timestamp. The original contract text is NOT stored on-chain — only in your browser's local cache.",
  },
  {
    q: "How does GenLegal AI protect my data?",
    a: "The original contract text never leaves your browser in plaintext — it is only sent to the GenLayer network for analysis processing. Results stored on-chain are the AI output only, not the raw document. All transactions are public on the GenLayer blockchain, so avoid submitting contracts containing confidential personal data if on-chain visibility is a concern.",
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
            GenLegal AI combines artificial intelligence and automated analysis to provide a quick evaluation of contract content, helping identify potential risks, summarize relevant information, and facilitate a faster and more informed review. AI-generated analyses are a support tool and do not replace a professional audit or legal advice.
          </p>
        </div>
      </div>
    </section>
  );
}
