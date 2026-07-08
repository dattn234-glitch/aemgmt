import { ArrowRight, Check } from "lucide-react";
import { useReveal } from "../hooks/useReveal";
import { formatMoney } from "../lib/company";
import type { PricingContent, PricingPlan } from "../lib/site-content";
import { cn } from "../lib/utils";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import { Container } from "./ui";

type PricingSectionProps = {
  pricing: PricingContent;
  teaser?: boolean;
};

export function PricingSection({ pricing, teaser = false }: PricingSectionProps) {
  const headerReveal = useReveal<HTMLDivElement>();
  const gridReveal = useReveal<HTMLDivElement>();
  const plans = pricing.plans;

  return (
    <section className="scroll-mt-[88px] bg-cream py-20 lg:py-28" id="pricing" aria-labelledby="pricing-title">
      <Container className="grid gap-10">
        <div
          ref={headerReveal.ref}
          className={`mx-auto grid max-w-3xl justify-items-center gap-4 text-center transition duration-500 ${headerReveal.className}`}
        >
          <p className="m-0 text-sm font-semibold uppercase tracking-[0.08em] text-primary-ink">{pricing.eyebrow}</p>
          <h2 id="pricing-title" className="m-0 font-display text-h2 font-medium text-ink">
            Simple,{" "}
            <span className="text-ink">transparent pricing.</span>
          </h2>
          <p className="m-0 text-lg leading-8 text-ink/65">{pricing.subtitle}</p>
          {teaser ? null : <p className="m-0 rounded-full bg-primary-soft px-4 py-2 text-sm font-medium text-ink">Weekend visits add S$8-15 — confirmed in your quote.</p>}
        </div>

        <div ref={gridReveal.ref} className={`grid items-stretch gap-6 transition duration-500 lg:grid-cols-3 ${gridReveal.className}`}>
          {plans.map((plan) => (
            <PricingPlanCard key={plan.name} plan={plan} />
          ))}
        </div>

        <div className="mx-auto grid justify-items-center gap-4 text-center">
          <p className="m-0 text-sm text-ink/65">
            {teaser ? "See full pricing for package rates by home size, add-ons, and how payment works." : "Package cleans are from-prices. Exact scope and cleaner availability are confirmed by AE."}
          </p>
          <Button asChild>
            <a href={teaser ? "#pricing" : "#booking"}>
              {teaser ? "See full pricing" : "Get my quote"}
              <ArrowRight size={16} aria-hidden="true" />
            </a>
          </Button>
        </div>
      </Container>
    </section>
  );
}

export function PricingPlanCard({ plan }: { plan: PricingPlan }) {
  return (
    <article
      className={cn(
        "relative flex flex-col rounded-[22px] border border-line bg-white p-7",
        plan.featured && "border-2 border-navy bg-white shadow-[0_18px_40px_rgb(9_30_66_/_0.12)] lg:scale-[1.03]"
      )}
    >
      {plan.featured ? (
        <span className="absolute left-1/2 top-0 inline-flex h-9 -translate-x-1/2 -translate-y-1/2 items-center gap-2 whitespace-nowrap rounded-full bg-gold px-5 text-sm font-semibold text-navy-900 shadow-[0_8px_18px_rgb(122_82_16_/_0.22)]">
          <span className="size-1.5 rounded-full bg-navy-900" aria-hidden="true" />
          Most popular
        </span>
      ) : null}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="m-0 font-display text-2xl font-medium">{plan.name}</h3>
          <p className="mb-0 mt-2 text-sm leading-6 text-ink/65">{plan.description}</p>
        </div>
        <span className="mt-1 text-right text-[11px] font-semibold uppercase tracking-[0.08em] text-ink/65">
          {shortCapacity(plan.capacity)}
        </span>
      </div>
      <div className="mt-7 flex items-end gap-2">
        <strong className={cn("font-display text-5xl font-medium leading-none", plan.featured && "text-primary-ink")}>{plan.priceLabel ?? formatMoney(plan.price)}</strong>
        <span className="pb-1 text-sm text-ink/65">{plan.suffix}</span>
      </div>
      {plan.durationPrices ? (
        <div className={cn("mt-5 overflow-hidden rounded-[18px] border border-line bg-paper text-sm", plan.featured && "bg-primary-soft")}>
          {plan.durationPrices.map((row) => (
            <div className="flex items-center justify-between border-b border-line px-4 py-3 last:border-b-0" key={row.label}>
              <span className="text-ink/65">{row.label}</span>
              <strong className="font-semibold">{formatMoney(row.price)}</strong>
            </div>
          ))}
        </div>
      ) : null}
      <Separator className="my-6 bg-line" />
      <ul className="mb-7 grid gap-3 p-0">
        {plan.features.map((feature) => (
          <li className="grid grid-cols-[16px_1fr] items-start gap-3 text-sm leading-6 text-ink/70" key={feature}>
            <Check className={cn("mt-1", plan.featured ? "text-primary-ink" : "text-ink/45")} size={16} aria-hidden="true" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
      <Button className="mt-auto w-full" asChild variant={plan.featured ? "default" : "secondary"}>
        <a href="#booking">
          Book this rate
          <ArrowRight size={16} aria-hidden="true" />
        </a>
      </Button>
    </article>
  );
}

function shortCapacity(capacity: string) {
  return capacity.replace("Up to ", "").replace(" bedrooms", " bd").replace(" bedroom", " bd").replace(" baths", " ba").replace(" bath", " ba");
}
