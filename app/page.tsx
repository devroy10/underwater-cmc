import { CtaSection } from "@/components/landing/cta-section";
// import { DeveloperSection } from "@/components/landing/developer-section";
import { FactMarquee } from "@/components/landing/fact-marquee";
import { FeaturesSection } from "@/components/landing/features-section";
import { FindingsSection } from "@/components/landing/findings-section";
import { HeroSection } from "@/components/landing/hero-section";
// import { SiteFooter } from "@/components/landing/site-footer";
import { SiteHeader } from "@/components/landing/site-header";
import {
  MobileStatsSection,
  StatsSection,
} from "@/components/landing/stats-section";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <SiteHeader />
      <main className="flex flex-1 flex-col">
        <HeroSection />
        <FactMarquee />
        <FeaturesSection />
        <StatsSection />
        <FindingsSection />
        <MobileStatsSection />
        {/*<DeveloperSection />*/}
        <CtaSection />
      </main>
      {/*<SiteFooter />*/}
    </div>
  );
}
