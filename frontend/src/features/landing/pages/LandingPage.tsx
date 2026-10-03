import { LandingNavbar } from '../components/LandingNavbar';
import { HeroSection } from '../components/HeroSection';
import { ProblemSection } from '../components/ProblemSection';
import { HowItWorksSection } from '../components/HowItWorksSection';
import { RoutingSection } from '../components/RoutingSection';
import { ShardManagementSection } from '../components/ShardManagementSection';
import { HealthSection } from '../components/HealthSection';
import { IntegrationSection } from '../components/IntegrationSection';
import { ArchitectureSection } from '../components/ArchitectureSection';
import { CtaSection } from '../components/CtaSection';
import { LandingFooter } from '../components/LandingFooter';

export function LandingPage() {
  return (
    <div className="min-h-screen bg-[#09090B] text-zinc-100 selection:bg-sky-500/20 selection:text-sky-300">
      <LandingNavbar />
      <main>
        <HeroSection />
        <ProblemSection />
        <HowItWorksSection />
        <RoutingSection />
        <ShardManagementSection />
        <HealthSection />
        <IntegrationSection />
        <ArchitectureSection />
        <CtaSection />
      </main>
      <LandingFooter />
    </div>
  );
}
