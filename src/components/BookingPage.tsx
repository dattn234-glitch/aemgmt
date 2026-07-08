import { useEffect, useMemo, useState, type ReactNode } from "react";
import { AlertCircle, ArrowLeft, ArrowRight, CalendarDays, Check, CheckCircle2, ChevronLeft, ClipboardList, Home, Info, Loader2, MapPinHouse, Search, Send, Sparkles, TriangleAlert, UserRound } from "lucide-react";
import { BookingStatusTimeline, type BookingStatusResponse } from "./BookingStatusTimeline";
import { CustomerAccountPanel } from "./CustomerAccountDialog";
import { Icon3D, type Icon3DName } from "./Icon3D";
import { WhatsappLogo } from "./WhatsappLogo";
import { useCustomerSession } from "../hooks/useCustomerSession";
import { searchAvailability, type AvailabilityDate, type AvailabilityErrorResponse, type AvailabilitySearchResponse } from "../lib/availability-api";
import { takePreferredBookingService } from "../lib/booking-preferences";
import type { CustomerBooking } from "../lib/customer-api";
import { customerDisplayName, customerShortName } from "../lib/customer-name";
import type { BookingAddon, BookingContent, BookingService, ContactContent } from "../lib/site-content";
import { company, formatFromMoney, formatMoney, formatSignedMoney, getWhatsappHref } from "../lib/company";
import { formatPhoneDisplay, normalizeSgPhone } from "../lib/phone";
import { cn } from "../lib/utils";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Calendar } from "./ui/calendar";
import { Checkbox } from "./ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { ScrollArea } from "./ui/scroll-area";
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

type BookingFieldErrors = Partial<Record<
  "address" | "postalCode",
  string
>>;

type BookingErrorResponse = {
  message?: string;
  errors?: Record<string, string>;
};

const DURATION_DIALOG_PENDING = "__duration_dialog_pending__";

const paymentChoices = [
  {
    label: "PayNow after service",
    value: "paynow-paylah-qr",
    helpText: "AE confirms your visit first. The invoice and PayNow details appear only after the service is completed."
  }
] as const;

const paymentLabels = Object.fromEntries(paymentChoices.map((choice) => [choice.value, choice.label])) as Record<string, string>;
const assuranceChips = ["Admin confirms first", "Pay after service", "AE updates you"];
const wizardSteps = [
  { mobileLabel: "Service", tabletLabel: "Service", desktopLabel: "Service", icon: Sparkles },
  { mobileLabel: "Address & slot", tabletLabel: "Address", desktopLabel: "Address & slot", icon: MapPinHouse },
  { mobileLabel: "Home details", tabletLabel: "Home", desktopLabel: "Home details", icon: Home },
  { mobileLabel: "Your details", tabletLabel: "Contact", desktopLabel: "Your details", icon: UserRound },
  { mobileLabel: "Review", tabletLabel: "Review", desktopLabel: "Review", icon: ClipboardList }
] as const;

type ServiceOption = {
  badge?: string;
  description: string;
  id: string;
  meta: string;
  price: string;
  title: string;
  value: string;
  icon: Icon3DName;
};

type ServiceSection = {
  description: string;
  options: ServiceOption[];
  title: string;
};

export function BookingPage({ booking }: BookingPageProps) {
  const customerSession = useCustomerSession();
  const customer = customerSession.customer;
  const initialService = getInitialBookingService(booking.services);
  const firstService = booking.services[0];
  const [serviceId, setServiceId] = useState(initialService.id);
  const selectedService = booking.services.find((service) => service.id === serviceId) ?? firstService;
  const [frequency, setFrequency] = useState(initialService.frequency);
  const [postalCode, setPostalCode] = useState("");
  const [homeType, setHomeType] = useState(booking.homeTypes[0]);
  const [duration, setDuration] = useState(booking.durationOptions[0]);
  const [sizeTier, setSizeTier] = useState(booking.sizeOptions[0]);
  const [bedrooms, setBedrooms] = useState(booking.bedroomOptions[2] ?? booking.bedroomOptions[0]);
  const [bathrooms, setBathrooms] = useState(booking.bathroomOptions[0]);
  const [visitDate, setVisitDate] = useState(getDefaultVisitDate());
  const [timeSlot, setTimeSlot] = useState(booking.timeSlots[1] ?? booking.timeSlots[0]);
  const [address, setAddress] = useState("");
  const [availabilityUnlocked, setAvailabilityUnlocked] = useState(false);
  const [availabilityStatus, setAvailabilityStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [availabilityResult, setAvailabilityResult] = useState<AvailabilitySearchResponse | null>(null);
  const [availabilityMessage, setAvailabilityMessage] = useState("");
  const [bookingsClosed, setBookingsClosed] = useState(false);
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [durationDialogOpen, setDurationDialogOpen] = useState(false);
  const [durationLocked, setDurationLocked] = useState(initialService.id !== "recurring");
  const paymentPreference = paymentChoices[0].value;
  const [fieldErrors, setFieldErrors] = useState<BookingFieldErrors>({});
  const [currentStep, setCurrentStep] = useState(0);
  const [stepError, setStepError] = useState("");
  const [bookingId, setBookingId] = useState("");
  const [bookingStatus, setBookingStatus] = useState<BookingStatusResponse | null>(null);
  const [accountDialogOpen, setAccountDialogOpen] = useState(false);
  const [status, setStatus] = useState<BookingStatus>({
    state: "idle",
    message: ""
  });

  const selectedAddons = useMemo(
    () => booking.addons.filter((addon) => selectedAddonIds.includes(addon.id)),
    [booking.addons, selectedAddonIds]
  );
  const formattedAddress = formatServiceAddress(postalCode, address);
  const serviceSections = useMemo<ServiceSection[]>(() => {
    const recurring = booking.services.find((service) => service.id === "recurring");
    const move = booking.services.find((service) => service.id === "move");
    const renovation = booking.services.find((service) => service.id === "renovation");

    return [
      {
        title: "Hourly cleaning",
        description: "Choose the visit rhythm that matches your home. Weekly remains the clearest entry plan for busy, lived-in households.",
        options: recurring
          ? ["Weekly", "Fortnightly", "One-time"].map((nextFrequency) =>
              buildServiceOption(recurring, nextFrequency)
            )
          : []
      },
      {
        title: "Packages",
        description: "Move and renovation cleans quoted by home size. AE confirms the final residential scope before payment.",
        options: [move ? buildServiceOption(move, move.frequencyOptions[0]) : null, renovation ? buildServiceOption(renovation, renovation.frequencyOptions[0]) : null].filter(
          (option): option is ServiceOption => option !== null
        )
      }
    ];
  }, [booking.services]);
  const availabilityDates = availabilityResult?.serviceable ? availabilityResult.dates : [];
  const selectedAvailabilityDate = availabilityDates.find((item) => item.date === visitDate) ?? availabilityDates.find((item) => item.available) ?? availabilityDates[0] ?? null;
  const availableSlots = selectedAvailabilityDate?.slots.filter((slot) => slot.available) ?? [];
  const slotWeekLabel = useMemo(() => formatSlotRangeLabel(availabilityDates.map((date) => date.date)), [availabilityDates]);
  const estimate = getEstimate(selectedService, frequency, duration, sizeTier, visitDate, selectedAddons);
  const estimatedTotal = estimate.total;
  const firstError = getFirstFieldError(fieldErrors);
  const lifecycleSettled = bookingStatus?.paymentStatus === "paid";
  const progressPercent = ((currentStep + 1) / wizardSteps.length) * 100;
  const bookingLocked = Boolean(bookingId);
  const activeCustomerBooking = useMemo(
    () => customerSession.bookings.find(isActiveCustomerBooking) ?? null,
    [customerSession.bookings]
  );
  const activeBookingMessage = activeCustomerBooking
    ? `You have an active booking — ${activeCustomerBooking.serviceName} on ${formatVisitDate(activeCustomerBooking.schedule.date)}. AE completes it before a new one can be placed.`
    : "";

  useEffect(() => {
    if (!bookingId || lifecycleSettled) {
      return;
    }

    const controller = new AbortController();

    async function refreshBookingStatus() {
      try {
        const response = await fetch(`/api/bookings/${bookingId}`, { signal: controller.signal });

        if (!response.ok) {
          return;
        }

        const payload = (await response.json()) as BookingStatusResponse;
        setBookingStatus(payload);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
      }
    }

    void refreshBookingStatus();
    const intervalId = window.setInterval(refreshBookingStatus, 5000);

    return () => {
      controller.abort();
      window.clearInterval(intervalId);
    };
  }, [bookingId, lifecycleSettled]);

  useEffect(() => {
    if (customer) {
      setAccountDialogOpen(false);
    }
  }, [customer]);

  function selectServicePath(nextServiceId: string, nextFrequency?: string) {
    const nextService = booking.services.find((service) => service.id === nextServiceId) ?? firstService;
    const needsDurationConfirm = nextService.id === "recurring";

    setServiceId(nextService.id);
    setFrequency(nextFrequency ?? nextService.frequencyOptions[0]);
    setAvailabilityUnlocked(false);
    setAvailabilityStatus("idle");
    setAvailabilityResult(null);
    setAvailabilityMessage("");
    setBookingsClosed(false);
    setFieldErrors({});
    setStepError("");
    setStatus({ state: "idle", message: "" });
    setDurationLocked(!needsDurationConfirm);
    // Duration is confirmed when the user proceeds (validateStep opens the dialog),
    // so selecting a plan no longer interrupts step 1 with a modal.
  }

  async function requestAvailability() {
    const nextErrors: BookingFieldErrors = {};

    if (!/^\d{6}$/.test(postalCode.trim())) {
      nextErrors.postalCode = "Enter the 6-digit Singapore postal code.";
    }

    if (address.trim().length < 8) {
      nextErrors.address = "Enter the service address so AE can confirm access.";
    }

    const nextError = getFirstFieldError(nextErrors);

    if (nextError) {
      setFieldErrors((current) => ({ ...current, ...nextErrors }));
      setStepError(nextError.message);
      focusBookingField(nextError.field);
      return;
    }

    setFieldErrors((current) => {
      const next = { ...current };
      delete next.postalCode;
      delete next.address;
      return next;
    });
    setAvailabilityUnlocked(false);
    setAvailabilityStatus("loading");
    setAvailabilityResult(null);
    setAvailabilityMessage("");
    setBookingsClosed(false);
    setStepError("");

    try {
      const result = await searchAvailability({
        postalCode,
        address,
        serviceId: selectedService.id,
        frequency,
        duration: selectedService.id === "recurring" ? duration : undefined,
        sizeTier: selectedService.id === "recurring" ? undefined : sizeTier
      });

      setAvailabilityResult(result);
      setAvailabilityMessage(result.message);

      if (result.bookingsOpen === false) {
        setAvailabilityStatus("error");
        setBookingsClosed(true);
        return;
      }

      if (!result.serviceable) {
        setAvailabilityStatus("error");
        setStepError(result.message);
        return;
      }

      const nextDate = result.dates.find((date) => date.available) ?? result.dates[0];
      const nextSlot = nextDate?.slots.find((slot) => slot.available);

      if (nextDate) {
        setVisitDate(nextDate.date);
      }

      setTimeSlot(nextSlot?.time ?? "");

      setAvailabilityUnlocked(true);
      setAvailabilityStatus("ready");
    } catch (error) {
      const details = (error as Error & { details?: AvailabilityErrorResponse }).details;
      const mappedErrors: BookingFieldErrors = {
        postalCode: details?.errors?.postalCode,
        address: details?.errors?.address
      };
      const firstAvailabilityError = getFirstFieldError(mappedErrors);
      const message = firstAvailabilityError?.message ?? (error instanceof Error ? error.message : "Availability search failed.");

      setFieldErrors((current) => ({ ...current, ...mappedErrors }));
      setAvailabilityStatus("error");
      setAvailabilityMessage(message);
      setStepError(message);

      if (firstAvailabilityError) {
        focusBookingField(firstAvailabilityError.field);
      }
    }
  }

  function toggleAddon(addon: BookingAddon, checked: boolean) {
    setSelectedAddonIds((current) =>
      checked ? [...new Set([...current, addon.id])] : current.filter((id) => id !== addon.id)
    );
  }

  async function createBookingRequest() {
    if (!customer) {
      setAccountDialogOpen(true);
      setStatus({
        state: "error",
        message: "Sign in or create an account before creating this booking."
      });
      return;
    }

    if (bookingLocked) {
      return;
    }

    if (activeCustomerBooking) {
      setStatus({
        state: "error",
        message: activeBookingMessage
      });
      return;
    }

    const nextFieldErrors = validateBookingFields({
      postalCode,
      address
    });

    const nextError = getFirstFieldError(nextFieldErrors);

    if (nextError) {
      setFieldErrors({ [nextError.field]: nextError.message });
      setStatus({
        state: "error",
        message: nextError.message
      });
      focusBookingField(nextError.field);
      return;
    }

    setFieldErrors({});
    setBookingStatus(null);
    setStatus({ state: "submitting", message: "Creating your secure booking request..." });

    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId: selectedService.id,
          serviceName: selectedService.name,
          frequency,
          home: {
            homeType,
            bedrooms,
            bathrooms,
            address: formattedAddress,
            duration: selectedService.id === "recurring" ? duration : undefined,
            sizeTier: selectedService.id === "recurring" ? undefined : sizeTier
          },
          schedule: { date: visitDate, time: timeSlot },
          addons: selectedAddons.map((addon) => ({
            id: addon.id,
            name: addon.name,
            price: addon.price
          })),
          customer: {
            name: customer?.name ?? "",
            phone: normalizeSgPhone(customer?.phone ?? ""),
            email: customer?.email ?? ""
          },
          notes,
          paymentPreference,
          estimatedTotal: estimate.customQuote ? null : estimatedTotal,
          customQuote: estimate.customQuote
        })
      });

      if (!response.ok) {
        const apiErrors = await readBookingErrors(response);
        if (response.status === 409) {
          const message = apiErrors?.message ?? "That slot was just taken — please pick another.";
          setStatus({ state: "error", message });
          setStepError(message);
          if (!message.includes("active booking")) {
            setCurrentStep(1);
            setAvailabilityUnlocked(false);
            setAvailabilityResult(null);
            setAvailabilityMessage("Find availability again to choose an open slot.");
          }
          return;
        }

        if (apiErrors?.errors) {
          const mappedApiErrors = mapApiErrors(apiErrors.errors);
          const firstApiError = getFirstFieldError(mappedApiErrors);

          if (firstApiError) {
            setFieldErrors({ [firstApiError.field]: firstApiError.message });
            setStatus({ state: "error", message: firstApiError.message });
            focusBookingField(firstApiError.field);
            return;
          }
        }

        throw new Error(`Booking request failed: ${response.status}`);
      }

      const result = (await response.json()) as BookingStatusResponse;
      const nextBookingId = result.id ?? "Booking";
      setBookingId(nextBookingId);
      setBookingStatus(result);
      void customerSession.refresh();
      setFieldErrors({});
      setStatus({
        state: "success",
        message: "Request received. AE is checking your cleaner slot now. No payment is due until the service is completed and the invoice is ready."
      });
    } catch {
      setStatus({
        state: "error",
        message: "We could not create the request yet. Check the marked field and try again."
      });
    }
  }

  function validateStep(step: number) {
    if (step === 0 && selectedService.id === "recurring" && !durationLocked) {
      // The duration dialog itself is the prompt — a red error banner alongside it reads
      // like something went wrong when nothing did.
      setDurationDialogOpen(true);
      return DURATION_DIALOG_PENDING;
    }

    if (step === 1) {
      if (!/^\d{6}$/.test(postalCode.trim())) {
        return "Enter the 6-digit Singapore postal code before continuing.";
      }

      if (address.trim().length < 8) {
        return "Enter the service address before continuing.";
      }

      if (!availabilityUnlocked) {
        return "Find availability before continuing.";
      }

      if (!timeSlot) {
        return "Select a preferred arrival slot before continuing.";
      }

      const chosenSlot = selectedAvailabilityDate?.slots.find((slot) => slot.time === timeSlot);
      if (!chosenSlot?.available) {
        return "That slot is taken on this date — pick an available time or another day.";
      }
    }

    if (step === 3) {
      const nextFieldErrors = validateBookingFields({
        postalCode,
        address
      });
      const nextError = getFirstFieldError(nextFieldErrors);

      if (nextError && nextError.field !== "address") {
        setFieldErrors({ [nextError.field]: nextError.message });
        return nextError.message;
      }
    }

    return "";
  }

  function goToNextStep() {
    const error = validateStep(currentStep);

    if (error === DURATION_DIALOG_PENDING) {
      setStepError("");
      return;
    }

    if (error) {
      setStepError(error);
      return;
    }

    if (currentStep >= 3 && !customer) {
      setStepError("Sign in or create an account to keep this booking attached to you.");
      return;
    }

    setStepError("");
    setCurrentStep((step) => Math.min(step + 1, wizardSteps.length - 1));
  }

  function goToPreviousStep() {
    setStepError("");
    setCurrentStep((step) => Math.max(step - 1, 0));
  }

  return (
    <main className="overflow-x-clip bg-paper">
      <section className="bg-cream pt-24 pb-4 sm:pt-28 sm:pb-4 lg:pt-32 lg:pb-6" id="booking" aria-labelledby="booking-title">
        <div className="mx-auto w-[min(1440px,calc(100%-40px))]">
          <div className="max-w-[920px]">
            <a className="inline-flex items-center gap-2 text-[13px] font-semibold text-ink/60 transition hover:text-primary-ink sm:text-sm" href="#services">
              <ChevronLeft className="size-4" aria-hidden="true" />
              Back to services
            </a>
            <p className="mb-2 text-sm font-semibold tracking-[0.08em] text-primary-ink uppercase">BOOK ONLINE</p>
            <h1 id="booking-title" className="max-w-[760px] font-display text-[clamp(1.9rem,4vw,3.65rem)] leading-[1.02] font-medium text-ink">
              {booking.title}{" "}
              <em className="italic text-primary-ink">
                then AE confirms your slot.
              </em>
            </h1>
            <p className="mt-2.5 max-w-[720px] text-[14px] leading-6 text-ink/65 sm:text-[15px] sm:leading-7 lg:text-[16px]">{booking.subtitle}</p>
          </div>
          <div className="mt-3 flex flex-wrap gap-2" aria-label="Booking assurances">
            {assuranceChips.map((chip) => (
              <span className="inline-flex h-7.5 items-center gap-2 rounded-full border border-line bg-white px-2.5 text-[11px] font-medium text-ink/70 sm:h-8 sm:px-3 sm:text-[12px]" key={chip}>
                <span className="size-1.5 rounded-full bg-primary" aria-hidden="true" />
                {chip}
              </span>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto w-[min(1440px,calc(100%-40px))] min-w-0 py-5 lg:py-7">
        {activeCustomerBooking ? (
          <section className="mb-4 rounded-[22px] border border-gold bg-gold-soft p-4 sm:p-5" role="status">
            <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
              <div className="grid min-w-0 grid-cols-[44px_1fr] gap-3">
                <span className="grid size-11 place-items-center rounded-full bg-white text-gold-text" aria-hidden="true">
                  <TriangleAlert className="size-5" />
                </span>
                <div className="min-w-0">
                  <p className="m-0 text-sm font-semibold tracking-[0.08em] text-gold-text uppercase">Active booking</p>
                  <h2 className="mt-2 break-words font-display text-2xl font-medium text-gold-text">{activeBookingMessage}</h2>
                </div>
              </div>
              <Button type="button" variant="secondary" onClick={() => { window.location.hash = "#signin"; }}>
                <UserRound className="size-4" aria-hidden="true" />
                View my booking
              </Button>
            </div>
          </section>
        ) : null}

        {activeCustomerBooking ? (
          <section className="rounded-[22px] border border-line bg-white p-5 sm:p-6" aria-label="Your booking status">
            <h2 className="m-0 font-display text-2xl font-medium text-ink">Your booking status</h2>
            <p className="m-0 mt-1 text-sm leading-6 text-ink/60">
              Your visit is set. Your cleaner arrives on the visit date — no payment is due until the service is completed, then AE sends the invoice on WhatsApp to pay by PayNow.
            </p>
            <div className="mt-4">
              <BookingStatusTimeline bookingStatus={activeCustomerBooking} />
            </div>
          </section>
        ) : null}

        <div
          className={`grid min-w-0 gap-4 pb-24 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start lg:pb-0 xl:grid-cols-[minmax(0,1fr)_420px] ${activeCustomerBooking ? "hidden" : ""}`}
        >
          <div className="grid min-w-0 gap-4">

          <WizardProgress
            currentStep={currentStep}
            onStepSelect={(stepIndex) => {
              if (stepIndex <= currentStep) {
                setStepError("");
                setCurrentStep(stepIndex);
              }
            }}
            progressPercent={progressPercent}
          />

          {bookingsClosed ? (
            <div className="grid gap-3 rounded-[18px] border border-gold/60 bg-gold-soft px-4 py-4 text-gold-text sm:flex sm:items-center sm:justify-between" role="status">
              <div>
                <p className="m-0 text-sm font-semibold">Online booking opens soon</p>
                <p className="m-0 mt-1 text-sm leading-6 text-gold-text/80">
                  {availabilityMessage || "AE is finalising cleaner schedules. Chat with us on WhatsApp and we will reserve your preferred visit for launch."}
                </p>
              </div>
              <Button asChild className="shrink-0" variant="secondary">
                <a href={getWhatsappHref("Hi AE! I'd like to reserve a cleaning visit when online booking opens.")} rel="noreferrer" target="_blank">
                  <WhatsappLogo className="size-4 text-[#25D366]" />
                  Chat with AE
                </a>
              </Button>
            </div>
          ) : null}

          {!customer && !bookingLocked ? (
            <p className="m-0 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-[16px] border border-line bg-white px-4 py-2.5 text-[13px] text-ink/60">
              <UserRound className="size-3.5 shrink-0 text-primary-ink" aria-hidden="true" />
              You'll need an account at step 4 to keep this booking attached to you.
              <a className="font-semibold text-primary-ink underline-offset-2 hover:underline" href="#signin">Sign in now</a>
            </p>
          ) : null}

          {currentStep === 0 ? (
            <ServiceSelectionStep
              serviceSections={serviceSections}
              selectedValue={`${serviceId}|${frequency}`}
              onValueChange={selectServicePath}
            />
          ) : null}

          {currentStep === 1 ? (
            <AddressAndSlotStep
              address={address}
              addressError={fieldErrors.address}
              availabilityUnlocked={availabilityUnlocked}
              onAddressChange={(value) => {
                setAddress(value);
                clearFieldError("address", setFieldErrors);
                setAvailabilityUnlocked(false);
                setAvailabilityStatus("idle");
                setAvailabilityResult(null);
                setAvailabilityMessage(availabilityUnlocked ? "Address changed — click Find availability again to refresh the slots." : "");
                setBookingsClosed(false);
                setStepError("");
              }}
              onFindAvailability={requestAvailability}
              onPostalCodeChange={(value) => {
                setPostalCode(value);
                clearFieldError("postalCode", setFieldErrors);
                setAvailabilityUnlocked(false);
                setAvailabilityStatus("idle");
                setAvailabilityResult(null);
                setAvailabilityMessage(availabilityUnlocked ? "Postal code changed — click Find availability again to refresh the slots." : "");
                setBookingsClosed(false);
                setStepError("");
              }}
              onSelectDate={(value) => {
                setVisitDate(value);
                const nextDate = availabilityDates.find((date) => date.date === value);
                const nextSlot = nextDate?.slots.find((slot) => slot.available);

                setTimeSlot(nextSlot?.time ?? "");

                setStepError("");
              }}
              onSelectTimeSlot={(value) => {
                setTimeSlot(value);
                setStepError("");
              }}
              postalCode={postalCode}
              postalCodeError={fieldErrors.postalCode}
              selectedDate={visitDate}
              selectedService={selectedService}
              selectedTimeSlot={timeSlot}
              availabilityDates={availabilityDates}
              availabilityLoading={availabilityStatus === "loading"}
              availabilityMessage={availabilityMessage}
              selectedAvailabilityDate={selectedAvailabilityDate}
              slots={availableSlots}
              slotWeekLabel={slotWeekLabel}
              frequency={frequency}
            />
          ) : null}

          {currentStep === 2 ? (
            <BookingCard badge="Step 3" title="Home details and add-ons" description="Confirm the home profile that AE should use for your quote and cleaner brief.">
              <div className="grid gap-4 md:grid-cols-2">
                {selectedService.id === "recurring" ? (
                  <div className="rounded-[20px] border border-line bg-paper px-4 py-4">
                    <p className="m-0 text-sm font-semibold text-ink/70">Cleaning duration</p>
                    <div className="mt-3 flex items-center justify-between gap-4">
                      <div>
                        <p className="m-0 font-display text-2xl font-medium text-ink">{duration}</p>
                        <p className="m-0 mt-1 text-sm leading-6 text-ink/60">Recommended for {bedrooms === "Studio" || bedrooms === "1 bedroom" || bedrooms === "2 bedrooms" ? "up to 2 bedrooms" : "larger homes"}.</p>
                      </div>
                      <Button variant="secondary" type="button" onClick={() => setDurationDialogOpen(true)}>
                        Edit duration
                      </Button>
                    </div>
                  </div>
                ) : (
                  <SelectField label="Home size" value={sizeTier} onValueChange={setSizeTier} options={booking.sizeOptions} />
                )}
                <SelectField label="Home type" value={homeType} onValueChange={setHomeType} options={booking.homeTypes} />
                <SelectField label="Bedrooms" value={bedrooms} onValueChange={setBedrooms} options={booking.bedroomOptions} />
                <SelectField label="Bathrooms" value={bathrooms} onValueChange={setBathrooms} options={booking.bathroomOptions} />
                {selectedService.id !== "recurring" ? null : (
                  <div className="md:col-span-2 rounded-[20px] border border-line bg-white p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="m-0 text-sm font-semibold tracking-[0.08em] text-primary-ink uppercase">Add-ons</p>
                        <h4 className="mt-2 font-display text-2xl font-medium text-ink">Add detail only where needed.</h4>
                      </div>
                      <span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary-ink">
                        Optional
                      </span>
                    </div>
                    <div className="mt-5 grid gap-3">
                      {booking.addons.map((addon) => {
                        const checked = selectedAddonIds.includes(addon.id);

                        return (
                          <Label
                            className={`grid cursor-pointer grid-cols-[auto_1fr] gap-4 rounded-[18px] border p-4 transition hover:border-primary/60 ${
                              checked ? "border-primary bg-primary-soft" : "border-line bg-white"
                            }`}
                            htmlFor={`addon-${addon.id}`}
                            key={addon.id}
                          >
                            <Checkbox
                              checked={checked}
                              className="mt-1 data-[state=checked]:border-primary data-[state=checked]:bg-primary"
                              id={`addon-${addon.id}`}
                              onCheckedChange={(value) => toggleAddon(addon, value === true)}
                            />
                            <span>
                              <span className="flex items-start justify-between gap-3">
                                <span className="font-display text-lg font-medium text-ink">{addon.name}</span>
                                <span className="font-semibold text-ink">{formatSignedMoney(addon.price)}</span>
                              </span>
                              <span className="mt-1 block text-sm leading-6 text-ink/60">{addon.description}</span>
                            </span>
                          </Label>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </BookingCard>
          ) : null}

          {currentStep === 3 ? (
            <BookingCard badge="Step 4" title="Your details" description="Sign in or create your account - your visit, confirmation, and invoice stay linked to it.">
              {customer ? (
                <div className="grid gap-4">
                  <div className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-start gap-3 rounded-[20px] border border-line bg-paper px-4 py-3">
                    <span className="size-2.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
                    <p className="m-0 min-w-0 break-words text-sm font-semibold leading-6 text-ink">
                      Booking as {customerDisplayName(customer)}
                      {customerDisplayName(customer) !== customer.email ? (
                        <span className="block font-medium text-ink/60 [overflow-wrap:anywhere] sm:inline"> · {customer.email}</span>
                      ) : null}
                    </p>
                  </div>
                  <div className="grid gap-3 rounded-[20px] border border-line bg-paper p-5 sm:grid-cols-2">
                    <AccountSummaryRow label="Name" value={customerDisplayName(customer)} />
                    <AccountSummaryRow label="Phone" value={formatPhoneDisplay(customer.phone)} />
                    <AccountSummaryRow label="Email" value={customer.email} wide />
                  </div>
                  <div className="md:col-span-2">
                    <Label className="text-sm font-semibold text-ink/70" htmlFor="notes">Notes</Label>
                    <Textarea className="mt-2 min-h-28 rounded-[20px] border-input bg-white px-4 py-3 focus-visible:ring-primary/30" id="notes" onChange={(event) => setNotes(event.target.value)} placeholder="Parking, pets, gate code..." value={notes} />
                  </div>
                </div>
              ) : (
                <div className="grid gap-4">
                  <div className="flex min-w-0 items-center gap-3 rounded-[20px] border border-line bg-paper px-4 py-3">
                    <span className="size-2.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
                    <p className="m-0 min-w-0 text-sm font-semibold leading-6 text-ink">
                      Booking as guest - sign in or create an account to continue.
                    </p>
                  </div>
                  <CustomerAccountPanel
                    compact
                    embedded
                    session={customerSession}
                    title="Sign in to attach this booking"
                    description="Your visit, confirmation, and invoice stay linked to your account."
                  />
                </div>
              )}
            </BookingCard>
          ) : null}

          {currentStep === 4 ? (
            <BookingCard badge="Step 5" title="Review and create booking" description="AE confirms availability manually. Payment is requested only after the service is completed and the invoice is ready.">
              <div className="grid gap-4 rounded-[20px] border border-line bg-paper p-5">
                <SummaryRow label="Service" value={selectedService.name} />
                <SummaryRow label="Plan" value={frequency} />
                <SummaryRow label={selectedService.id === "recurring" ? "Duration" : "Size"} value={selectedService.id === "recurring" ? duration : sizeTier} />
                <SummaryRow label="Address" value={formattedAddress || "Add address"} />
                <SummaryRow label="Visit" value={`${formatVisitDate(visitDate)} at ${timeSlot}`} />
                <SummaryRow label="Home" value={`${homeType}, ${bedrooms}, ${bathrooms}`} />
                <SummaryRow label="Add-ons" value={selectedAddons.length > 0 ? selectedAddons.map((addon) => addon.name).join(", ") : "None selected"} />
                <SummaryRow label="Payment" value={paymentLabels[paymentPreference] ?? "Cashless after confirmation"} />
              </div>
              {bookingId ? (
                <div className="mt-5">
                  <BookingStatusTimeline bookingStatus={bookingStatus} fallbackBookingId={bookingId} fallbackPaymentMethod={paymentLabels[paymentPreference] ?? "PayNow after service"} />
                </div>
              ) : null}
            </BookingCard>
          ) : null}
        </div>

        <aside className="min-w-0 lg:sticky lg:top-20" aria-labelledby="booking-summary-title">
          <div className="rounded-[22px] border border-line bg-white p-5 xl:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="mb-3 text-sm font-semibold tracking-[0.08em] text-primary-ink uppercase">Checkout</p>
                <h2 id="booking-summary-title" className="font-display text-2xl leading-tight font-medium text-ink">Your booking summary</h2>
              </div>
              <span className="shrink-0 rounded-full bg-paper px-3 py-1 text-xs font-semibold text-ink/60">
                Step {currentStep + 1} of {wizardSteps.length}
              </span>
            </div>
            <div className="mt-6 grid gap-4">
              <SummaryRow label="Service" value={selectedService.name} />
              <SummaryRow label="Plan" value={frequency} />
              <SummaryRow label={selectedService.id === "recurring" ? "Duration" : "Size"} value={selectedService.id === "recurring" ? duration : sizeTier} />
              <SummaryRow label="Address" value={formattedAddress || "Add address"} />
              <SummaryRow label="Visit" value={`${formatVisitDate(visitDate)} at ${timeSlot}`} />
              <SummaryRow label="Home" value={`${homeType}, ${bedrooms}, ${bathrooms}`} />
              <SummaryRow label="Add-ons" value={selectedAddons.length > 0 ? selectedAddons.map((addon) => addon.name).join(", ") : "None selected"} />
              <SummaryRow label="Payment" value={paymentLabels[paymentPreference] ?? "Cashless after confirmation"} />
            </div>

            <Separator className="my-6 bg-line" />

            <div className="grid gap-2 text-sm">
              {estimate.lines.map((line) => (
                <SummaryRow key={line.label} label={line.label} value={line.value} />
              ))}
            </div>

            <div className="flex items-end justify-between gap-4">
              <span className="text-sm font-semibold text-ink/55">Est. total</span>
              <strong className="font-display text-[40px] leading-none font-medium text-primary-ink">{estimate.customQuote ? "Custom" : formatMoney(estimatedTotal)}</strong>
            </div>
            <p className="mt-2 text-xs leading-5 text-ink/55">{estimate.note}</p>

            {stepError || firstError ? (
              <div className="mt-5 rounded-[18px] border border-destructive-border/40 bg-destructive-soft px-4 py-3 text-destructive" role="alert">
                <div className="flex items-start gap-2">
                  <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                  <div>
                    <p className="m-0 text-sm font-semibold">Check this first</p>
                    <p className="m-0 mt-2 text-sm leading-5">{stepError || firstError?.message}</p>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="mt-6 grid gap-3">
              {currentStep > 0 ? (
                <Button className="w-full" variant="secondary" type="button" onClick={goToPreviousStep}>
                  <ArrowLeft className="size-4" aria-hidden="true" />
                  Back
                </Button>
              ) : null}
              {bookingLocked ? (
                <>
                  <Button className="w-full" type="button" onClick={() => void customerSession.refresh()}>
                    <Loader2 className={cn("size-4", customerSession.bookingsLoading ? "animate-spin" : "hidden")} aria-hidden="true" />
                    Refresh status
                  </Button>
                  <Button className="w-full" variant="secondary" type="button" onClick={() => { window.location.hash = "#signin"; }}>
                    View my bookings
                  </Button>
                </>
              ) : currentStep < wizardSteps.length - 1 ? (
                <Button className="w-full" type="button" onClick={goToNextStep}>
                  Proceed
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Button>
              ) : (
                <Button className="w-full" disabled={status.state === "submitting" || Boolean(activeCustomerBooking)} type="button" onClick={() => {
                  if (!customer) {
                    setAccountDialogOpen(true);
                    return;
                  }

                  void createBookingRequest();
                }}>
                  {status.state === "submitting" ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Send className="size-4" aria-hidden="true" />}
                  {status.state === "submitting" ? "Creating..." : "Create booking"}
                </Button>
              )}
              <p className="m-0 text-xs leading-5 text-ink/50">
                {customer ? `Booking as ${customerShortName(customer)}` : "You'll sign in at the Your details step."}
              </p>
            </div>

            {status.state === "submitting" || (status.state === "error" && !firstError) ? (
              <p
                aria-live="polite"
                className={`mt-4 rounded-[18px] border px-4 py-3 text-sm leading-6 ${
                  status.state === "error"
                    ? "border-destructive-border/40 bg-destructive-soft text-destructive"
                    : "border-line bg-paper text-ink/60"
                }`}
              >
                {status.message}
              </p>
            ) : null}

            <BookingHelpCard />

          </div>
        </aside>
        </div>

        {!activeCustomerBooking ? (
          <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 px-4 pb-[max(env(safe-area-inset-bottom),12px)] pt-3 backdrop-blur-md lg:hidden">
            <div className="mx-auto w-[min(640px,100%)]">
              {stepError ? (
                <p className="m-0 mb-2 text-xs font-semibold leading-4 text-destructive" role="alert">{stepError}</p>
              ) : null}
              <div className="flex items-center gap-3">
                {currentStep > 0 && !bookingLocked ? (
                  <Button aria-label="Back" size="icon" type="button" variant="secondary" onClick={goToPreviousStep}>
                    <ArrowLeft className="size-4" aria-hidden="true" />
                  </Button>
                ) : null}
                <div className="min-w-0 flex-1">
                  <p className="m-0 text-[11px] font-semibold uppercase tracking-[0.08em] text-ink/50">Est. total</p>
                  <p className="m-0 font-display text-2xl font-semibold leading-none text-primary-ink">
                    {estimate.customQuote ? "Custom" : formatMoney(estimatedTotal)}
                  </p>
                </div>
                {bookingLocked ? (
                  <Button className="flex-1" type="button" onClick={() => { window.location.hash = "#signin"; }}>
                    View my bookings
                  </Button>
                ) : currentStep < wizardSteps.length - 1 ? (
                  <Button className="flex-1" type="button" onClick={goToNextStep}>
                    Proceed
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </Button>
                ) : (
                  <Button
                    className="flex-1"
                    disabled={status.state === "submitting"}
                    type="button"
                    onClick={() => {
                      if (!customer) {
                        setAccountDialogOpen(true);
                        return;
                      }

                      void createBookingRequest();
                    }}
                  >
                    {status.state === "submitting" ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Send className="size-4" aria-hidden="true" />}
                    {status.state === "submitting" ? "Creating..." : "Create booking"}
                  </Button>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <DurationModal
        duration={duration}
        frequency={frequency}
        open={durationDialogOpen}
        onOpenChange={setDurationDialogOpen}
        onSelectDuration={(value) => setDuration(value)}
        onConfirm={() => {
          setDurationLocked(true);
          setDurationDialogOpen(false);
          setStepError("");
          if (currentStep === 0) {
            setCurrentStep(1);
          }
        }}
        rate={getFrequencyRate(frequency)}
      />
      <Dialog open={accountDialogOpen} onOpenChange={setAccountDialogOpen}>
        <DialogContent className="w-[min(1040px,calc(100%-32px))] max-h-[calc(100svh-32px)] overflow-hidden p-0">
          <ScrollArea className="max-h-[calc(100svh-32px)] p-5 sm:p-6">
            <CustomerAccountPanel
              session={customerSession}
              title="Sign in to continue booking"
              description="Your request stays attached to your WhatsApp mobile account, including confirmed visits and invoices after refresh."
            />
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </main>
  );
}

function BookingCard({ badge, title, description, children }: { badge: string; title: string; description: string; children: ReactNode }) {
  return (
    <section className="min-w-0 rounded-[22px] border border-line bg-white p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-[1.05rem] leading-tight font-medium text-ink sm:text-xl">{title}</h3>
          <p className="mt-1.5 text-sm leading-6 text-ink/60">{description}</p>
        </div>
        <Badge className="rounded-full bg-primary-soft px-2.5 text-[11px] text-ink hover:bg-primary-soft">{badge}</Badge>
      </div>
      {children}
    </section>
  );
}

function ServiceSelectionStep({
  serviceSections,
  selectedValue,
  onValueChange
}: {
  serviceSections: ServiceSection[];
  selectedValue: string;
  onValueChange: (serviceId: string, frequency?: string) => void;
}) {
  return (
    <BookingCard
      badge="Step 1"
      title="Choose frequency and service"
      description="Pick the cleaning pattern first. AE keeps the flow residential-only, then the order rail updates immediately."
    >
      <div className="mb-4 rounded-[20px] border border-line bg-paper p-3.5 text-ink sm:p-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary-soft text-ink">
            <Info className="size-5" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1 basis-64">
            <p className="m-0 text-sm font-semibold">AE brings cleaning supplies and eco options on request.</p>
            <p className="m-0 mt-1 text-sm leading-6 text-ink/60">Choose your plan first, then confirm duration, address, and the arrival slot before payment appears.</p>
          </div>
          <Button asChild className="shrink-0" size="sm" variant="secondary">
            <a href={getWhatsappHref("Hi AE! My home needs a non-standard schedule or access arrangement.")} rel="noreferrer" target="_blank">
              <WhatsappLogo className="size-4 text-[#25D366]" />
              Chat with AE
            </a>
          </Button>
        </div>
      </div>
      <RadioGroup
        className="grid gap-6"
        onValueChange={(value) => {
          const [nextServiceId, nextFrequency] = value.split("|");
          onValueChange(nextServiceId, nextFrequency);
        }}
        value={selectedValue}
      >
        {serviceSections.map((section) => (
          <ServiceOptionSection
            key={section.title}
            description={section.description}
            title={section.title}
          >
            {section.options.map((option) => (
              <ServiceRadioCard
                key={option.value}
                id={option.id}
                value={option.value}
                selected={option.value === selectedValue}
                title={option.title}
                price={option.price}
                description={option.description}
                badge={option.badge}
                meta={option.meta}
                icon={option.icon}
              />
            ))}
          </ServiceOptionSection>
        ))}
      </RadioGroup>
    </BookingCard>
  );
}

function WizardProgress({
  currentStep,
  onStepSelect,
  progressPercent
}: {
  currentStep: number;
  onStepSelect: (stepIndex: number) => void;
  progressPercent: number;
}) {
  return (
    <section className="min-w-0 overflow-hidden rounded-[22px] border border-line bg-white p-3.5 sm:p-4 lg:p-5" aria-label="Booking wizard progress">
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold tracking-[0.08em] text-primary-ink uppercase">Booking progress</p>
          <p className="mt-1 text-sm leading-6 text-ink/60 sm:hidden">Finish each step in order, then review before creating the booking.</p>
          <p className="mt-1 hidden text-sm leading-6 text-ink/60 sm:block">Complete each step in order. You can revisit finished steps without losing your selections.</p>
        </div>
        <span className="shrink-0 text-sm font-semibold text-ink/55">Step {currentStep + 1} of {wizardSteps.length}</span>
      </div>

      <div className="mt-3 h-2 rounded-full bg-paper">
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <ol className="mt-3 flex w-full max-w-full snap-x gap-2.5 overflow-x-auto pb-1 sm:grid sm:grid-cols-5 sm:gap-3 sm:overflow-visible sm:pb-0">
        {wizardSteps.map((step, index) => {
          const Icon = step.icon;
          const done = index < currentStep;
          const current = index === currentStep;
          const clickable = index <= currentStep;

          return (
            <li className="min-w-[120px] snap-start sm:min-w-0" key={step.desktopLabel}>
              <Button
                className={cn(
                  "flex h-auto min-h-[112px] w-full flex-col items-center justify-center gap-2.5 rounded-[18px] border px-3 py-4 text-center whitespace-normal transition disabled:opacity-100",
                  current && "border-primary bg-primary-soft text-primary-ink",
                  done && "border-line bg-white text-primary-ink hover:border-primary/60",
                  !done && !current && "border-line bg-white text-ink/45",
                  clickable ? "cursor-pointer" : "cursor-default"
                )}
                disabled={!clickable}
                onClick={() => onStepSelect(index)}
                type="button"
                variant="secondary"
              >
                <span className={cn(
                  "grid size-10 shrink-0 place-items-center rounded-full border bg-white xl:size-11",
                  done ? "border-primary bg-primary text-white" : current ? "border-primary text-primary-ink" : "border-current/20 text-current"
                )}>
                  {done ? <CheckCircle2 className="size-4" aria-hidden="true" /> : <Icon className="size-4" aria-hidden="true" />}
                </span>
                <span className="grid justify-items-center gap-0.5">
                  <span className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-current/70">
                    {index + 1 < 10 ? `0${index + 1}` : index + 1}
                  </span>
                  <span className="block text-[13px] font-semibold leading-4 text-current sm:hidden">{step.mobileLabel}</span>
                  <span className="hidden text-sm font-semibold leading-5 text-current sm:block xl:hidden">{step.tabletLabel}</span>
                  <span className="hidden text-sm font-semibold leading-5 text-current xl:block">{step.desktopLabel}</span>
                </span>
              </Button>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function ServiceOptionSection({
  title,
  description,
  children
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="grid gap-3">
      <div>
        <h4 className="font-display text-[1.45rem] font-medium text-ink">{title}</h4>
        <p className="mt-1.5 max-w-3xl text-sm leading-6 text-ink/60">{description}</p>
      </div>
      <div className={cn("grid items-stretch gap-3", title === "Hourly cleaning" ? "md:grid-cols-2 xl:grid-cols-3" : "md:grid-cols-2")}>{children}</div>
    </section>
  );
}

function ServiceRadioCard({
  id,
  value,
  selected,
  title,
  price,
  description,
  badge,
  meta,
  icon
}: {
  id: string;
  value: string;
  selected: boolean;
  title: string;
  price: string;
  description: string;
  badge?: string;
  meta: string;
  icon: Icon3DName;
}) {
  return (
    <Label
      className={cn(
        "relative flex h-full min-w-0 cursor-pointer flex-col gap-3 rounded-[20px] border p-4 pr-12 text-left transition hover:border-primary/60 hover:shadow-[0_8px_24px_rgb(22_25_26_/_.06)] sm:p-5 sm:pr-14",
        selected ? "border-primary bg-primary-soft shadow-[0_8px_24px_rgb(22_25_26_/_.04)]" : "border-line bg-white"
      )}
      htmlFor={id}
    >
      <span className="flex min-w-0 items-center gap-2">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-ink">
          <Icon3D name={icon} size={30} tile={false} />
        </span>
        {badge ? <Badge className="min-w-0 rounded-full bg-primary-soft px-2.5 text-[11px] text-primary-ink hover:bg-primary-soft">{badge}</Badge> : null}
      </span>
      <span className="min-w-0 font-display text-2xl leading-tight font-medium text-ink sm:text-[1.75rem]">{title}</span>
      <span className="min-w-0 font-semibold leading-tight text-primary-ink">{price}</span>
      <span className="min-w-0 text-sm leading-6 text-ink/60">{description}</span>
      <span className="min-w-0 text-xs font-medium leading-5 text-ink/60">{meta}</span>
      <span className="absolute top-4 right-4 grid size-6 place-items-center">
        <RadioGroupItem id={id} value={value} className="border-input text-ink" />
      </span>
    </Label>
  );
}

function AddressAndSlotStep({
  address,
  addressError,
  availabilityUnlocked,
  availabilityDates,
  availabilityLoading,
  availabilityMessage,
  onAddressChange,
  onFindAvailability,
  onPostalCodeChange,
  onSelectDate,
  onSelectTimeSlot,
  postalCode,
  postalCodeError,
  selectedDate,
  selectedAvailabilityDate,
  selectedService,
  selectedTimeSlot,
  slots,
  slotWeekLabel,
  frequency
}: {
  address: string;
  addressError?: string;
  availabilityUnlocked: boolean;
  availabilityDates: AvailabilityDate[];
  availabilityLoading: boolean;
  availabilityMessage: string;
  onAddressChange: (value: string) => void;
  onFindAvailability: () => void;
  onPostalCodeChange: (value: string) => void;
  onSelectDate: (value: string) => void;
  onSelectTimeSlot: (value: string) => void;
  postalCode: string;
  postalCodeError?: string;
  selectedDate: string;
  selectedAvailabilityDate: AvailabilityDate | null;
  selectedService: BookingService;
  selectedTimeSlot: string;
  slots: AvailabilityDate["slots"];
  slotWeekLabel: string;
  frequency: string;
}) {
  const selectedRate = getFrequencyRate(frequency);
  const hasLoadedEmpty = availabilityUnlocked && slots.length === 0;
  const disabledCalendarDates = availabilityDates.filter((date) => !date.available).map((date) => parseIsoDateLocal(date.date));
  const selectedCalendarDate = selectedDate ? parseIsoDateLocal(selectedDate) : undefined;

  return (
    <BookingCard
      badge="Step 2"
      title="Address and availability"
      description="Enter the service location first, then unlock the slot board that matches your requested clean."
    >
      <div className="grid gap-6">
        <section className="grid gap-4 rounded-[22px] border border-line bg-white p-5">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-full bg-primary-soft text-ink">
              <MapPinHouse className="size-5" aria-hidden="true" />
            </span>
            <div>
              <p className="m-0 font-display text-2xl font-medium text-ink">Service address</p>
              <p className="m-0 mt-1 text-sm leading-6 text-ink/60">AE uses this to check which cleaner can reach you and when.</p>
            </div>
          </div>
          <div className="grid gap-4 xl:grid-cols-[180px_minmax(0,1fr)_auto] xl:items-end">
            <div>
              <Label className="text-sm font-semibold text-ink/70" htmlFor="postal-code">Postal code</Label>
              <Input
                aria-describedby={postalCodeError ? "postal-code-error" : undefined}
                aria-invalid={Boolean(postalCodeError)}
                autoComplete="postal-code"
                className={cn(
                  "mt-2 h-11 rounded-full bg-white px-4 focus-visible:ring-primary/30",
                  postalCodeError ? "border-destructive-border bg-destructive-soft focus-visible:ring-destructive-border/30" : "border-input"
                )}
                id="postal-code"
                inputMode="numeric"
                maxLength={6}
                onChange={(event) => onPostalCodeChange(event.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="048618"
                value={postalCode}
              />
              <FieldError id="postal-code-error" message={postalCodeError} />
            </div>
            <div>
              <Label className="text-sm font-semibold text-ink/70" htmlFor="address">Full address</Label>
              <Input
                aria-describedby={addressError ? "address-error" : undefined}
                aria-invalid={Boolean(addressError)}
                autoComplete="street-address"
                className={cn(
                  "mt-2 h-11 rounded-full bg-white px-4 focus-visible:ring-primary/30",
                  addressError ? "border-destructive-border bg-destructive-soft focus-visible:ring-destructive-border/30" : "border-input"
                )}
                id="address"
                onChange={(event) => onAddressChange(event.target.value)}
                placeholder="Block / condo name, street"
                value={address}
              />
              <FieldError id="address-error" message={addressError} />
            </div>
            <Button className="w-full sm:w-auto xl:mb-[1px]" disabled={availabilityLoading} type="button" onClick={onFindAvailability}>
              {availabilityLoading ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Search className="size-4" aria-hidden="true" />}
              {availabilityLoading ? "Checking..." : "Find availability"}
            </Button>
          </div>
        </section>

        {availabilityLoading ? (
          <AvailabilitySkeleton />
        ) : availabilityUnlocked ? (
          <section className="grid gap-5 rounded-[22px] border border-line bg-paper p-5">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-full bg-white text-ink">
                <CalendarDays className="size-5" aria-hidden="true" />
              </span>
              <div>
                <p className="m-0 font-display text-2xl font-medium text-ink">Select slot</p>
                <p className="m-0 mt-1 text-sm leading-6 text-ink/60">Choose the visit window that works for your home schedule.</p>
              </div>
            </div>
            {availabilityMessage ? (
              <div className="rounded-[18px] border border-line bg-white px-4 py-3 text-sm leading-6 text-ink/65">
                {availabilityMessage}
              </div>
            ) : null}

            <div className="grid gap-3 rounded-[20px] border border-line bg-white p-3">
              <div className="rounded-[16px] border border-line bg-paper px-4 py-3 text-center">
                <strong className="text-sm font-semibold text-ink">{slotWeekLabel}</strong>
              </div>

              <div className="grid justify-items-center gap-3 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-start sm:justify-items-start">
                <Calendar
                  mode="single"
                  selected={selectedCalendarDate}
                  disabled={disabledCalendarDates}
                  onSelect={(date) => {
                    if (date) {
                      onSelectDate(toIsoDateLocal(date));
                    }
                  }}
                  className="rounded-[18px] border border-line bg-white"
                  classNames={{
                    day_button: "rounded-full data-[selected-single=true]:bg-primary data-[selected-single=true]:text-white",
                    disabled: "text-ink/30 opacity-45 line-through"
                  }}
                />
                {selectedAvailabilityDate ? (
                  <div className="w-full rounded-[18px] border border-line bg-paper px-4 py-4 sm:max-w-xs">
                    <span className="block text-xs font-semibold uppercase tracking-[0.08em] text-ink/45">{formatSlotDayMeta(selectedAvailabilityDate.date)}</span>
                    <span className="mt-2 block font-display text-xl font-medium text-ink">{formatSlotDayTitle(selectedAvailabilityDate.date)}</span>
                    <span className="mt-2 block text-sm leading-6 text-ink/60">
                      {selectedAvailabilityDate.surcharge > 0 ? `Weekend surcharge ${formatSignedMoney(selectedAvailabilityDate.surcharge)}` : "Weekday rate"}
                    </span>
                    <span className="mt-2 block text-xs leading-5 text-ink/45">Crossed-out dates are fully booked or unavailable.</span>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
              {slots.map((slot) => {
                const weekendSurcharge = selectedAvailabilityDate?.surcharge ?? 0;
                const slotPrice = selectedService.id === "recurring"
                  ? `${formatMoney(slot.rate || selectedRate)}/hr`
                  : slot.total
                    ? formatFromMoney(slot.total)
                    : getServicePathPrice(selectedService, frequency);
                return (
                  <Button
                    aria-pressed={slot.time === selectedTimeSlot}
                    className={cn(
                      "[display:block] h-auto min-w-0 rounded-[20px] border bg-white p-4 text-left whitespace-normal transition",
                      slot.time === selectedTimeSlot ? "border-primary bg-primary-soft shadow-[0_10px_28px_rgb(22_25_26_/_.05)]" : "border-line hover:border-primary/60",
                      !slot.available && "cursor-not-allowed opacity-50"
                    )}
                    disabled={!slot.available}
                    key={`${selectedAvailabilityDate?.date ?? "date"}-${slot.time}`}
                    onClick={() => onSelectTimeSlot(slot.time)}
                    type="button"
                    variant="secondary"
                  >
                    <span className="flex min-w-0 flex-wrap items-start justify-between gap-x-4 gap-y-2">
                      <span className="min-w-0">
                        <span className="block whitespace-nowrap font-display text-[clamp(1.45rem,3vw,2rem)] leading-tight font-medium text-ink">{slot.time}</span>
                        <span className="mt-1 block text-[11px] font-semibold tracking-[0.08em] text-ink/45 uppercase">Arrival window</span>
                      </span>
                      <span className="text-left sm:text-right">
                        <span className="block whitespace-nowrap font-display text-xl leading-tight font-medium text-primary-ink">{slotPrice}</span>
                        {weekendSurcharge > 0 ? (
                          <span className="mt-2 inline-flex rounded-full border border-line bg-white/80 px-2.5 py-1 text-[11px] font-semibold text-ink/60">
                            Weekend {formatSignedMoney(weekendSurcharge)} included
                          </span>
                        ) : null}
                      </span>
                    </span>
                    {!slot.available ? (
                      <span className="mt-3 block text-sm leading-6 text-ink/50">Taken or unavailable.</span>
                    ) : null}
                  </Button>
                );
              })}
            </div>
            {hasLoadedEmpty ? (
              <div className="rounded-[18px] border border-line bg-white px-4 py-3 text-sm leading-6 text-ink/65">
                No online slots are visible for this search. Chat with AE and we will check availability for you.
              </div>
            ) : null}
          </section>
        ) : (
          <section className="rounded-[22px] border border-dashed border-line bg-paper p-5">
            <div className="flex items-start gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-white text-ink">
                <Search className="size-5" aria-hidden="true" />
              </span>
              <div>
                <p className="m-0 font-display text-2xl font-medium text-ink">Unlock the slot board</p>
                <p className="m-0 mt-2 max-w-2xl text-sm leading-6 text-ink/60">
                  Enter the 6-digit postal code and full residential address above, then click{" "}
                  <strong className="font-semibold text-ink">Find availability</strong>. AE uses that address to load the date rail and arrival windows for this booking.
                </p>
                {availabilityMessage ? (
                  <p className="m-0 mt-3 rounded-[14px] border border-gold/50 bg-gold-soft px-3 py-2 text-sm leading-5 text-gold-text">{availabilityMessage}</p>
                ) : null}
              </div>
            </div>
          </section>
        )}
      </div>
    </BookingCard>
  );
}

function AvailabilitySkeleton() {
  return (
    <section className="grid gap-5 rounded-[22px] border border-line bg-paper p-5" aria-live="polite" aria-busy="true">
      <div className="flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-full bg-white text-ink">
          <Loader2 className="size-5 animate-spin" aria-hidden="true" />
        </span>
        <div>
          <p className="m-0 font-display text-2xl font-medium text-ink">Checking availability</p>
          <p className="m-0 mt-1 text-sm leading-6 text-ink/60">Loading available dates and arrival windows for this address.</p>
        </div>
      </div>
      <div className="grid gap-3 rounded-[20px] border border-line bg-white p-3">
        <div className="h-16 animate-pulse rounded-[16px] bg-primary-soft" />
        <div className="grid gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div className="h-32 animate-pulse rounded-[18px] bg-primary-soft" key={index} />
          ))}
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 5 }).map((_, index) => (
          <div className="h-40 animate-pulse rounded-[20px] border border-line bg-white" key={index} />
        ))}
      </div>
    </section>
  );
}

function BookingHelpCard() {
  return (
    <div className="mt-5 rounded-[20px] border border-line bg-paper p-4">
      <p className="m-0 text-sm font-semibold text-ink">Need help?</p>
      <p className="m-0 mt-1 text-sm leading-6 text-ink/60">Chat with AE before submitting your booking.</p>
      <Button asChild className="mt-3 w-full border-line bg-white text-ink hover:border-ink/25 hover:bg-white" variant="secondary">
        <a href={getWhatsappHref("Hi AE, I need help with my booking wizard.")} target="_blank" rel="noreferrer">
          <WhatsappLogo className="size-5 text-[#25D366]" />
          Chat with AE on WhatsApp
        </a>
      </Button>
    </div>
  );
}

function DurationModal({
  duration,
  frequency,
  open,
  onOpenChange,
  onSelectDuration,
  onConfirm,
  rate
}: {
  duration: string;
  frequency: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectDuration: (value: string) => void;
  onConfirm: () => void;
  rate: number;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(760px,calc(100%-32px))]">
        <DialogHeader>
          <p className="text-sm font-semibold tracking-[0.08em] text-primary-ink uppercase">Cleaning duration</p>
          <DialogTitle>Lock the visit length before you continue.</DialogTitle>
          <DialogDescription>
            AE recommends at least {company.rates.minHours} hours for up to 2 bedrooms, and 4 hours for larger homes. You can still change this before submitting.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          {company.rates.durations.slice().reverse().map((hours) => {
            const value = `${hours} hrs`;
            const selected = duration === value;

            return (
              <Button
                className={cn(
                  "[display:grid] h-auto items-center gap-3 rounded-[20px] border px-5 py-5 text-left whitespace-normal transition sm:grid-cols-[1fr_auto_auto]",
                  selected ? "border-primary bg-primary-soft" : "border-line bg-white hover:border-primary/60"
                )}
                key={value}
                onClick={() => onSelectDuration(value)}
                type="button"
                variant="secondary"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-display text-[32px] font-medium text-ink">{hours} hours</span>
                    {hours === 4 ? <Badge className="rounded-full bg-primary-soft px-3 text-ink hover:bg-primary-soft">Value for money</Badge> : null}
                  </div>
                  <p className="m-0 mt-2 text-sm leading-6 text-ink/60">
                    {frequency} home cleaning at {formatMoney(rate)}/hr. Estimated visit total {formatMoney(rate * hours)} before any weekend or add-on adjustments.
                  </p>
                </div>
                <span className="font-display text-2xl font-medium text-ink">{formatMoney(rate)}/hr</span>
                <span className={cn("grid size-6 place-items-center rounded-full border", selected ? "border-primary bg-primary text-white" : "border-input bg-white text-transparent")}>
                  <Check className="size-4" aria-hidden="true" />
                </span>
              </Button>
            );
          })}
        </div>
        <Button className="w-full" type="button" onClick={onConfirm}>
          Proceed
          <ArrowRight className="size-4" aria-hidden="true" />
        </Button>
      </DialogContent>
    </Dialog>
  );
}

function buildServiceOption(service: BookingService, frequency: string): ServiceOption {
  return {
    id: `service-${service.id}-${frequency}`,
    value: `${service.id}|${frequency}`,
    title: service.id === "recurring" ? frequency : service.name,
    price: getServicePathPrice(service, frequency),
    description: getServicePathDescription(service, frequency),
    badge: frequency === "Weekly" ? "Most popular" : undefined,
    meta: getServicePathMeta(service, frequency),
    icon: getServicePathIcon(service, frequency)
  };
}

function getServicePathIcon(service: BookingService, frequency: string): Icon3DName {
  if (service.id === "move") {
    return "key";
  }

  if (service.id === "renovation") {
    return "sparkles";
  }

  if (frequency === "Fortnightly") {
    return "calendar";
  }

  if (frequency === "One-time") {
    return "bucket";
  }

  return "broom";
}

function getServicePathPrice(service: BookingService, frequency: string) {
  if (service.id !== "recurring") {
    return formatFromMoney(service.price);
  }

  const rate = frequency === "Fortnightly" ? company.rates.fortnightly : frequency === "One-time" ? company.rates.oneTime : company.rates.weekly;
  return `from ${formatMoney(rate)}/hr`;
}

function getServicePathDescription(service: BookingService, frequency: string) {
  if (service.id !== "recurring") {
    return service.description;
  }

  if (frequency === "Weekly") {
    return "Same cleaner every week for busy, lived-in homes.";
  }

  if (frequency === "Fortnightly") {
    return "A reliable reset every two weeks.";
  }

  return "One-off deep help, no commitment.";
}

function getServicePathMeta(service: BookingService, frequency: string) {
  if (service.id !== "recurring") {
    return service.id === "move" ? "Quoted by home size" : "Dust-reset package";
  }

  const rate = frequency === "Fortnightly" ? company.rates.fortnightly : frequency === "One-time" ? company.rates.oneTime : company.rates.weekly;
  return `3 hrs ${formatMoney(rate * 3)} - 4 hrs ${formatMoney(rate * 4)}`;
}

function getInitialBookingService(services: BookingService[]) {
  const preferred = takePreferredBookingService(services.map((service) => service.id));
  const service = services.find((nextService) => nextService.id === preferred?.serviceId) ?? services[0];
  const frequency = preferred?.frequency && service.frequencyOptions.includes(preferred.frequency)
    ? preferred.frequency
    : service.frequencyOptions[0];

  return { ...service, frequency };
}

function SelectField({ label, value, onValueChange, options }: { label: string; value: string; onValueChange: (value: string) => void; options: string[] }) {
  const id = label.toLowerCase().replace(/\s+/g, "-");

  return (
    <div>
      <Label className="text-sm font-semibold text-ink/70" htmlFor={id}>{label}</Label>
      <Select onValueChange={onValueChange} value={value}>
        <SelectTrigger className="mt-2 h-11 w-full rounded-full border-input bg-white px-4 focus:ring-primary/30" id={id}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="border-input bg-white">
          {options.map((option) => (
            <SelectItem className="focus:bg-primary-soft focus:text-ink" key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}



function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="mt-2 text-sm font-medium text-destructive" id={id}>{message}</p>;
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid min-w-0 gap-1 text-sm sm:grid-cols-[112px_minmax(0,1fr)] sm:gap-3">
      <span className="text-ink/50">{label}</span>
      <strong className="min-w-0 break-words font-medium text-ink/80 sm:text-right">{value}</strong>
    </div>
  );
}

function AccountSummaryRow({ label, value, wide = false }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className={cn("min-w-0 rounded-[18px] border border-line bg-white px-4 py-3", wide && "sm:col-span-2")}>
      <span className="block text-xs font-semibold tracking-[0.08em] text-ink/45 uppercase">{label}</span>
      <strong className="mt-1 block [overflow-wrap:anywhere] text-sm leading-5 font-semibold text-ink">{value}</strong>
    </div>
  );
}

function validateBookingFields({
  postalCode,
  address
}: {
  postalCode: string;
  address: string;
}) {
  const errors: BookingFieldErrors = {};

  if (!/^\d{6}$/.test(postalCode.trim())) {
    errors.postalCode = "Enter the 6-digit Singapore postal code.";
  }

  if (address.trim().length < 8) {
    errors.address = "Enter the Singapore service address.";
  }

  return errors;
}



const bookingFieldOrder = ["postalCode", "address"] as const;
const bookingFieldFocusIds: Record<keyof BookingFieldErrors, string> = {
  address: "address",
  postalCode: "postal-code"
};

function getFirstFieldError(errors: BookingFieldErrors) {
  for (const field of bookingFieldOrder) {
    const message = errors[field];

    if (message) {
      return { field, message };
    }
  }

  return null;
}

function focusBookingField(field: keyof BookingFieldErrors) {
  window.requestAnimationFrame(() => {
    document.getElementById(bookingFieldFocusIds[field])?.focus();
  });
}

function clearFieldError(
  field: keyof BookingFieldErrors,
  updateErrors: (value: (current: BookingFieldErrors) => BookingFieldErrors) => void
) {
  updateErrors((current) => {
    if (!current[field]) {
      return current;
    }

    const next = { ...current };
    delete next[field];
    return next;
  });
}

function isActiveCustomerBooking(booking: CustomerBooking) {
  return booking.status !== "cancelled" && booking.paymentStatus !== "paid";
}

async function readBookingErrors(response: Response) {
  const payload = (await response.json().catch(() => null)) as BookingErrorResponse | null;
  return payload ? { message: payload.message, errors: payload.errors } : null;
}

function mapApiErrors(errors: Record<string, string>) {
  const fieldMap: Record<string, keyof BookingFieldErrors> = {
    "home.address": "address"
  };
  const mapped: BookingFieldErrors = {};

  Object.entries(errors).forEach(([key, message]) => {
    const field = fieldMap[key];

    if (field) {
      mapped[field] = message;
    }
  });

  return mapped;
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

function formatServiceAddress(postalCode: string, address: string) {
  const trimmedPostalCode = postalCode.trim();
  const trimmedAddress = address.trim();

  if (!trimmedPostalCode && !trimmedAddress) {
    return "";
  }

  if (!trimmedPostalCode) {
    return trimmedAddress;
  }

  if (!trimmedAddress) {
    return `${trimmedPostalCode}, Singapore`;
  }

  return `${trimmedAddress}, Singapore ${trimmedPostalCode}`;
}



function formatSlotRangeLabel(slotDates: string[]) {
  if (slotDates.length === 0) {
    return "";
  }

  const first = parseIsoDateLocal(slotDates[0]);
  const last = parseIsoDateLocal(slotDates[slotDates.length - 1]);
  const sameMonth = first.getMonth() === last.getMonth();
  const monthFormatter = new Intl.DateTimeFormat("en-US", { month: "short" });
  const firstMonth = monthFormatter.format(first);
  const lastMonth = monthFormatter.format(last);
  const firstDay = first.getDate();
  const lastDay = last.getDate();
  const year = last.getFullYear();

  return sameMonth
    ? `${firstMonth} ${firstDay} - ${lastDay}, ${year}`
    : `${firstMonth} ${firstDay} - ${lastMonth} ${lastDay}, ${year}`;
}

function formatSlotDayMeta(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short"
  }).format(parseIsoDateLocal(value));
}

function formatSlotDayTitle(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "short"
  }).format(parseIsoDateLocal(value));
}

function getFrequencyRate(frequency: string) {
  if (frequency === "Fortnightly") {
    return company.rates.fortnightly;
  }

  if (frequency === "One-time") {
    return company.rates.oneTime;
  }

  return company.rates.weekly;
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
      note: weekend ? "Weekend surcharge applied automatically from the selected date." : "Nett estimate before AE confirmation.",
      lines: [
        { label: "Rate", value: `${formatMoney(rate)}/hr x ${hours} hrs = ${formatMoney(base)}` },
        { label: "Weekend", value: weekendSurcharge ? formatSignedMoney(weekendSurcharge) : formatMoney(0) },
        { label: "Add-ons", value: addonTotal ? formatSignedMoney(addonTotal) : formatMoney(0) }
      ]
    };
  }

  const row = company.packageMatrix.find((item) => item.size === sizeTier) ?? company.packageMatrix[0];
  const packagePrice = service.id === "move" ? row.moveInOut : row.postRenovation;

  return {
    customQuote: packagePrice === null,
    total: (packagePrice ?? 0) + addonTotal,
    note: "Package prices are from-prices. Final quote is confirmed by AE.",
    lines: [
      { label: "Package", value: packagePrice === null ? "Custom quote" : formatFromMoney(packagePrice) },
      { label: "Add-ons", value: addonTotal ? formatSignedMoney(addonTotal) : formatMoney(0) }
    ]
  };
}

function isWeekend(value: string) {
  const day = parseIsoDateLocal(value).getDay();
  return day === 0 || day === 6;
}
