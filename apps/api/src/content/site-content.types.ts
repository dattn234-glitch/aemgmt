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
  highlights: string[];
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

