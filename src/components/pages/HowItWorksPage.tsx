import { CalendarClock, CheckCircle2, ClipboardCheck, PackageCheck } from "lucide-react";
import { Icon3D, type Icon3DName } from "../Icon3D";
import { Reveal } from "../Reveal";
import { CtaBand } from "../page/CtaBand";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion";
import { Container } from "../ui";

const steps = [
  {
    number: "01",
    title: "Book online",
    chip: "~2 minutes",
    icon: "calendar" as Icon3DName,
    copy: "Pick your service, date, and frequency online. AE confirms your slot on WhatsApp — no callbacks, no phone tag.",
    youDo: "Choose the service, tell us about your home, and pick a time that suits you.",
    weDo: "Match you with the right cleaner, confirm the slot, and send a WhatsApp confirmation."
  },
  {
    number: "02",
    title: "We show up",
    chip: "On time, equipped",
    icon: "broom" as Icon3DName,
    copy: "A vetted cleaner arrives in the confirmed window with supplies included, and works through your home's digital checklist.",
    youDo: "Let us in — or leave access notes at booking. You don't need to be home.",
    weDo: "Clean room by room to the checklist, and note anything that needs your attention."
  },
  {
    number: "03",
    title: "Enjoy & pay after",
    chip: "PayNow, no deposits",
    icon: "house" as Icon3DName,
    copy: "You get completion photos with the checklist, then the invoice on WhatsApp. Pay by PayNow only once you're happy.",
    youDo: "Review the photos, then settle the invoice by PayNow whenever it suits you.",
    weDo: "Send the photo report and invoice, and fix anything important that was missed."
  }
] as const;

const visitTimeline = [
  ["Arrival window", "Your cleaner arrives in the confirmed window — you get a heads-up if anything shifts."],
  ["Quick walkthrough", "On first visits, two minutes to align on priorities and no-go areas."],
  ["Checklist clean", "Room by room through the digital checklist, with your priorities first."],
  ["Photo report", "Completion photos are shared so you can see the work, even from the office."],
  ["PayNow invoice", "The invoice arrives on WhatsApp — pay after service, not before."]
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
  ["How do I reschedule?", "Message AE on WhatsApp or use the contact form. Reschedules with 24 hours notice are free."]
] as const;

export function HowItWorksPage() {
  return (
    <>
      <section className="bg-paper pb-14 pt-32 lg:pb-16 lg:pt-40">
        <Container className="grid gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-end">
          <div className="grid gap-4">
            <p className="m-0 text-sm font-semibold uppercase tracking-[0.08em] text-primary-ink">HOW IT WORKS</p>
            <h1 className="m-0 font-display text-display font-medium text-ink">
              Three steps. <em className="italic text-primary-ink">Zero chasing.</em>
            </h1>
          </div>
          <p className="m-0 max-w-md text-lg leading-8 text-ink/65 lg:pb-3">
            Book in minutes, welcome a prepared cleaner, and pay only after the work is done. Here's exactly what
            happens at each step.
          </p>
        </Container>
      </section>

      <section className="bg-paper pb-20 lg:pb-28">
        <Container className="grid gap-14 lg:gap-4">
          {steps.map((step) => (
            <div className="grid gap-6 border-t border-line pt-10 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] lg:gap-10 lg:pb-14" key={step.number}>
              <div className="lg:sticky lg:top-28 lg:self-start">
                <p className="m-0 font-display text-[clamp(4rem,8vw,7rem)] font-semibold leading-none tracking-tight text-navy-900/12">
                  {step.number}
                </p>
                <div className="-mt-6 flex items-center gap-4 lg:-mt-8">
                  <span className="grid size-[64px] shrink-0 place-items-center rounded-full border border-line bg-white shadow-[0_10px_24px_rgb(9_30_66_/_0.06)]">
                    <Icon3D name={step.icon} size={38} tile={false} />
                  </span>
                  <div>
                    <h2 className="m-0 font-display text-h3 font-medium text-ink">{step.title}</h2>
                    <span className="mt-1.5 inline-flex rounded-full bg-gold-soft px-3 py-1 text-xs font-semibold text-gold-text">{step.chip}</span>
                  </div>
                </div>
              </div>
              <Reveal className="grid gap-4">
                <p className="m-0 max-w-2xl text-xl leading-9 text-ink/75">{step.copy}</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-[20px] border border-line bg-white p-6">
                    <p className="m-0 text-xs font-semibold uppercase tracking-[0.08em] text-primary-ink">What you do</p>
                    <p className="mb-0 mt-3 text-[15px] leading-7 text-ink/70">{step.youDo}</p>
                  </div>
                  <div className="rounded-[20px] bg-navy-900 p-6 text-white">
                    <p className="m-0 text-xs font-semibold uppercase tracking-[0.08em] text-sky-200">What we do</p>
                    <p className="mb-0 mt-3 text-[15px] leading-7 text-white/80">{step.weDo}</p>
                  </div>
                </div>
              </Reveal>
            </div>
          ))}
        </Container>
      </section>

      <section className="bg-navy-900 py-20 text-white lg:py-24">
        <Container className="grid gap-10">
          <div className="grid gap-3">
            <p className="m-0 text-sm font-semibold uppercase tracking-[0.08em] text-sky-200">A VISIT, HOUR BY HOUR</p>
            <h2 className="m-0 max-w-2xl font-display text-h2 font-medium">
              What a visit looks like <em className="italic text-sky-200">from your side.</em>
            </h2>
          </div>
          <ol className="m-0 grid list-none gap-3 p-0 md:grid-cols-2 xl:grid-cols-5">
            {visitTimeline.map(([title, copy], index) => (
              <li className="relative rounded-[20px] border border-white/12 bg-white/5 p-5" key={title}>
                <span className="font-display text-sm font-semibold text-gold">{String(index + 1).padStart(2, "0")}</span>
                <h3 className="mb-0 mt-2 font-display text-lg font-medium leading-snug text-white">{title}</h3>
                <p className="mb-0 mt-2 text-sm leading-6 text-white/65">{copy}</p>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      <section className="bg-cream py-20 lg:py-28">
        <Container className="grid gap-10">
          <div className="grid gap-3">
            <p className="m-0 text-sm font-semibold uppercase tracking-[0.08em] text-primary-ink">FIRST VISIT</p>
            <h2 className="m-0 font-display text-h2 font-medium text-ink">
              What to expect the first <em className="italic text-primary-ink">time we visit.</em>
            </h2>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {expectations.map(([title, copy, Icon]) => (
              <article className="rounded-[20px] border border-line bg-white p-7" key={title}>
                <span className="grid size-10 place-items-center rounded-xl bg-primary-soft text-ink"><Icon size={20} aria-hidden="true" /></span>
                <h3 className="mb-2 mt-5 font-display text-2xl font-medium text-ink">{title}</h3>
                <p className="m-0 text-sm leading-6 text-ink/60">{copy}</p>
              </article>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {["Free reschedules 24h+", "Cancel anytime", "Satisfaction guarantee"].map((policy) => (
              <span className="inline-flex items-center gap-2 rounded-full bg-primary-soft px-4 py-2 text-sm font-medium text-ink" key={policy}>
                <CheckCircle2 size={15} aria-hidden="true" />
                {policy}
              </span>
            ))}
          </div>
          <Accordion className="rounded-[22px] border border-line bg-white px-6" type="single" collapsible>
            {faqs.map(([question, answer]) => (
              <AccordionItem value={question} key={question}>
                <AccordionTrigger className="font-display text-xl font-medium">{question}</AccordionTrigger>
                <AccordionContent className="text-base leading-7 text-ink/65">{answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Container>
      </section>

      <CtaBand
        variant="full"
        title={<>Tell us the date. We handle the <em className="italic text-sky-200">rest.</em></>}
        sub="Move from booking to AE confirmation to a finished clean without chasing updates or guessing the next step."
      />
    </>
  );
}
