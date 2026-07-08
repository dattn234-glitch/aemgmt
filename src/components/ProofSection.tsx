import { Info } from "lucide-react";
import { useReveal } from "../hooks/useReveal";
import { Container } from "./ui";

const proofCards = [
  {
    stat: "1",
    unit: "cleaner",
    title: "Same cleaner, every visit where available",
    copy: "Your cleaner learns your home and remembers how you like things done. If they're ever unavailable, AE arranges a replacement."
  },
  {
    stat: "S$0",
    unit: "upfront",
    title: "Pay only after the clean",
    copy: "No deposits, no prepayment. Settle by PayNow once the work is done and you're happy with it."
  },
  {
    stat: "100%",
    unit: "proof",
    title: "Digital checklist + photo report",
    copy: "Every visit follows a digital checklist, with completion photos when the work is done."
  }
] as const;

export function ProofSection() {
  const headerReveal = useReveal<HTMLDivElement>();
  const gridReveal = useReveal<HTMLDivElement>();

  return (
    <section className="scroll-mt-[88px] bg-paper py-20 lg:py-28" id="why" aria-labelledby="why-title">
      <Container className="grid gap-10">
        <div ref={headerReveal.ref} className={`grid gap-6 transition duration-500 lg:grid-cols-12 lg:items-end ${headerReveal.className}`}>
          <div className="grid gap-3 lg:col-span-7">
            <p className="m-0 text-sm font-semibold uppercase tracking-[0.08em] text-primary-ink">WHY AE</p>
            <h2 id="why-title" className="m-0 font-display text-h2 font-medium text-ink">
              The same cleaner, a backup plan, and proof it's done.
            </h2>
          </div>
          <div className="grid gap-4 lg:col-span-5 lg:self-end">
            <p className="m-0 max-w-md text-lg leading-8 text-ink/65">
              The same cleaner each visit where available, confirmation before every clean, and cashless PayNow payment after the service.
            </p>
            <div className="grid grid-cols-[40px_1fr] gap-4 rounded-[24px] border border-line bg-white px-6 py-5">
              <span className="grid size-10 place-items-center rounded-xl bg-primary-soft text-ink">
                <Info size={20} aria-hidden="true" />
              </span>
              <div>
                <p className="m-0 text-sm font-semibold uppercase tracking-[0.08em] text-primary-ink">Residential homes only</p>
                <p className="mb-0 mt-2 text-base leading-7 text-ink/65">AE follows MOM's Household Services Scheme — cleaners serve residential homes only, with booking records and checklists for every visit.</p>
              </div>
            </div>
          </div>
        </div>

        <div ref={gridReveal.ref} className={`grid gap-5 transition duration-500 md:grid-cols-3 ${gridReveal.className}`}>
          {proofCards.map((card) => (
            <article className="rounded-[20px] border border-line bg-white p-7 transition-shadow hover:shadow-[0_18px_44px_rgb(9_30_66_/_0.08)]" key={card.title}>
              <p className="m-0 font-display text-[clamp(3rem,4.5vw,4rem)] font-semibold leading-none tracking-tight text-navy-900">
                {card.stat}
                <span className="ml-2 align-baseline font-display text-xl font-medium italic text-gold-text">{card.unit}</span>
              </p>
              <h3 className="mb-2 mt-6 font-display text-xl font-medium leading-7 text-ink">{card.title}</h3>
              <p className="m-0 text-[15px] leading-7 text-ink/65">{card.copy}</p>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}
