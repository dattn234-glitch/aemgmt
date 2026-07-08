import { ArrowRight, CalendarCheck, Home, MapPin, ShieldCheck, SlidersHorizontal, Sparkles, type LucideIcon } from "lucide-react";
import kitchenImage from "../assets/ae-cleaner-kitchen.png";
import { useReveal } from "../hooks/useReveal";
import { Container } from "./ui";

type ServicesBentoSectionProps = {
  trustRow: string[];
};

type ServiceCard = {
  area: string;
  title: string;
  copy: string;
  icon: LucideIcon;
  titleClass?: string;
  compact?: boolean;
};

const cards: ServiceCard[] = [
  {
    area: "deep",
    title: "Post-Renovation",
    copy: "Fine dust wiped from floors, ledges, and every reachable corner after the contractors finish — before you move back in.",
    icon: Sparkles
  },
  {
    area: "move",
    title: "Move In / Out",
    copy: "Leave it spotless for handoff, staging, or the first day in your next home.",
    icon: Home
  },
  {
    area: "vetted",
    title: "Vetted Pros",
    copy: "Background-checked, trained, insured, and easy to work with.",
    icon: ShieldCheck,
    compact: true
  },
  {
    area: "easy",
    title: "Easy Booking",
    copy: "Online in under two minutes. Reschedule from your phone.",
    icon: CalendarCheck
  }
] as const;

export function ServicesBentoSection({ trustRow }: ServicesBentoSectionProps) {
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
              Everything your home{" "}
              <span className="text-ink">needs.</span>
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
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <article
                className="grid gap-4 rounded-[20px] border border-line bg-white p-7 transition hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgb(22_25_26/0.06)]"
                style={{ gridArea: card.area }}
                key={card.title}
              >
                <span className="grid size-10 place-items-center rounded-xl bg-primary-soft text-ink">
                  <Icon size={20} aria-hidden="true" />
                </span>
                <h3 className={`m-0 font-display font-medium leading-tight text-ink ${card.titleClass ?? "text-2xl"}`}>{card.title}</h3>
                <p className={`m-0 leading-7 text-ink/65 ${card.compact ? "text-sm" : "text-base"}`}>{card.copy}</p>
              </article>
            );
          })}
          <article
            className="grid items-center gap-4 rounded-[20px] border border-line bg-white p-7 transition hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgb(22_25_26/0.06)]"
            style={{ gridArea: "eco" }}
          >
            <span className="grid size-10 place-items-center rounded-xl bg-primary-soft text-ink">
              <SlidersHorizontal size={20} aria-hidden="true" />
            </span>
            <div>
              <h3 className="m-0 font-display text-2xl font-medium text-ink">Optional Add-Ons</h3>
              <p className="mb-0 mt-3 max-w-2xl leading-7 text-ink/65">
                Kitchen degrease, fridge or oven interiors, bathroom deep cleans, and sofa or mattress extraction — add them to any visit.
              </p>
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

function FeaturedServiceCard() {
  return (
    <article
      className="flex min-h-[560px] flex-col overflow-hidden rounded-[20px] border border-line bg-white p-7 transition hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgb(22_25_26/0.06)]"
      style={{ gridArea: "featured" }}
    >
      <span className="inline-flex h-8 w-fit items-center gap-2 rounded-full bg-primary-soft px-3 text-xs font-semibold text-primary-ink">
        <span className="size-1.5 rounded-full bg-primary" aria-hidden="true" />
        MOST BOOKED
      </span>
      <h3 className="mb-0 mt-5 font-display text-4xl font-medium leading-tight text-ink">Recurring Cleans</h3>
      <p className="mb-5 mt-3 leading-7 text-ink/65">
        Weekly or fortnightly, with the same cleaner where available — they learn your home, your preferences, and the spots that always need a little extra.
      </p>
      <div className="flex flex-wrap gap-2">
        {["Same cleaner", "Weekly or fortnightly", "Pay after service"].map((tag) => (
          <span className="inline-flex h-8 items-center gap-2 rounded-full bg-primary-soft px-3 text-xs font-medium text-ink" key={tag}>
            <span className="size-1.5 rounded-full bg-primary" aria-hidden="true" />
            {tag}
          </span>
        ))}
      </div>
      <div className="-mx-7 -mb-7 mt-6 min-h-[260px] flex-1 overflow-hidden rounded-b-[20px]">
        <img
          className="h-full min-h-[260px] w-full object-cover object-center"
          src={kitchenImage}
          alt="Cleaner wiping a bright kitchen counter"
          loading="lazy"
        />
      </div>
    </article>
  );
}
