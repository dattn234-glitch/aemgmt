import { ArrowRight, BadgeCheck, Leaf, Star, Users } from "lucide-react";
import type { ReactNode } from "react";
import heroImage from "../assets/ae-hero-living-room.png";
import type { HeroContent } from "../lib/site-content";
import { Button } from "./ui/button";
import { Container } from "./ui";

type HeroSectionProps = {
  hero: HeroContent;
};

export function HeroSection({ hero }: HeroSectionProps) {
  return (
    <section
      className="relative flex min-h-[92svh] max-h-[960px] flex-col justify-end overflow-hidden scroll-mt-[88px]"
      id="home"
      aria-labelledby="hero-title"
    >
      <img
        className="absolute inset-0 size-full object-cover object-center"
        src={heroImage}
        alt="Bright clean living room with plants"
        fetchPriority="high"
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(90deg, rgba(13,24,43,.62) 0%, rgba(13,24,43,.30) 55%, rgba(13,24,43,.16) 100%)"
        }}
        aria-hidden="true"
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(13,24,43,.35) 0%, transparent 30%, transparent 60%, #FAFAF8 100%)"
        }}
        aria-hidden="true"
      />

      <Container className="relative grid gap-8 pb-24 pt-40">
        <div className="grid max-w-3xl gap-5">
          <span className="inline-flex h-9 w-fit items-center gap-2 rounded-full border border-white/15 bg-black/35 px-4 text-sm text-white/90 backdrop-blur">
            <span className="size-2 rounded-full bg-navy" aria-hidden="true" />
            {hero.eyebrow}
          </span>
          <h1 id="hero-title" className="m-0 max-w-[13ch] font-display text-display font-normal leading-[1.02] text-white">
            {hero.title} <em className="italic text-sky-300">{hero.emphasis}</em>
          </h1>
          <p className="m-0 max-w-xl text-xl leading-8 text-white/80">{hero.body}</p>
          <div className="flex flex-wrap gap-3 pt-1">
            <Button asChild>
              <a href="#booking">
                {hero.primaryCta}
                <ArrowRight size={17} aria-hidden="true" />
              </a>
            </Button>
            <Button asChild variant="ghostOnDark">
              <a href="#pricing">See Pricing</a>
            </Button>
          </div>
          <p className="m-0 text-sm text-white/65">Cashless payment · Replacement guarantee · Island-wide</p>
        </div>
      </Container>

      <div className="relative border-t border-ink/10">
        <Container>
          <div className="grid grid-cols-2 text-sm font-medium text-ink/70 md:grid-cols-4">
            <TrustItem icon={<Star size={15} fill="currentColor" aria-hidden="true" />} text="Same cleaner where available" />
            <TrustItem icon={<BadgeCheck size={15} aria-hidden="true" />} text="Replacement guarantee" />
            <TrustItem icon={<Users size={15} aria-hidden="true" />} text="Digital checklist" />
            <TrustItem icon={<Leaf size={15} aria-hidden="true" />} text="Photo completion report" />
          </div>
        </Container>
      </div>
    </section>
  );
}

function TrustItem({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <div className="flex min-h-16 items-center gap-2 border-l border-ink/10 px-3 first:border-l-0 md:px-5">
      {icon}
      <span>{text}</span>
    </div>
  );
}
