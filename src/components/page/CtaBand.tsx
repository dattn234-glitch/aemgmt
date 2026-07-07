import type { ReactNode } from "react";
import { company } from "../../lib/company";
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
};

export function CtaBand({
  title = <>Come home <em className="italic text-sky-300">to clean.</em></>,
  sub = "Book recurring home cleaning, a move-in/out reset, or a post-renovation clean with WhatsApp confirmation.",
  primary = { label: "Book Your Cleaning", href: "#booking" },
  secondary = { label: "WhatsApp us", href: company.whatsappHref },
  tone = "paper"
}: CtaBandProps) {
  const toneClass = tone === "paper" ? "bg-paper" : "bg-cream";

  return (
    <section className={`${toneClass} py-10`}>
      <Container>
        <div className="rounded-[28px] bg-navy-900 px-8 py-16 text-center text-white lg:py-20">
          <h2 className="m-0 font-display text-h2 font-normal">{title}</h2>
          <p className="mx-auto mb-0 mt-4 max-w-2xl text-lg leading-8 text-white/75">{sub}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild>
              <a href={primary.href}>{primary.label}</a>
            </Button>
            <Button asChild variant="ghostOnDark">
              <a href={secondary.href}>{secondary.label}</a>
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}
