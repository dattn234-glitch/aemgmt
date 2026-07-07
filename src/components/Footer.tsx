import { Facebook, Instagram, MessageCircle } from "lucide-react";
import type { ReactNode } from "react";
import aeLogo from "../assets/ae-logo.jpeg";
import { company } from "../lib/company";
import type { BrandContent, ContactContent, NavItem } from "../lib/site-content";
import { Container } from "./ui";

type FooterProps = {
  brand: BrandContent;
  contact: ContactContent;
  navItems: NavItem[];
};

export function Footer({ brand, contact, navItems }: FooterProps) {
  const whatsappHref = company.whatsappHref;

  return (
    <footer className="border-t border-line bg-paper py-16">
      <Container className="grid gap-10 lg:grid-cols-4 lg:gap-8">
        <div className="grid content-start gap-5">
          <a className="inline-flex items-center gap-2" href="#home" aria-label={`${brand.name} home`}>
            <img className="size-10 rounded-lg border border-line object-cover" src={aeLogo} alt="" aria-hidden="true" />
            <span>
              <span className="block font-display text-[24px] font-normal leading-none text-ink">
                <span className="text-navy">AE</span> Management Services
              </span>
              <span className="mt-1 block text-[11px] font-semibold uppercase tracking-[0.08em] text-[rgb(22_25_26_/_0.45)]">
                {company.tagline}
              </span>
            </span>
          </a>
          <p className="max-w-xs text-sm leading-6 text-[rgb(22_25_26_/_0.60)]">
            Residential home cleaning subscriptions, move-in/out resets, and post-renovation cleans
            for Singapore households.
          </p>
          <div className="flex gap-3" aria-label="Social links">
            <a className="text-[rgb(22_25_26_/_0.45)] transition-colors hover:text-navy" href="#" aria-label="Instagram">
              <Instagram size={18} aria-hidden="true" />
            </a>
            <a className="text-[rgb(22_25_26_/_0.45)] transition-colors hover:text-navy" href="#" aria-label="Facebook">
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

        <FooterColumn title="Reach Us">
          <a href={`mailto:${company.email}`}>{company.email}</a>
          <a href={whatsappHref} target="_blank" rel="noreferrer">WhatsApp {contact.phone}</a>
          <span>Singapore island-wide</span>
          <span>{company.serviceHours}</span>
        </FooterColumn>

        <div className="grid content-start gap-5">
          <span className="inline-flex w-fit items-center gap-2 rounded-full bg-sky-100 px-4 py-2 text-sm font-medium text-navy">
            <span className="size-2 rounded-full bg-navy" aria-hidden="true" />
            Residential only · Singapore
          </span>
          <p className="text-sm text-[rgb(22_25_26_/_0.55)]">AE Management Services Pte Ltd · Singapore · UEN {company.uen}</p>
          <p className="text-sm text-[rgb(22_25_26_/_0.55)]">© 2026 AE Management Services. All rights reserved.</p>
          <div className="flex gap-4 text-[13px] text-[rgb(22_25_26_/_0.45)]">
            <a className="hover:text-navy" href="#">Privacy</a>
            <a className="hover:text-navy" href="#">Terms</a>
            <a className="inline-flex items-center gap-1 hover:text-navy" href={whatsappHref} target="_blank" rel="noreferrer">
              <MessageCircle size={13} aria-hidden="true" />
              WhatsApp
            </a>
          </div>
        </div>
      </Container>
    </footer>
  );
}

function FooterColumn({ children, title }: { children: ReactNode; title: string }) {
  return (
    <div className="grid content-start gap-3">
      <p className="m-0 text-xs font-semibold uppercase tracking-[0.08em] text-[rgb(22_25_26_/_0.45)]">
        {title}
      </p>
      <div className="grid gap-2 text-sm text-[rgb(22_25_26_/_0.65)] [&_a:hover]:text-navy">
        {children}
      </div>
    </div>
  );
}
