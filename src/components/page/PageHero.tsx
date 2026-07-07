import type { ReactNode } from "react";
import { Container } from "../ui";

type PageHeroProps = {
  eyebrow: string;
  title: ReactNode;
  sub: string;
  align?: "left" | "center";
  tone?: "paper" | "cream";
};

export function PageHero({ eyebrow, title, sub, align = "center", tone = "cream" }: PageHeroProps) {
  const centered = align === "center";
  const toneClass = tone === "paper" ? "bg-paper" : "bg-cream";

  return (
    <section className={`${toneClass} pb-16 pt-32 lg:pb-20 lg:pt-36`} aria-labelledby="page-title">
      <Container className={`grid gap-4 ${centered ? "mx-auto max-w-4xl justify-items-center text-center" : "max-w-4xl"}`}>
        <p className="m-0 text-sm font-semibold uppercase tracking-[0.08em] text-navy">{eyebrow}</p>
        <h1 id="page-title" className="m-0 font-display text-h2 font-normal leading-[1.05] text-ink">
          {title}
        </h1>
        <p className="m-0 max-w-2xl text-lg leading-8 text-ink/65">{sub}</p>
      </Container>
    </section>
  );
}
