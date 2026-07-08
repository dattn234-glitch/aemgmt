import { ArrowRight, BadgeCheck, CalendarCheck, MapPin, ShieldCheck, Sparkles, UserCheck } from "lucide-react";
import kitchenImage from "../assets/ae-cleaner-kitchen.webp";
import { useReveal } from "../hooks/useReveal";
import { setPreferredBookingService } from "../lib/booking-preferences";
import { company, formatFromMoney, formatSignedMoney } from "../lib/company";
import type { PricingContent } from "../lib/site-content";
import { Icon3D } from "./Icon3D";
import { Container } from "./ui";

type ServicesBentoSectionProps = {
  pricing: PricingContent;
  trustRow: string[];
};

const packageTier = company.packageMatrix[0];

export function ServicesBentoSection({ pricing, trustRow }: ServicesBentoSectionProps) {
  const headerReveal = useReveal<HTMLDivElement>();
  const gridReveal = useReveal<HTMLDivElement>();

  return (
    <section className="scroll-mt-[88px] bg-cream py-20 lg:py-28" id="services" aria-labelledby="services-title">
      <Container className="grid gap-10">
        <div
          ref={headerReveal.ref}
          className={`grid gap-6 transition duration-500 lg:grid-cols-[1fr_360px] lg:items-end ${headerReveal.className}`}
        >
          <div className="grid gap-3">
            <p className="m-0 text-sm font-semibold uppercase tracking-[0.08em] text-primary-ink">SERVICES</p>
            <h2 id="services-title" className="m-0 font-display text-h2 font-medium text-ink">
              Everything your home <em className="italic text-primary-ink">needs.</em>
            </h2>
          </div>
          <div className="grid gap-3 text-lg leading-8 text-ink/65">
            <p className="m-0">Hourly cleaning on your schedule, plus one-off packages for handovers and post-renovation dust. AE matches you with the right cleaner.</p>
            <a className="inline-flex items-center gap-2 text-sm font-semibold text-primary-ink" href="#services">
              See all services
              <ArrowRight size={14} aria-hidden="true" />
            </a>
          </div>
        </div>

        <div ref={gridReveal.ref} className={`services-bento-grid grid gap-5 transition duration-500 ${gridReveal.className}`}>
          <FeaturedServiceCard />

          <ServiceBentoCard
            area="deep"
            icon="soap"
            title="Post-Renovation"
            copy="Fine dust wiped from floors, ledges, and every reachable corner after the contractors finish — before you move back in."
            price={formatFromMoney(packageTier.postRenovation ?? 0)}
            serviceId="renovation"
            cta="Book renovation clean"
          />

          <ServiceBentoCard
            area="move"
            icon="key"
            title="Move In / Out"
            copy="Key-ready for handover, inspection, or the first day in your next home."
            price={formatFromMoney(packageTier.moveInOut ?? 0)}
            serviceId="move"
            cta="Book move clean"
          />

          <article className="grid content-start gap-4 rounded-[20px] border border-line bg-white p-6" style={{ gridArea: "vetted" }}>
            <h3 className="m-0 flex items-center gap-3 font-display text-xl font-medium leading-tight text-ink">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary-ink">
                <ShieldCheck size={20} aria-hidden="true" />
              </span>
              Vetted Pros
            </h3>
            <ul className="m-0 grid list-none gap-2.5 p-0 text-sm text-ink/70">
              {[
                ["Background-checked", UserCheck],
                ["Trained & insured", BadgeCheck],
                ["Same cleaner where available", Sparkles]
              ].map(([label, Icon]) => (
                <li className="flex items-center gap-2.5" key={label as string}>
                  <Icon className="shrink-0 text-primary-ink/60" size={15} aria-hidden="true" />
                  {label as string}
                </li>
              ))}
            </ul>
          </article>

          <article className="grid content-start gap-4 rounded-[20px] border border-line bg-navy-900 p-6 text-white" style={{ gridArea: "easy" }}>
            <h3 className="m-0 flex items-center gap-3 font-display text-xl font-medium leading-tight">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/10 text-sky-200">
                <CalendarCheck size={20} aria-hidden="true" />
              </span>
              Easy Booking
            </h3>
            <ol className="m-0 grid list-none gap-2.5 p-0 text-sm text-white/75">
              {["Book online in ~2 minutes", "AE confirms on WhatsApp", "Pay by PayNow after the clean"].map((step, index) => (
                <li className="flex items-center gap-2.5" key={step}>
                  <span className="grid size-5 shrink-0 place-items-center rounded-full bg-white/10 font-display text-[11px] font-semibold text-gold" aria-hidden="true">
                    {index + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
            <a className="inline-flex items-center gap-2 text-sm font-semibold text-sky-200 transition-colors hover:text-white" href="#how-it-works">
              How it works
              <ArrowRight size={14} aria-hidden="true" />
            </a>
          </article>

          <article className="grid content-center gap-4 rounded-[20px] border border-line bg-white p-6" style={{ gridArea: "eco" }}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="m-0 font-display text-xl font-medium text-ink">Optional Add-Ons</h3>
              <a className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-ink" href="#pricing">
                See pricing
                <ArrowRight size={13} aria-hidden="true" />
              </a>
            </div>
            <div className="flex flex-wrap gap-2">
              {pricing.addons.map((addon) => (
                <span className="inline-flex items-center gap-2 rounded-full border border-line bg-paper px-3.5 py-2 text-sm font-medium text-ink/75" key={addon.name}>
                  {addon.name}
                  <strong className="font-semibold text-primary-ink">{formatSignedMoney(addon.price)}</strong>
                </span>
              ))}
            </div>
          </article>
        </div>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-ink/55">
          <p className="m-0 text-xs font-semibold uppercase tracking-[0.08em] text-ink/45">TRUSTED BY HOMEOWNERS IN</p>
          {trustRow.map((location) => (
            <span className="inline-flex items-center gap-2" key={location}>
              <MapPin size={14} aria-hidden="true" />
              {location}
            </span>
          ))}
        </div>
      </Container>
    </section>
  );
}

function ServiceBentoCard({
  area,
  icon,
  title,
  copy,
  price,
  serviceId,
  cta
}: {
  area: string;
  icon: Parameters<typeof Icon3D>[0]["name"];
  title: string;
  copy: string;
  price: string;
  serviceId: string;
  cta: string;
}) {
  return (
    <a
      className="group flex flex-col gap-4 rounded-[20px] border border-line bg-white p-6 transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[0_14px_34px_rgb(9_30_66_/_0.08)]"
      href="#booking"
      onClick={() => setPreferredBookingService(serviceId)}
      style={{ gridArea: area }}
    >
      <h3 className="m-0 flex items-center gap-3 font-display text-2xl font-medium leading-tight text-ink">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary-soft">
          <Icon3D name={icon} size={30} tile={false} />
        </span>
        {title}
      </h3>
      <p className="m-0 text-[15px] leading-7 text-ink/65">{copy}</p>
      <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
        <p className="m-0 font-display text-xl font-semibold text-navy-900">{price}</p>
        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-ink">
          {cta}
          <ArrowRight className="transition-transform group-hover:translate-x-0.5" size={14} aria-hidden="true" />
        </span>
      </div>
    </a>
  );
}

function FeaturedServiceCard() {
  return (
    <a
      className="group flex min-h-[480px] flex-col overflow-hidden rounded-[20px] border border-line bg-white p-7 transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[0_14px_34px_rgb(9_30_66_/_0.08)]"
      href="#booking"
      onClick={() => setPreferredBookingService("recurring", "Weekly")}
      style={{ gridArea: "featured" }}
    >
      <span className="inline-flex h-8 w-fit items-center gap-2 rounded-full bg-gold px-3 text-xs font-semibold text-navy-900">
        <span className="size-1.5 rounded-full bg-navy-900" aria-hidden="true" />
        MOST BOOKED
      </span>
      <h3 className="mb-0 mt-5 font-display text-4xl font-medium leading-tight text-ink">Recurring Cleans</h3>
      <p className="mb-4 mt-3 leading-7 text-ink/65">
        Weekly or fortnightly, with the same cleaner where available — they learn your home, your preferences, and the spots that always need a little extra.
      </p>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {["Same cleaner", "Weekly or fortnightly", "Pay after service"].map((tag) => (
            <span className="inline-flex h-8 items-center gap-2 rounded-full bg-primary-soft px-3 text-xs font-medium text-ink" key={tag}>
              <span className="size-1.5 rounded-full bg-primary" aria-hidden="true" />
              {tag}
            </span>
          ))}
        </div>
        <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-sm font-semibold text-primary-ink">
          from S$24/hr
          <ArrowRight className="transition-transform group-hover:translate-x-0.5" size={14} aria-hidden="true" />
        </span>
      </div>
      <div className="-mx-7 -mb-7 mt-6 min-h-[240px] flex-1 overflow-hidden">
        <img
          className="h-full min-h-[240px] w-full object-cover object-center transition-transform duration-500 group-hover:scale-[1.03]"
          src={kitchenImage}
          alt="Cleaner wiping a bright kitchen counter"
          loading="lazy"
        />
      </div>
    </a>
  );
}
