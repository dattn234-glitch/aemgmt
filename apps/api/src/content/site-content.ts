import type { SiteContent } from "./site-content.types.js";

export const siteContent: SiteContent = {
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
    phone: "+65 8123 4567",
    bookingHref: "#booking"
  },
  home: {
    hero: {
      eyebrow: "Residential home cleaning · Singapore island-wide",
      title: "Home cleaning in Singapore",
      emphasis: "you can rely on.",
      suffix: "",
      body: "Same-cleaner reliability, digital checklists, photo completion reports, and WhatsApp support for HDB, condominium, and landed homes.",
      promises: [
        { title: "Same cleaner", description: "Every visit where available" },
        { title: "Replacement", description: "Cleaner guarantee" },
        { title: "Digital checklist", description: "+ photo report" },
        { title: "Cashless", description: "PayNow or transfer" }
      ],
      primaryCta: "Book on WhatsApp",
      secondaryCta: "See Pricing",
      rating: {
        score: "HSS-focused",
        label: "residential homes only",
        reviews: "Built for Singapore households"
      }
    },
    trustRow: ["East", "West", "North", "Central", "CBD fringe"]
  },
  pricing: {
    eyebrow: "Pricing",
    title: "Hourly rates with clear packages",
    subtitle: "Choose 3 or 4 hours for recurring home cleaning. Move-in/out and post-renovation cleans are quoted by home size and confirmed on WhatsApp.",
    billingOptions: ["Hourly home cleaning", "Package cleaning"],
    plans: [
      {
        name: "Weekly",
        description: "Best for busy households that want the same dedicated cleaner every visit.",
        price: 25,
        suffix: "/hr",
        capacity: "3 or 4 hour sessions",
        featured: true,
        durationPrices: [
          { label: "3 hrs", price: 75 },
          { label: "4 hrs", price: 100 }
        ],
        features: ["Same dedicated cleaner", "Digital cleaning checklist", "Photo completion report", "Easy WhatsApp rescheduling"]
      },
      {
        name: "Fortnightly",
        description: "A reliable reset every two weeks for HDB, condominium, and landed homes.",
        price: 27,
        suffix: "/hr",
        capacity: "3 or 4 hour sessions",
        durationPrices: [
          { label: "3 hrs", price: 81 },
          { label: "4 hrs", price: 108 }
        ],
        features: ["Same cleaner where available", "Replacement-cleaner guarantee", "Checklist-led visits", "Cashless payment after confirm"]
      },
      {
        name: "One-Time",
        description: "Ad-hoc home cleaning when you need help without a recurring schedule.",
        price: 30,
        suffix: "/hr",
        capacity: "3 or 4 hour sessions",
        durationPrices: [
          { label: "3 hrs", price: 90 },
          { label: "4 hrs", price: 120 }
        ],
        features: ["Flexible one-off visit", "Cleaner assigned by availability", "WhatsApp confirmation", "Nett rate before add-ons"]
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
    eyebrow: "WhatsApp-first booking",
    title: "Book your home clean",
    emphasis: "then confirm on WhatsApp",
    subtitle: "Submit a residential cleaning request for your Singapore home. We confirm cleaner availability and cashless payment details by WhatsApp before the visit.",
    steps: [
      { label: "Service", description: "Choose hourly or package" },
      { label: "Date & Time", description: "Pick a visit window" },
      { label: "Home Details", description: "HDB, condominium, or landed" },
      { label: "Add-ons", description: "Customize the scope" },
      { label: "WhatsApp", description: "Confirm booking" }
    ],
    services: [
      {
        id: "recurring",
        name: "Residential Cleaning Subscription",
        description: "Weekly, fortnightly, or one-time hourly cleaning for lived-in Singapore homes.",
        price: 25,
        billingLabel: "from /hr",
        badge: "Popular",
        frequencyOptions: ["Weekly", "Fortnightly", "One-time"],
        highlights: ["3 or 4 hour sessions", "Same cleaner every visit where available", "Digital checklist", "Photo completion report"]
      },
      {
        id: "move",
        name: "Move-In / Move-Out Cleaning",
        description: "Package cleaning for handover, keys collection, or a fresh home reset.",
        price: 300,
        billingLabel: "from",
        frequencyOptions: ["One-time package"],
        highlights: ["Size-tier package quote", "Cabinets and fixtures", "Kitchen and bathroom detail", "Final quote on WhatsApp"]
      },
      {
        id: "renovation",
        name: "Post-Renovation Cleaning",
        description: "Detailed residential dust removal after renovation work is complete.",
        price: 380,
        billingLabel: "from",
        frequencyOptions: ["One-time package"],
        highlights: ["Fine dust wipe-down", "Floor and surface reset", "Window ledges and trims", "Photo completion report"]
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
      { title: "WhatsApp confirmation", description: "Cleaner availability and payment details are confirmed after submit." },
      { title: "Replacement guarantee", description: "If an assigned cleaner is unavailable, we arrange a replacement." },
      { title: "Cashless only", description: "PayNow or bank transfer details are shared after confirmation." }
    ]
  }
};
