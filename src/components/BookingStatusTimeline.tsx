import { shortBookingRef } from "../lib/booking-ref";
import { formatMoney } from "../lib/company";
import { cn } from "../lib/utils";

type InvoiceSummary = {
  id: string;
  invoiceNo: string;
  amount: number;
  amountCents?: number;
  currency: string;
  lineItems: {
    label: string;
    amount: number;
    quantity?: string;
  }[];
  customerName?: string | null;
  address?: string | null;
  visitDate?: string | null;
  publicToken?: string | null;
  status: string;
  createdAt: string | null;
  paidAt: string | null;
  paymentQrPayload?: string | null;
};

export type BookingStatusResponse = {
  id: string;
  status: "received" | "confirmed" | "completed" | "cancelled" | string;
  serviceName: string;
  paymentStatus: "none" | "invoice_unpaid" | "paid" | "instructions_pending" | "qr_ready" | string;
  paymentMethod: string;
  paymentQrPayload: string | null;
  estimatedTotal: number | null;
  customQuote: boolean;
  confirmedAt: string | null;
  invoice: InvoiceSummary | null;
};

const statusSteps = ["Submitted", "AE confirming", "Visit confirmed", "Service completed", "Invoice ready - pay by PayNow", "Paid"] as const;
const invoiceReadyStatuses = new Set(["invoice_unpaid", "qr_ready", "instructions_pending"]);

export function BookingStatusTimeline({
  bookingStatus,
  fallbackBookingId,
  fallbackPaymentMethod = "PayNow after service",
  compact = false
}: {
  bookingStatus: BookingStatusResponse | null;
  fallbackBookingId?: string;
  fallbackPaymentMethod?: string;
  compact?: boolean;
}) {
  const invoice = bookingStatus?.invoice ?? null;
  const paymentStatus = bookingStatus?.paymentStatus ?? "none";
  const rawInvoiceReady = invoiceReadyStatuses.has(paymentStatus) && invoice?.status !== "paid";
  const paid = bookingStatus?.paymentStatus === "paid" || invoice?.status === "paid";
  const completed = bookingStatus?.status === "completed" || paid;
  const invoiceReady = rawInvoiceReady && completed;
  const confirmed = bookingStatus?.status === "confirmed" || completed;
  const activeIndex = paid ? 5 : invoiceReady ? 4 : completed ? 3 : confirmed ? 2 : bookingStatus ? 1 : 0;
  const bookingRef = bookingStatus?.id ?? fallbackBookingId ?? "Pending";
  const amount = bookingStatus
    ? invoice
      ? formatMoney(invoice.amount)
      : bookingStatus.customQuote || bookingStatus.estimatedTotal === null
      ? "Confirm quote"
      : formatMoney(bookingStatus.estimatedTotal)
    : "Pending";
  const paymentMethod = bookingStatus?.paymentMethod ?? fallbackPaymentMethod;
  const isPendingTone = !paid && !confirmed && !invoiceReady;
  const isInvoiceTone = invoiceReady;

  return (
    <div
      className={cn(
        "rounded-[22px] border",
        compact ? "p-3" : "p-4",
        paid || confirmed
          ? "border-primary/25 bg-white text-ink shadow-[0_8px_24px_rgb(9_30_66_/_0.06)]"
          : isInvoiceTone
            ? "border-gold/60 bg-white text-ink"
          : "border-gold/60 bg-gold-soft text-gold-text"
      )}
      role="status"
    >
      <ol
        className={cn(
          "grid gap-2",
          compact ? "grid-cols-3 sm:grid-cols-6" : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-6"
        )}
        aria-label="Pay-after-service booking status timeline"
      >
        {statusSteps.map((step, index) => {
          // When paid, the final "Paid" step is a completed (filled) state, not a lighter "current".
          const done = index < activeIndex || (paid && index === activeIndex);
          const current = index === activeIndex && !done;

          return (
            <li className={cn("grid gap-2", compact && "justify-items-start")} key={step}>
              <span
                className={cn(
                  "grid place-items-center rounded-full border font-semibold",
                  compact ? "size-8 text-xs" : "size-9 text-sm",
                  done && "border-primary bg-primary text-white",
                  current && isPendingTone && "border-gold bg-white text-gold-text",
                  current && isInvoiceTone && "border-gold bg-gold-soft text-gold-text",
                  current && !isPendingTone && !isInvoiceTone && "border-primary bg-primary-soft text-primary-ink",
                  !done && !current && "border-line bg-white/70 text-ink/35"
                )}
              >
                {done ? "✓" : index + 1}
              </span>
              <span className={cn(compact ? "text-[12px] leading-4" : "text-[13px] leading-5", "font-semibold", done || current ? "text-current" : "text-ink/40")}>
                {step}
              </span>
            </li>
          );
        })}
      </ol>

      <div className={cn("grid gap-4", compact ? "mt-3" : "mt-4")}>
        {!confirmed ? (
          <div className="flex items-start gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-white text-gold-text">
                <span className="text-lg leading-none">·</span>
            </span>
            <div>
              <p className="m-0 text-sm font-semibold">Waiting for AE to confirm your slot</p>
              <p className="m-0 mt-1 text-sm leading-6 text-gold-text/80">
                Your request is saved. AE checks cleaner availability first; the invoice and PayNow details appear after the service is completed.
              </p>
            </div>
          </div>
        ) : null}

        <div className={cn("grid content-center gap-2", compact ? "text-[13px]" : "text-sm")}>
          {confirmed && !completed ? <p className={cn("m-0 font-semibold text-ink", compact ? "text-[13px]" : "text-sm")}>Visit confirmed. No payment is due until the service is completed.</p> : null}
          {completed && !invoiceReady && !paid ? <p className={cn("m-0 font-semibold text-ink", compact ? "text-[13px]" : "text-sm")}>Service completed. AE will share the invoice and PayNow details when ready.</p> : null}
          {invoiceReady && invoice ? (
            <div className="rounded-[18px] border border-gold/60 bg-gold-soft px-4 py-3 text-sm font-semibold leading-6 text-gold-text">
              Invoice {invoice.invoiceNo} · {formatMoney(invoice.amount)} — AE sends your invoice link via WhatsApp. Pay by PayNow using reference {invoice.invoiceNo}.
            </div>
          ) : null}
          {paid ? <p className={cn("m-0 font-semibold text-ink", compact ? "text-[13px]" : "text-sm")}>Paid. Thank you for settling this invoice.</p> : null}
          <TimelineRow compact={compact} label="Booking" value={shortBookingRef(bookingRef)} />
          {bookingStatus?.serviceName ? <TimelineRow compact={compact} label="Service" value={bookingStatus.serviceName} /> : null}
          <TimelineRow compact={compact} label="Method" value={paymentMethod} />
          <TimelineRow compact={compact} label="Amount" value={amount} />
          {invoice ? <TimelineRow compact={compact} label="Reference" value={invoice.invoiceNo} /> : null}
        </div>
      </div>
    </div>
  );
}

function TimelineRow({ compact = false, label, value }: { compact?: boolean; label: string; value: string }) {
  return (
    <div className={cn("grid min-w-0 gap-2", compact ? "grid-cols-[72px_minmax(0,1fr)] text-[13px]" : "grid-cols-[96px_minmax(0,1fr)] text-sm sm:grid-cols-[112px_minmax(0,1fr)]")}>
      <span className="text-current/60">{label}</span>
      <strong className="min-w-0 break-words text-right font-medium text-current/85">{value}</strong>
    </div>
  );
}
