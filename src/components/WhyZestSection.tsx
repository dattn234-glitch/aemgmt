import { useReveal } from "../hooks/useReveal";
import { Container } from "./ui";

const proofCards = [
  {
    stat: "Same",
    unit: "",
    title: "Same cleaner, every visit where available",
    copy: "Preferences stay attached to the cleaner who learns your home."
  },
  {
    stat: "Backup",
    unit: "",
    title: "Replacement-cleaner guarantee",
    copy: "If the assigned cleaner is unavailable, AE helps arrange a replacement."
  },
  {
    stat: "Proof",
    unit: "",
    title: "Digital checklist + photo report",
    copy: "Checklist-led work and photo completion reports support accountability."
  }
] as const;

export function WhyZestSection() {
  const headerReveal = useReveal<HTMLDivElement>();
  const gridReveal = useReveal<HTMLDivElement>();

  return (
    <section className="scroll-mt-[88px] bg-paper py-20 lg:py-28" id="why" aria-labelledby="why-title">
      <Container className="grid gap-10">
        <div ref={headerReveal.ref} className={`grid gap-6 transition duration-500 lg:grid-cols-12 lg:items-end ${headerReveal.className}`}>
          <div className="grid gap-3 lg:col-span-7">
            <p className="m-0 text-sm font-semibold uppercase tracking-[0.08em] text-navy">WHY AE</p>
            <h2 id="why-title" className="m-0 font-display text-h2 font-normal text-ink">
              Finally, a cleaning service{" "}
              <span className="text-navy">you can actually rely on.</span>
            </h2>
          </div>
          <p className="m-0 max-w-md text-lg leading-8 text-ink/65 lg:col-span-5 lg:self-end">
            Same-cleaner reliability, clear WhatsApp confirmation, and cashless payment for Singapore households that need residential cleaning support.
          </p>
        </div>

        <div ref={gridReveal.ref} className={`grid gap-5 transition duration-500 md:grid-cols-3 ${gridReveal.className}`}>
          {proofCards.map((card) => (
            <article className="rounded-[20px] border border-line bg-white p-7" key={card.title}>
              <p className="m-0 font-display text-5xl font-normal leading-none text-navy">
                {card.stat}
                <span className="relative -top-3 ml-1 font-sans text-lg font-semibold text-navy">{card.unit}</span>
              </p>
              <h3 className="mb-2 mt-6 font-display text-xl font-normal leading-6 text-ink">{card.title}</h3>
              <p className="m-0 text-sm leading-6 text-ink/65">{card.copy}</p>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}
