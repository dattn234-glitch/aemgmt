import { Check, Home, Leaf, ShieldCheck, Sparkles, type LucideIcon } from "lucide-react";
import kitchenImage from "../../assets/ae-cleaner-kitchen.png";
import livingRoomImage from "../../assets/ae-hero-living-room.png";
import type { BookingContent, PricingContent } from "../../lib/site-content";
import { CtaBand } from "../page/CtaBand";
import { PageHero } from "../page/PageHero";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion";
import { Button } from "../ui/button";
import { Container } from "../ui";

const serviceVisuals: { icon: LucideIcon; image?: string; chip: string }[] = [
  { icon: Sparkles, image: kitchenImage, chip: "MOST BOOKED" },
  { icon: Home, image: livingRoomImage, chip: "MOVE READY" },
  { icon: Leaf, chip: "DUST RESET" }
];

const checklist = {
  Kitchen: ["Counters cleaned", "Sink polished", "Appliance fronts", "Cabinet exteriors", "Floors mopped", "Trash removed"],
  Bathrooms: ["Showers scrubbed", "Toilets sanitized", "Mirrors polished", "Vanity reset", "Fixtures shined", "Floors mopped"],
  Bedrooms: ["Beds tidied", "Surfaces dusted", "Floors vacuumed", "Bins emptied", "Mirrors wiped", "Baseboards checked"],
  "Living areas": ["Dusting", "Vacuuming", "Mopping", "Sofa tidy", "Entry reset", "High-touch surfaces"]
} as const;

export function ServicesPage({ booking, pricing }: { booking: BookingContent; pricing: PricingContent }) {
  return (
    <>
      <PageHero
        eyebrow="SERVICES"
        title={<>Everything your home <span className="text-navy">needs.</span></>}
        sub="Choose recurring home care, a move-day reset, or detailed post-renovation cleaning with clear scope from the start."
      />

      <section className="bg-paper py-20 lg:py-28">
        <Container className="grid gap-10">
          {booking.services.map((service, index) => {
            const visual = serviceVisuals[index];
            const Icon = visual.icon;
            const reversed = index % 2 === 1;

            return (
              <article className="grid gap-8 rounded-[24px] border border-line bg-white p-5 lg:grid-cols-2 lg:items-center lg:p-7" key={service.id}>
                <div className={`${reversed ? "lg:order-2" : ""}`}>
                  {visual.image ? (
                    <img className="h-[320px] w-full rounded-[20px] object-cover" src={visual.image} alt={`${service.name} service`} />
                  ) : (
                    <div className="grid h-[320px] place-items-center rounded-[20px] bg-sky-100 text-navy">
                      <Icon size={96} strokeWidth={1.5} aria-hidden="true" />
                    </div>
                  )}
                </div>
                <div className="grid gap-5">
                  <span className="inline-flex h-8 w-fit items-center rounded-full bg-sky-100 px-3 text-xs font-semibold text-navy">{visual.chip}</span>
                  <h2 className="m-0 font-display text-[30px] font-normal leading-tight text-ink">{service.name}</h2>
                  <p className="m-0 text-lg leading-8 text-ink/65">{service.description}</p>
                  <ul className="grid gap-3 p-0 sm:grid-cols-2">
                    {service.highlights.map((item) => (
                      <li className="grid grid-cols-[16px_1fr] gap-3 text-sm leading-6 text-ink/70" key={item}>
                        <Check className="mt-1 text-navy" size={16} aria-hidden="true" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="flex flex-wrap items-center gap-4">
                    <p className="m-0 font-display text-3xl font-normal text-navy">
                      {service.id === "recurring" ? `from S$${service.price}/hr` : `from S$${service.price}`}
                    </p>
                    <Button asChild><a href="#booking">Book this clean</a></Button>
                  </div>
                </div>
              </article>
            );
          })}
        </Container>
      </section>

      <section className="bg-cream py-20 lg:py-28">
        <Container className="grid gap-10">
          <div className="grid gap-3">
            <p className="m-0 text-sm font-semibold uppercase tracking-[0.08em] text-navy">ADD-ONS</p>
            <h2 className="m-0 font-display text-h2 font-normal text-ink">
              Add detail where your home{" "}
              <span className="text-navy">needs it.</span>
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {pricing.addons.map((addon) => (
              <div className="flex items-center justify-between gap-3 rounded-full bg-sky-100 px-4 py-3 text-sm font-medium text-navy" key={addon.name}>
                <span>{addon.name}</span>
                <span className="rounded-full bg-white px-3 py-1">+S${addon.price}</span>
              </div>
            ))}
          </div>

          <Accordion className="rounded-[22px] border border-line bg-white px-6" type="single" collapsible>
            {Object.entries(checklist).map(([area, items]) => (
              <AccordionItem value={area} key={area}>
                <AccordionTrigger className="font-display text-xl font-normal">{area}</AccordionTrigger>
                <AccordionContent>
                  <ul className="grid gap-3 pb-5 sm:grid-cols-2">
                    {items.map((item) => (
                      <li className="grid grid-cols-[16px_1fr] gap-3 text-sm text-ink/70" key={item}>
                        <Check className="text-navy" size={16} aria-hidden="true" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          <div className="grid gap-4 rounded-[20px] border border-line bg-white p-7 md:grid-cols-[auto_1fr] md:items-center">
            <span className="grid size-12 place-items-center rounded-xl bg-sky-100 text-navy"><ShieldCheck size={24} aria-hidden="true" /></span>
            <div>
              <h3 className="m-0 font-display text-2xl font-normal text-ink">Satisfaction guarantee.</h3>
              <p className="mb-0 mt-2 text-ink/65">If something important is missed, tell us quickly and we will make it right.</p>
            </div>
          </div>
        </Container>
      </section>

      <CtaBand tone="cream" sub="Pick the service that fits the moment and get a clear quote before we arrive." />
    </>
  );
}
