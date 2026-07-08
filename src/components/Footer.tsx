import { Facebook, Instagram } from "lucide-react";
import type { ReactNode } from "react";
import aeLogo from "../assets/ae-logo.jpeg";
import { company } from "../lib/company";
import type { BrandContent, ContactContent, NavItem } from "../lib/site-content";
import { WhatsappLogo } from "./WhatsappLogo";
import { Container } from "./ui";

type FooterProps = {
  brand: BrandContent;
  contact: ContactContent;
  navItems: NavItem[];
};

export function Footer({ brand, contact, navItems }: FooterProps) {
  const whatsappHref = company.whatsappHref;
  const companyLine = `AE Management Services Pte Ltd · Singapore${company.uen ? ` · UEN ${company.uen}` : ""}`;

  return (
    <footer className="bg-navy-900 text-white">
      <Container className="pt-16 lg:pt-20">
        <p className="m-0 max-w-3xl font-display text-[clamp(2rem,4.5vw,3.5rem)] font-medium leading-[1.08]">
          Come home <em className="italic text-sky-200">to clean.</em>
        </p>

        <div className="mt-12 grid gap-10 border-t border-white/12 pt-12 lg:grid-cols-[5fr_3fr_4fr] lg:gap-8">
          <div className="grid content-start gap-5">
            <a className="inline-flex items-center gap-3" href="#home" aria-label={`${brand.name} home`}>
              <img className="size-10 rounded-lg border border-white/15 object-cover" src={aeLogo} alt="" aria-hidden="true" />
              <span>
                <span className="block font-display text-xl font-medium leading-none">AE Management Services</span>
                <span className="mt-1.5 block text-[11px] font-semibold uppercase tracking-[0.08em] text-white/45">
                  {company.tagline}
                </span>
              </span>
            </a>
            <p className="m-0 max-w-xs text-sm leading-6 text-white/60">
              Residential cleaning subscriptions, move-in/out handovers, and post-renovation cleans for Singapore homes.
              Confirmed bookings, PayNow after service.
            </p>
            <div className="flex gap-3" aria-label="Social links">
              <a className="text-white/45 transition-colors hover:text-white" href="#" aria-label="Instagram">
                <Instagram size={18} aria-hidden="true" />
              </a>
              <a className="text-white/45 transition-colors hover:text-white" href="#" aria-label="Facebook">
                <Facebook size={18} aria-hidden="true" />
              </a>
            </div>
          </div>

          <FooterColumn title="Company">
            {navItems.map((item) => (
              <a href={item.href} key={item.href}>{item.label}</a>
            ))}
            <a href={contact.bookingHref}>Booking</a>
          </FooterColumn>

          <FooterColumn title="Reach us">
            <a href={`mailto:${company.email}`}>{company.email}</a>
            <a className="inline-flex items-center gap-3" href={whatsappHref} target="_blank" rel="noreferrer" aria-label={`Message AE at ${contact.phone}`}>
              <WhatsappLogo className="size-6 text-[#25D366]" />
              {contact.phone}
            </a>
            <span>Singapore island-wide</span>
            <span>{company.serviceHours}</span>
          </FooterColumn>
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-white/12 py-7 text-[13px] text-white/45">
          <p className="m-0">{companyLine}</p>
          <div className="flex items-center gap-5">
            <p className="m-0">© 2026 AE Management Services. All rights reserved.</p>
            <a className="transition-colors hover:text-white" href="#">Privacy</a>
            <a className="transition-colors hover:text-white" href="#">Terms</a>
          </div>
        </div>
      </Container>
    </footer>
  );
}

function FooterColumn({ children, title }: { children: ReactNode; title: string }) {
  return (
    <div className="grid content-start gap-3">
      <p className="m-0 text-xs font-semibold uppercase tracking-[0.08em] text-white/45">
        {title}
      </p>
      <div className="grid justify-items-start gap-2.5 text-sm text-white/70 [&_a:hover]:text-white [&_a]:transition-colors">
        {children}
      </div>
    </div>
  );
}
