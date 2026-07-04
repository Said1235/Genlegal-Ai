import { Navbar }          from "@/components/landing/Navbar";
import { Hero }            from "@/components/landing/Hero";
import { FeatureTicker }   from "@/components/landing/FeatureTicker";
import { WhySection }      from "@/components/landing/WhySection";
import { UseCasesSection } from "@/components/landing/UseCasesSection";
import { HowItWorks }      from "@/components/landing/HowItWorks";
import { FAQSection }      from "@/components/landing/FAQSection";
import { Footer }          from "@/components/landing/Footer";

export default function HomePage() {
  return (
    <main>
      <Navbar />
      <Hero />
      <FeatureTicker />
      <WhySection />
      <UseCasesSection />
      <HowItWorks />
      <FAQSection />
      <Footer />
    </main>
  );
}
