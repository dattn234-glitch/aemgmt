import { BadgeCheck, Camera, ClipboardCheck, Users } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";
import heroImage from "../assets/ae-hero-living-room.webp";
import type { HeroContent } from "../lib/site-content";
import { BookingOptionDialog } from "./BookingOptionDialog";
import { Button } from "./ui/button";
import { Container } from "./ui";

type HeroSectionProps = {
  hero: HeroContent;
};

export function HeroSection({ hero }: HeroSectionProps) {
  const reducedMotion = useReducedMotion();

  const rise = (delay: number) =>
    reducedMotion
      ? {}
      : {
          initial: { opacity: 0, y: 22 },
          animate: { opacity: 1, y: 0 },
          transition: { type: "spring" as const, stiffness: 90, damping: 18, delay }
        };

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
            "linear-gradient(90deg, color-mix(in srgb, var(--color-navy-900) 66%, transparent) 0%, color-mix(in srgb, var(--color-navy) 34%, transparent) 55%, color-mix(in srgb, var(--color-navy) 14%, transparent) 100%)"
        }}
        aria-hidden="true"
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, color-mix(in srgb, var(--color-navy-900) 34%, transparent) 0%, transparent 30%, transparent 60%, var(--color-paper) 100%)"
        }}
        aria-hidden="true"
      />

      <Container className="relative grid gap-8 pb-24 pt-40">
        <div className="grid max-w-3xl gap-5">
          <motion.span
            {...rise(0)}
            className="inline-flex h-9 w-fit items-center gap-2 rounded-full border border-white/40 bg-white/95 px-4 text-sm font-medium text-primary-ink shadow-[0_8px_20px_rgb(9_30_66_/_0.12)]"
          >
            <span className="size-2 rounded-full bg-primary" aria-hidden="true" />
            {hero.eyebrow}
          </motion.span>
          <motion.h1
            {...rise(0.08)}
            id="hero-title"
            className="m-0 max-w-[14ch] font-display text-display font-semibold text-white"
          >
            {hero.title} <em className="italic text-sky-200">{hero.emphasis}</em>
          </motion.h1>
          <motion.p {...rise(0.16)} className="m-0 max-w-xl text-xl leading-8 text-white/85">
            {hero.body}
          </motion.p>
          <motion.div {...rise(0.24)} className="flex flex-wrap gap-3 pt-1">
            <BookingOptionDialog label={hero.primaryCta} />
            <Button asChild variant="ghostOnDark">
              <a href="#pricing">See pricing</a>
            </Button>
          </motion.div>
          <motion.p {...rise(0.32)} className="m-0 text-sm text-white/75">
            Pay after service by PayNow · Replacement guarantee · Island-wide
          </motion.p>
        </div>
      </Container>

      <div className="relative border-t border-white/15 bg-white/80 backdrop-blur-sm">
        <Container>
          <div className="grid grid-cols-2 text-sm font-medium text-ink/75 md:grid-cols-4">
            <TrustItem icon={<Users className="text-ink/45" size={15} aria-hidden="true" />} text="Same cleaner where available" />
            <TrustItem icon={<BadgeCheck className="text-ink/45" size={15} aria-hidden="true" />} text="Replacement guarantee" />
            <TrustItem icon={<ClipboardCheck className="text-ink/45" size={15} aria-hidden="true" />} text="Digital checklist" />
            <TrustItem icon={<Camera className="text-ink/45" size={15} aria-hidden="true" />} text="Photo completion report" />
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
