export type NavItem = {
  label: string;
  href: string;
  status: "live" | "planned";
};

export type BrandContent = {
  name: string;
  descriptor: string;
};

export type ContactContent = {
  phone: string;
  bookingHref: string;
};

export type HeroPromise = {
  title: string;
  description: string;
};

export type HeroContent = {
  eyebrow: string;
  title: string;
  emphasis: string;
  suffix: string;
  body: string;
  promises: HeroPromise[];
  primaryCta: string;
  secondaryCta: string;
  rating: {
    score: string;
    label: string;
    reviews: string;
  };
};

export type PricingPlan = {
  name: string;
  description: string;
  price: number;
  priceLabel?: string;
  suffix: string;
  capacity: string;
  features: string[];
  featured?: boolean;
  durationPrices?: {
    label: string;
    price: number;
  }[];
};

export type PricingAddon = {
  name: string;
  price: number;
};

export type PricingContent = {
  eyebrow: string;
  title: string;
  subtitle: string;
  billingOptions: string[];
  plans: PricingPlan[];
  addons: PricingAddon[];
};

export type BookingService = {
  id: string;
  name: string;
  description: string;
  price: number;
  billingLabel: string;
  badge?: string;
  frequencyOptions: string[];
  keyPoints: string[];
};

export type BookingAddon = {
  id: string;
  name: string;
  description: string;
  price: number;
};

export type BookingContent = {
  eyebrow: string;
  title: string;
  emphasis: string;
  subtitle: string;
  steps: {
    label: string;
    description: string;
  }[];
  services: BookingService[];
  homeTypes: string[];
  sizeOptions: string[];
  durationOptions: string[];
  bedroomOptions: string[];
  bathroomOptions: string[];
  timeSlots: string[];
  addons: BookingAddon[];
  assurances: {
    title: string;
    description: string;
  }[];
};

export type SiteContent = {
  brand: BrandContent;
  navItems: NavItem[];
  contact: ContactContent;
  home: {
    hero: HeroContent;
    trustRow: string[];
  };
  pricing: PricingContent;
  booking: BookingContent;
};

export const fallbackSiteContent: SiteContent = {
  brand: {
    name: "AE Management Services",
    descriptor: "Simple. Efficient. Professional."
  },
  navItems: [
    { label: "Home", href: "#home", status: "live" },
    { label: "About Us", href: "#about", status: "live" },
    { label: "Services", href: "#services", status: "live" },
    { label: "Pricing", href: "#pricing", status: "live" },
    { label: "How It Works", href: "#how-it-works", status: "live" },
    { label: "Reviews", href: "#reviews", status: "live" },
    { label: "Contact", href: "#contact", status: "live" }
  ],
  contact: {
    phone: "+65 6980 3559",
    bookingHref: "#booking"
  },
  home: {
    hero: {
      eyebrow: "From S$24/hr · Singapore island-wide",
      title: "Come home to a house",
      emphasis: "that's already clean.",
      suffix: "",
      body: "Weekly cleans, move-in/out handovers, and post-renovation resets — booked online in two minutes, confirmed on WhatsApp, and paid only after the visit.",
      promises: [
        { title: "Same cleaner", description: "Every visit where available" },
        { title: "Replacement", description: "Cleaner guarantee" },
        { title: "Digital checklist", description: "Room by room" },
        { title: "Cashless", description: "PayNow or transfer" }
      ],
      primaryCta: "Book online",
      secondaryCta: "See pricing",
      rating: {
        score: "HSS-focused",
        label: "residential homes only",
        reviews: "Built for Singapore households"
      }
    },
    trustRow: ["East", "West", "North", "Central", "City fringe"]
  },
  pricing: {
    eyebrow: "Pricing",
    title: "Hourly rates with clear packages",
    subtitle: "Weekly, fortnightly, and one-time cleaning at clear hourly rates. Move-in/out and post-renovation packages run S$300-S$450 for homes up to 1,300 sq ft.",
    billingOptions: ["Hourly home cleaning", "Package cleaning"],
    plans: [
      {
        name: "Weekly",
        description: "The lowest hourly rate, and your home never gets the chance to slip. Same cleaner where available.",
        price: 25,
        priceLabel: "S$24-26",
        suffix: "/hr",
        capacity: "3 or 4 hour sessions",
        featured: true,
        durationPrices: [
          { label: "3 hrs", price: 75 },
          { label: "4 hrs", price: 100 }
        ],
        features: ["Same cleaner where available", "Replacement guarantee", "Digital cleaning checklist", "Easy rescheduling"]
      },
      {
        name: "Fortnightly",
        description: "A dependable reset every two weeks — the sweet spot for tidy HDB, condo, and landed homes.",
        price: 27,
        priceLabel: "S$25-28",
        suffix: "/hr",
        capacity: "3 or 4 hour sessions",
        durationPrices: [
          { label: "3 hrs", price: 81 },
          { label: "4 hrs", price: 108 }
        ],
        features: ["Same cleaner where available", "Replacement cleaner guarantee", "Checklist-led visits", "Pay by PayNow after service"]
      },
      {
        name: "One-Time",
        description: "One visit, no commitment — try AE before a subscription, or get help before guests arrive.",
        price: 30,
        priceLabel: "S$28-32",
        suffix: "/hr",
        capacity: "3 or 4 hour sessions",
        durationPrices: [
          { label: "3 hrs", price: 90 },
          { label: "4 hrs", price: 120 }
        ],
        features: ["Flexible one-off visit", "Cleaner assigned by availability", "Slot confirmed by AE", "No hidden fees; add-ons optional"]
      }
    ],
    addons: [
      { name: "Kitchen degrease", price: 45 },
      { name: "Fridge or oven", price: 35 },
      { name: "Bathroom deep clean", price: 40 },
      { name: "Sofa or mattress extraction", price: 80 }
    ]
  },
  booking: {
    eyebrow: "Online booking",
    title: "Book your home clean",
    emphasis: "then AE confirms your slot",
    subtitle: "Submit a residential cleaning request for your Singapore home. AE confirms availability first — you pay by PayNow only after the service is completed and the invoice is ready.",
    steps: [
      { label: "Service", description: "Choose hourly or package" },
      { label: "Date & Time", description: "Pick a visit window" },
      { label: "Home Details", description: "HDB, condominium, or landed" },
      { label: "Add-ons", description: "Customize the scope" },
      { label: "Review", description: "Confirm and pay after service" }
    ],
    services: [
      {
        id: "recurring",
        name: "Residential Cleaning Subscription",
        description: "Weekly or fortnightly visits from a cleaner who learns your home — or a one-time clean when you need it.",
        price: 24,
        billingLabel: "from /hr",
        frequencyOptions: ["Weekly", "Fortnightly", "One-time"],
        keyPoints: ["3 or 4 hour sessions", "Same cleaner every visit where available", "Digital checklist", "WhatsApp confirmation"]
      },
      {
        id: "move",
        name: "Move-In / Move-Out Cleaning",
        description: "Get the flat key-ready for handover, inspection, or your first night — cabinets, bathrooms, and floors included.",
        price: 300,
        billingLabel: "from",
        frequencyOptions: ["One-time package"],
        keyPoints: ["S$300-S$450 up to 1,300 sq ft", "Cabinets and fixtures", "Kitchen and bathroom detail", "Final quote by AE"]
      },
      {
        id: "renovation",
        name: "Post-Renovation Cleaning",
        description: "Clear the fine dust contractors leave behind — ledges, tracks, and floors reset before you move back in.",
        price: 380,
        billingLabel: "from",
        frequencyOptions: ["One-time package"],
        keyPoints: ["Packages sized up to 1,300 sq ft", "Fine dust wipe-down", "Floor and surface reset", "Scope confirmed by AE"]
      }
    ],
    homeTypes: ["HDB", "Condominium", "Landed"],
    sizeOptions: ["Up to 700 sq ft", "700-1,000 sq ft", "1,000-1,300 sq ft", "Above 1,300 sq ft"],
    durationOptions: ["3 hrs", "4 hrs"],
    bedroomOptions: ["Studio", "1 bedroom", "2 bedrooms", "3 bedrooms", "4 bedrooms", "5+ bedrooms"],
    bathroomOptions: ["1 bathroom", "2 bathrooms", "3 bathrooms", "4+ bathrooms"],
    timeSlots: ["8:00 AM", "10:30 AM", "1:00 PM", "3:30 PM", "5:00 PM"],
    addons: [
      { id: "kitchen-degrease", name: "Kitchen degrease", description: "Extra time for hob, backsplash, cabinet fronts, and oily buildup.", price: 45 },
      { id: "fridge-oven", name: "Fridge or oven", description: "Interior shelves, racks, seals, glass, and reachable surfaces.", price: 35 },
      { id: "bathroom-deep-clean", name: "Bathroom deep clean", description: "Scale, grout, glass, fittings, and wet-room detail work.", price: 40 },
      { id: "sofa-mattress", name: "Sofa or mattress extraction", description: "Fabric extraction for one sofa or mattress item, subject to confirmation.", price: 80 }
    ],
    assurances: [
      { title: "Pay after service", description: "AE confirms your visit first; invoice and PayNow details appear after completion." },
      { title: "Confirmed before we come", description: "Every booking is checked and confirmed by AE on WhatsApp — no surprise arrivals." },
      { title: "Checklist-led visit", description: "AE confirms your scope and visit details so the cleaner knows what matters most." }
    ]
  }
};
