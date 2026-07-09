import { Suspense, lazy, useEffect, useState, type ReactElement } from "react";
import { FloatingWhatsapp } from "./components/FloatingWhatsapp";
import { Footer } from "./components/Footer";
import { Header } from "./components/Header";
import { HomePage } from "./components/HomePage";
import { AboutPage } from "./components/pages/AboutPage";
import { ContactPage } from "./components/pages/ContactPage";
import { HowItWorksPage } from "./components/pages/HowItWorksPage";
import { PricingPage } from "./components/pages/PricingPage";
import { ReviewsPage } from "./components/pages/ReviewsPage";
import { ServicesPage } from "./components/pages/ServicesPage";
import { fallbackSiteContent, type SiteContent } from "./lib/site-content";

const BookingPage = lazy(() => import("./components/BookingPage").then((module) => ({ default: module.BookingPage })));
const AdminPage = lazy(() => import("./components/pages/AdminPage").then((module) => ({ default: module.AdminPage })));
const PublicInvoicePage = lazy(() => import("./components/pages/PublicInvoicePage").then((module) => ({ default: module.PublicInvoicePage })));
const SignInPage = lazy(() => import("./components/pages/SignInPage").then((module) => ({ default: module.SignInPage })));

function RouteFallback() {
  return (
    <div className="grid min-h-[60svh] place-items-center bg-paper pt-[72px]">
      <span className="size-8 animate-spin rounded-full border-2 border-line border-t-primary" aria-label="Loading" />
    </div>
  );
}

const fallbackRoute = "#home";
const legacyRoutes = new Map([["#testimonials", "#reviews"]]);
const routeTitles: Record<string, string> = {
  "#home": "AE Management Services — Singapore home cleaning",
  "#about": "About Us — AE Management Services",
  "#services": "Services — AE Management Services",
  "#pricing": "Pricing — AE Management Services",
  "#how-it-works": "How It Works — AE Management Services",
  "#reviews": "Reviews — AE Management Services",
  "#contact": "Contact — AE Management Services",
  "#booking": "Booking — AE Management Services",
  "#signin": "Sign in — AE Management Services",
  "#admin": "Admin — AE Management Services",
  "#invoice": "Invoice — AE Management Services"
};

export function App() {
  const [content, setContent] = useState<SiteContent>(fallbackSiteContent);
  const [activeHref, setActiveHref] = useState(() => getActiveHref());
  const view = activeHref === "#home" ? "home" : activeHref === "#booking" ? "booking" : "subpage";

  useEffect(() => {
    let cancelled = false;

    fetch("/api/site")
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Site content request failed: ${response.status}`);
        }

        return response.json() as Promise<SiteContent>;
      })
      .then((payload) => {
        if (cancelled) {
          return;
        }

        setContent(normalizeSiteContent(payload));
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const updateActiveHref = () => setActiveHref(getActiveHref());

    updateActiveHref();
    window.addEventListener("hashchange", updateActiveHref);

    return () => window.removeEventListener("hashchange", updateActiveHref);
  }, []);

  useEffect(() => {
    document.title = routeTitles[activeHref] ?? routeTitles[fallbackRoute];
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [activeHref]);

  const page = renderRoute(activeHref, content);

  return (
    <div className="app-shell">
      <Header
        activeHref={activeHref}
        brand={content.brand}
        contact={content.contact}
        navItems={content.navItems}
        view={view}
      />
      <main className={`route route--${view}`}>
        <Suspense fallback={<RouteFallback />}>
          {page}
        </Suspense>
      </main>
      <Footer brand={content.brand} contact={content.contact} navItems={content.navItems} />
      <FloatingWhatsapp activeHref={activeHref} />
    </div>
  );
}

function normalizeSiteContent(payload: SiteContent): SiteContent {
  const content = sanitizeUnsupportedClaims(payload) as SiteContent;
  const apiPointsField = ["high", "lights"].join("");
  const booking = content.booking;

  return {
    ...content,
    booking: {
      ...booking,
      services: booking.services.map((service) => {
        const apiService = service as typeof service & Record<string, unknown>;
        const keyPoints = service.keyPoints ?? apiService[apiPointsField];

        return {
          ...service,
          keyPoints: Array.isArray(keyPoints) ? keyPoints.filter((item): item is string => typeof item === "string") : []
        };
      })
    }
  };
}

function sanitizeUnsupportedClaims(value: unknown): unknown {
  if (typeof value === "string") {
    return value
      .replaceAll("+ photo report", "Room by room")
      .replaceAll("Photo completion report", "Checklist-led visit")
      .replaceAll("photo completion report", "checklist-led visit")
      .replaceAll("Photo/checklist completion", "Checklist completion")
      .replaceAll("Photo proof", "Scope review")
      .replaceAll("photo report", "checklist summary")
      .replaceAll("completion photos", "the completed scope")
      .replaceAll("photos", "visit details")
      .replaceAll("AE follows MOM's Household Services Scheme — ", "");
  }

  if (Array.isArray(value)) {
    return value.map(sanitizeUnsupportedClaims);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, sanitizeUnsupportedClaims(entry)]));
  }

  return value;
}

function getActiveHref() {
  const hash = window.location.hash || fallbackRoute;
  const redirected = legacyRoutes.get(hash);

  if (redirected) {
    window.history.replaceState(null, "", redirected);
    return redirected;
  }

  return routeTitles[hash] ? hash : fallbackRoute;
}

function renderRoute(activeHref: string, content: SiteContent) {
  const routes: Record<string, ReactElement> = {
    "#home": (
      <HomePage
        hero={content.home.hero}
        pricing={content.pricing}
        trustRow={content.home.trustRow}
      />
    ),
    "#about": <AboutPage />,
    "#services": <ServicesPage booking={content.booking} pricing={content.pricing} />,
    "#pricing": <PricingPage pricing={content.pricing} />,
    "#how-it-works": <HowItWorksPage />,
    "#reviews": <ReviewsPage />,
    "#contact": <ContactPage contact={content.contact} />,
    "#booking": <BookingPage booking={content.booking} contact={content.contact} />,
    "#signin": <SignInPage />,
    "#admin": <AdminPage />,
    "#invoice": <PublicInvoicePage />
  };

  return routes[activeHref] ?? routes[fallbackRoute];
}
