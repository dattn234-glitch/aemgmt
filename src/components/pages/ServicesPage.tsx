import { useEffect, useState } from "react";
import { ArrowRight, Check, ShieldCheck, Star } from "lucide-react";
import moveAfterImage from "../../assets/services/move-after.webp";
import moveBeforeImage from "../../assets/services/move-before.webp";
import moveHeroImage from "../../assets/services/move-hero.webp";
import renoAfterImage from "../../assets/services/reno-after.webp";
import renoBeforeImage from "../../assets/services/reno-before.webp";
import renoHeroImage from "../../assets/services/reno-hero.webp";
import renoReportImage from "../../assets/services/reno-report.webp";
import subscriptionAfterImage from "../../assets/services/subscription-after.webp";
import subscriptionBeforeImage from "../../assets/services/subscription-before.webp";
import subscriptionHeroImage from "../../assets/services/subscription-hero.webp";
import { formatMoney, formatSignedMoney, getWhatsappHref } from "../../lib/company";
import { setPreferredBookingService } from "../../lib/booking-preferences";
import type { BookingContent, BookingService, PricingContent } from "../../lib/site-content";
import { Icon3D } from "../Icon3D";
import { Reveal } from "../Reveal";
import { reviewCards } from "../ReviewsSection";
import { WhatsappLogo } from "../WhatsappLogo";
import { CtaBand } from "../page/CtaBand";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion";
import { Button } from "../ui/button";
import { Container } from "../ui";

const checklist = {
  Kitchen: ["Counters cleaned", "Sink polished", "Appliance fronts", "Cabinet exteriors", "Floors mopped", "Trash removed"],
  Bathrooms: ["Showers scrubbed", "Toilets sanitized", "Mirrors polished", "Vanity reset", "Fixtures shined", "Floors mopped"],
  Bedrooms: ["Beds tidied", "Surfaces dusted", "Floors vacuumed", "Bins emptied", "Mirrors wiped", "Baseboards checked"],
  "Living areas": ["Dusting", "Vacuuming", "Mopping", "Sofa tidy", "Entry reset", "High-touch surfaces"]
} as const;

const serviceImages = {
  subscriptionHero: subscriptionHeroImage,
  subscriptionBefore: subscriptionBeforeImage,
  subscriptionAfter: subscriptionAfterImage,
  moveHero: moveHeroImage,
  moveBefore: moveBeforeImage,
  moveAfter: moveAfterImage,
  renovationHero: renoHeroImage,
  renovationBefore: renoBeforeImage,
  renovationAfter: renoAfterImage,
  renovationReport: renoReportImage
} as const;

const chapters = [
  { number: "01", label: "Subscription", href: "#chapter-subscription" },
  { number: "02", label: "Move-in / out", href: "#chapter-move" },
  { number: "03", label: "Post-renovation", href: "#chapter-renovation" }
] as const;

function scrollToAnchor(event: { preventDefault: () => void }, href: string) {
  // In-page anchors must not touch location.hash — the hash router treats unknown
  // hashes as routes and falls back to #home.
  event.preventDefault();
  document.getElementById(href.slice(1))?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function ServicesPage({ booking, pricing }: { booking: BookingContent; pricing: PricingContent }) {
  const recurring = getService(booking, "recurring");
  const move = getService(booking, "move");
  const renovation = getService(booking, "renovation");
  const [activeChapter, setActiveChapter] = useState<string>(chapters[0].href);

  useEffect(() => {
    const elements = chapters
      .map((chapter) => document.getElementById(chapter.href.slice(1)))
      .filter((element): element is HTMLElement => Boolean(element));

    if (elements.length === 0) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (visible?.target.id) {
          setActiveChapter(`#${visible.target.id}`);
        }
      },
      { rootMargin: "-30% 0px -55% 0px", threshold: [0.05, 0.2, 0.4] }
    );

    elements.forEach((element) => observer.observe(element));

    return () => observer.disconnect();
  }, []);

  return (
    <>
      <section className="bg-navy-900 pb-16 pt-28 text-white lg:pb-20 lg:pt-36" id="services" aria-labelledby="services-title">
        <Container size="wide" className="grid gap-6">
          <p className="m-0 text-sm font-semibold tracking-[0.08em] text-sky-200 uppercase">Services</p>
          <h1 id="services-title" className="m-0 max-w-3xl font-display text-display font-semibold">
            Which clean does your home <em className="italic text-sky-200">need?</em>
          </h1>
          <p className="m-0 max-w-2xl text-lg leading-8 text-white/70">
            Pick the one that fits — every service ends with a digital checklist and photo report, and you pay by
            PayNow only after the visit.
          </p>
          <div className="flex flex-wrap gap-2">
            {["Photo proof on every visit", "AE confirms first", "Pay after service"].map((chip) => (
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-[15px] font-medium text-white/85" key={chip}>
                <span className="size-1.5 rounded-full bg-gold" aria-hidden="true" />
                {chip}
              </span>
            ))}
          </div>
        </Container>
      </section>

      <section className="bg-cream py-10 lg:py-14">
        <Container size="wide" className="grid gap-5 lg:grid-cols-3">
          {[
            {
              service: recurring,
              icon: "broom" as const,
              bestIf: "you want the house to stay clean, week after week",
              chapter: chapters[0]
            },
            {
              service: move,
              icon: "key" as const,
              bestIf: "you're moving in, moving out, or handing keys back",
              chapter: chapters[1]
            },
            {
              service: renovation,
              icon: "sparkles" as const,
              bestIf: "contractors just left and dust is everywhere",
              chapter: chapters[2]
            }
          ].map(({ service, icon, bestIf, chapter }, index) => (
            <Reveal
              className="flex flex-col gap-4 rounded-[24px] border border-line bg-white p-6 shadow-[0_24px_60px_rgb(9_30_66_/_0.10)]"
              delay={index * 0.08}
              key={service.id}
            >
              <article className="flex h-full flex-col gap-4">
                <div className="flex items-center gap-3">
                  <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary-soft">
                    <Icon3D name={icon} size={34} tile={false} />
                  </span>
                  <h2 className="m-0 font-display text-xl font-semibold leading-tight text-ink">{service.name}</h2>
                </div>
                <p className="m-0 text-[15px] leading-7">
                  <span className="font-semibold uppercase tracking-[0.08em] text-gold-text">Best if </span>
                  <span className="text-ink/70">{bestIf}.</span>
                </p>
                <p className="m-0 text-[15px] leading-7 text-ink/62">{service.description}</p>
                <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
                  <p className="m-0 font-display text-2xl font-semibold text-navy-900">
                    from {formatMoney(service.price)}
                    {service.id === "recurring" ? <span className="text-base font-medium text-ink/55">/hr</span> : null}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button asChild size="sm" variant="secondary">
                      <a href={chapter.href} onClick={(event) => scrollToAnchor(event, chapter.href)}>Details</a>
                    </Button>
                    <Button asChild size="sm">
                      <a href="#booking" onClick={() => setPreferredBookingService(service.id)}>
                        Book
                        <ArrowRight className="size-3.5" aria-hidden="true" />
                      </a>
                    </Button>
                  </div>
                </div>
              </article>
            </Reveal>
          ))}
        </Container>
      </section>

      <nav className="sticky top-[72px] z-30 border-y border-line bg-paper/90 backdrop-blur-md" aria-label="Service chapters">
        <Container size="wide" className="flex items-center gap-1 overflow-x-auto py-3 sm:gap-2">
          {chapters.map((chapter) => {
            const active = chapter.href === activeChapter;

            return (
              <a
                aria-current={active ? "true" : undefined}
                className={`inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-[15px] font-medium transition-colors hover:bg-primary-soft hover:text-primary-ink ${active ? "bg-primary-soft text-primary-ink" : "text-ink/65"}`}
                href={chapter.href}
                key={chapter.number}
                onClick={(event) => scrollToAnchor(event, chapter.href)}
              >
                <span className="font-display text-xs font-semibold text-gold-text">{chapter.number}</span>
                {chapter.label}
              </a>
            );
          })}
        </Container>
      </nav>

      <ResidentialSubscriptionSection service={recurring} />
      <MoveOutSection service={move} />
      <PostRenovationSection service={renovation} />

      <section className="bg-paper py-16 lg:py-22">
        <Container size="wide" className="grid gap-9">
          <div className="grid gap-3 lg:max-w-3xl">
            <p className="m-0 text-sm font-semibold uppercase tracking-[0.08em] text-primary-ink">Scope & add-ons</p>
            <h2 className="m-0 font-display text-[34px] font-semibold leading-tight text-ink lg:text-[44px]">
              Add detail where your home needs it.
            </h2>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {pricing.addons.map((addon) => (
              <div className="flex min-h-16 items-center justify-between gap-4 rounded-[20px] border border-line bg-white px-5 py-3 text-[15px] font-semibold text-ink/78" key={addon.name}>
                <span>{addon.name}</span>
                <span className="shrink-0 rounded-full bg-primary-soft px-3 py-1 text-ink">{formatSignedMoney(addon.price)}</span>
              </div>
            ))}
          </div>

          <div className="grid gap-4">
            <h3 className="m-0 font-display text-[26px] font-semibold text-ink">What every clean covers</h3>
            <Accordion className="rounded-[24px] border border-line bg-white px-6" type="single" collapsible>
              {Object.entries(checklist).map(([area, items]) => (
                <AccordionItem value={area} key={area}>
                  <AccordionTrigger className="font-display text-xl font-semibold">{area}</AccordionTrigger>
                  <AccordionContent>
                    <ul className="grid gap-3 pb-5 sm:grid-cols-2">
                      {items.map((item) => (
                        <li className="grid grid-cols-[18px_1fr] gap-3 text-[15px] leading-7 text-ink/72" key={item}>
                          <Check className="mt-1 text-primary" size={18} aria-hidden="true" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>

          <div className="grid gap-4 rounded-[24px] border border-line bg-white p-6 md:grid-cols-[auto_1fr] md:items-center">
            <span className="grid size-12 place-items-center rounded-xl bg-primary-soft text-ink">
              <ShieldCheck size={24} aria-hidden="true" />
            </span>
            <div>
              <h3 className="m-0 font-display text-[26px] font-semibold text-ink">Satisfaction guarantee.</h3>
              <p className="mb-0 mt-2 text-[17px] leading-8 text-ink/65">If something important is missed, tell AE right away and the team will sort it out with you.</p>
            </div>
          </div>
        </Container>
      </section>

      <CtaBand
        variant="full"
        title={<>Choose the clean your home <em className="italic text-sky-200">actually needs.</em></>}
        sub="Pick the service that fits your home, then book online in minutes — you only pay after the visit."
      />
    </>
  );
}

// Marketing rate ranges — must match PricingPage / client-locked pricing.
const frequencyRates: Record<string, string> = {
  Weekly: "S$24-26/hr",
  Fortnightly: "S$25-28/hr",
  "One-time": "S$28-32/hr"
};

function ResidentialSubscriptionSection({ service }: { service: BookingService }) {
  const review = reviewCards[3];

  return (
    <section className="scroll-mt-[132px] bg-paper py-16 lg:py-22" id="chapter-subscription" aria-labelledby="subscription-title">
      <Container size="wide" className="grid gap-7 xl:grid-cols-[minmax(0,1fr)_340px] xl:items-start">
        <div className="grid gap-6">
          <div className="grid gap-6 rounded-[30px] border border-line bg-white p-5 shadow-[0_18px_48px_rgb(22_25_26_/_0.05)] lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)] lg:p-7">
            <div className="aspect-[4/3] h-full overflow-hidden rounded-[26px] bg-cream lg:min-h-[320px] lg:aspect-auto">
              <img loading="lazy" className="h-full w-full object-cover" src={serviceImages.subscriptionHero} alt="Professional cleaner preparing a bright residential kitchen" />
            </div>
            <div className="grid content-center gap-5">
              <span className="inline-flex w-fit items-center gap-2 rounded-full bg-primary-soft px-4 py-2 text-[13px] font-semibold tracking-[0.08em] text-primary-ink uppercase">
                <span className="font-display text-sm font-semibold text-gold-text">01</span>
                Same-cleaner care
              </span>
              <div>
                <h2 id="subscription-title" className="m-0 font-display text-[34px] font-semibold leading-tight text-ink lg:text-[44px]">
                  {service.name}
                </h2>
                <p className="m-0 mt-4 text-[17px] leading-8 text-ink/65">{service.description}</p>
              </div>
              <ul className="grid gap-2.5 p-0 sm:grid-cols-2">
                {service.keyPoints.map((item) => (
                  <li className="grid grid-cols-[18px_1fr] items-start gap-2.5 rounded-[14px] bg-paper px-4 py-3 text-[15px] font-medium leading-6 text-ink/80" key={item}>
                    <Check className="mt-0.5 text-primary" size={18} aria-hidden="true" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <div className="rounded-[24px] bg-paper p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="m-0 text-sm font-semibold uppercase tracking-[0.08em] text-ink/50">Frequency options</p>
                  <span className="rounded-full bg-primary-soft px-3 py-1 text-[13px] font-semibold text-primary-ink">Weekly = lowest rate</span>
                </div>
                <div className="mt-4 grid gap-2.5">
                  {service.frequencyOptions.map((option) => (
                    <div className="flex items-center justify-between gap-3 rounded-[16px] border border-line bg-white px-4 py-3" key={option}>
                      <p className="m-0 font-display text-base font-semibold leading-tight text-ink">{option}</p>
                      <p className="m-0 whitespace-nowrap text-[15px] font-semibold text-primary-ink">{frequencyRates[option]}</p>
                    </div>
                  ))}
                </div>
                <p className="m-0 mt-4 text-[15px] leading-7 text-ink/65">
                  AE confirms your cleaner and visit window — you pay only after the visit.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-line bg-white p-5 lg:p-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="m-0 text-sm font-semibold tracking-[0.08em] text-primary-ink uppercase">Before / after</p>
                <h3 className="m-0 mt-2 font-display text-[26px] font-semibold leading-tight text-ink">What changes with a regular clean</h3>
              </div>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <ProofImage image={serviceImages.subscriptionBefore} label="Before" caption="Counters, floors, and high-touch spots build up through the week without a regular clean." />
              <ProofImage image={serviceImages.subscriptionAfter} label="After" caption="The same checklist is repeated each visit, so shared spaces feel freshly reset." positive />
            </div>
          </div>
        </div>

        <aside className="grid gap-4 xl:sticky xl:top-24">
          <PriceCard serviceId={service.id} serviceName={service.name} price={service.price} note="3 or 4 hour visits. Weekly visits get the lowest hourly rate." suffix="/hr" />
          <ReviewRailCard review={review} label="Fortnightly client" />
          <HelpCard serviceName={service.name} />
        </aside>
      </Container>
    </section>
  );
}

function MoveOutSection({ service }: { service: BookingService }) {
  return (
    <section className="scroll-mt-[132px] bg-cream py-16 lg:py-22" id="chapter-move" aria-labelledby="move-title">
      <Container size="wide" className="grid gap-7 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:items-start">
        <div className="grid content-start gap-6 rounded-[30px] bg-navy-900 p-6 text-white lg:p-8">
          <span className="grid size-13 place-items-center rounded-2xl bg-white/10 text-sky-200 ring-1 ring-white/12">
            <Icon3D name="key" size={42} tile={false} />
          </span>
          <div>
            <p className="m-0 inline-flex items-center gap-2 text-[13px] font-semibold tracking-[0.08em] text-sky-200 uppercase">
              <span className="font-display text-sm font-semibold text-gold">02</span>
              Move ready
            </p>
            <h2 id="move-title" className="m-0 mt-4 font-display text-[34px] font-semibold leading-tight text-white lg:text-[44px]">
              {service.name}
            </h2>
            <p className="m-0 mt-5 max-w-2xl text-[17px] leading-8 text-white/72">{service.description}</p>
          </div>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            {["Cabinet interiors checked", "Bathrooms reset for handover", "Floors and base edges cleaned", "Access instructions noted at booking"].map((item) => (
              <div className="rounded-[18px] border border-white/10 bg-white/7 px-4 py-3.5 text-[15px] font-semibold text-white/85" key={item}>{item}</div>
            ))}
          </div>
          <BookButton serviceId={service.id}>Book move clean</BookButton>
        </div>

        <div className="grid gap-5">
          <div className="aspect-[4/3] h-full overflow-hidden rounded-[30px] border border-line bg-white p-4 shadow-[0_18px_48px_rgb(22_25_26_/_0.06)] lg:min-h-[320px] lg:aspect-auto">
            <img loading="lazy" className="h-full w-full rounded-[24px] object-cover" src={serviceImages.moveHero} alt="Bright empty apartment prepared for move-in or handover cleaning" />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <ProofImage image={serviceImages.moveBefore} label="Before" caption="Boxes out — but the dust, wrap, and scuffs from the move stay behind." />
            <ProofImage image={serviceImages.moveAfter} label="After" caption="The same room, clean and key-ready for the next resident or your final inspection." positive />
          </div>
          <div className="rounded-[24px] border border-line bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="m-0 text-[15px] text-ink/55">Starting from</p>
                <p className="m-0 mt-1 font-display text-[38px] font-semibold leading-none text-ink">{formatMoney(service.price)}</p>
              </div>
              <p className="m-0 max-w-xl text-[15px] leading-7 text-ink/62">Final package price depends on home type and size. AE confirms the scope before your visit.</p>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

function PostRenovationSection({ service }: { service: BookingService }) {
  const proofItems = [
    { label: "Before the clean", image: serviceImages.renovationBefore, caption: "Dust clings to trims, ledges, and floor edges even after contractors leave." },
    { label: "After the clean", image: serviceImages.renovationAfter, caption: "Reachable surfaces, floors, and visible corners are reset for occupancy." },
    { label: "Photo proof", image: serviceImages.renovationReport, caption: "AE shares completion photos so you can review the work before you pay." }
  ];

  return (
    <section className="scroll-mt-[132px] bg-paper py-16 lg:py-22" id="chapter-renovation" aria-labelledby="reno-title">
      <Container size="wide" className="grid gap-7">
        <div className="grid gap-6 rounded-[30px] border border-line bg-white p-5 shadow-[0_18px_48px_rgb(22_25_26_/_0.05)] lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-start lg:p-7">
          <div className="grid content-start gap-6 rounded-[26px] bg-primary-soft p-6 lg:p-8">
            <div>
              <span className="grid size-13 place-items-center rounded-2xl bg-white text-ink shadow-sm">
                <Icon3D name="soap" size={42} tile={false} />
              </span>
              <p className="m-0 mt-6 inline-flex items-center gap-2 text-[13px] font-semibold tracking-[0.08em] text-primary-ink uppercase">
                <span className="font-display text-sm font-semibold text-gold-text">03</span>
                Dust reset
              </p>
              <h2 id="reno-title" className="m-0 mt-4 font-display text-[34px] font-semibold leading-tight text-ink lg:text-[44px]">
                {service.name}
              </h2>
              <p className="m-0 mt-5 text-[17px] leading-8 text-ink/68">{service.description}</p>
            </div>
            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              {service.keyPoints.map((item) => (
                <CheckItem key={item}>{item}</CheckItem>
              ))}
            </div>
          </div>

          <div className="grid gap-4">
            <div className="aspect-[4/3] h-full overflow-hidden rounded-[26px] border border-line bg-cream lg:min-h-[320px] lg:aspect-auto">
              <img loading="lazy" className="h-full w-full object-cover" src={serviceImages.renovationHero} alt="Post-renovation residential room prepared for dust reset cleaning" />
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {proofItems.map((item) => (
                <article className="overflow-hidden rounded-[22px] border border-line bg-white" key={item.label}>
                  <img loading="lazy" className="aspect-[1.15] w-full object-cover" src={item.image} alt={item.label} />
                  <div className="p-4">
                    <p className="m-0 text-base font-semibold text-ink">{item.label}</p>
                    <p className="m-0 mt-2 text-[15px] leading-7 text-ink/62">{item.caption}</p>
                  </div>
                </article>
              ))}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-[24px] border border-line bg-paper p-5">
              <div>
                <p className="m-0 text-[15px] text-ink/55">Starting from</p>
                <p className="m-0 mt-1 font-display text-[38px] font-semibold leading-none text-ink">{formatMoney(service.price)}</p>
              </div>
              <BookButton serviceId={service.id}>Book renovation clean</BookButton>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

function PriceCard({
  serviceId,
  serviceName,
  price,
  note,
  suffix
}: {
  serviceId: string;
  serviceName: string;
  price: number;
  note: string;
  suffix?: string;
}) {
  return (
    <div className="rounded-[24px] border border-line bg-white p-5">
      <p className="m-0 text-[15px] text-ink/55">Starting from</p>
      <div className="mt-2 flex items-end gap-1">
        <span className="font-display text-[38px] font-semibold leading-none text-ink">{formatMoney(price)}</span>
        {suffix ? <span className="pb-1 text-base text-ink/55">{suffix}</span> : null}
      </div>
      <p className="m-0 mt-3 text-[15px] leading-7 text-ink/62">{note}</p>
      <BookButton serviceId={serviceId}>Book this clean</BookButton>
      <p className="m-0 mt-4 text-base font-semibold text-ink">{serviceName}</p>
      <p className="m-0 mt-1 text-[15px] leading-7 text-ink/55">AE confirms the scope first — you only pay after the visit is done.</p>
    </div>
  );
}

function ReviewRailCard({ review, label }: { review: (typeof reviewCards)[number]; label: string }) {
  return (
    <div className="rounded-[24px] border border-line bg-white p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-1 text-gold" aria-label="Five star rating">
            {Array.from({ length: 5 }).map((_, index) => (
              <Star key={index} size={15} fill="currentColor" aria-hidden="true" />
            ))}
          </div>
          <p className="m-0 mt-2 text-base font-semibold text-ink">4.9/5 from Singapore homeowners</p>
        </div>
        <Button asChild className="h-9 rounded-full px-4 text-xs" size="sm" variant="outline">
          <a href="#reviews">View all</a>
        </Button>
      </div>
      <div className="mt-4 rounded-[20px] bg-paper p-4">
        <p className="m-0 text-[15px] font-semibold text-ink">{review.name} · {review.city}</p>
        <p className="m-0 mt-1 text-[13px] font-semibold uppercase tracking-[0.08em] text-primary-ink">{label}</p>
        <p className="m-0 mt-3 text-[15px] leading-7 text-ink/70">"{review.quote}"</p>
      </div>
    </div>
  );
}

function HelpCard({ serviceName }: { serviceName: string }) {
  return (
    <div className="rounded-[24px] border border-line bg-white p-5">
      <div className="flex items-start gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-primary-soft text-ink">
          <Icon3D name="chat" size={32} tile={false} />
        </span>
        <div>
          <p className="m-0 text-base font-semibold text-ink">Need help?</p>
          <p className="m-0 mt-1 text-[15px] leading-7 text-ink/60">Not sure which clean fits? Chat with AE before you book.</p>
        </div>
      </div>
      <Button asChild className="mt-4 w-full border-line bg-white text-ink hover:border-ink/25 hover:bg-white" variant="secondary">
        <a href={getWhatsappHref(`Hi AE, I'm looking at ${serviceName} and would like help choosing the right scope.`)} target="_blank" rel="noreferrer">
          <WhatsappLogo className="size-5 text-[#25D366]" />
          Chat with AE on WhatsApp
        </a>
      </Button>
    </div>
  );
}

function ProofImage({
  caption,
  image,
  label,
  positive = false
}: {
  caption: string;
  image: string;
  label: string;
  positive?: boolean;
}) {
  return (
    <article className="overflow-hidden rounded-[22px] border border-line bg-white">
      <div className="relative aspect-[1.28] overflow-hidden">
        <img loading="lazy" className="h-full w-full object-cover" src={image} alt={`${label} cleaning state`} />
        <span className={`absolute left-3 top-3 inline-flex rounded-full px-3.5 py-1.5 text-[12px] font-semibold uppercase tracking-[0.08em] ${positive ? "bg-primary text-white" : "bg-white/94 text-ink"}`}>
          {label}
        </span>
      </div>
      <p className="m-0 border-t border-line px-4 py-3.5 text-[15px] leading-7 text-ink/70">{caption}</p>
    </article>
  );
}

function CheckItem({ children }: { children: string }) {
  return (
    <li className="grid grid-cols-[18px_1fr] gap-3 text-[15px] leading-7 text-current/78">
      <Check className="mt-1.5 text-primary" size={18} aria-hidden="true" />
      <span>{children}</span>
    </li>
  );
}

function BookButton({ children, serviceId }: { children: string; serviceId: string }) {
  return (
    <Button asChild className="mt-4 w-full">
      <a href="#booking" onClick={() => setPreferredBookingService(serviceId)}>
        {children}
        <ArrowRight size={16} aria-hidden="true" />
      </a>
    </Button>
  );
}

function getService(booking: BookingContent, id: string) {
  return booking.services.find((service) => service.id === id) ?? booking.services[0];
}
