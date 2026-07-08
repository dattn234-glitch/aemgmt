import { CalendarCheck, ChevronDown, Loader2, LogOut, UserRound } from "lucide-react";
import { useState, type FormEvent, type ReactNode } from "react";
import { useCustomerSession } from "../hooks/useCustomerSession";
import { shortBookingRef } from "../lib/booking-ref";
import { bookingStatusView } from "../lib/booking-status";
import { formatMoney } from "../lib/company";
import type { CustomerBooking, CustomerUser } from "../lib/customer-api";
import { customerDisplayName, customerShortName } from "../lib/customer-name";
import { buildInvoicePublicUrl } from "../lib/invoice";
import { formatPhoneDisplay, isValidSgMobile, normalizeSgPhone } from "../lib/phone";
import { cn } from "../lib/utils";
import { BookingStatusTimeline } from "./BookingStatusTimeline";
import { MobileWhatsappField } from "./MobileWhatsappField";
import { Button } from "./ui/button";
import { DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Form } from "./ui/form";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { ScrollArea } from "./ui/scroll-area";

type CustomerAccountDialogProps = {
  mobile?: boolean;
  signedOutHref?: string;
  solid?: boolean;
};

export function CustomerAccountDialog({ mobile = false, signedOutHref, solid = true }: CustomerAccountDialogProps) {
  const session = useCustomerSession();
  const signedIn = Boolean(session.customer);

  if (!signedIn && signedOutHref) {
    return (
      <Button
        asChild
        className={mobile ? "w-full justify-center" : solid ? "h-12 px-5" : "h-12 border-white/25 bg-white/10 px-5 text-white hover:bg-white/15"}
        variant={solid ? "secondary" : "ghostOnDark"}
      >
        <a href={signedOutHref}>
          <UserRound className="size-4" aria-hidden="true" />
          <span>Sign in</span>
        </a>
      </Button>
    );
  }

  return <SignedInMenu mobile={mobile} session={session} solid={solid} />;
}

function SignedInMenu({
  mobile,
  session,
  solid
}: {
  mobile: boolean;
  session: ReturnType<typeof useCustomerSession>;
  solid: boolean;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const customer = session.customer as CustomerUser;
  const triggerClass = mobile ? "w-full justify-center" : solid ? "h-12 px-5" : "h-12 border-white/25 bg-white/10 px-5 text-white hover:bg-white/15";

  function openBookings() {
    setMenuOpen(false);
    window.location.hash = "#signin";
  }

  const identity = (
    <div className="min-w-0">
      <p className="m-0 text-sm font-semibold text-ink [overflow-wrap:anywhere]">{customerDisplayName(customer)}</p>
      <p className="m-0 mt-0.5 text-sm text-ink/60 [overflow-wrap:anywhere]">{customer.email}</p>
      <p className="m-0 mt-0.5 text-sm text-ink/60">{formatPhoneDisplay(customer.phone)}</p>
    </div>
  );

  const actions = (
    <div className="mt-3 grid gap-2">
      <Button className="w-full" onClick={openBookings} type="button">
        <CalendarCheck className="size-4" aria-hidden="true" />
        View my bookings
      </Button>
      <Button className="w-full" onClick={() => { setMenuOpen(false); void session.logout(); }} type="button" variant="secondary">
        <LogOut className="size-4" aria-hidden="true" />
        Sign out
      </Button>
    </div>
  );

  return (
    <>
      {mobile ? (
        <div className="rounded-[20px] border border-line bg-paper p-4">
          {identity}
          {actions}
        </div>
      ) : (
        <Popover open={menuOpen} onOpenChange={setMenuOpen}>
          <PopoverTrigger asChild>
            <Button className={triggerClass} type="button" variant={solid ? "secondary" : "ghostOnDark"}>
              <UserRound className="size-4" aria-hidden="true" />
              <span className="max-w-[130px] truncate">{customerShortName(customer)}</span>
              <ChevronDown className="size-4 opacity-60" aria-hidden="true" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-[min(300px,calc(100vw-24px))] rounded-[20px] border-line p-4">
            {identity}
            {actions}
          </PopoverContent>
        </Popover>
      )}
    </>
  );
}

export function CustomerAccountPanel({
  compact = false,
  embedded = false,
  hideHeader = false,
  session,
  title = "Sign in to continue booking",
  description = ""
}: {
  compact?: boolean;
  embedded?: boolean;
  hideHeader?: boolean;
  session: ReturnType<typeof useCustomerSession>;
  title?: string;
  description?: string;
}) {
  if (session.loading) {
    return (
      <div className="grid min-h-[260px] place-items-center text-ink/60">
        <Loader2 className="size-6 animate-spin" aria-hidden="true" />
      </div>
    );
  }

  if (session.customer) {
    return <SignedInAccount embedded={embedded} hideHeader={hideHeader} session={session} />;
  }

  return (
    <>
      {hideHeader ? null : <AccountPanelHeader compact={compact} description={description} embedded={embedded} title={title} />}
      <AuthForms onLogin={session.login} onSignup={session.signup} />
    </>
  );
}

function SignedInAccount({
  embedded,
  hideHeader = false,
  session
}: {
  embedded: boolean;
  hideHeader?: boolean;
  session: ReturnType<typeof useCustomerSession>;
}) {
  const customer = session.customer as CustomerUser;

  return (
    <>
      {hideHeader ? null : (
        <AccountPanelHeader
          description="Your requests, confirmed visits, and invoices stay linked to this account."
          embedded={embedded}
          compact={false}
          title={`Welcome back, ${customerShortName(customer)}.`}
        />
      )}

      <div className="grid min-w-0 gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="m-0 font-display text-2xl font-medium text-ink">Your bookings</h3>
          <Button disabled={session.bookingsLoading} size="sm" type="button" variant="secondary" onClick={() => void session.refresh()}>
            {session.bookingsLoading ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
            Refresh
          </Button>
        </div>
        {session.bookings.length > 0 ? (
          embedded ? (
            <div className="grid gap-4">
              {session.bookings.map((booking, index) => (
                <CustomerBookingCard booking={booking} index={index} key={booking.id} />
              ))}
            </div>
          ) : (
            <ScrollArea className="max-h-[min(58vh,620px)] pr-3">
              <div className="grid gap-4">
                {session.bookings.map((booking, index) => (
                  <CustomerBookingCard booking={booking} index={index} key={booking.id} />
                ))}
              </div>
            </ScrollArea>
          )
        ) : (
          <div className="rounded-[20px] border border-line bg-white p-5 text-sm leading-6 text-ink/60">
            No bookings yet. Start a booking and it will stay attached to this account.
          </div>
        )}
      </div>
    </>
  );
}

function AccountPanelHeader({
  compact,
  description,
  embedded,
  title
}: {
  compact: boolean;
  description: string;
  embedded: boolean;
  title: string;
}) {
  if (!embedded) {
    return (
      <DialogHeader>
        <p className="text-sm font-semibold tracking-[0.08em] text-primary-ink uppercase">Customer account</p>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>
    );
  }

  return (
    <div>
      {compact ? null : <p className="text-sm font-semibold tracking-[0.08em] text-primary-ink uppercase">Customer account</p>}
      <h2 className={cn("font-display font-medium leading-tight text-ink", compact ? "text-xl" : "mt-2 text-[32px]")}>{title}</h2>
      <p className="mt-2 text-sm leading-6 text-ink/60">{description}</p>
    </div>
  );
}

function AuthForms({
  onLogin,
  onSignup
}: {
  onLogin: ReturnType<typeof useCustomerSession>["login"];
  onSignup: ReturnType<typeof useCustomerSession>["signup"];
}) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [state, setState] = useState<"idle" | "submitting" | "error">("idle");
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("submitting");
    setMessage("");

    try {
      if (mode === "login") {
        await onLogin({ email, password });
      } else {
        if (!isValidSgMobile(phone)) {
          setState("error");
          setMessage("Enter an 8-digit Singapore WhatsApp mobile starting with 8 or 9.");
          return;
        }

        await onSignup({ firstName, lastName, email, phone: normalizeSgPhone(phone), password });
      }
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "Account request failed.");
      return;
    }

    setState("idle");
  }

  const disabled = state === "submitting";

  return (
    <div className="grid gap-5">
      <Form className="grid gap-4 rounded-[22px] border border-line bg-white p-5" noValidate onSubmit={submit}>
        <div className="inline-flex w-fit rounded-full border border-line bg-paper p-1">
          <Button
            className={`h-10 px-5 ${mode === "login" ? "" : "bg-transparent text-ink/60 shadow-none hover:bg-white hover:text-ink"}`}
            onClick={() => setMode("login")}
            type="button"
            variant={mode === "login" ? "default" : "ghost"}
          >
            Sign in
          </Button>
          <Button
            className={`h-10 px-5 ${mode === "signup" ? "" : "bg-transparent text-ink/60 shadow-none hover:bg-white hover:text-ink"}`}
            onClick={() => setMode("signup")}
            type="button"
            variant={mode === "signup" ? "default" : "ghost"}
          >
            Sign up
          </Button>
        </div>

        {mode === "signup" ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <AuthField id="customer-first-name" label="First name" value={firstName} onChange={setFirstName} autoComplete="given-name" />
            <AuthField id="customer-last-name" label="Last name" value={lastName} onChange={setLastName} autoComplete="family-name" />
          </div>
        ) : null}

        <AuthField id="customer-email" label="Email" value={email} onChange={setEmail} autoComplete="email" type="email" />
        {mode === "signup" ? <MobileWhatsappField id="customer-phone" value={phone} onChange={setPhone} /> : null}
        <AuthField id="customer-password" label="Password" value={password} onChange={setPassword} autoComplete={mode === "login" ? "current-password" : "new-password"} type="password" />

        {message ? (
          <p className="m-0 rounded-[18px] border border-destructive-border/40 bg-destructive-soft px-4 py-3 text-sm text-destructive" role="alert">
            {message}
          </p>
        ) : null}

        <Button disabled={disabled} type="submit">
          {disabled ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <UserRound className="size-4" aria-hidden="true" />}
          {mode === "login" ? "Sign in" : "Create account"}
        </Button>
      </Form>

    </div>
  );
}

function AuthField({
  autoComplete,
  id,
  label,
  onChange,
  type = "text",
  value
}: {
  autoComplete?: string;
  id: string;
  label: string;
  onChange: (value: string) => void;
  type?: string;
  value: string;
}) {
  return (
    <div>
      <Label className="text-sm font-semibold text-ink/70" htmlFor={id}>{label}</Label>
      <Input
        autoComplete={autoComplete}
        className="mt-2 h-12 rounded-full border-input bg-white px-4"
        id={id}
        onChange={(event) => onChange(event.target.value)}
        required
        type={type}
        value={value}
      />
    </div>
  );
}

function AccountBenefit({ children }: { children: ReactNode }) {
  return (
    <li className="grid grid-cols-[16px_1fr] gap-3">
      <CalendarCheck className="mt-1 size-4 text-ink/45" aria-hidden="true" />
      <span>{children}</span>
    </li>
  );
}

function CustomerBookingCard({ booking, index }: { booking: CustomerBooking; index?: number }) {
  const addOns = booking.addons.length > 0 ? booking.addons.map((addon) => addon.name).join(", ") : "None";
  const invoiceReady = (booking.paymentStatus === "invoice_unpaid" || booking.paymentStatus === "qr_ready" || booking.paymentStatus === "instructions_pending") && booking.status === "completed";
  const invoiceLink = booking.invoice ? buildInvoicePublicUrl(booking.invoice) : "";
  const totalLabel = booking.invoice ? "Invoice total" : booking.customQuote || booking.estimatedTotal === null ? "Estimate" : "Est. total";
  const totalValue = booking.invoice
    ? formatMoney(booking.invoice.amount)
    : booking.customQuote || booking.estimatedTotal === null
      ? "Custom quote"
      : formatMoney(booking.estimatedTotal);
  const homeDetail = [
    booking.home.homeType,
    booking.home.bedrooms,
    booking.home.bathrooms,
    booking.home.duration ?? booking.home.sizeTier
  ].filter(Boolean).join(" · ");

  const statusView = bookingStatusView(booking.status, booking.paymentStatus);

  return (
    <article className={cn("rounded-[22px] border border-l-4 border-line bg-white p-4 shadow-[0_4px_16px_rgb(9_30_66_/_0.05)] sm:p-5", statusView.accent)}>
      {typeof index === "number" ? (
        <p className="m-0 mb-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-ink/45">Booking {index + 1}</p>
      ) : null}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="m-0 text-base font-semibold text-ink">{booking.serviceName}</p>
          <p className="m-0 mt-1 break-words text-xs text-ink/55">{booking.frequency} · {shortBookingRef(booking.id)}</p>
        </div>
        <span className={cn("inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold leading-5", statusView.badge)}>
          <span className={cn("size-1.5 rounded-full", statusView.dot)} aria-hidden="true" />
          {statusView.label}
        </span>
      </div>
      <div className="mt-3 grid gap-2 rounded-[16px] bg-paper p-3 text-sm text-ink/65">
        <AccountBookingLine label="Visit" value={`${booking.schedule.date} at ${booking.schedule.time}`} />
        <AccountBookingLine label="Home" value={homeDetail} />
        <AccountBookingLine label="Address" value={booking.home.address} />
        <AccountBookingLine label="Add-ons" value={addOns} />
      </div>
      <div className="mt-4">
        <BookingStatusTimeline bookingStatus={booking} compact />
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3">
        <div className="grid gap-0.5">
          <p className="m-0 text-xs font-semibold tracking-[0.08em] text-ink/45 uppercase">{totalLabel}</p>
          <p className="m-0 text-sm font-semibold text-ink">{totalValue}</p>
        </div>
        {booking.invoice && (invoiceReady || booking.paymentStatus === "paid") ? (
          <Button asChild size="sm" variant="secondary">
            <a href={invoiceLink}>
              View invoice
            </a>
          </Button>
        ) : null}
      </div>
    </article>
  );
}

function AccountBookingLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 sm:grid-cols-[70px_1fr]">
      <span className="text-ink/45">{label}</span>
      <strong className="min-w-0 break-words font-medium text-ink/75">{value}</strong>
    </div>
  );
}
