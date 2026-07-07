import { useMemo, useState, type ComponentProps, type FormEvent, type ReactNode } from "react";
import { CalendarCheck, CreditCard, Loader2, MessageCircle, Send, ShieldCheck } from "lucide-react";
import type { BookingAddon, BookingContent, BookingService, ContactContent } from "../lib/site-content";
import { company, getWhatsappHref } from "../lib/company";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Calendar } from "./ui/calendar";
import { Checkbox } from "./ui/checkbox";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "./ui/select";
import { Separator } from "./ui/separator";
import { Textarea } from "./ui/textarea";

type BookingPageProps = {
  booking: BookingContent;
  contact: ContactContent;
};

type BookingStatus = {
  state: "idle" | "submitting" | "success" | "error";
  message: string;
};

const paymentChoices = [
  {
    label: "PayNow / bank transfer",
    value: "paynow-bank-transfer",
    helpText: "Details are shared via WhatsApp after confirmation."
  },
  {
    label: "Discuss on WhatsApp",
    value: "discuss-on-whatsapp",
    helpText: "Use this if scope or access needs a quick chat before confirmation."
  }
];

const assuranceChips = ["WhatsApp confirm", "Cashless payment", "Residential only"];

export function BookingPage({ booking, contact }: BookingPageProps) {
  const firstService = booking.services[0];
  const [serviceId, setServiceId] = useState(firstService.id);
  const selectedService = booking.services.find((service) => service.id === serviceId) ?? firstService;
  const [frequency, setFrequency] = useState(selectedService.frequencyOptions[0]);
  const [homeType, setHomeType] = useState(booking.homeTypes[0]);
  const [duration, setDuration] = useState(booking.durationOptions[0]);
  const [sizeTier, setSizeTier] = useState(booking.sizeOptions[0]);
  const [bedrooms, setBedrooms] = useState(booking.bedroomOptions[2] ?? booking.bedroomOptions[0]);
  const [bathrooms, setBathrooms] = useState(booking.bathroomOptions[0]);
  const [visitDate, setVisitDate] = useState(getDefaultVisitDate());
  const [timeSlot, setTimeSlot] = useState(booking.timeSlots[1] ?? booking.timeSlots[0]);
  const [address, setAddress] = useState("");
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentPreference, setPaymentPreference] = useState(paymentChoices[0].value);
  const [bookingId, setBookingId] = useState("");
  const [status, setStatus] = useState<BookingStatus>({
    state: "idle",
    message: "Review the summary, then create your booking request. No payment is collected on this page."
  });

  const selectedAddons = useMemo(
    () => booking.addons.filter((addon) => selectedAddonIds.includes(addon.id)),
    [booking.addons, selectedAddonIds]
  );
  const selectedDate = parseIsoDateLocal(visitDate);
  const estimate = getEstimate(selectedService, frequency, duration, sizeTier, visitDate, selectedAddons);
  const estimatedTotal = estimate.total;

  function selectService(nextServiceId: string) {
    const nextService = booking.services.find((service) => service.id === nextServiceId) ?? firstService;

    setServiceId(nextService.id);
    setFrequency(nextService.frequencyOptions[0]);
    setStatus({
      state: "idle",
      message: "Service updated. Complete your home details and checkout information."
    });
  }

  function toggleAddon(addon: BookingAddon, checked: boolean) {
    setSelectedAddonIds((current) =>
      checked ? [...new Set([...current, addon.id])] : current.filter((id) => id !== addon.id)
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus({ state: "submitting", message: "Creating your secure booking request..." });

    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId: selectedService.id,
          serviceName: selectedService.name,
          frequency,
          home: { homeType, bedrooms, bathrooms, address },
          schedule: { date: visitDate, time: timeSlot },
          addons: selectedAddons.map((addon) => ({
            id: addon.id,
            name: addon.name,
            price: addon.price
          })),
          customer: {
            name: customerName,
            phone: customerPhone,
            email: customerEmail
          },
          notes,
          paymentPreference,
          estimatedTotal
        })
      });

      if (!response.ok) {
        throw new Error(`Booking request failed: ${response.status}`);
      }

      const result = (await response.json()) as { id?: string };
      const nextBookingId = result.id ?? "Booking";
      setBookingId(nextBookingId);
      setStatus({
        state: "success",
        message: `${nextBookingId} received. Please confirm the request on WhatsApp so AE can check cleaner availability and cashless payment details.`
      });
    } catch {
      setStatus({
        state: "error",
        message: "The booking API did not respond. Your details are still here so you can try again."
      });
    }
  }

  return (
    <main className="bg-paper">
      <section className="bg-cream pt-28 pb-16 lg:pt-32 lg:pb-20" id="booking" aria-labelledby="booking-title">
        <div className="mx-auto w-[min(1200px,calc(100%-48px))]">
          <div className="max-w-3xl">
            <p className="mb-4 text-sm font-semibold tracking-[0.08em] text-navy uppercase">BOOK ONLINE</p>
            <h1 id="booking-title" className="font-display text-h2 leading-[1.05] font-normal text-ink">
              {booking.title} <em className="italic text-navy">{booking.emphasis}.</em>
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-ink/65">{booking.subtitle}</p>
          </div>
          <div className="mt-8 flex flex-wrap gap-3" aria-label="Booking assurances">
            {assuranceChips.map((chip) => (
              <span className="inline-flex h-9 items-center gap-2 rounded-full bg-sky-100 px-4 text-sm font-medium text-navy" key={chip}>
                <span className="size-1.5 rounded-full bg-navy" aria-hidden="true" />
                {chip}
              </span>
            ))}
          </div>
        </div>
      </section>

      <form className="mx-auto grid w-[min(1200px,calc(100%-48px))] gap-6 py-12 lg:grid-cols-[1fr_380px] lg:items-start lg:py-16" onSubmit={handleSubmit}>
        <div className="grid gap-6">
          <BookingCard badge="Step 1" title="Service" description="Choose the service path that fits this home.">
            <RadioGroup className="grid gap-4" onValueChange={selectService} value={serviceId}>
              {booking.services.map((service) => {
                const selected = service.id === serviceId;

                return (
                  <Label
                    className={`grid cursor-pointer gap-4 rounded-[20px] border p-5 transition hover:border-navy/60 sm:grid-cols-[auto_1fr_auto] sm:items-start ${
                      selected ? "border-navy bg-[#F4FAF7]" : "border-line bg-white"
                    }`}
                    key={service.id}
                    htmlFor={`service-${service.id}`}
                  >
                    <RadioGroupItem id={`service-${service.id}`} value={service.id} className="mt-1 border-line text-navy" />
                    <span>
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="font-display text-xl font-normal text-ink">{service.name}</span>
                        {service.badge ? <Badge className="rounded-full bg-sky-100 px-3 text-navy hover:bg-sky-100">{service.badge}</Badge> : null}
                      </span>
                      <span className="mt-2 block text-sm leading-6 text-ink/60">{service.description}</span>
                    </span>
                    <span className="text-left sm:text-right">
                      <span className="block font-display text-2xl font-normal text-navy">{service.id === "recurring" ? `S$${service.price}` : `from S$${service.price}`}</span>
                      <span className="text-xs font-medium text-ink/45">{service.billingLabel}</span>
                    </span>
                  </Label>
                );
              })}
            </RadioGroup>
          </BookingCard>

          <BookingCard badge="Step 2" title="Date & time" description="Pick a visit day and preferred arrival window.">
            <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
              <div className="rounded-[20px] border border-line bg-paper p-3">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    if (date) {
                      setVisitDate(toIsoDateLocal(date));
                    }
                  }}
                  disabled={{ before: new Date() }}
                  className="mx-auto bg-transparent"
                />
              </div>
              <div>
                <p className="mb-3 text-sm font-semibold text-ink/70">Preferred arrival window</p>
                <div className="flex flex-wrap gap-3">
                  {booking.timeSlots.map((slot) => (
                    <button
                      aria-pressed={slot === timeSlot}
                      className={`h-11 rounded-full border px-5 text-sm font-semibold transition ${
                        slot === timeSlot
                          ? "border-navy-900 bg-navy-900 text-white"
                          : "border-line bg-white text-ink hover:border-navy/60"
                      }`}
                      key={slot}
                      onClick={() => setTimeSlot(slot)}
                      type="button"
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </BookingCard>

          <BookingCard badge="Step 3" title="Home details" description="A few basics help us estimate the visit or package tier.">
            <div className="grid gap-4 md:grid-cols-2">
              <SelectField label="Frequency" value={frequency} onValueChange={setFrequency} options={selectedService.frequencyOptions} />
              {selectedService.id === "recurring" ? (
                <SelectField label="Duration" value={duration} onValueChange={setDuration} options={booking.durationOptions} />
              ) : (
                <SelectField label="Home size" value={sizeTier} onValueChange={setSizeTier} options={booking.sizeOptions} />
              )}
              <SelectField label="Home type" value={homeType} onValueChange={setHomeType} options={booking.homeTypes} />
              <SelectField label="Bedrooms" value={bedrooms} onValueChange={setBedrooms} options={booking.bedroomOptions} />
              <SelectField label="Bathrooms" value={bathrooms} onValueChange={setBathrooms} options={booking.bathroomOptions} />
              <div className="md:col-span-2">
                <Label className="text-sm font-semibold text-ink/70" htmlFor="address">Service address</Label>
                <Input
                  autoComplete="street-address"
                  className="mt-2 h-11 rounded-full border-line bg-white px-4 focus-visible:ring-navy/30"
                  id="address"
                  onChange={(event) => setAddress(event.target.value)}
                  placeholder="Block / condo name, street, Singapore"
                  required
                  value={address}
                />
              </div>
            </div>
          </BookingCard>

          <BookingCard badge="Step 4" title="Add-ons" description="Optional extras for a more detailed clean.">
            <div className="grid gap-4 md:grid-cols-2">
              {booking.addons.map((addon) => {
                const checked = selectedAddonIds.includes(addon.id);

                return (
                  <Label
                    className={`grid cursor-pointer grid-cols-[auto_1fr] gap-4 rounded-[20px] border p-5 transition hover:border-navy/60 ${
                      checked ? "border-navy bg-[#F4FAF7]" : "border-line bg-white"
                    }`}
                    htmlFor={`addon-${addon.id}`}
                    key={addon.id}
                  >
                    <Checkbox
                      checked={checked}
                      className="mt-1 border-line data-[state=checked]:border-navy data-[state=checked]:bg-navy"
                      id={`addon-${addon.id}`}
                      onCheckedChange={(value) => toggleAddon(addon, value === true)}
                    />
                    <span>
                      <span className="flex items-start justify-between gap-3">
                        <span className="font-display text-xl font-normal text-ink">{addon.name}</span>
                        <span className="font-semibold text-navy">+S${addon.price}</span>
                      </span>
                      <span className="mt-2 block text-sm leading-6 text-ink/60">{addon.description}</span>
                    </span>
                  </Label>
                );
              })}
            </div>
          </BookingCard>

          <BookingCard badge="Step 5" title="Contact & payment" description="Tell us where to send your confirmation.">
            <div className="grid gap-4 md:grid-cols-2">
              <TextInput label="Full name" id="customer-name" value={customerName} onChange={setCustomerName} autoComplete="name" placeholder="Mia Nguyen" required />
              <TextInput label="Phone" id="customer-phone" value={customerPhone} onChange={setCustomerPhone} autoComplete="tel" placeholder="+65 9000 0000" required type="tel" />
              <TextInput label="Email" id="customer-email" value={customerEmail} onChange={setCustomerEmail} autoComplete="email" placeholder="mia@example.com" required type="email" />
              <div className="md:col-span-2">
                <Label className="text-sm font-semibold text-ink/70" htmlFor="notes">Notes</Label>
                <Textarea
                  className="mt-2 min-h-28 rounded-[20px] border-line bg-white px-4 py-3 focus-visible:ring-navy/30"
                  id="notes"
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Parking, pets, gate code..."
                  value={notes}
                />
              </div>
            </div>

            <div className="mt-6">
              <p className="mb-3 text-sm font-semibold text-ink/70">Payment preference</p>
              <RadioGroup className="grid gap-3" onValueChange={setPaymentPreference} value={paymentPreference}>
                {paymentChoices.map((choice) => {
                  const selected = paymentPreference === choice.value;

                  return (
                    <Label
                      className={`grid cursor-pointer grid-cols-[auto_1fr] gap-4 rounded-[20px] border p-5 transition hover:border-navy/60 ${
                        selected ? "border-navy bg-[#F4FAF7]" : "border-line bg-white"
                      }`}
                      htmlFor={`payment-${choice.value}`}
                      key={choice.value}
                    >
                      <RadioGroupItem id={`payment-${choice.value}`} value={choice.value} className="mt-1 border-line text-navy" />
                      <span>
                        <span className="font-semibold text-ink">{choice.label}</span>
                        <span className="mt-1 block text-sm leading-6 text-ink/60">{choice.helpText}</span>
                      </span>
                    </Label>
                  );
                })}
              </RadioGroup>
            </div>
          </BookingCard>
        </div>

        <aside className="lg:sticky lg:top-24" aria-labelledby="booking-summary-title">
          <div className="rounded-[22px] border border-line bg-white p-6">
            <p className="mb-3 text-sm font-semibold tracking-[0.08em] text-navy uppercase">Checkout</p>
            <h2 id="booking-summary-title" className="font-display text-2xl leading-tight font-normal text-ink">Your booking summary</h2>
            <div className="mt-6 grid gap-4">
              <SummaryRow label="Service" value={selectedService.name} />
              <SummaryRow label="Frequency" value={frequency} />
              <SummaryRow label="Home" value={`${homeType}, ${bedrooms}, ${bathrooms}`} />
              <SummaryRow label={selectedService.id === "recurring" ? "Duration" : "Size"} value={selectedService.id === "recurring" ? duration : sizeTier} />
              <SummaryRow label="Date & time" value={`${formatVisitDate(visitDate)} at ${timeSlot}`} />
              <SummaryRow label="Add-ons" value={selectedAddons.length > 0 ? selectedAddons.map((addon) => addon.name).join(", ") : "None selected"} />
              <SummaryRow label="Payment" value={paymentPreference === "paynow-bank-transfer" ? "PayNow / bank transfer" : "Discuss on WhatsApp"} />
            </div>

            <Separator className="my-6 bg-line" />

            <div className="grid gap-2 text-sm">
              {estimate.lines.map((line) => (
                <SummaryRow key={line.label} label={line.label} value={line.value} />
              ))}
            </div>

            <div className="flex items-end justify-between gap-4">
              <span className="text-sm font-semibold text-ink/55">Est. total</span>
              <strong className="font-display text-[40px] leading-none font-normal text-navy">{estimate.customQuote ? "Custom" : `S$${estimatedTotal}`}</strong>
            </div>
            <p className="mt-2 text-xs leading-5 text-ink/55">{estimate.note}</p>

            <Button className="mt-6 w-full" disabled={status.state === "submitting"} type="submit">
              {status.state === "submitting" ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Send className="size-4" aria-hidden="true" />}
              {status.state === "submitting" ? "Creating..." : "Create Booking"}
            </Button>

            <p
              className={`mt-4 rounded-[18px] border px-4 py-3 text-sm leading-6 ${
                status.state === "success"
                  ? "border-navy/20 bg-sky-100 text-navy"
                  : status.state === "error"
                    ? "border-[#F4C4B3] bg-[#FFF3ED] text-[#8A321D]"
                    : "border-line bg-paper text-ink/60"
              }`}
            >
              {status.message}
            </p>
            {status.state === "success" ? (
              <Button className="mt-3 w-full bg-[#25D366] text-white hover:bg-[#20BD5A]" asChild>
                <a href={getWhatsappHref(`Hi AE! Booking ${bookingId}: ${selectedService.name}, ${formatVisitDate(visitDate)} ${timeSlot}, est. ${estimate.customQuote ? "custom quote" : `S$${estimatedTotal}`}. Please confirm.`)} target="_blank" rel="noreferrer">
                  <MessageCircle className="size-4" aria-hidden="true" />
                  Confirm on WhatsApp
                </a>
              </Button>
            ) : null}

            <div className="mt-6 grid gap-3" aria-label="Booking assurances">
              {booking.assurances.map((assurance, index) => {
                const Icon = index === 0 ? CalendarCheck : index === 1 ? ShieldCheck : CreditCard;

                return (
                  <div className="grid grid-cols-[32px_1fr] gap-3" key={assurance.title}>
                    <span className="grid size-8 place-items-center rounded-full bg-sky-100 text-navy">
                      <Icon className="size-4" aria-hidden="true" />
                    </span>
                    <span>
                      <strong className="block text-sm font-semibold text-ink">{assurance.title}</strong>
                      <span className="block text-xs leading-5 text-ink/55">{assurance.description}</span>
                    </span>
                  </div>
                );
              })}
            </div>

            <a className="mt-6 inline-flex text-sm font-semibold text-navy hover:underline" href={company.whatsappHref} target="_blank" rel="noreferrer">
              WhatsApp for help choosing
            </a>
          </div>
        </aside>
      </form>
    </main>
  );
}

function BookingCard({ badge, title, description, children }: { badge: string; title: string; description: string; children: ReactNode }) {
  return (
    <section className="rounded-[22px] border border-line bg-white p-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-xl leading-tight font-normal text-ink">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-ink/60">{description}</p>
        </div>
        <Badge className="rounded-full bg-sky-100 px-3 text-navy hover:bg-sky-100">{badge}</Badge>
      </div>
      {children}
    </section>
  );
}

function SelectField({ label, value, onValueChange, options }: { label: string; value: string; onValueChange: (value: string) => void; options: string[] }) {
  const id = label.toLowerCase().replace(/\s+/g, "-");

  return (
    <div>
      <Label className="text-sm font-semibold text-ink/70" htmlFor={id}>{label}</Label>
      <Select onValueChange={onValueChange} value={value}>
        <SelectTrigger className="mt-2 h-11 w-full rounded-full border-line bg-white px-4 focus:ring-navy/30" id={id}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="border-line bg-white">
          {options.map((option) => (
            <SelectItem className="focus:bg-sky-100 focus:text-ink" key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function TextInput({
  label,
  id,
  value,
  onChange,
  ...props
}: {
  label: string;
  id: string;
  value: string;
  onChange: (value: string) => void;
} & Omit<ComponentProps<typeof Input>, "onChange" | "value" | "id">) {
  return (
    <div>
      <Label className="text-sm font-semibold text-ink/70" htmlFor={id}>{label}</Label>
      <Input
        className="mt-2 h-11 rounded-full border-line bg-white px-4 focus-visible:ring-navy/30"
        id={id}
        onChange={(event) => onChange(event.target.value)}
        value={value}
        {...props}
      />
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[112px_1fr] gap-3 text-sm">
      <span className="text-ink/50">{label}</span>
      <strong className="text-right font-medium text-ink/80">{value}</strong>
    </div>
  );
}

const toIsoDateLocal = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

function parseIsoDateLocal(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function getDefaultVisitDate() {
  const date = new Date();
  date.setDate(date.getDate() + 2);
  return toIsoDateLocal(date);
}

function formatVisitDate(value: string) {
  if (!value) {
    return "Select date";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(parseIsoDateLocal(value));
}

function getEstimate(
  service: BookingService,
  frequency: string,
  duration: string,
  sizeTier: string,
  visitDate: string,
  addons: BookingAddon[]
) {
  const addonTotal = addons.reduce((total, addon) => total + addon.price, 0);

  if (service.id === "recurring") {
    const rate = frequency === "Fortnightly" ? company.rates.fortnightly : frequency === "One-time" ? company.rates.oneTime : company.rates.weekly;
    const hours = Number.parseInt(duration, 10) || company.rates.minHours;
    const weekend = isWeekend(visitDate);
    const weekendSurcharge = weekend ? company.rates.weekendSurcharge : 0;
    const base = rate * hours;

    return {
      customQuote: false,
      total: base + weekendSurcharge + addonTotal,
      note: weekend ? "Weekend surcharge applied automatically from the selected date." : "Nett estimate before WhatsApp confirmation.",
      lines: [
        { label: "Rate", value: `S$${rate}/hr x ${hours} hrs = S$${base}` },
        { label: "Weekend", value: weekendSurcharge ? `+S$${weekendSurcharge}` : "S$0" },
        { label: "Add-ons", value: addonTotal ? `+S$${addonTotal}` : "S$0" }
      ]
    };
  }

  const row = company.packageMatrix.find((item) => item.size === sizeTier) ?? company.packageMatrix[0];
  const packagePrice = service.id === "move" ? row.moveInOut : row.postRenovation;

  return {
    customQuote: packagePrice === null,
    total: (packagePrice ?? 0) + addonTotal,
    note: "Package prices are from-prices. Final quote is confirmed on WhatsApp.",
    lines: [
      { label: "Package", value: packagePrice === null ? "Custom quote" : `from S$${packagePrice}` },
      { label: "Add-ons", value: addonTotal ? `+S$${addonTotal}` : "S$0" }
    ]
  };
}

function isWeekend(value: string) {
  const day = parseIsoDateLocal(value).getDay();
  return day === 0 || day === 6;
}
