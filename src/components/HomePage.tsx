import type { HeroContent, PricingContent } from "../lib/site-content";
import { CtaBandSection } from "./CtaBandSection";
import { HeroSection } from "./HeroSection";
import { HowItWorksSection } from "./HowItWorksSection";
import { PricingSection } from "./PricingSection";
import { ReviewsSection } from "./ReviewsSection";
import { ServicesBentoSection } from "./ServicesBentoSection";
import { ProofSection } from "./ProofSection";

type HomePageProps = {
  hero: HeroContent;
  pricing: PricingContent;
  trustRow: string[];
};

export function HomePage({ hero, pricing, trustRow }: HomePageProps) {
  return (
    <>
      <HeroSection hero={hero} />
      <ProofSection />
      <ServicesBentoSection pricing={pricing} trustRow={trustRow} />
      <HowItWorksSection />
      <PricingSection pricing={pricing} teaser />
      <ReviewsSection />
      <CtaBandSection />
    </>
  );
}
