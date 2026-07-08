import type { ReactNode } from "react";
import cleanerKitchen from "../../assets/ae-cleaner-kitchen.png";
import { company } from "../../lib/company";
import { BookingOptionDialog } from "../BookingOptionDialog";
import { WhatsappLogo } from "../WhatsappLogo";
import { Button } from "../ui/button";
import { Container } from "../ui";

type CtaBandProps = {
  title?: ReactNode;
  sub?: string;
  primary?: {
    label: string;
    href: string;
  };
  secondary?: {
    label: string;
    href: string;
  };
  tone?: "paper" | "cream";
  variant?: "card" | "full" | "split" | "inline";
};

export function CtaBand({
  title = <>Come home <em className="italic text-sky-200">to clean.</em></>,
  sub = "Book a recurring clean, move-in/out handover, or post-renovation clean — AE confirms every booking and you pay only after service.",
  primary = { label: "Book your clean", href: "#booking" },
  secondary = { label: "WhatsApp us", href: company.whatsappHref },
  tone = "paper",
  variant = "card"
}: CtaBandProps) {
  const toneClass = tone === "paper" ? "bg-paper" : "bg-cream";
  const secondaryIsWhatsapp = secondary.href === company.whatsappHref;

  const primaryButton = primary.href === "#booking" ? (
    <BookingOptionDialog label={primary.label} />
  ) : (
    <Button asChild>
      <a href={primary.href}>{primary.label}</a>
    </Button>
  );

  const secondaryButton = (
    <Button asChild className={secondaryIsWhatsapp ? "size-12 p-0" : ""} variant="ghostOnDark">
      <a href={secondary.href} aria-label={secondaryIsWhatsapp ? "Message AE on WhatsApp" : undefined}>
        {secondaryIsWhatsapp ? <WhatsappLogo className="size-7 text-[#25D366]" /> : secondary.label}
      </a>
    </Button>
  );

  if (variant === "inline") {
    return (
      <section className={`${toneClass} py-16 lg:py-20`}>
        <Container size="narrow" className="border-y border-line py-12 text-center lg:py-14">
          <h2 className="m-0 font-display text-h2 font-medium text-ink">{title}</h2>
          <p className="mx-auto mb-0 mt-4 max-w-xl text-lg leading-8 text-ink/65">{sub}</p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            {primaryButton}
            <Button asChild variant="secondary" className={secondaryIsWhatsapp ? "size-12 p-0" : ""}>
              <a href={secondary.href} aria-label={secondaryIsWhatsapp ? "Message AE on WhatsApp" : undefined}>
                {secondaryIsWhatsapp ? <WhatsappLogo className="size-7 text-[#25D366]" /> : secondary.label}
              </a>
            </Button>
          </div>
        </Container>
      </section>
    );
  }

  if (variant === "split") {
    return (
      <section className={`${toneClass} py-8`}>
        <Container>
          <div className="grid overflow-hidden rounded-[24px] lg:grid-cols-[7fr_5fr]">
            <div className="bg-gold-soft px-8 py-12 lg:px-12 lg:py-16">
              <h2 className="m-0 font-display text-h2 font-medium text-navy-900">{title}</h2>
            </div>
            <div className="grid content-center gap-6 bg-navy-900 px-8 py-12 text-white lg:px-12">
              <p className="m-0 text-lg leading-8 text-white/75">{sub}</p>
              <div className="flex flex-wrap gap-3">
                {primaryButton}
                {secondaryButton}
              </div>
            </div>
          </div>
        </Container>
      </section>
    );
  }

  if (variant === "full") {
    return (
      <section className="relative overflow-hidden bg-navy-900 py-20 lg:py-24">
        <img
          alt=""
          aria-hidden="true"
          className="absolute inset-y-0 right-0 hidden h-full w-[46%] object-cover opacity-90 lg:block"
          loading="lazy"
          src={cleanerKitchen}
        />
        <div className="absolute inset-y-0 right-0 hidden w-[46%] bg-gradient-to-r from-navy-900 via-navy-900/55 to-transparent lg:block" aria-hidden="true" />
        <Container className="relative">
          <div className="max-w-2xl text-white">
            <h2 className="m-0 font-display text-h2 font-medium">{title}</h2>
            <p className="mb-0 mt-4 max-w-xl text-lg leading-8 text-white/75">{sub}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              {primaryButton}
              {secondaryButton}
            </div>
          </div>
        </Container>
      </section>
    );
  }

  return (
    <section className={`${toneClass} py-8`}>
      <Container>
        <div className="rounded-[24px] bg-navy-900 px-7 py-10 text-center text-white lg:py-14">
          <h2 className="m-0 font-display text-h2 font-medium">{title}</h2>
          <p className="mx-auto mb-0 mt-4 max-w-2xl text-lg leading-8 text-white/75">{sub}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {primaryButton}
            {secondaryButton}
          </div>
        </div>
      </Container>
    </section>
  );
}
