import { Navbar }          from "@/components/landing/Navbar";
import { Hero }            from "@/components/landing/Hero";
import { FeatureTicker }   from "@/components/landing/FeatureTicker";
import { StatCounters }    from "@/components/landing/StatCounters";
import { TwoToolsSection } from "@/components/landing/TwoToolsSection";
import { HowItWorks }      from "@/components/landing/HowItWorks";
import { UseCasesSection } from "@/components/landing/UseCasesSection";
import { WhySection }      from "@/components/landing/WhySection";
import { FAQSection }      from "@/components/landing/FAQSection";
import { CTABanner }       from "@/components/landing/CTABanner";
import { Footer }          from "@/components/landing/Footer";

export default function HomePage() {
  return (
    <main>
      <Navbar />
      <Hero />
      <FeatureTicker />
      <StatCounters />
      <TwoToolsSection />
      <HowItWorks />
      <UseCasesSection />
      <WhySection />
      <FAQSection />
      <CTABanner />
      <Footer />
    </main>
  );
}
