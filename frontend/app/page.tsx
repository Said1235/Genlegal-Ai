import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { WhySection } from "@/components/landing/WhySection";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Scale, Github } from "lucide-react";
import { GITHUB_REPO_URL } from "@/lib/constants";

export default function HomePage() {
  return (
    <main>
      <Navbar />
      <Hero />
      <WhySection />
      <HowItWorks />

      <footer className="border-t border-white/5 py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 sm:flex-row">
          <div className="flex items-center gap-2 text-sm text-white/40">
            <Scale className="h-4 w-4" />
            GenLegal AI - built on GenLayer
          </div>
          <a
            href={GITHUB_REPO_URL}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 text-sm text-white/40 transition hover:text-white"
          >
            <Github className="h-4 w-4" />
            View on GitHub
          </a>
        </div>
      </footer>
    </main>
  );
}
