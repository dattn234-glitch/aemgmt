import { CalendarClock, CheckCircle2, ClipboardCheck, PackageCheck } from "lucide-react";
import { CtaBand } from "../page/CtaBand";
import { PageHero } from "../page/PageHero";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion";
import { Container } from "../ui";

const steps = [
  ["Book Online", "Pick your service, date, and frequency. Instant confirmation means no callbacks or phone tag.", "~2 min"],
  ["We Show Up", "A vetted cleaner arrives on time, fully equipped, and ready to work to your checklist.", "Same team"],
  ["Enjoy Your Home", "Relax into a reset home, with follow-up handled only when you need it.", "No follow-up needed"]
] as const;

const expectations = [
  ["Arrival window & walkthrough", "We confirm the window and review priorities for first visits.", CalendarClock],
  ["Supplies included", "Teams arrive with the core supplies needed for your selected clean.", PackageCheck],
  ["Post-clean checklist review", "We close the loop on the rooms and details that mattered most.", ClipboardCheck]
] as const;

const faqs = [
  ["How do keys or access work?", "Add access notes during booking. Many clients use a lockbox, concierge, garage code, or meet the cleaner for the first visit."],
  ["What about pets?", "Friendly pets are welcome. Share notes so the team knows names, rooms, and any doors that should stay closed."],
  ["Do I need to provide supplies?", "No. Standard supplies are included. If you prefer a specific product, leave it out with a note."],
  ["How do I reschedule?", "Use the contact flow or call us. Reschedules with 24 hours notice are free."]
] as const;

export function HowItWorksPage() {
  return (
    <>
      <PageHero
        eyebrow="HOW IT WORKS"
        title={<>A clean home in <span className="text-navy">three steps.</span></>}
        sub="Book in minutes, welcome a prepared team, and enjoy a home that feels reset."
      />

      <section className="bg-paper py-20 lg:py-28">
        <Container className="grid gap-12">
          <div className="relative grid gap-10">
            <div className="absolute bottom-16 left-9 top-16 hidden border-l-2 border-dotted border-ink/15 md:block" aria-hidden="true" />
            {steps.map(([title, copy, chip], index) => (
              <article className="grid gap-5 md:grid-cols-[72px_1fr] md:items-start" key={title}>
                <span className="relative z-10 grid size-[72px] place-items-center rounded-full border border-line bg-white font-display text-3xl font-normal text-navy">{index + 1}</span>
                <div className="rounded-[22px] border border-line bg-white p-7">
                  <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-navy">{chip}</span>
                  <h2 className="mb-3 mt-5 font-display text-2xl font-normal text-ink">{title}</h2>
                  <p className="m-0 text-lg leading-8 text-ink/65">{copy}</p>
                </div>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <section className="bg-cream py-20 lg:py-28">
        <Container className="grid gap-10">
          <div className="grid gap-3">
            <p className="m-0 text-sm font-semibold uppercase tracking-[0.08em] text-navy">FIRST VISIT</p>
            <h2 className="m-0 font-display text-h2 font-normal text-ink">
              What to expect the first{" "}
              <span className="text-navy">time we visit.</span>
            </h2>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {expectations.map(([title, copy, Icon]) => (
              <article className="rounded-[20px] border border-line bg-white p-7" key={title}>
                <span className="grid size-10 place-items-center rounded-xl bg-sky-100 text-navy"><Icon size={20} aria-hidden="true" /></span>
                <h3 className="mb-2 mt-5 font-display text-2xl font-normal text-ink">{title}</h3>
                <p className="m-0 text-sm leading-6 text-ink/60">{copy}</p>
              </article>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {["Free reschedules 24h+", "Cancel anytime", "Satisfaction guarantee"].map((policy) => (
              <span className="inline-flex items-center gap-2 rounded-full bg-sky-100 px-4 py-2 text-sm font-medium text-navy" key={policy}>
                <CheckCircle2 size={15} aria-hidden="true" />
                {policy}
              </span>
            ))}
          </div>
          <Accordion className="rounded-[22px] border border-line bg-white px-6" type="single" collapsible>
            {faqs.map(([question, answer]) => (
              <AccordionItem value={question} key={question}>
                <AccordionTrigger className="font-display text-xl font-normal">{question}</AccordionTrigger>
                <AccordionContent className="text-base leading-7 text-ink/65">{answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Container>
      </section>

      <CtaBand tone="cream" sub="Book once, tell us what matters, and let a vetted team handle the reset." />
    </>
  );
}
