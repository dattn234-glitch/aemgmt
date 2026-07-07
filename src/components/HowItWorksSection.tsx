import { useReveal } from "../hooks/useReveal";
import { Container } from "./ui";

const steps = [
  {
    title: "Book Online",
    copy: "Pick your service, date, and frequency. Instant confirmation - no callbacks or phone tag."
  },
  {
    title: "We Show Up",
    copy: "A vetted cleaner arrives on time, fully equipped, ready to work to your checklist."
  },
  {
    title: "Enjoy Your Home",
    copy: "Relax. We handle the rest - every time, on your schedule."
  }
] as const;

export function HowItWorksSection() {
  const headerReveal = useReveal<HTMLDivElement>();
  const gridReveal = useReveal<HTMLDivElement>();

  return (
    <section className="scroll-mt-[88px] bg-paper py-20 lg:py-28" id="how-it-works" aria-labelledby="how-it-works-title">
      <Container className="grid gap-12 text-center">
        <div ref={headerReveal.ref} className={`mx-auto grid max-w-3xl gap-4 transition duration-500 ${headerReveal.className}`}>
          <p className="m-0 text-sm font-semibold uppercase tracking-[0.08em] text-navy">HOW IT WORKS</p>
          <h2 id="how-it-works-title" className="m-0 font-display text-h2 font-normal text-ink">
            A clean home in{" "}
            <span className="text-navy">three steps.</span>
          </h2>
        </div>
        <div ref={gridReveal.ref} className={`relative grid gap-8 transition duration-500 lg:grid-cols-3 ${gridReveal.className}`}>
          <div className="absolute left-[16.5%] right-[16.5%] top-9 hidden border-t-2 border-dotted border-ink/15 lg:block" aria-hidden="true" />
          {steps.map((step, index) => (
            <article className="relative grid justify-items-center gap-4" key={step.title}>
              <span className="grid size-[72px] place-items-center rounded-full border border-line bg-white font-display text-3xl font-normal text-navy">
                {index + 1}
              </span>
              <h3 className="m-0 font-display text-2xl font-normal text-ink">{step.title}</h3>
              <p className="m-0 max-w-sm leading-7 text-ink/65">{step.copy}</p>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}
