import { useEffect, useMemo, useState } from "react";
import {
  CalendarCheck,
  CalendarOff,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Copy,
  LayoutDashboard,
  Loader2,
  LogOut,
  MessageCircle,
  ReceiptText,
  RefreshCcw,
  Search,
  ShieldCheck,
  Users,
  Wallet
} from "lucide-react";
import { shortBookingRef } from "../../lib/booking-ref";
import { bookingStatusView } from "../../lib/booking-status";
import { formatMoney } from "../../lib/company";
import { cn } from "../../lib/utils";
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

type AdminView = "overview" | "bookings" | "customers" | "availability";

type BookingFilter = "all" | "pending" | "confirmed" | "awaiting" | "paid";

type CustomerGroup = {
  key: string;
  name: string;
  email: string;
  phone: string;
  isAccount: boolean;
  bookings: AdminBooking[];
  totalValue: number;
  lastVisit: string;
};

const adminViews: { id: AdminView; label: string; icon: typeof LayoutDashboard; blurb: string }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard, blurb: "Today's pipeline at a glance — requests, payments, and what needs action." },
  { id: "bookings", label: "Bookings", icon: CalendarCheck, blurb: "Confirm requests, complete visits, and send invoices." },
  { id: "customers", label: "Customers", icon: Users, blurb: "Every customer with their booking history and total value." },
  { id: "availability", label: "Availability", icon: CalendarOff, blurb: "Block full dates so online booking skips them." }
];

const bookingFilters: { id: BookingFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "pending", label: "Pending" },
  { id: "confirmed", label: "Confirmed" },
  { id: "awaiting", label: "Awaiting payment" },
  { id: "paid", label: "Paid" }
];

function matchesFilter(booking: AdminBooking, filter: BookingFilter) {
  switch (filter) {
    case "pending":
      return booking.status === "received";
    case "confirmed":
      return booking.status === "confirmed" && booking.paymentStatus !== "invoice_unpaid" && booking.paymentStatus !== "paid";
    case "awaiting":
      return booking.paymentStatus === "invoice_unpaid";
    case "paid":
      return booking.paymentStatus === "paid";
    default:
      return true;
  }
}

function groupCustomers(bookings: AdminBooking[]): CustomerGroup[] {
  const groups = new Map<string, CustomerGroup>();

  for (const booking of bookings) {
    const key = booking.customerUser ? `account:${booking.customerUser.id}` : `guest:${booking.customer.email.toLowerCase()}`;
    const existing = groups.get(key);
    const value = booking.invoice?.amount ?? booking.estimatedTotal ?? 0;

    if (existing) {
      existing.bookings.push(booking);
      existing.totalValue += value;
      if (booking.schedule.date > existing.lastVisit) {
        existing.lastVisit = booking.schedule.date;
      }
    } else {
      groups.set(key, {
        key,
        name: booking.customerUser ? `${booking.customerUser.firstName} ${booking.customerUser.lastName}`.trim() : booking.customer.name,
        email: booking.customerUser?.email ?? booking.customer.email,
        phone: booking.customerUser?.phone ?? booking.customer.phone,
        isAccount: Boolean(booking.customerUser),
        bookings: [booking],
        totalValue: value,
        lastVisit: booking.schedule.date
      });
    }
  }

  return [...groups.values()].sort((a, b) => b.totalValue - a.totalValue);
}

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
  const [view, setView] = useState<AdminView>("overview");
  const [bookingFilter, setBookingFilter] = useState<BookingFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedBookingId, setExpandedBookingId] = useState("");
  const pendingCount = bookings.filter((booking) => booking.status === "received").length;
  const completedUnpaidCount = bookings.filter((booking) => booking.paymentStatus === "invoice_unpaid").length;
  const paidRevenue = bookings.reduce(
    (sum, booking) => sum + (booking.paymentStatus === "paid" && booking.invoice ? booking.invoice.amount : 0),
    0
  );
  const customers = useMemo(() => groupCustomers(bookings), [bookings]);
  const filteredBookings = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return bookings.filter((booking) => {
      if (!matchesFilter(booking, bookingFilter)) {
        return false;
      }

      if (!query) {
        return true;
      }

      return [
        booking.customer.name,
        booking.customer.email,
        booking.customer.phone,
        booking.serviceName,
        booking.home.address,
        booking.id,
        shortBookingRef(booking.id)
      ]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [bookings, bookingFilter, searchQuery]);
  const attentionBookings = useMemo(
    () => bookings.filter((booking) => booking.status === "received" || booking.paymentStatus === "invoice_unpaid").slice(0, 5),
    [bookings]
  );

  function openBooking(bookingId: string) {
    setView("bookings");
    setBookingFilter("all");
    setSearchQuery("");
    setExpandedBookingId(bookingId);
  }

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

  const activeView = adminViews.find((item) => item.id === view) ?? adminViews[0];

  if (checkingSession) {
    return (
      <main className="min-h-screen bg-paper pb-16 pt-28">
        <div className="mx-auto grid min-h-[300px] w-[min(1180px,calc(100%-32px))] place-items-center rounded-[24px] border border-line bg-white text-ink/60">
          <span className="inline-flex items-center gap-2 text-[15px]">
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            Checking admin session...
          </span>
        </div>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="min-h-screen bg-paper pb-16 pt-28">
        <div className="mx-auto grid max-w-[520px] gap-5 rounded-[24px] border border-line bg-white p-8 text-center">
          <div>
            <ShieldCheck className="mx-auto size-10 text-ink" aria-hidden="true" />
            <p className="mt-4 text-sm font-semibold tracking-[0.08em] text-primary-ink uppercase">AE staff access</p>
            <h2 className="mt-3 font-display text-3xl font-semibold text-ink">Please sign in as AE staff.</h2>
            <p className="mt-2 text-[15px] leading-7 text-ink/60">
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
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-paper pb-16 pt-24 lg:pt-28">
      <div className="mx-auto grid w-[min(1400px,calc(100%-32px))] gap-5 lg:grid-cols-[250px_minmax(0,1fr)] lg:items-start">
        <aside className="sticky top-24 hidden flex-col gap-5 self-start rounded-[24px] bg-navy-900 p-5 text-white lg:flex" aria-label="Admin navigation">
          <div className="flex items-center gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-white/10 text-sky-200 ring-1 ring-white/15">
              <ShieldCheck className="size-5" aria-hidden="true" />
            </span>
            <div>
              <p className="m-0 font-display text-lg font-semibold leading-tight">AE Admin</p>
              <p className="m-0 mt-0.5 text-[13px] text-white/60">Operations dashboard</p>
            </div>
          </div>
          <nav className="grid gap-1.5" aria-label="Admin sections">
            {adminViews.map((item) => {
              const ItemIcon = item.icon;
              const active = item.id === view;
              const badge =
                item.id === "bookings" && pendingCount > 0 ? pendingCount : item.id === "customers" && customers.length > 0 ? customers.length : null;

              return (
                <button
                  className={cn(
                    "flex w-full items-center gap-3 rounded-[14px] px-3.5 py-2.5 text-left text-[15px] font-medium transition-colors",
                    active ? "bg-white/12 text-white" : "text-white/65 hover:bg-white/8 hover:text-white"
                  )}
                  key={item.id}
                  onClick={() => setView(item.id)}
                  type="button"
                >
                  <ItemIcon className="size-[18px] shrink-0" aria-hidden="true" />
                  <span className="flex-1">{item.label}</span>
                  {badge !== null ? (
                    <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", item.id === "bookings" ? "bg-gold text-navy-900" : "bg-white/12 text-white/80")}>
                      {badge}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </nav>
          <div className="mt-auto grid gap-3 border-t border-white/12 pt-4">
            <div>
              <p className="m-0 text-[15px] font-semibold">{session.displayName}</p>
              <p className="m-0 mt-0.5 text-[13px] text-white/55">AE staff account</p>
            </div>
            <Button className="w-full border-white/20 bg-white/8 text-white hover:bg-white/15" onClick={() => void logout()} type="button" variant="secondary">
              <LogOut className="size-4" aria-hidden="true" />
              Sign out
            </Button>
          </div>
        </aside>

        <section className="grid min-w-0 gap-5" aria-labelledby="admin-title">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:hidden" aria-label="Admin sections">
            {adminViews.map((item) => {
              const active = item.id === view;

              return (
                <button
                  className={cn(
                    "inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors",
                    active ? "bg-navy-900 text-white" : "border border-line bg-white text-ink/65"
                  )}
                  key={item.id}
                  onClick={() => setView(item.id)}
                  type="button"
                >
                  {item.label}
                  {item.id === "bookings" && pendingCount > 0 ? (
                    <span className="rounded-full bg-gold px-1.5 text-xs font-semibold text-navy-900">{pendingCount}</span>
                  ) : null}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="m-0 text-sm font-semibold uppercase tracking-[0.08em] text-primary-ink">Admin portal</p>
              <h1 id="admin-title" className="m-0 mt-1.5 font-display text-[32px] font-semibold leading-tight text-ink lg:text-[38px]">{activeView.label}</h1>
              <p className="m-0 mt-1.5 max-w-xl text-[15px] leading-7 text-ink/60">{activeView.blurb}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button disabled={loading} onClick={() => loadBookings()} type="button" variant="secondary">
                {loading ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <RefreshCcw size={16} aria-hidden="true" />}
                Refresh
              </Button>
              <Button className="lg:hidden" onClick={() => void logout()} type="button" variant="secondary">
                <LogOut className="size-4" aria-hidden="true" />
                Sign out
              </Button>
            </div>
          </div>

          <AdminNotice message={message} tone="success" />
          <AdminNotice message={error} tone="error" />

          {loading && bookings.length === 0 ? (
            <div className="grid min-h-[220px] place-items-center rounded-[22px] border border-line bg-white text-ink/60">
              <span className="inline-flex items-center gap-2 text-[15px]">
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                Loading bookings...
              </span>
            </div>
          ) : null}

          {view === "overview" ? (
            <>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard icon={CalendarCheck} label="Total bookings" value={String(bookings.length)} />
                <StatCard icon={Clock3} label="Pending action" value={String(pendingCount)} tone="pending" />
                <StatCard icon={ReceiptText} label="Awaiting payment" value={String(completedUnpaidCount)} />
                <StatCard icon={Wallet} label="Revenue collected" value={formatMoney(paidRevenue)} tone="success" />
              </div>

              <div className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
                <div className="rounded-[22px] border border-line bg-white p-5">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="m-0 font-display text-xl font-semibold text-ink">Needs attention</h2>
                    <Button onClick={() => setView("bookings")} size="sm" type="button" variant="secondary">
                      View all
                    </Button>
                  </div>
                  <div className="mt-4 grid gap-2.5">
                    {attentionBookings.length === 0 ? (
                      <p className="m-0 rounded-[16px] bg-paper px-4 py-3 text-[15px] leading-7 text-ink/60">Nothing waiting on AE right now.</p>
                    ) : (
                      attentionBookings.map((booking) => (
                        <button
                          className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-[16px] border border-line bg-paper px-4 py-3 text-left transition hover:border-primary/40"
                          key={booking.id}
                          onClick={() => openBooking(booking.id)}
                          type="button"
                        >
                          <span className="min-w-0">
                            <span className="block truncate text-[15px] font-semibold text-ink">
                              {booking.customer.name} · {booking.serviceName}
                            </span>
                            <span className="mt-0.5 block text-sm text-ink/55">
                              {formatVisitDate(booking.schedule.date)} at {booking.schedule.time}
                            </span>
                          </span>
                          <StatusPill paymentStatus={booking.paymentStatus} status={booking.status} />
                        </button>
                      ))
                    )}
                  </div>
                </div>

                <div className="grid content-start gap-5">
                  <div className="rounded-[22px] border border-line bg-white p-5">
                    <h2 className="m-0 font-display text-xl font-semibold text-ink">Recent requests</h2>
                    <div className="mt-4 grid gap-2.5">
                      {bookings.length === 0 ? (
                        <p className="m-0 rounded-[16px] bg-paper px-4 py-3 text-[15px] leading-7 text-ink/60">No requests yet.</p>
                      ) : (
                        bookings.slice(0, 5).map((booking) => (
                          <button
                            className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-[16px] bg-paper px-4 py-3 text-left transition hover:bg-primary-soft"
                            key={booking.id}
                            onClick={() => openBooking(booking.id)}
                            type="button"
                          >
                            <span className="min-w-0">
                              <span className="block truncate text-[15px] font-medium text-ink">{booking.customer.name}</span>
                              <span className="block truncate text-sm text-ink/55">
                                {booking.serviceName} · {formatVisitDate(booking.schedule.date)}
                              </span>
                            </span>
                            <span className="font-display text-[15px] font-semibold text-ink">
                              {booking.customQuote || booking.estimatedTotal === null ? "Custom" : formatMoney(booking.invoice?.amount ?? booking.estimatedTotal)}
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-[22px] border border-line bg-white p-5">
                    <div>
                      <h2 className="m-0 font-display text-xl font-semibold text-ink">Availability</h2>
                      <p className="m-0 mt-1 text-[15px] leading-7 text-ink/60">
                        {blockedDates.length === 0 ? "No dates blocked." : `${blockedDates.length} date${blockedDates.length === 1 ? "" : "s"} blocked for online booking.`}
                      </p>
                    </div>
                    <Button onClick={() => setView("availability")} size="sm" type="button" variant="secondary">
                      <CalendarOff className="size-4" aria-hidden="true" />
                      Manage
                    </Button>
                  </div>
                </div>
              </div>
            </>
          ) : null}

          {view === "bookings" ? (
            <>
              <div className="grid gap-3 rounded-[20px] border border-line bg-white p-4 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-center">
                <div className="flex flex-wrap gap-2">
                  {bookingFilters.map((filter) => (
                    <button
                      className={cn(
                        "rounded-full px-4 py-2 text-sm font-semibold transition-colors",
                        bookingFilter === filter.id ? "bg-navy-900 text-white" : "bg-paper text-ink/65 hover:bg-primary-soft hover:text-primary-ink"
                      )}
                      key={filter.id}
                      onClick={() => setBookingFilter(filter.id)}
                      type="button"
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-ink/40" aria-hidden="true" />
                  <Input
                    className="h-11 rounded-full border-input bg-white pl-11 pr-4"
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Search name, email, ref, address"
                    value={searchQuery}
                  />
                </div>
              </div>

              {!loading && filteredBookings.length === 0 ? (
                <div className="rounded-[22px] border border-line bg-white p-8 text-center">
                  <ShieldCheck className="mx-auto size-10 text-ink" aria-hidden="true" />
                  <h2 className="mt-4 font-display text-2xl font-semibold text-ink">
                    {bookings.length === 0 ? "No booking requests yet" : "No bookings match"}
                  </h2>
                  <p className="mx-auto mt-2 max-w-md text-[15px] leading-7 text-ink/60">
                    {bookings.length === 0
                      ? "New customer requests from the booking form will appear here for admin confirmation."
                      : "Try a different status filter or clear the search."}
                  </p>
                </div>
              ) : null}

              <div className="grid gap-3">
                {filteredBookings.map((booking) => (
                  <BookingRow
                    booking={booking}
                    completing={completingId === booking.id}
                    confirming={confirmingId === booking.id}
                    expanded={expandedBookingId === booking.id}
                    key={booking.id}
                    markingPaid={markingPaidId === booking.invoice?.id}
                    onComplete={(finalAmount) => completeBooking(booking.id, finalAmount)}
                    onConfirm={() => confirmBooking(booking.id)}
                    onMarkPaid={() => markInvoicePaid(booking)}
                    onToggle={() => setExpandedBookingId(expandedBookingId === booking.id ? "" : booking.id)}
                  />
                ))}
              </div>
            </>
          ) : null}

          {view === "customers" ? (
            customers.length === 0 ? (
              <div className="rounded-[22px] border border-line bg-white p-8 text-center">
                <Users className="mx-auto size-10 text-ink" aria-hidden="true" />
                <h2 className="mt-4 font-display text-2xl font-semibold text-ink">No customers yet</h2>
                <p className="mx-auto mt-2 max-w-md text-[15px] leading-7 text-ink/60">
                  Customers appear here automatically from booking requests — accounts and guests both.
                </p>
              </div>
            ) : (
              <div className="grid gap-3">
                {customers.map((customer) => (
                  <CustomerCard customer={customer} key={customer.key} onOpenBooking={openBooking} />
                ))}
              </div>
            )
          ) : null}

          {view === "availability" ? (
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
          ) : null}
        </section>
      </div>
    </main>
  );
}

function StatusPill({ paymentStatus, status }: { paymentStatus: string; status: string }) {
  const statusView = bookingStatusView(status, paymentStatus);

  return (
    <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold leading-5 ${statusView.badge}`}>
      <span className={`size-1.5 rounded-full ${statusView.dot}`} aria-hidden="true" />
      {statusView.label}
    </span>
  );
}

function BookingRow({
  booking,
  completing,
  confirming,
  expanded,
  markingPaid,
  onComplete,
  onConfirm,
  onMarkPaid,
  onToggle
}: {
  booking: AdminBooking;
  completing: boolean;
  confirming: boolean;
  expanded: boolean;
  markingPaid: boolean;
  onComplete: (finalAmount: string) => void;
  onConfirm: () => void;
  onMarkPaid: () => void;
  onToggle: () => void;
}) {
  return (
    <article className={cn("overflow-hidden rounded-[20px] border bg-white transition-shadow", expanded ? "border-primary/35 shadow-[0_14px_34px_rgb(9_30_66_/_0.08)]" : "border-line")}>
      <button
        aria-expanded={expanded}
        className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 px-5 py-4 text-left md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,0.9fr)_auto_auto]"
        onClick={onToggle}
        type="button"
      >
        <span className="min-w-0">
          <span className="block truncate text-[15px] font-semibold text-ink">{booking.customer.name}</span>
          <span className="block truncate text-sm text-ink/55">{booking.customer.email}</span>
        </span>
        <span className="hidden min-w-0 md:block">
          <span className="block truncate text-[15px] font-medium text-ink/80">{booking.serviceName}</span>
          <span className="block truncate text-sm text-ink/55">{booking.frequency}</span>
        </span>
        <span className="hidden text-sm leading-5 text-ink/70 md:block">
          {formatVisitDate(booking.schedule.date)}
          <span className="block text-ink/50">{booking.schedule.time}</span>
        </span>
        <span className="hidden whitespace-nowrap font-display text-lg font-semibold text-ink sm:block">
          {booking.customQuote || booking.estimatedTotal === null ? "Custom" : formatMoney(booking.invoice?.amount ?? booking.estimatedTotal)}
        </span>
        <span className="flex items-center gap-2 justify-self-end">
          <StatusPill paymentStatus={booking.paymentStatus} status={booking.status} />
          <ChevronDown className={cn("size-4 shrink-0 text-ink/45 transition-transform", expanded && "rotate-180")} aria-hidden="true" />
        </span>
      </button>
      {expanded ? (
        <div className="border-t border-line bg-paper/50 p-5">
          <BookingDetail
            booking={booking}
            completing={completing}
            confirming={confirming}
            markingPaid={markingPaid}
            onComplete={onComplete}
            onConfirm={onConfirm}
            onMarkPaid={onMarkPaid}
          />
        </div>
      ) : null}
    </article>
  );
}

function CustomerCard({ customer, onOpenBooking }: { customer: CustomerGroup; onOpenBooking: (bookingId: string) => void }) {
  const [open, setOpen] = useState(false);
  const initials =
    customer.name
      .split(/\s+/)
      .map((word) => word[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?";

  return (
    <article className={cn("overflow-hidden rounded-[20px] border bg-white transition-shadow", open ? "border-primary/35 shadow-[0_14px_34px_rgb(9_30_66_/_0.08)]" : "border-line")}>
      <button
        aria-expanded={open}
        className="grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 px-5 py-4 text-left"
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-primary-soft font-display text-[15px] font-semibold text-primary-ink">{initials}</span>
        <span className="min-w-0">
          <span className="flex flex-wrap items-center gap-2">
            <span className="truncate text-[15px] font-semibold text-ink">{customer.name}</span>
            <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold", customer.isAccount ? "bg-primary-soft text-primary-ink" : "bg-paper text-ink/55")}>
              {customer.isAccount ? "Account" : "Guest"}
            </span>
          </span>
          <span className="mt-0.5 block truncate text-sm text-ink/55">
            {customer.email}
            {customer.phone ? ` · ${formatPhoneDisplay(customer.phone)}` : ""}
          </span>
        </span>
        <span className="flex items-center gap-4">
          <span className="hidden text-right sm:block">
            <span className="block font-display text-lg font-semibold text-ink">{formatMoney(customer.totalValue)}</span>
            <span className="block text-sm text-ink/55">
              {customer.bookings.length} booking{customer.bookings.length === 1 ? "" : "s"} · last {formatVisitDate(customer.lastVisit)}
            </span>
          </span>
          <ChevronDown className={cn("size-4 shrink-0 text-ink/45 transition-transform", open && "rotate-180")} aria-hidden="true" />
        </span>
      </button>
      {open ? (
        <div className="grid gap-2 border-t border-line bg-paper/50 p-4">
          {customer.bookings.map((booking) => (
            <button
              className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-[14px] border border-line bg-white px-4 py-3 text-left transition hover:border-primary/40"
              key={booking.id}
              onClick={() => onOpenBooking(booking.id)}
              type="button"
            >
              <span className="min-w-0">
                <span className="block truncate text-[15px] font-medium text-ink">{booking.serviceName}</span>
                <span className="block text-sm text-ink/55">
                  {formatVisitDate(booking.schedule.date)} at {booking.schedule.time} ·{" "}
                  {booking.customQuote || booking.estimatedTotal === null ? "Custom" : formatMoney(booking.invoice?.amount ?? booking.estimatedTotal)}
                </span>
              </span>
              <StatusPill paymentStatus={booking.paymentStatus} status={booking.status} />
            </button>
          ))}
        </div>
      ) : null}
    </article>
  );
}

function BookingDetail({
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

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
      <div className="min-w-0">
        <p className="m-0 text-xs font-semibold uppercase tracking-[0.08em] text-ink/45">{shortBookingRef(booking.id)}</p>
        <div className="mt-3 grid gap-3 text-sm text-ink/70 md:grid-cols-2">
          <InfoRow label="Home" value={`${booking.home.homeType} · ${booking.home.bedrooms} · ${booking.home.bathrooms}`} />
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

      <aside className="grid content-start gap-4 rounded-[18px] border border-line bg-white p-4">
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
    </div>
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
          <h2 id="blocked-dates-title" className="m-0 font-display text-2xl font-semibold text-ink">Blocked dates</h2>
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

function StatCard({
  icon: Icon,
  label,
  value,
  tone = "default"
}: {
  icon: typeof Wallet;
  label: string;
  value: string;
  tone?: "default" | "pending" | "success";
}) {
  return (
    <div className="rounded-[20px] border border-line bg-white p-5">
      <span
        className={cn(
          "grid size-10 place-items-center rounded-xl",
          tone === "pending" ? "bg-gold-soft text-gold-text" : tone === "success" ? "bg-success-soft text-success" : "bg-primary-soft text-primary-ink"
        )}
      >
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <p className="m-0 mt-4 truncate font-display text-[28px] font-semibold leading-none text-ink">{value}</p>
      <p className="m-0 mt-1.5 text-sm font-medium text-ink/55">{label}</p>
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
