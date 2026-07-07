import { Check, Minus } from "lucide-react";
import type { PricingContent } from "../../lib/site-content";
import { company } from "../../lib/company";
import { CtaBand } from "../page/CtaBand";
import { PageHero } from "../page/PageHero";
import { PricingSection } from "../PricingSection";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion";
import { Container } from "../ui";

const faqs = [
  ["How is the exact price set?", "Hourly cleaning is calculated from your selected frequency and 3 or 4 hour duration. Package cleaning starts from the size table, then AE confirms the final quote on WhatsApp after checking home condition and scope."],
  ["How do I pay?", "No payment is collected on the website. After WhatsApp confirmation, AE shares PayNow or bank-transfer details for cashless payment."],
  ["Do I need to be home?", "No. Many clients share access instructions during booking. We can also do a quick walkthrough at the first visit if you prefer."],
  ["Can I reschedule?", "Yes. Message us on WhatsApp as early as possible and we will help arrange the next suitable slot."]
] as const;

const whyAeRows = [
  ["Same cleaner", "Yes, where available", "Often changes"],
  ["Replacement guarantee", "Included", "Varies"],
  ["Platform fee", "Free", "Often added"],
  ["WhatsApp support", "Direct support", "Limited or ticketed"]
] as const;

export function PricingPage({ pricing }: { pricing: PricingContent }) {
  const features = Array.from(new Set(pricing.plans.flatMap((plan) => plan.features)));

  return (
    <>
      <PageHero
        eyebrow="PRICING"
        title={<>Hourly rates, <span className="text-navy">clear packages.</span></>}
        sub="S$ hourly home cleaning plus from-price packages for residential move-in/out and post-renovation cleans."
      />
      <PricingSection pricing={pricing} />

      <section className="bg-paper py-20 lg:py-28">
        <Container className="grid gap-10">
          <div className="grid gap-3">
            <p className="m-0 text-sm font-semibold uppercase tracking-[0.08em] text-navy">WHY AE</p>
            <h2 className="m-0 font-display text-h2 font-normal text-ink">
              A more reliable home cleaning{" "}
              <span className="text-navy">experience.</span>
            </h2>
          </div>
          <div className="overflow-x-auto rounded-[22px] border border-line bg-white">
            <table className="w-full min-w-[720px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-line">
                  <th className="p-4 font-medium text-ink/55">Item</th>
                  <th className="p-4 font-display text-xl font-normal text-ink">AE Management Services</th>
                  <th className="p-4 font-display text-xl font-normal text-ink">Others</th>
                </tr>
              </thead>
              <tbody>
                {whyAeRows.map(([item, ae, others]) => (
                  <tr className="border-b border-line last:border-b-0" key={item}>
                    <td className="p-4 text-ink/70">{item}</td>
                    <td className="p-4 text-ink/75"><Check className="mr-2 inline text-navy" size={18} aria-hidden="true" />{ae}</td>
                    <td className="p-4 text-ink/55"><Minus className="mr-2 inline text-ink/25" size={18} aria-hidden="true" />{others}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid gap-4 rounded-[22px] border border-line bg-white p-6">
            <h3 className="m-0 font-display text-2xl font-normal text-ink">Package cleaning from-prices</h3>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-line text-ink/55">
                    <th className="py-3 pr-4 font-medium">Home size</th>
                    <th className="py-3 pr-4 font-medium">Move-In/Out</th>
                    <th className="py-3 pr-4 font-medium">Post-Renovation</th>
                  </tr>
                </thead>
                <tbody>
                  {company.packageMatrix.map((row) => (
                    <tr className="border-b border-line last:border-b-0" key={row.size}>
                      <td className="py-3 pr-4 text-ink/70">{row.size}</td>
                      <td className="py-3 pr-4 font-semibold text-navy">{formatPackage(row.moveInOut)}</td>
                      <td className="py-3 pr-4 font-semibold text-navy">{formatPackage(row.postRenovation)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="m-0 text-sm leading-6 text-ink/60">Exact quote confirmed on WhatsApp after we check home size, condition, and add-ons.</p>
          </div>

          <div className="grid gap-3 rounded-[20px] border border-line bg-white p-6">
            <h3 className="m-0 font-display text-2xl font-normal text-ink">Add-ons price list</h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {pricing.addons.map((addon) => (
                <div className="flex items-center justify-between border-b border-line py-2 text-sm last:border-b-0 lg:border-b-0" key={addon.name}>
                  <span className="text-ink/70">{addon.name}</span>
                  <span className="font-semibold text-navy">+S${addon.price}</span>
                </div>
              ))}
            </div>
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

      <CtaBand tone="paper" primary={{ label: "Get my exact quote", href: "#booking" }} sub="Tell us about your Singapore home and confirm cleaner availability on WhatsApp." />
    </>
  );
}

function formatPackage(value: number | null) {
  return value === null ? "Custom quote" : `from S$${value}`;
}
