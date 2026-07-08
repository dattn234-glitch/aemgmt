import { Check, HelpCircle, Minus } from "lucide-react";
import { Reveal } from "../Reveal";
import type { PricingContent } from "../../lib/site-content";
import { company, formatMoney, formatSignedMoney } from "../../lib/company";
import { CtaBand } from "../page/CtaBand";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion";
import { Button } from "../ui/button";
import { Container } from "../ui";

const rateCards = [
  {
    name: "Weekly",
    label: "For busy homes",
    price: "S$24-26/hr",
    sub: "Best for busy households",
    rows: ["3-4 hour minimum", "Same cleaner where available", "Replacement cleaner guarantee"],
    featured: true
  },
  {
    name: "Fortnightly",
    label: "Every two weeks",
    price: "S$25-28/hr",
    sub: "Best for lighter upkeep",
    rows: ["3-4 hour minimum", "Digital cleaning checklist", "Easy rescheduling"],
    featured: false
  },
  {
    name: "One-time",
    label: "One-off refresh",
    price: "S$28-32/hr",
    sub: "Best for a one-off refresh",
    rows: ["3-4 hour minimum", "Cleaner assigned by availability", "Pay by PayNow after service"],
    featured: false
  }
] as const;

const packageCards = [
  ["Move-in / move-out", "Tenancy handover, pre-move-in reset, keys collection clean.", "S$300-S$450"],
  ["Post-renovation", "Fine dust reset after renovation works are complete.", "S$300-S$450"],
  ["Deep add-ons", "Kitchen degreasing, bathroom detail, fridge/oven, sofa or mattress extraction.", "Quoted by scope"]
] as const;

const comparisonSections = [
  {
    title: "Your cleaner",
    rows: [
      ["Same cleaner each visit", "Where available", "Where available", "By availability", "Assigned per job"],
      ["Replacement if your cleaner is away", "Included", "Included", "Best effort", "Included"],
      ["Help if something's not right", "Priority", "Standard", "Standard", "Handled by AE"]
    ]
  },
  {
    title: "Booking and payment",
    rows: [
      ["Online booking webpage", "Yes", "Yes", "Yes", "Yes"],
      ["WhatsApp support", "Yes", "Yes", "Yes", "Yes"],
      ["Cashless payment", "PayNow after service", "PayNow after service", "PayNow after service", "After AE quote"],
      ["Easy rescheduling", "Yes", "Yes", "Limited", "Before the visit"]
    ]
  },
  {
    title: "Proof and protection",
    rows: [
      ["Digital cleaning checklist", "Included", "Included", "Available", "Included"],
      ["Photo/checklist completion", "Included", "Included", "Available", "Included"],
      ["Public-liability and damage coverage", "Covered", "Covered", "Covered", "Covered"],
      ["Weekend surcharge", "S$8-15", "S$8-15", "S$8-15", "Confirmed in quote"]
    ]
  }
] as const;

const faqs = [
  ["Do I get the same cleaner each time?", "On weekly and fortnightly plans we keep the same cleaner where available, so they learn your home. If they're ever away, we send a replacement so your visit still happens."],
  ["When do I pay?", "After the visit. You book online, AE confirms your slot, and once the clean is done we send the invoice on WhatsApp — you pay by PayNow using the reference on it."],
  ["What's the minimum booking?", "Hourly cleaning starts at 3-4 hours depending on your home size. You lock the length when you book, and can change it before submitting."],
  ["How are packages priced?", "Move-in/out and post-renovation cleans run S$300-S$450 for homes up to 1,300 sq ft. AE confirms the exact price for your home before the visit."]
] as const;

export function PricingPage({ pricing }: { pricing: PricingContent }) {
  return (
    <>
      <section className="bg-cream pt-28 pb-16 lg:pt-36 lg:pb-20" aria-labelledby="pricing-page-title">
        <Container className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div className="grid gap-4">
            <p className="m-0 text-sm font-semibold uppercase tracking-[0.08em] text-primary-ink">Pricing</p>
            <div className="flex flex-wrap items-end gap-x-5 gap-y-2">
              <p className="m-0 font-display text-[clamp(4.5rem,10vw,8rem)] font-semibold leading-[0.9] tracking-tight text-navy-900 [font-variant-numeric:tabular-nums]">
                S$24
              </p>
              <p className="m-0 pb-2 font-display text-xl font-semibold italic text-ink/55">/hr from</p>
            </div>
            <h1 id="pricing-page-title" className="m-0 max-w-xl font-display text-h3 font-semibold leading-snug text-ink">
              Clear home cleaning rates, <em className="italic text-primary-ink">no surprises.</em>
            </h1>
            <p className="m-0 max-w-2xl text-lg leading-8 text-ink/65">
              Simple hourly rates for weekly, fortnightly, and one-time cleaning, plus fixed packages for move-in/out and post-renovation. You only pay by PayNow after the visit.
            </p>
          </div>
          <div className="grid grid-cols-[44px_1fr] gap-4 rounded-[24px] border border-line bg-white p-6">
            <span className="grid size-11 place-items-center rounded-xl bg-primary-soft text-ink">
              <HelpCircle size={21} aria-hidden="true" />
            </span>
            <div>
              <p className="m-0 text-sm font-semibold uppercase tracking-[0.08em] text-primary-ink">Booking note</p>
              <p className="mb-0 mt-3 text-lg leading-7 text-ink/70">
                Weekend visits add +S$8-15 as a visible line item — AE confirms the exact amount in your quote. Payment is requested only after the service is completed and the invoice is ready.
              </p>
            </div>
          </div>
        </Container>
      </section>

      <section className="bg-paper py-18 lg:py-24">
        <Container className="grid gap-9">
          <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)] lg:items-start">
            <div className="min-w-0">
              <p className="m-0 text-sm font-semibold uppercase tracking-[0.08em] text-primary-ink">Hourly cleaning</p>
              <h2 className="mt-3 font-display text-h2 font-semibold leading-tight text-ink">
                Choose how often,{" "}
                <span className="text-ink">then how long.</span>
              </h2>
              <p className="mt-4 max-w-xl text-base leading-7 text-ink/62">
                Weekly or fortnightly keeps the same cleaner and the best rate. Prefer a one-off? One-time cleaning is always available.
              </p>
            </div>
            <div className="grid min-w-0 items-stretch gap-4 md:grid-cols-2 xl:grid-cols-3">
              {rateCards.map((plan, index) => (
                <Reveal className="h-full min-w-0" delay={index * 0.08} key={plan.name}>
                <article className={`relative flex h-full min-w-0 flex-col gap-4 rounded-[24px] border p-6 ${plan.featured ? "border-navy-900 bg-navy-900 text-white shadow-[0_18px_44px_rgb(9_30_66_/_0.18)]" : "border-line bg-white"}`}>
                  {plan.featured ? <span className="absolute -top-3 left-6 rounded-full bg-gold px-3 py-1 text-xs font-semibold text-navy-900">Most popular</span> : null}
                  <p className={`m-0 text-xs font-semibold uppercase tracking-[0.08em] ${plan.featured ? "text-sky-200" : "text-primary-ink"}`}>{plan.label}</p>
                  <div>
                    <h3 className={`m-0 font-display text-[30px] font-semibold ${plan.featured ? "text-white" : "text-ink"}`}>{plan.name}</h3>
                    <p className={`m-0 mt-1 text-sm ${plan.featured ? "text-white/60" : "text-ink/55"}`}>{plan.sub}</p>
                  </div>
                  <p className={`m-0 font-display text-[32px] font-semibold leading-none [font-variant-numeric:tabular-nums] sm:text-[36px] xl:text-[42px] ${plan.featured ? "text-gold" : "text-ink"}`}>{plan.price}</p>
                  <ul className={`grid gap-3 p-0 text-sm ${plan.featured ? "text-white/80" : "text-ink/68"}`}>
                    {plan.rows.map((row) => (
                      <li className="grid grid-cols-[16px_1fr] gap-3" key={row}>
                        <Check className={`mt-0.5 size-4 ${plan.featured ? "text-gold" : "text-ink/45"}`} aria-hidden="true" />
                        <span>{row}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-auto pt-2">
                    <Button asChild className={`w-full ${plan.featured ? "bg-gold text-navy-900 hover:bg-gold/90" : ""}`}>
                      <a href="#booking">Book this rate</a>
                    </Button>
                  </div>
                </article>
                </Reveal>
              ))}
            </div>
          </div>

          <div className="grid min-w-0 gap-4 rounded-[24px] border border-line bg-white p-6 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
            <div className="min-w-0">
              <p className="m-0 text-sm font-semibold uppercase tracking-[0.08em] text-primary-ink">Packages</p>
              <h2 className="mt-3 font-display text-[38px] font-semibold leading-tight text-ink">
                Fixed-price{" "}
                <span className="text-ink">package cleans.</span>
              </h2>
              <p className="mt-4 text-sm leading-6 text-ink/62">For move-in/out handovers and post-renovation dust — priced by home size, confirmed by AE before the visit.</p>
            </div>
            <div className="grid min-w-0 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {packageCards.map(([name, description, price]) => (
                <article className="flex min-w-0 flex-col rounded-[20px] border border-line bg-paper p-5" key={name}>
                  <h3 className="m-0 font-display text-2xl font-semibold text-ink">{name}</h3>
                  <p className="m-0 mt-3 text-sm leading-6 text-ink/62">{description}</p>
                  <p className="m-0 mt-auto pt-5 text-xl font-semibold text-ink">{price}</p>
                </article>
              ))}
            </div>
            <div className="min-w-0 lg:col-span-2">
              <div className="overflow-x-auto rounded-[20px] border border-line" role="region" aria-label="Package prices by home size" tabIndex={0}>
                <table className="w-full min-w-[520px] border-collapse text-left text-sm [font-variant-numeric:tabular-nums]">
                  <thead>
                    <tr className="border-b border-line bg-paper">
                      <th className="p-4 font-semibold text-ink/60">Home size</th>
                      <th className="p-4 font-display text-lg font-semibold text-ink">Move-in / out</th>
                      <th className="p-4 font-display text-lg font-semibold text-ink">Post-renovation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {company.packageMatrix.map((tier) => (
                      <tr className="border-b border-line last:border-b-0" key={tier.size}>
                        <td className="p-4 font-medium text-ink/75">{tier.size}</td>
                        <td className="p-4 text-ink/70">{tier.moveInOut === null ? "Custom quote" : formatMoney(tier.moveInOut)}</td>
                        <td className="p-4 text-ink/70">{tier.postRenovation === null ? "Custom quote" : formatMoney(tier.postRenovation)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mb-0 mt-3 text-xs leading-5 text-ink/50">
                Fixed package prices by floor area. AE confirms the exact price for your home before the visit — larger homes get a custom quote on WhatsApp.
              </p>
            </div>
          </div>
        </Container>
      </section>

      <section className="bg-cream py-18 lg:py-24">
        <Container className="grid gap-8">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)] lg:items-end">
            <div>
              <p className="m-0 text-sm font-semibold uppercase tracking-[0.08em] text-primary-ink">Compare features</p>
              <h2 className="mt-3 font-display text-h2 font-semibold leading-tight text-ink">
                Compare what's included <em className="italic text-primary-ink">in each plan.</em>
              </h2>
            </div>
            <p className="m-0 max-w-md text-base leading-7 text-ink/60 lg:justify-self-end lg:text-right">
              The same booking flow, checklist, and pay-after-service protection — the plans differ in rate and cleaner continuity.
            </p>
          </div>

          <div className="relative min-w-0 max-w-full rounded-[24px] border border-line bg-white">
            <div
              className="w-full max-w-full overflow-x-auto rounded-[24px] [scrollbar-gutter:stable]"
              data-pricing-table-scroller="true"
              role="region"
              aria-label="Pricing feature comparison"
              tabIndex={0}
            >
              <table className="w-full min-w-[720px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-line">
                  <th className="w-[34%] p-5 font-semibold text-ink/60">Feature</th>
                  {["Weekly", "Fortnightly", "One-time", "Packages"].map((column) => (
                    <th className="p-5 font-display text-xl font-semibold text-ink" key={column}>
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comparisonSections.map((section) => (
                  <PricingMatrixSection rows={section.rows} title={section.title} key={section.title} />
                ))}
              </tbody>
            </table>
            </div>
            <div className="pointer-events-none absolute inset-y-0 right-0 w-10 rounded-r-[24px] bg-gradient-to-l from-white to-white/0" aria-hidden="true" />
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {pricing.addons.map((addon) => (
              <div className="flex items-center justify-between rounded-[18px] border border-line bg-white px-5 py-4 text-sm font-semibold" key={addon.name}>
                <span className="text-ink/70">{addon.name}</span>
                <span className="rounded-full bg-primary-soft px-3 py-1 text-ink">{formatSignedMoney(addon.price)}</span>
              </div>
            ))}
          </div>

          <Accordion className="rounded-[22px] border border-line bg-white px-6" type="single" collapsible>
            {faqs.map(([question, answer]) => (
              <AccordionItem value={question} key={question}>
                <AccordionTrigger className="font-display text-xl font-semibold">{question}</AccordionTrigger>
                <AccordionContent className="text-base leading-7 text-ink/65">{answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Container>
      </section>

      <CtaBand
        variant="inline"
        tone="paper"
        title={<>Pick a plan and{" "}<em className="italic text-primary-ink">book in minutes.</em></>}
        primary={{ label: "Get my quote", href: "#booking" }}
        sub="Choose your service, date, and home details. AE confirms your slot first — you only pay by PayNow after the visit."
      />
    </>
  );
}

function PricingMatrixSection({
  rows,
  title
}: {
  rows: readonly (readonly [string, string, string, string, string])[];
  title: string;
}) {
  return (
    <>
      <tr className="border-y border-line bg-paper">
        <td className="p-5 font-display text-2xl font-semibold text-ink" colSpan={5}>{title}</td>
      </tr>
      {rows.map((row) => (
        <tr className="border-b border-line last:border-b-0" key={row[0]}>
          <td className="p-5 text-ink/75">{row[0]}</td>
          {row.slice(1).map((cell, index) => (
            <td className="p-5 text-ink/65" key={`${row[0]}-${index}`}>
              {cell === "No" ? <Minus className="size-4 text-ink/35" aria-hidden="true" /> : cell}
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
