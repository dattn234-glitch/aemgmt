import { useEffect, useState } from "react";
import { CalendarCheck, Check, CheckCircle2, Clock3, Copy, Loader2, LogOut, MessageCircle, ReceiptText, RefreshCcw, ShieldCheck } from "lucide-react";
import { shortBookingRef } from "../../lib/booking-ref";
import { bookingStatusView } from "../../lib/booking-status";
import { formatMoney } from "../../lib/company";
import { forgetAdminSession, getCurrentAuth } from "../../lib/customer-api";
import { buildInvoiceMessage, buildInvoiceWhatsappHref } from "../../lib/invoice";
import { formatPhoneDisplay } from "../../lib/phone";
import type { InvoiceSummary } from "../InvoiceView";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion";
import { Button } from "../ui/button";
import { Calendar } from "../ui/calendar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Separator } from "../ui/separator";

type AdminSession = {
  username: string;
  displayName: string;
};

type AdminBooking = {
  id: string;
  status: string;
  serviceName: string;
  frequency: string;
  home: {
    homeType: string;
    bedrooms: string;
    bathrooms: string;
    address: string;
    duration: string | null;
    sizeTier: string | null;
  };
  schedule: {
    date: string;
    time: string;
  };
  addons: {
    id: string;
    name: string;
    price: number;
  }[];
  customer: {
    name: string;
    phone: string;
    email: string;
  };
  customerUser: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    bookingCount: number;
  } | null;
  notes: string;
  paymentMethod: string;
  paymentStatus: string;
  estimatedTotal: number | null;
  customQuote: boolean;
  createdAt: string;
  confirmedAt: string | null;
  autoCompleted: boolean;
  dueCompletion?: boolean;
  invoice: InvoiceSummary | null;
};

type AdminBookingsResponse = {
  bookings: AdminBooking[];
};

type BlockedDate = {
  id: string;
  date: string;
  reason: string;
  createdAt: string;
};

type BlockedDatesResponse = {
  blockedDates: BlockedDate[];
};

export function AdminPage() {
  const [session, setSession] = useState<AdminSession | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [loading, setLoading] = useState(false);
  const [confirmingId, setConfirmingId] = useState("");
  const [completingId, setCompletingId] = useState("");
  const [markingPaidId, setMarkingPaidId] = useState("");
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [blockedDate, setBlockedDate] = useState("");
  const [blockedReason, setBlockedReason] = useState("");
  const [blockingDate, setBlockingDate] = useState(false);
  const [removingBlockedDateId, setRemovingBlockedDateId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const pendingCount = bookings.filter((booking) => booking.status === "received").length;
  const completedUnpaidCount = bookings.filter((booking) => booking.paymentStatus === "invoice_unpaid").length;
  const paidCount = bookings.filter((booking) => booking.paymentStatus === "paid").length;

  useEffect(() => {
    let active = true;

    async function restoreAdminSession() {
      try {
        const payload = await getCurrentAuth();

        if (payload.role !== "admin") {
          forgetAdminSession();
          return;
        }

        if (active) {
          setSession({ username: "admin@interisland.com", displayName: payload.name ?? "AE Admin" });
        }
      } finally {
        if (active) {
          setCheckingSession(false);
        }
      }
    }

    void restoreAdminSession();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!session) {
      return;
    }

    void loadBookings();
    void loadBlockedDates();
  }, [session]);

  async function loadBookings() {
    if (!session) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/bookings", {
        credentials: "include"
      });

      if (response.status === 401) {
        forgetAdminSession();
        setSession(null);
        throw new Error("Admin session expired.");
      }

      if (!response.ok) {
        throw new Error("Could not load bookings.");
      }

      const payload = (await response.json()) as AdminBookingsResponse;
      setBookings(payload.bookings);
    } catch {
      setError("Could not load admin bookings. Check the API and PostgreSQL connection.");
    } finally {
      setLoading(false);
    }
  }

  async function loadBlockedDates() {
    if (!session) {
      return;
    }

    try {
      const response = await fetch("/api/admin/blocked-dates", {
        credentials: "include"
      });

      if (!response.ok) {
        throw new Error("Could not load blocked dates.");
      }

      const payload = (await response.json()) as BlockedDatesResponse;
      setBlockedDates(payload.blockedDates);
    } catch {
      setError("Could not load blocked dates. Check the API and PostgreSQL connection.");
    }
  }

  async function addBlockedDate() {
    if (!session || !blockedDate) {
      return;
    }

    setBlockingDate(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/admin/blocked-dates", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: blockedDate, reason: blockedReason })
      });

      if (!response.ok) {
        throw new Error("Could not add blocked date.");
      }

      const nextBlockedDate = (await response.json()) as BlockedDate;
      setBlockedDates((current) => [...current.filter((item) => item.date !== nextBlockedDate.date), nextBlockedDate].sort((a, b) => a.date.localeCompare(b.date)));
      setBlockedDate("");
      setBlockedReason("");
      setMessage(`${formatVisitDate(nextBlockedDate.date)} blocked for online booking.`);
    } catch {
      setError("Could not add that blocked date. Check the date and try again.");
    } finally {
      setBlockingDate(false);
    }
  }

  async function removeBlockedDate(item: BlockedDate) {
    if (!session) {
      return;
    }

    setRemovingBlockedDateId(item.id);
    setError("");
    setMessage("");

    try {
      const response = await fetch(`/api/admin/blocked-dates/${item.id}`, {
        method: "DELETE",
        credentials: "include"
      });

      if (!response.ok) {
        throw new Error("Could not remove blocked date.");
      }

      setBlockedDates((current) => current.filter((blocked) => blocked.id !== item.id));
      setMessage(`${formatVisitDate(item.date)} is available for online booking again.`);
    } catch {
      setError("Could not remove that blocked date. Refresh and try again.");
    } finally {
      setRemovingBlockedDateId("");
    }
  }

  async function confirmBooking(bookingId: string) {
    if (!session) {
      return;
    }

    setConfirmingId(bookingId);
    setError("");
    setMessage("");

    try {
      const response = await fetch(`/api/admin/bookings/${bookingId}/confirm`, {
        method: "PATCH",
        credentials: "include"
      });

      if (!response.ok) {
        throw new Error("Could not confirm booking.");
      }

      const updatedBooking = (await response.json()) as AdminBooking;
      setBookings((current) =>
        current.map((booking) =>
          booking.id === updatedBooking.id
            ? { ...updatedBooking, customerUser: updatedBooking.customerUser ?? booking.customerUser }
            : booking
        )
      );
      setMessage(`${updatedBooking.id} confirmed. No customer payment is shown until the invoice stage.`);
    } catch {
      setError("Could not confirm this booking. Refresh and try again.");
    } finally {
      setConfirmingId("");
    }
  }

  async function completeBooking(bookingId: string, finalAmount: string) {
    if (!session) {
      return;
    }

    setCompletingId(bookingId);
    setError("");
    setMessage("");

    try {
      const response = await fetch(`/api/admin/bookings/${bookingId}/complete`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ finalAmount })
      });

      if (!response.ok) {
        throw new Error("Could not complete booking.");
      }

      const updatedBooking = (await response.json()) as AdminBooking;
      upsertBooking(updatedBooking);
      setMessage(`${updatedBooking.id} completed. Invoice ${updatedBooking.invoice?.invoiceNo ?? ""} is ready.`);
    } catch {
      setError("Could not complete this booking. Check the final amount and try again.");
    } finally {
      setCompletingId("");
    }
  }

  async function markInvoicePaid(booking: AdminBooking) {
    if (!session || !booking.invoice) {
      return;
    }

    setMarkingPaidId(booking.invoice.id);
    setError("");
    setMessage("");

    try {
      const response = await fetch(`/api/admin/invoices/${booking.invoice.id}/paid`, {
        method: "PATCH",
        credentials: "include"
      });

      if (!response.ok) {
        throw new Error("Could not mark invoice paid.");
      }

      const updatedBooking = (await response.json()) as AdminBooking;
      upsertBooking(updatedBooking);
      setMessage(`${updatedBooking.invoice?.invoiceNo ?? updatedBooking.id} marked paid.`);
    } catch {
      setError("Could not mark this invoice paid. Refresh and try again.");
    } finally {
      setMarkingPaidId("");
    }
  }

  function upsertBooking(updatedBooking: AdminBooking) {
    setBookings((current) =>
      current.map((booking) =>
        booking.id === updatedBooking.id
          ? { ...updatedBooking, customerUser: updatedBooking.customerUser ?? booking.customerUser }
          : booking
      )
    );
  }

  async function logout() {
    await fetch("/api/admin/logout", {
      method: "POST",
      credentials: "include"
    }).catch(() => undefined);
    forgetAdminSession();
    setSession(null);
    setBookings([]);
    setMessage("");
    setError("");
    window.location.hash = "#home";
  }

  return (
    <main className="bg-paper">
      <section className="bg-cream pt-28 pb-12 lg:pt-32" aria-labelledby="admin-title">
        <div className="mx-auto w-[min(1180px,calc(100%-48px))]">
          <p className="mb-4 text-sm font-semibold tracking-[0.08em] text-primary-ink uppercase">ADMIN PORTAL</p>
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
            <div>
              <h1 id="admin-title" className="font-display text-h2 leading-[1.05] font-medium text-ink">
                Manage requests through <span className="text-ink">invoice payment.</span>
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-ink/65">
                AE checks cleaner availability, confirms the slot, completes the service, then the invoice appears in the customer account.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 rounded-[22px] border border-line bg-white p-4 sm:grid-cols-4">
              <AdminStat label="Total" value={bookings.length} />
              <AdminStat label="Pending" value={pendingCount} tone="pending" />
              <AdminStat label="Invoice ready" value={completedUnpaidCount} />
              <AdminStat label="Paid" value={paidCount} />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-[min(1180px,calc(100%-48px))] py-12 lg:py-16">
        {checkingSession ? (
          <div className="grid min-h-[220px] place-items-center rounded-[22px] border border-line bg-white text-ink/60">
            <span className="inline-flex items-center gap-2">
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              Checking admin session...
            </span>
          </div>
        ) : session ? (
          <div className="grid gap-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="m-0 text-sm text-ink/55">Confirm bookings only after cleaner availability is checked.</p>
              <Button disabled={loading} onClick={() => loadBookings()} type="button" variant="secondary">
                {loading ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <RefreshCcw size={16} aria-hidden="true" />}
                Refresh
              </Button>
            </div>

            <AdminNotice message={message} tone="success" />
            <AdminNotice message={error} tone="error" />

            <BlockedDatesPanel
              blockedDate={blockedDate}
              blockedDates={blockedDates}
              blockedReason={blockedReason}
              blockingDate={blockingDate}
              removingBlockedDateId={removingBlockedDateId}
              onAdd={addBlockedDate}
              onBlockedDateChange={setBlockedDate}
              onBlockedReasonChange={setBlockedReason}
              onRemove={removeBlockedDate}
            />

            {loading && bookings.length === 0 ? (
              <div className="grid min-h-[220px] place-items-center rounded-[22px] border border-line bg-white text-ink/60">
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  Loading bookings...
                </span>
              </div>
            ) : null}

            {!loading && bookings.length === 0 ? (
              <div className="rounded-[22px] border border-line bg-white p-8 text-center">
                <ShieldCheck className="mx-auto size-10 text-ink" aria-hidden="true" />
                <h2 className="mt-4 font-display text-2xl font-medium text-ink">No booking requests yet</h2>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-ink/60">
                  New customer requests from the booking form will appear here for admin confirmation.
                </p>
              </div>
            ) : null}

            <div className="grid gap-4">
              {bookings.map((booking) => (
                <BookingApprovalCard
                  booking={booking}
                  confirming={confirmingId === booking.id}
                  completing={completingId === booking.id}
                  key={booking.id}
                  markingPaid={markingPaidId === booking.invoice?.id}
                  onConfirm={() => confirmBooking(booking.id)}
                  onComplete={(finalAmount) => completeBooking(booking.id, finalAmount)}
                  onMarkPaid={() => markInvoicePaid(booking)}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="mx-auto grid max-w-[520px] gap-5 rounded-[22px] border border-line bg-white p-6 text-center">
            <div>
              <ShieldCheck className="mx-auto size-10 text-ink" aria-hidden="true" />
              <p className="mt-4 text-sm font-semibold tracking-[0.08em] text-primary-ink uppercase">AE staff access</p>
              <h2 className="mt-3 font-display text-3xl font-medium text-ink">Please sign in as AE staff.</h2>
              <p className="mt-2 text-sm leading-6 text-ink/60">
                Use the shared sign-in page with your AE staff email to approve slots and manage invoices.
              </p>
            </div>
            <Button asChild className="mx-auto">
              <a href="#signin">
                <ShieldCheck size={16} aria-hidden="true" />
                Sign in
              </a>
            </Button>
          </div>
        )}
      </section>
    </main>
  );
}

function BookingApprovalCard({
  booking,
  completing,
  confirming,
  markingPaid,
  onComplete,
  onConfirm,
  onMarkPaid
}: {
  booking: AdminBooking;
  completing: boolean;
  confirming: boolean;
  markingPaid: boolean;
  onComplete: (finalAmount: string) => void;
  onConfirm: () => void;
  onMarkPaid: () => void;
}) {
  const confirmed = booking.status === "confirmed";
  const completed = booking.status === "completed";
  const invoiceUnpaid = booking.paymentStatus === "invoice_unpaid" && booking.invoice;
  const paid = booking.paymentStatus === "paid";
  const invoiceMessage = booking.invoice ? buildInvoiceMessage(booking, booking.invoice) : "";
  const [messageCopied, setMessageCopied] = useState(false);

  async function copyInvoiceMessage() {
    if (!invoiceMessage) {
      return;
    }

    await copyTextToClipboard(invoiceMessage);
    setMessageCopied(true);
    window.setTimeout(() => {
      setMessageCopied(false);
    }, 2000);
  }

  const statusView = bookingStatusView(booking.status, booking.paymentStatus);

  return (
    <article className={`grid gap-5 rounded-[22px] border border-l-4 border-line bg-white p-5 shadow-[0_4px_16px_rgb(9_30_66_/_0.05)] lg:grid-cols-[minmax(0,1fr)_260px] ${statusView.accent}`}>
      <div className="min-w-0">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold leading-5 ${statusView.badge}`}>
                <span className={`size-1.5 rounded-full ${statusView.dot}`} aria-hidden="true" />
                {statusView.label}
              </span>
              {booking.autoCompleted ? <span className="inline-flex h-7 items-center rounded-full border border-line bg-paper px-3 text-xs font-semibold text-ink/60">Auto-completed</span> : null}
              {booking.dueCompletion && booking.status === "confirmed" ? <span className="inline-flex h-7 items-center rounded-full border border-[#D97706]/30 bg-[#FEF3C7] px-3 text-xs font-semibold text-[#B45309]">Due — mark completed</span> : null}
              <span className="text-xs font-semibold tracking-[0.08em] text-ink/45 uppercase">{shortBookingRef(booking.id)}</span>
            </div>
            <h2 className="mt-3 font-display text-2xl font-medium text-ink">{booking.serviceName}</h2>
            <p className="mt-1 text-sm leading-6 text-ink/60">
              {booking.frequency} · {booking.home.homeType}, {booking.home.bedrooms}, {booking.home.bathrooms}
            </p>
          </div>
          <p className="m-0 font-display text-3xl font-medium text-ink">
            {booking.customQuote || booking.estimatedTotal === null ? "Custom" : formatMoney(booking.estimatedTotal)}
          </p>
        </div>

        <div className="mt-5 grid gap-3 text-sm text-ink/70 md:grid-cols-2">
          {booking.customerUser ? (
            <InfoRow
              label="Customer account"
              value={`${booking.customerUser.firstName} ${booking.customerUser.lastName} · ${booking.customerUser.bookingCount} total request${booking.customerUser.bookingCount === 1 ? "" : "s"}`}
              wide
            />
          ) : null}
          <InfoRow label="Customer" value={`${booking.customer.name} · ${formatPhoneDisplay(booking.customer.phone)}`} />
          <InfoRow label="Email" value={booking.customer.email} />
          <InfoRow label="Visit" value={`${formatVisitDate(booking.schedule.date)} at ${booking.schedule.time}`} />
          <InfoRow label="Payment" value={booking.paymentMethod} />
          {booking.invoice ? <InfoRow label="Invoice" value={`${booking.invoice.invoiceNo} · ${formatMoney(booking.invoice.amount)} · ${booking.invoice.status}`} /> : null}
          <InfoRow label="Address" value={booking.home.address} wide />
          {booking.addons.length > 0 ? <InfoRow label="Add-ons" value={booking.addons.map((addon) => addon.name).join(", ")} wide /> : null}
          {booking.notes ? <InfoRow label="Notes" value={booking.notes} wide /> : null}
        </div>
      </div>

      <aside className="grid content-between gap-5 rounded-[18px] border border-line bg-paper p-4">
        <div className="grid gap-3 text-sm">
          <InfoRow label="Requested" value={formatDateTime(booking.createdAt)} />
          <InfoRow
            label="Payment stage"
            value={booking.invoice ? `${booking.invoice.invoiceNo} ${booking.invoice.status}` : confirmed ? "Visit confirmed — invoice after service" : "Awaiting AE confirmation"}
          />
          {booking.confirmedAt ? <InfoRow label="Confirmed" value={formatDateTime(booking.confirmedAt)} /> : null}
          {completed && booking.invoice ? <InfoRow label="Completed" value="Invoice generated" /> : null}
        </div>
        <Separator className="bg-line" />
        <div className="grid gap-3">
          {booking.status === "received" ? (
            <Button disabled={confirming} onClick={onConfirm} type="button">
              {confirming ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <CalendarCheck size={16} aria-hidden="true" />}
              {confirming ? "Confirming..." : "Confirm"}
            </Button>
          ) : null}
          {confirmed && !booking.invoice ? <CompleteBookingDialog booking={booking} completing={completing} onComplete={onComplete} /> : null}
          {invoiceUnpaid ? (
            <>
              <Button disabled={markingPaid} onClick={onMarkPaid} type="button">
                {markingPaid ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <CheckCircle2 size={16} aria-hidden="true" />}
                {markingPaid ? "Marking paid..." : "Mark paid"}
              </Button>
              <Button onClick={copyInvoiceMessage} type="button" variant="secondary">
                {messageCopied ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
                {messageCopied ? "Copied" : "Copy message"}
              </Button>
              <Button asChild type="button" variant="secondary">
                <a href={buildInvoiceWhatsappHref(booking, booking.invoice)} target="_blank" rel="noreferrer">
                  <MessageCircle size={16} aria-hidden="true" />
                  Send invoice via WhatsApp
                </a>
              </Button>
              <p className="text-xs leading-5 text-muted-foreground">
                WhatsApp Web strips line breaks from prefilled links — tap Copy message, open the chat, and paste so the spacing stays exact.
              </p>
              <Accordion className="min-w-0 rounded-[18px] border border-line bg-white px-3 text-sm text-ink" collapsible type="single">
                <AccordionItem className="border-0" value="invoice-message">
                  <AccordionTrigger className="py-3 text-xs font-semibold text-primary hover:text-primary">
                    Preview message
                  </AccordionTrigger>
                  <AccordionContent className="pb-3">
                    <div className="min-w-0 whitespace-pre-wrap break-words rounded-[14px] border border-line bg-paper p-3 font-mono text-xs leading-5 text-ink/75">
                      {invoiceMessage}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </>
          ) : null}
          {paid ? (
            <Button disabled type="button" variant="secondary">
              <CheckCircle2 size={16} aria-hidden="true" />
              Paid
            </Button>
          ) : null}
        </div>
      </aside>
    </article>
  );
}

async function copyTextToClipboard(text: string) {
  if (navigator.clipboard?.writeText && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.top = "0";
  textarea.style.left = "-9999px";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();

  try {
    document.execCommand("copy");
  } finally {
    document.body.removeChild(textarea);
  }
}

function BlockedDatesPanel({
  blockedDate,
  blockedDates,
  blockedReason,
  blockingDate,
  removingBlockedDateId,
  onAdd,
  onBlockedDateChange,
  onBlockedReasonChange,
  onRemove
}: {
  blockedDate: string;
  blockedDates: BlockedDate[];
  blockedReason: string;
  blockingDate: boolean;
  removingBlockedDateId: string;
  onAdd: () => void;
  onBlockedDateChange: (value: string) => void;
  onBlockedReasonChange: (value: string) => void;
  onRemove: (item: BlockedDate) => void;
}) {
  const selectedDate = blockedDate ? parseIsoDateLocal(blockedDate) : undefined;
  const today = startOfLocalDay(new Date());

  return (
    <section className="grid gap-5 rounded-[22px] border border-line bg-white p-5" aria-labelledby="blocked-dates-title">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="blocked-dates-title" className="m-0 font-display text-2xl font-medium text-ink">Blocked dates</h2>
          <p className="m-0 mt-1 text-sm leading-6 text-ink/60">Full-day admin blocks make every online slot unavailable for that date.</p>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-[180px_minmax(0,1fr)_auto] lg:items-end">
        <div>
          <Label className="text-sm font-semibold text-ink/70" htmlFor="blocked-date">Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button className="mt-2 h-11 w-full justify-start border-input bg-white px-4 text-ink hover:bg-white lg:w-[180px]" id="blocked-date" type="button" variant="secondary">
                <CalendarCheck className="size-4" aria-hidden="true" />
                {selectedDate ? formatBlockedDateButton(blockedDate) : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto border-line bg-white p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                disabled={(date) => startOfLocalDay(date) < today}
                onSelect={(date) => {
                  if (date) {
                    onBlockedDateChange(toIsoDateLocal(date));
                  }
                }}
              />
            </PopoverContent>
          </Popover>
        </div>
        <div>
          <Label className="text-sm font-semibold text-ink/70" htmlFor="blocked-reason">Reason</Label>
          <Input
            className="mt-2 h-11 rounded-full border-input bg-white px-4"
            id="blocked-reason"
            onChange={(event) => onBlockedReasonChange(event.target.value)}
            placeholder="Holiday, no cleaners, maintenance"
            value={blockedReason}
          />
        </div>
        <Button className="w-full lg:w-auto" disabled={!blockedDate || blockingDate} onClick={onAdd} type="button">
          {blockingDate ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <CalendarCheck size={16} aria-hidden="true" />}
          {blockingDate ? "Adding..." : "Add block"}
        </Button>
      </div>

      <div className="grid gap-2">
        {blockedDates.length === 0 ? (
          <p className="m-0 rounded-[18px] border border-line bg-paper px-4 py-3 text-sm leading-6 text-ink/60">No blocked dates yet.</p>
        ) : (
          blockedDates.map((item) => (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-[18px] border border-line bg-paper px-4 py-3" key={item.id}>
              <div>
                <p className="m-0 text-sm font-semibold text-ink">{formatVisitDate(item.date)}</p>
                <p className="m-0 mt-1 text-sm leading-6 text-ink/60">{item.reason || "Unavailable"}</p>
              </div>
              <Button disabled={removingBlockedDateId === item.id} onClick={() => onRemove(item)} type="button" variant="secondary">
                {removingBlockedDateId === item.id ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
                Remove
              </Button>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

function CompleteBookingDialog({
  booking,
  completing,
  onComplete
}: {
  booking: AdminBooking;
  completing: boolean;
  onComplete: (finalAmount: string) => void;
}) {
  const [finalAmount, setFinalAmount] = useState(booking.estimatedTotal?.toString() ?? "");

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button type="button" variant="secondary">
          <ReceiptText size={16} aria-hidden="true" />
          Mark completed
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Complete service and generate invoice</DialogTitle>
          <DialogDescription>Manual override only. Use this if AE needs to regenerate the invoice amount after confirming the request.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <Label htmlFor={`final-amount-${booking.id}`}>Final amount (S$)</Label>
          <Input
            className="h-12 rounded-full border-input bg-white px-4"
            id={`final-amount-${booking.id}`}
            inputMode="decimal"
            onChange={(event) => setFinalAmount(event.target.value)}
            value={finalAmount}
          />
          <Button disabled={completing} onClick={() => onComplete(finalAmount)} type="button">
            {completing ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <ReceiptText size={16} aria-hidden="true" />}
            {completing ? "Generating..." : "Generate invoice"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AdminStat({ label, value, tone = "default" }: { label: string; value: number; tone?: "default" | "pending" }) {
  return (
    <div className={tone === "pending" ? "rounded-[16px] bg-gold-soft px-3 py-3 text-gold-text" : "rounded-[16px] bg-primary-soft px-3 py-3 text-ink"}>
      <p className="m-0 text-2xl font-semibold leading-none">{value}</p>
      <p className="m-0 mt-2 text-xs font-medium">{label}</p>
    </div>
  );
}

function InfoRow({ label, value, wide = false }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className={wide ? "md:col-span-2" : ""}>
      <p className="m-0 text-xs font-semibold tracking-[0.06em] text-ink/45 uppercase">{label}</p>
      <p className="m-0 mt-1 break-words text-sm font-medium leading-6 text-ink">{value}</p>
    </div>
  );
}

function AdminNotice({ message, tone }: { message: string; tone: "success" | "error" }) {
  if (!message) {
    return null;
  }

  return (
    <p
      className={
        tone === "error"
          ? "m-0 rounded-[18px] border border-destructive-border/40 bg-destructive-soft px-4 py-3 text-sm leading-6 text-destructive"
          : "m-0 rounded-[18px] border border-line bg-primary-soft px-4 py-3 text-sm leading-6 text-ink"
      }
      role={tone === "error" ? "alert" : "status"}
    >
      {message}
    </p>
  );
}

function formatVisitDate(value: string) {
  return new Intl.DateTimeFormat("en-SG", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(parseIsoDateLocal(value));
}

function formatBlockedDateButton(value: string) {
  return new Intl.DateTimeFormat("en-SG", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(parseIsoDateLocal(value));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-SG", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}

function parseIsoDateLocal(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function toIsoDateLocal(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function startOfLocalDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}
