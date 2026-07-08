import { forwardRef, useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronDown, ChevronRight, LogOut, Menu, ShieldCheck } from "lucide-react";
import aeLogo from "../assets/ae-logo.jpeg";
import { company } from "../lib/company";
import { setPreferredBookingService } from "../lib/booking-preferences";
import { forgetCustomerSession, getCurrentAuth, logoutAdmin } from "../lib/customer-api";
import { customerSessionChangedEvent } from "../hooks/useCustomerSession";
import type { BrandContent, ContactContent, NavItem } from "../lib/site-content";
import { BookingOptionDialog } from "./BookingOptionDialog";
import { CustomerAccountDialog } from "./CustomerAccountDialog";
import { Icon3D, type Icon3DName } from "./Icon3D";
import { WhatsappLogo } from "./WhatsappLogo";
import { Button } from "./ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
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
  const [megaOpen, setMegaOpen] = useState(false);
  const megaRef = useRef<HTMLDivElement | null>(null);
  const auth = useAuthState();

  function closeMegaMenu() {
    setMegaOpen(false);
  }

  useEffect(() => {
    closeMegaMenu();
  }, [activeHref]);

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (megaRef.current && !megaRef.current.contains(event.target as Node)) {
        closeMegaMenu();
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeMegaMenu();
      }
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 h-[72px] transition-colors duration-200 ${
        solid
          ? "border-b border-line bg-white/85 text-ink backdrop-blur-md"
          : "bg-transparent text-white"
      }`}
    >
      <nav
        className="mx-auto grid h-full w-[min(1440px,calc(100%-40px))] grid-cols-[minmax(0,auto)_minmax(0,1fr)_auto] items-center gap-5 xl:gap-8 2xl:gap-12"
        aria-label="Primary navigation"
      >
        <a className="inline-flex min-w-0 items-center gap-2 sm:gap-3 xl:min-w-max" href="#home" aria-label={`${brand.name} home`}>
          <img className="size-9 shrink-0 rounded-lg border border-line object-cover" src={aeLogo} alt="" aria-hidden="true" />
          <span className={`block max-w-[calc(100vw-118px)] truncate font-display text-[17px] font-medium leading-none tracking-normal sm:max-w-none sm:text-[19px] xl:text-[20px] 2xl:text-[22px] ${solid ? "" : "rounded-full bg-white/92 px-2.5 py-1 text-ink ring-1 ring-white/35"}`}>
            <span className={solid ? "text-ink" : "text-primary-ink"}>AE</span>
            <span className="text-ink max-[360px]:hidden"> Management Services</span>
            <span className="hidden text-ink max-[360px]:inline"> Management</span>
          </span>
        </a>

        <div className="hidden min-w-0 justify-center xl:flex">
          <div className="flex min-w-0 items-center justify-center gap-1.5 whitespace-nowrap 2xl:gap-3" aria-label="Site sections">
            {navItems.map((item) => {
              const isActive = item.href === observedHref;
              const isServices = item.href === "#services";

              return (
                <div
                  className="relative"
                  key={item.href}
                  ref={isServices ? megaRef : undefined}
                >
                  <a
                    aria-current={isActive ? "page" : undefined}
                    aria-expanded={isServices ? megaOpen : undefined}
                    className={`inline-flex h-10 items-center gap-2 rounded-full px-3.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary 2xl:px-4 ${
                      solid
                        ? "text-ink/75 hover:bg-primary-soft hover:text-primary-ink"
                        : "text-white/85 hover:bg-white/10 hover:text-white"
                    } ${isActive && solid ? "bg-primary-soft text-primary-ink" : ""} ${isActive && !solid ? "bg-white/10 text-white" : ""} ${isServices && megaOpen && solid ? "bg-primary-soft text-primary-ink shadow-[0_10px_30px_rgb(22_25_26_/_0.06)]" : ""} ${isServices && megaOpen && !solid ? "bg-white/14 text-white" : ""}`}
                    data-nav-link={item.href.slice(1)}
                    href={item.href}
                    onClick={(event) => {
                      if (isServices) {
                        event.preventDefault();
                        setMegaOpen((open) => !open);
                      }
                    }}
                  >
                    {item.label}
                    {isServices ? (
                      <ChevronDown
                        className={`size-4 transition-transform ${megaOpen ? "rotate-180" : ""}`}
                        aria-hidden="true"
                      />
                    ) : null}
                  </a>
                  {isServices && megaOpen ? <ServicesMegaMenu onNavigate={closeMegaMenu} /> : null}
                </div>
              );
            })}
          </div>
        </div>

        <div className="hidden items-center justify-end gap-4 xl:flex 2xl:gap-5">
          <HeaderAuthControls auth={auth} solid={solid} />
          <BookingOptionDialog bookingHref={contact.bookingHref} />
        </div>

        <div className="flex justify-end xl:hidden">
          <MobileMenu
            activeHref={observedHref}
            brand={brand}
            contact={contact}
            navItems={navItems}
            whatsappHref={whatsappHref}
            solid={solid}
            auth={auth}
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
  solid,
  auth
}: {
  activeHref: string;
  auth: AuthState;
  brand: BrandContent;
  contact: ContactContent;
  navItems: NavItem[];
  whatsappHref: string;
  solid: boolean;
}) {
  const [servicesOpen, setServicesOpen] = useState(activeHref === "#services");

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
          <SheetTitle className="font-display text-[28px] font-medium text-ink">
            {brand.name}
          </SheetTitle>
          <SheetDescription className="text-sm text-[rgb(22_25_26_/_0.55)]">
            {brand.descriptor}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-10 grid gap-3" aria-label="Mobile site sections">
          {navItems.map((item) => item.href === "#services" ? (
            <div className={`rounded-[24px] border bg-white p-4 transition ${servicesOpen ? "border-primary/25 shadow-[0_14px_34px_rgb(22_25_26_/_0.06)]" : "border-line"}`} key={item.href}>
              <Button
                aria-expanded={servicesOpen}
                className="h-auto w-full justify-between gap-4 rounded-none border-0 bg-transparent p-0 text-left text-ink shadow-none hover:bg-transparent"
                onClick={() => setServicesOpen((open) => !open)}
                type="button"
                variant="ghost"
              >
                <span className={`font-display text-[28px] font-medium leading-tight transition-colors ${servicesOpen ? "text-primary-ink" : "text-ink"}`}>
                  Services
                </span>
                <span className={`grid size-11 place-items-center rounded-full border text-primary-ink transition-transform ${servicesOpen ? "rotate-180 border-primary/30 bg-primary-soft" : "border-line bg-paper"}`}>
                  <ChevronDown className="size-5" aria-hidden="true" />
                </span>
              </Button>
              {servicesOpen ? (
                <div className="mt-5 grid gap-4">
                  <MobileServicesSection title="Home services">
                    {serviceMenuItems.map((menuItem) => (
                      <SheetClose asChild key={menuItem.title}>
                        <ServicesMenuLink {...menuItem} compact />
                      </SheetClose>
                    ))}
                  </MobileServicesSection>
                  <MobileServicesSection title="Booking support">
                    {supportMenuItems.map((menuItem) => (
                      <SheetClose asChild key={menuItem.title}>
                        <ServicesMenuLink {...menuItem} compact />
                      </SheetClose>
                    ))}
                  </MobileServicesSection>
                </div>
              ) : null}
            </div>
          ) : (
            <SheetClose asChild key={item.href}>
              <a
                aria-current={item.href === activeHref ? "page" : undefined}
                className={`font-display text-[28px] font-medium leading-tight transition-colors hover:text-primary-ink ${
                  item.href === activeHref ? "text-primary-ink" : "text-ink"
                }`}
                href={item.href}
              >
                {item.label}
              </a>
            </SheetClose>
          ))}
        </div>

        <div className="mt-auto grid gap-3 pt-8">
          <HeaderAuthControls auth={auth} solid={true} mobile />
          <SheetClose asChild>
            <Button asChild className="size-12 p-0" variant="secondary">
              <a href={whatsappHref} target="_blank" rel="noreferrer" aria-label="Message AE on WhatsApp">
                <WhatsappLogo className="size-7 text-[#25D366]" />
              </a>
            </Button>
          </SheetClose>
          <BookingOptionDialog bookingHref={contact.bookingHref} mobile />
        </div>
      </SheetContent>
    </Sheet>
  );
}

type AuthState = {
  loading: boolean;
  name: string | null;
  role: "admin" | "customer" | null;
};

function useAuthState() {
  const [auth, setAuth] = useState<AuthState>({ loading: true, name: null, role: null });

  useEffect(() => {
    let active = true;

    async function refresh() {
      try {
        const nextAuth = await getCurrentAuth();

        if (active) {
          setAuth({ loading: false, name: nextAuth.name, role: nextAuth.role });
        }
      } catch {
        if (active) {
          setAuth({ loading: false, name: null, role: null });
        }
      }
    }

    void refresh();

    const onSessionChanged = () => void refresh();

    window.addEventListener(customerSessionChangedEvent, onSessionChanged);
    window.addEventListener("focus", onSessionChanged);

    return () => {
      active = false;
      window.removeEventListener(customerSessionChangedEvent, onSessionChanged);
      window.removeEventListener("focus", onSessionChanged);
    };
  }, []);

  return auth;
}

function HeaderAuthControls({
  auth,
  mobile = false,
  solid
}: {
  auth: AuthState;
  mobile?: boolean;
  solid: boolean;
}) {
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);

  if (auth.role === "admin") {
    const buttonClass = mobile ? "w-full justify-center" : solid ? "h-12 px-5" : "h-12 border-white/25 bg-white/10 px-5 text-white hover:bg-white/15";

    async function signOut() {
      await logoutAdmin().catch(() => undefined);
      forgetCustomerSession();
      window.dispatchEvent(new Event(customerSessionChangedEvent));
      window.location.hash = "#home";
    }

    const identity = (
      <div>
        <p className="m-0 text-sm font-semibold text-ink">AE Admin</p>
        <p className="m-0 mt-0.5 text-sm text-ink/60">Staff account · {auth.name ?? "AE"}</p>
      </div>
    );
    const actions = (
      <div className="mt-3 grid gap-2">
        <Button asChild className="w-full" type="button">
          <a href="#admin" onClick={() => setAdminMenuOpen(false)}>
            <ShieldCheck className="size-4" aria-hidden="true" />
            Admin dashboard
          </a>
        </Button>
        <Button className="w-full" onClick={() => { setAdminMenuOpen(false); void signOut(); }} type="button" variant="secondary">
          <LogOut className="size-4" aria-hidden="true" />
          Sign out
        </Button>
      </div>
    );

    if (mobile) {
      return (
        <div className="rounded-[20px] border border-line bg-paper p-4">
          {identity}
          {actions}
        </div>
      );
    }

    return (
      <Popover open={adminMenuOpen} onOpenChange={setAdminMenuOpen}>
        <PopoverTrigger asChild>
          <Button className={buttonClass} type="button" variant={solid ? "secondary" : "ghostOnDark"}>
            <ShieldCheck className="size-4" aria-hidden="true" />
            <span className="grid text-left leading-none">
              <span>Admin</span>
              <span className="text-[10px] font-medium opacity-70">Staff</span>
            </span>
            <ChevronDown className="size-4 opacity-60" aria-hidden="true" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-[min(300px,calc(100vw-24px))] rounded-[20px] border-line p-4">
          {identity}
          {actions}
        </PopoverContent>
      </Popover>
    );
  }

  if (auth.role === "customer") {
    // The signed-in customer menu (identity + view bookings + sign out) now lives inside
    // CustomerAccountDialog as a navbar dropdown, so no separate sign-out button here.
    return <CustomerAccountDialog signedOutHref="#signin" solid={solid} mobile={mobile} />;
  }

  return <CustomerAccountDialog signedOutHref="#signin" solid={solid} mobile={mobile} />;
}

function MobileServicesSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-[20px] bg-paper p-3.5">
      <p className="px-1 text-[12px] font-semibold uppercase tracking-[0.08em] text-ink/45">{title}</p>
      <div className="mt-2.5 grid gap-2.5">{children}</div>
    </div>
  );
}

type MenuItem = {
  desc: string;
  href: string;
  icon: Icon3DName;
  serviceId?: string;
  frequency?: string;
  detail: string;
  links: string[];
  title: string;
};

const serviceMenuItems: MenuItem[] = [
  {
    title: "Residential Subscription",
    desc: "Weekly or fortnightly same-cleaner home care.",
    href: "#services",
    icon: "broom",
    serviceId: "recurring",
    frequency: "Weekly",
    detail: "Steady weekly, fortnightly, or one-time hourly cleaning for lived-in Singapore homes.",
    links: ["Weekly S$24-26/hr", "Fortnightly S$25-28/hr", "One-time S$28-32/hr"]
  },
  {
    title: "Move-In / Out",
    desc: "Residential handover and fresh-start resets.",
    href: "#services",
    icon: "key",
    serviceId: "move",
    detail: "Move-in and move-out handover cleaning sized by home type before AE confirms scope.",
    links: ["Up to 700 sq ft from S$300", "700-1,000 sq ft from S$360", "1,000-1,300 sq ft from S$420"]
  },
  {
    title: "Post-Renovation",
    desc: "Detailed dust reset after renovation work.",
    href: "#services",
    icon: "sparkles",
    serviceId: "renovation",
    detail: "Fine-dust reset for post-renovation homes, with visible scope review before payment.",
    links: ["Up to 700 sq ft from S$380", "700-1,000 sq ft from S$420", "1,000-1,300 sq ft from S$450"]
  },
];

const supportMenuItems: MenuItem[] = [
  {
    title: "Pricing",
    desc: "Hourly rates, packages, and surcharges.",
    href: "#pricing",
    icon: "money",
    detail: "Compare hourly rates, package starting prices, and add-ons before choosing a booking path.",
    links: ["Weekly S$24-26/hr", "One-time S$28-32/hr", "Move clean from S$300"]
  },
  {
    title: "Cleaning Checklist",
    desc: "Recurring, move, and reno cleaning scope.",
    href: "#services",
    icon: "clipboard",
    detail: "Scan the room-by-room checklist and add detail only where your home needs it.",
    links: ["Kitchen and bath scope", "Bedrooms and living areas", "Add-ons from S$18"]
  },
  {
    title: "How It Works",
    desc: "Submit, AE confirms, clean, then invoice.",
    href: "#how-it-works",
    icon: "bell",
    detail: "See the request flow from online booking through AE confirmation, service completion, and invoice payment.",
    links: ["Request online", "AE confirms your slot", "Pay after service"]
  },
  {
    title: "Track my booking",
    desc: "Sign in to see visits and invoices.",
    href: "#signin",
    icon: "phone",
    detail: "Use the existing customer account to view your bookings and status timeline.",
    links: ["Email/password sign-in", "Pending status", "Invoice payment timeline"]
  }
];

function ServicesMegaMenu({ onNavigate }: { onNavigate: () => void }) {
  const categories = [
    { title: "Our cleaning", desc: "Homes we clean", icon: "house" as Icon3DName, items: serviceMenuItems },
    { title: "Pricing & help", desc: "Rates, booking, account", icon: "money" as Icon3DName, items: supportMenuItems }
  ];
  const [categoryIndex, setCategoryIndex] = useState(0);
  const [hoveredTitle, setHoveredTitle] = useState(serviceMenuItems[0].title);
  const activeCategory = categories[categoryIndex];
  const activeItem = activeCategory.items.find((item) => item.title === hoveredTitle) ?? activeCategory.items[0];

  function selectCategory(index: number) {
    setCategoryIndex(index);
    setHoveredTitle(categories[index].items[0].title);
  }

  return (
    <div
      data-services-mega-menu="true"
      className="absolute left-1/2 top-[calc(100%+14px)] z-50 w-[min(1040px,calc(100vw-56px))] -translate-x-1/2 whitespace-normal rounded-[32px] border border-line bg-white p-5 text-ink shadow-[0_24px_72px_rgb(22_25_26_/_0.12)]"
    >
      <div className="grid gap-5 xl:grid-cols-[250px_minmax(0,1fr)_300px]">
        <div className="grid content-start gap-3 rounded-[26px] bg-paper p-3.5">
          {categories.map((category, index) => {
            const selected = index === categoryIndex;

            return (
              <Button
                className={`grid h-auto grid-cols-[52px_minmax(0,1fr)] items-center gap-3 rounded-[22px] border p-3 text-left transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${selected ? "border-primary/25 bg-primary-soft" : "border-transparent hover:bg-primary-soft"}`}
                key={category.title}
                onClick={() => selectCategory(index)}
                onFocus={() => selectCategory(index)}
                type="button"
                variant="ghost"
              >
                <Icon3D name={category.icon} size={36} />
                <span className="min-w-0">
                  <span className="block text-[15px] font-semibold text-ink">{category.title}</span>
                  <span className="mt-1 block text-[13px] text-ink/55">{category.desc}</span>
                </span>
              </Button>
            );
          })}
        </div>

        <div className="grid content-start gap-2 rounded-[26px] bg-white p-2.5">
          <p className="px-3 pt-2 text-[12px] font-semibold uppercase tracking-[0.08em] text-ink/45">{activeCategory.title}</p>
          {activeCategory.items.map((item) => (
            <ServicesMenuLink
              href={item.href}
              icon={item.icon}
              key={item.title}
              title={item.title}
              desc={item.desc}
              detail={item.detail}
              links={item.links}
              frequency={item.frequency}
              serviceId={item.serviceId}
              active={item.title === activeItem.title}
              onHover={() => setHoveredTitle(item.title)}
              onNavigate={onNavigate}
            />
          ))}
        </div>

        <div className="grid content-between rounded-[26px] bg-primary-soft/50 p-5">
          <div>
            <Icon3D name={activeItem.icon} size={44} />
            <h2 className="mt-5 font-display text-[28px] font-medium leading-tight text-ink">{activeItem.title}</h2>
            <p className="mt-3 text-sm leading-6 text-ink/65">{activeItem.detail}</p>
            <div className="mt-5 grid gap-2">
              {activeItem.links.map((link) => (
                <a className="rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold text-ink/72 transition hover:border-primary/40 hover:text-primary-ink" href={activeItem.href} key={link} onClick={onNavigate}>
                  {link}
                </a>
              ))}
            </div>
          </div>
          <Button asChild className="mt-6 w-full">
            <a
              href={activeItem.serviceId ? "#booking" : activeItem.href}
              onClick={() => {
                if (activeItem.serviceId) {
                  setPreferredBookingService(activeItem.serviceId, activeItem.frequency);
                }
                onNavigate();
              }}
            >
              {activeItem.serviceId ? "Book this" : "Open page"}
              <ChevronRight className="size-4" aria-hidden="true" />
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}

const ServicesMenuLink = forwardRef<HTMLAnchorElement, MenuItem & {
  active?: boolean;
  compact?: boolean;
  onHover?: () => void;
  onNavigate?: () => void;
}>(
  function ServicesMenuLink({
  href,
  icon,
  title,
  desc,
  serviceId,
  frequency,
  onNavigate,
  onHover,
  active = false,
  compact = false
}, ref) {
    return (
      <a
        className={`grid items-center gap-4 rounded-[22px] border border-transparent px-4 transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary hover:bg-primary-soft/60 ${active ? "bg-primary-soft/60" : "bg-white"} ${compact ? "grid-cols-[48px_1fr_auto] py-3.5" : "grid-cols-[60px_1fr_auto] py-3"}`}
        href={href}
        onClick={() => {
          if (serviceId) {
            setPreferredBookingService(serviceId, frequency);
          }
          onNavigate?.();
        }}
        onFocus={onHover}
        onMouseEnter={onHover}
        ref={ref}
      >
        <Icon3D name={icon} size={compact ? 32 : 44} />
        <span className="min-w-0">
          <span className="block text-[15px] font-semibold leading-5 text-ink">{title}</span>
          <span className="mt-1 block text-[13px] leading-5 text-ink/60">{desc}</span>
        </span>
        <ChevronRight className="size-4 shrink-0 text-primary-ink" aria-hidden="true" />
      </a>
    );
  }
);

ServicesMenuLink.displayName = "ServicesMenuLink";

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

    const media = window.matchMedia("(min-width: 1280px)");

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
