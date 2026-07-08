export const company = {
  legalName: "AE Management Services Pte Ltd",
  displayName: "AE Management Services",
  tagline: "Simple. Efficient. Professional.",
  phone: "+65 6980 3559",
  email: "hello@ae-mgmt.com",
  uen: "", // [CLIENT TO CONFIRM]
  serviceHours: "Mon-Sun · 8 AM - 6 PM", // [CLIENT TO CONFIRM]
  serviceArea: "Singapore island-wide",
  currencySymbol: "S$",
  whatsappNumber: "6569803559",
  whatsappHref:
    "https://wa.me/6569803559?text=Hi%20AE!%20I%20would%20like%20to%20confirm%20a%20home%20cleaning%20booking.",
  paynow: "[CLIENT TO CONFIRM]",
  paynowUen: "", // [CLIENT TO CONFIRM]
  bankName: "DBS",
  bankAccount: "", // [CLIENT TO CONFIRM]
  billingWhatsapp: "+65 6980 3559",
  siteUrl: "https://ae-mgmt.com",
  rates: {
    minHours: 3,
    durations: [3, 4],
    weekly: 25,
    fortnightly: 27,
    oneTime: 30,
    weekendSurcharge: 10
  },
  packageMatrix: [
    {
      size: "Up to 700 sq ft",
      moveInOut: 300,
      postRenovation: 380
    },
    {
      size: "700-1,000 sq ft",
      moveInOut: 360,
      postRenovation: 420
    },
    {
      size: "1,000-1,300 sq ft",
      moveInOut: 420,
      postRenovation: 450
    },
    {
      size: "Above 1,300 sq ft",
      moveInOut: null,
      postRenovation: null
    }
  ]
} as const;

export function formatMoney(value: number) {
  return `${company.currencySymbol}${value}`;
}

export function formatSignedMoney(value: number) {
  return `+${formatMoney(value)}`;
}

export function formatFromMoney(value: number) {
  return `from ${formatMoney(value)}`;
}

export function getWhatsappHref(message: string) {
  return `https://wa.me/${company.whatsappNumber}?text=${encodeURIComponent(message)}`;
}
