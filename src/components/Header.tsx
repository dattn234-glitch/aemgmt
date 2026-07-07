import { useEffect, useState } from "react";
import { CalendarCheck, Menu, MessageCircle } from "lucide-react";
import aeLogo from "../assets/ae-logo.jpeg";
import { company } from "../lib/company";
import type { BrandContent, ContactContent, NavItem } from "../lib/site-content";
import { Button } from "./ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from "./ui/sheet";

type HeaderProps = {
  activeHref: string;
  brand: BrandContent;
  navItems: NavItem[];
  contact: ContactContent;
  view: "home" | "booking" | "subpage";
};

export function Header({ activeHref, brand, navItems, contact, view }: HeaderProps) {
  const scrolled = useScrolled();
  const observedHref = useObservedNavHref(activeHref, navItems);
  const solid = view !== "home" || scrolled;
  const whatsappHref = company.whatsappHref;

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 h-[72px] transition-colors duration-200 ${
        solid
          ? "border-b border-line bg-white/90 text-ink backdrop-blur"
          : "bg-transparent text-white"
      }`}
    >
      <nav
        className="mx-auto grid h-full w-[min(1200px,calc(100%-48px))] grid-cols-[auto_1fr_auto] items-center gap-4"
        aria-label="Primary navigation"
      >
        <a className="group inline-flex min-w-max items-center gap-2" href="#home" aria-label={`${brand.name} home`}>
          <img className="size-9 rounded-lg border border-line object-cover" src={aeLogo} alt="" aria-hidden="true" />
          <span className="font-display text-[20px] font-normal leading-none tracking-normal sm:text-[22px]">
            <span className={solid ? "text-navy" : "text-sky-300"}>AE</span>
            <span className={solid ? "text-ink" : "text-white"}> Management Services</span>
          </span>
        </a>

        <div className="hidden min-w-0 justify-center lg:flex">
          <div className="flex min-w-0 items-center justify-center gap-1 whitespace-nowrap" aria-label="Site sections">
            {navItems.map((item) => {
              const isActive = item.href === observedHref;

              return (
                <a
                  aria-current={isActive ? "page" : undefined}
                  className={`rounded-full px-3 py-2 text-sm font-medium transition-colors ${
                    solid
                      ? "text-[rgb(22_25_26_/_0.80)] hover:bg-sky-100 hover:text-ink"
                      : "text-white/85 hover:bg-white/10 hover:text-white"
                  } ${isActive && solid ? "bg-sky-100 text-navy" : ""}`}
                  href={item.href}
                  key={item.href}
                >
                  {item.label}
                </a>
              );
            })}
          </div>
        </div>

        <div className="hidden items-center justify-end gap-3 lg:flex">
          <a
            className={`hidden h-10 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors xl:inline-flex ${
              solid
                ? "border-line bg-white text-ink hover:border-[rgb(22_25_26_/_0.25)]"
                : "border-white/25 bg-white/10 text-white hover:bg-white/15"
            }`}
            href={whatsappHref}
            target="_blank"
            rel="noreferrer"
          >
            <MessageCircle size={15} aria-hidden="true" />
            WhatsApp us
          </a>
          <Button asChild>
            <a href={contact.bookingHref}>
              <CalendarCheck size={15} aria-hidden="true" />
              Book Now
            </a>
          </Button>
        </div>

        <div className="flex justify-end lg:hidden">
          <MobileMenu
            activeHref={observedHref}
            brand={brand}
            contact={contact}
            navItems={navItems}
            whatsappHref={whatsappHref}
            solid={solid}
          />
        </div>
      </nav>
    </header>
  );
}

function MobileMenu({
  activeHref,
  brand,
  contact,
  navItems,
  whatsappHref,
  solid
}: {
  activeHref: string;
  brand: BrandContent;
  contact: ContactContent;
  navItems: NavItem[];
  whatsappHref: string;
  solid: boolean;
}) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          className={solid ? "" : "border-white/25 bg-white/10 text-white hover:bg-white/15"}
          size="icon-lg"
          variant={solid ? "secondary" : "ghostOnDark"}
          aria-label="Open navigation menu"
        >
          <Menu size={20} aria-hidden="true" />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full border-l border-line bg-paper px-6 py-7 sm:max-w-none" side="right">
        <SheetHeader className="p-0 text-left">
          <SheetTitle className="font-display text-[28px] font-normal text-ink">
            {brand.name}
          </SheetTitle>
          <SheetDescription className="text-sm text-[rgb(22_25_26_/_0.55)]">
            {brand.descriptor}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-10 grid gap-3" aria-label="Mobile site sections">
          {navItems.map((item) => (
            <SheetClose asChild key={item.href}>
              <a
                aria-current={item.href === activeHref ? "page" : undefined}
                className="font-display text-[28px] font-normal leading-tight text-ink transition-colors hover:text-navy"
                href={item.href}
              >
                {item.label}
              </a>
            </SheetClose>
          ))}
        </div>

        <div className="mt-auto grid gap-3 pt-8">
          <SheetClose asChild>
            <Button asChild variant="secondary">
              <a href={whatsappHref} target="_blank" rel="noreferrer">
                <MessageCircle size={16} aria-hidden="true" />
                WhatsApp us
              </a>
            </Button>
          </SheetClose>
          <SheetClose asChild>
            <Button asChild>
              <a href={contact.bookingHref}>
                <CalendarCheck size={16} aria-hidden="true" />
                Book Now
              </a>
            </Button>
          </SheetClose>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function useScrolled() {
  const [scrolled, setScrolled] = useState(() => window.scrollY > 24);

  useEffect(() => {
    const updateScrolled = () => setScrolled(window.scrollY > 24);

    updateScrolled();
    window.addEventListener("scroll", updateScrolled, { passive: true });

    return () => window.removeEventListener("scroll", updateScrolled);
  }, []);

  return scrolled;
}

function useObservedNavHref(activeHref: string, navItems: NavItem[]) {
  const [observedHref, setObservedHref] = useState(activeHref);

  useEffect(() => {
    setObservedHref(activeHref);

    const media = window.matchMedia("(min-width: 1024px)");

    if (!media.matches) {
      return;
    }

    const elements = navItems
      .map((item) => document.getElementById(item.href.slice(1)))
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
          setObservedHref(`#${visible.target.id}`);
        }
      },
      { rootMargin: "-30% 0px -55% 0px", threshold: [0.08, 0.18, 0.32] }
    );

    elements.forEach((element) => observer.observe(element));

    return () => observer.disconnect();
  }, [activeHref, navItems]);

  return observedHref;
}
