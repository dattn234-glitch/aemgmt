import { useEffect, useState } from "react";
import { Download, Landmark, QrCode } from "lucide-react";
import QRCode from "qrcode";
import aeLogo from "../assets/ae-logo.png";
import { shortBookingRef } from "../lib/booking-ref";
import { company } from "../lib/company";
import { Button } from "./ui/button";

export type InvoiceSummary = {
  id: string;
  invoiceNo: string;
  amount: number;
  amountCents: number;
  currency: string;
  lineItems: {
    label: string;
    quantity?: string;
    amount: number;
  }[];
  customerName?: string | null;
  address?: string | null;
  visitDate?: string | null;
  status: "unpaid" | "paid" | string;
  createdAt: string | null;
  paidAt: string | null;
  paymentQrPayload: string | null;
  publicToken?: string | null;
};

export function InvoiceView({
  bookingRef,
  compact = false,
  invoice,
  serviceName
}: {
  bookingRef: string;
  compact?: boolean;
  invoice: InvoiceSummary;
  serviceName: string;
}) {
  const [qrCode, setQrCode] = useState("");
  const qrPayload = invoice.paymentQrPayload ?? `${company.legalName}|${invoice.invoiceNo}|${invoice.amount}`;
  const lineItems = invoice.lineItems.length > 0 ? invoice.lineItems : [{ label: serviceName, amount: invoice.amount, quantity: "1" }];
  const subtotal = lineItems.reduce((total, item) => total + item.amount, 0);
  const total = invoice.amount || subtotal;
  const paid = invoice.status === "paid";

  useEffect(() => {
    let active = true;

    QRCode.toDataURL(qrPayload, {
      color: {
        dark: "#16191A",
        light: "#FFFFFF"
      },
      errorCorrectionLevel: "M",
      margin: 2,
      width: 180
    }).then((value) => {
      if (active) {
        setQrCode(value);
      }
    }).catch(() => {
      if (active) {
        setQrCode("");
      }
    });

    return () => {
      active = false;
    };
  }, [qrPayload]);

  return (
    <section className="invoice-print-root min-w-0 max-w-full rounded-[22px] border border-line bg-white p-4 text-ink sm:p-6" aria-label={`Invoice ${invoice.invoiceNo}`}>
      <div className="grid min-w-0 gap-5 border-b border-line pb-5 md:grid-cols-[minmax(0,1fr)_minmax(240px,0.8fr)]">
        <div className="min-w-0">
          <p className="m-0 text-xs font-semibold tracking-[0.08em] text-primary-ink uppercase">Pay after service</p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="m-0 font-display text-[clamp(1.6rem,3.5vw,2.25rem)] leading-tight font-semibold tracking-normal text-ink">TAX INVOICE</h1>
            <span
              className={`inline-flex -rotate-3 items-center rounded-md border-2 px-3 py-1 text-sm font-extrabold uppercase tracking-[0.15em] ${
                paid ? "border-success bg-success-soft text-success" : "border-destructive bg-destructive-soft text-destructive"
              }`}
            >
              {paid ? "Paid" : "Payment due"}
            </span>
          </div>
          <div className="mt-5 min-w-0">
            <p className="m-0 text-xs font-semibold tracking-[0.08em] text-ink/45 uppercase">Bill-To</p>
            <p className="m-0 mt-1.5 break-words text-sm font-semibold text-ink">{invoice.customerName || "Customer name pending"}</p>
            <p className="m-0 mt-1 whitespace-pre-line break-words text-sm leading-6 text-ink/65">{invoice.address || "Service address pending"}</p>
          </div>
        </div>
        <div className="min-w-0 text-left md:text-right">
          <img className="mb-3 h-9 w-auto rounded-md object-contain md:ml-auto" src={aeLogo} alt="AE Management Services" />
          <h2 className="m-0 break-words font-display text-lg font-semibold leading-tight text-ink sm:text-xl">{company.legalName}</h2>
          <p className="m-0 mt-2 text-sm leading-6 text-ink/65">
            {company.serviceArea}<br />
            {company.email}
            {company.uen ? <><br />UEN {company.uen}</> : null}
          </p>
          <dl className="mt-4 grid gap-1.5 text-sm">
            <InvoiceMeta label="Invoice Number" value={invoice.invoiceNo} />
            <InvoiceMeta label="Invoice Date" value={formatInvoiceDate(invoice.createdAt)} />
            <InvoiceMeta label="Booking ref" value={shortBookingRef(bookingRef)} />
          </dl>
        </div>
      </div>

      <p className="m-0 mt-5 text-sm leading-6 text-ink/65">Invoice for your recent visit on {formatVisitDate(invoice.visitDate)}.</p>

      <div className="mt-5 grid gap-3 sm:hidden">
        {lineItems.map((item, index) => {
          const quantity = parseQuantity(item.quantity);
          const unitPrice = quantity > 0 ? item.amount / quantity : item.amount;

          return (
            <div className="rounded-[16px] border border-line bg-white p-4" key={`${item.label}-mobile-${index}`}>
              <p className="m-0 text-sm font-semibold text-ink">{item.label}</p>
              <dl className="mt-3 grid gap-2 text-sm">
                <InvoiceItemMeta label="Qty" value={formatQuantity(quantity)} />
                <InvoiceItemMeta label="Unit price" value={formatSgd(unitPrice)} />
                <InvoiceItemMeta emphasis label="Amount SGD" value={formatSgd(item.amount)} />
              </dl>
            </div>
          );
        })}
      </div>

      <div className="mt-5 hidden min-w-0 overflow-hidden rounded-[16px] border border-line sm:block">
        <table className="w-full table-fixed border-collapse text-xs sm:text-sm">
          <thead className="bg-paper text-left text-xs font-semibold tracking-[0.08em] text-ink/50 uppercase">
            <tr>
              <th className="w-[46%] px-2 py-3 sm:px-4">Description</th>
              <th className="w-[12%] px-2 py-3 text-right sm:px-4">Qty</th>
              <th className="w-[20%] px-2 py-3 text-right sm:px-4">Unit Price</th>
              <th className="w-[22%] px-2 py-3 text-right sm:px-4">Amount SGD</th>
            </tr>
          </thead>
          <tbody>
            {lineItems.map((item, index) => {
              const quantity = parseQuantity(item.quantity);
              const unitPrice = quantity > 0 ? item.amount / quantity : item.amount;

              return (
              <tr className="border-t border-line" key={`${item.label}-${index}`}>
                <td className="break-words px-2 py-3 font-medium text-ink sm:px-4">{item.label}</td>
                <td className="break-words px-2 py-3 text-right text-ink/65 sm:px-4">{formatQuantity(quantity)}</td>
                <td className="px-2 py-3 text-right whitespace-nowrap text-ink/65 sm:px-4">{formatSgd(unitPrice)}</td>
                <td className="px-2 py-3 text-right font-semibold whitespace-nowrap text-ink sm:px-4">{formatSgd(item.amount)}</td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-5 grid justify-items-end">
        <div className="w-full max-w-[360px] text-sm">
          <TotalRow label="Subtotal" value={formatSgd(subtotal)} />
          <TotalRow emphasis label="TOTAL SGD" value={formatSgd(total)} />
          {paid ? (
            <>
              <TotalRow label="Amount Paid" value={formatSgd(total)} />
              <TotalRow emphasis label="AMOUNT DUE SGD" value={formatSgd(0)} />
            </>
          ) : (
            <>
              <TotalRow emphasis label="AMOUNT DUE SGD" value={formatSgd(total)} />
              <p className="m-0 mt-2 text-right text-xs font-semibold text-ink/55">Due: pay by PayNow after this invoice</p>
            </>
          )}
        </div>
      </div>

      <div className="mt-6 grid min-w-0 max-w-full grid-cols-1 gap-4 overflow-hidden lg:grid-cols-[minmax(0,1fr)_220px]">
        <div className="grid min-w-0 gap-4 rounded-[18px] border border-line bg-paper p-4 sm:p-5">
          <div className="flex min-w-0 items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary-soft text-ink">
              <Landmark className="size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h3 className="m-0 font-display text-2xl font-semibold text-ink">Payment instructions</h3>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <PaymentBlock
                  title="1. PayNow (preferred)"
                  rows={[
                    ["Account Name (DBS)", company.legalName],
                    ...(company.paynowUen ? [["PayNow UEN", company.paynowUen] as [string, string]] : []),
                    ["Reference", invoice.invoiceNo]
                  ]}
                />
                <PaymentBlock
                  title="2. Online Bank Transfer"
                  rows={[
                    ["Account Name (DBS)", company.legalName],
                    ...(company.bankAccount ? [["Account Number", company.bankAccount] as [string, string]] : []),
                    ["Reference", invoice.invoiceNo]
                  ]}
                />
              </div>
              <p className="m-0 mt-4 rounded-[16px] border border-line bg-white px-4 py-3 text-sm font-semibold leading-6 text-ink/70">
                IMPT: Please include the invoice number as your payment reference so AE can match your payment quickly.
              </p>
            </div>
          </div>
        </div>
        <figure className="m-0 grid min-w-0 max-w-full justify-items-center gap-2 rounded-[18px] border border-line bg-white p-4">
          {qrCode ? (
            <img className="aspect-square w-full max-w-[180px]" src={qrCode} alt={`PayNow QR code for invoice ${invoice.invoiceNo}`} />
          ) : (
            <div className="grid aspect-square w-full max-w-[180px] place-items-center rounded-[14px] bg-paper text-sm text-ink/55">
              <QrCode className="size-6" aria-hidden="true" />
            </div>
          )}
          <figcaption className="max-w-full break-words text-center text-xs leading-5 text-ink/55">Scan and use {invoice.invoiceNo}</figcaption>
        </figure>
      </div>

      <footer className="mt-7 grid gap-2 border-t border-line pt-5 text-xs leading-5 text-ink/55">
        <p className="m-0">Should you have any questions about your invoice or billing, WhatsApp us at {company.billingWhatsapp}.</p>
        <p className="m-0">This is a computer-generated document. No signature is required.</p>
        {company.uen ? <p className="m-0">Company Registration No: {company.uen}</p> : null}
      </footer>

      {!compact ? (
        <Button className="invoice-print-hide mt-5" onClick={() => window.print()} type="button" variant="secondary">
          <Download className="size-4" aria-hidden="true" />
          Download / Print invoice
        </Button>
      ) : null}
    </section>
  );
}

function InvoiceMeta({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 sm:grid-cols-[130px_1fr] md:grid-cols-[1fr_auto]">
      <dt className="font-semibold text-ink/45">{label}</dt>
      <dd className="m-0 min-w-0 break-words font-semibold text-ink">{value}</dd>
    </div>
  );
}

function InvoiceItemMeta({ emphasis = false, label, value }: { emphasis?: boolean; label: string; value: string }) {
  return (
    <div className="grid grid-cols-[1fr_auto] gap-3 border-t border-line pt-2 first:border-t-0 first:pt-0">
      <dt className="text-ink/50">{label}</dt>
      <dd className={`m-0 text-right ${emphasis ? "font-semibold text-ink" : "font-medium text-ink/70"}`}>{value}</dd>
    </div>
  );
}

function PaymentBlock({ rows, title }: { rows: [string, string][]; title: string }) {
  return (
    <div className="min-w-0 rounded-[16px] border border-line bg-white p-4">
      <p className="m-0 text-sm font-semibold text-ink">{title}</p>
      <dl className="mt-3 grid gap-2 text-sm leading-5">
        {rows.map(([label, value]) => (
          <div className="min-w-0" key={label}>
            <dt className="text-xs font-semibold tracking-[0.08em] text-ink/45 uppercase">{label}</dt>
            <dd className="m-0 mt-1 break-words text-ink/70">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function TotalRow({ emphasis = false, label, value }: { emphasis?: boolean; label: string; value: string }) {
  return (
    <div className={`grid grid-cols-[1fr_auto] gap-4 border-b border-line py-3 ${emphasis ? "font-semibold text-ink" : "text-ink/65"}`}>
      <span>{label}</span>
      <span className={emphasis ? "font-display text-xl font-semibold" : "font-semibold"}>{value}</span>
    </div>
  );
}

function formatInvoiceDate(value: string | null) {
  if (!value) {
    return "Invoice date pending";
  }

  return new Intl.DateTimeFormat("en-SG", {
    day: "numeric",
    month: "short",
    year: "numeric"
  }).format(new Date(value));
}

function formatVisitDate(value: string | null | undefined) {
  if (!value) {
    return "the scheduled service date";
  }

  return new Intl.DateTimeFormat("en-SG", {
    day: "numeric",
    month: "short",
    year: "numeric"
  }).format(new Date(`${value.slice(0, 10)}T00:00:00`));
}

function parseQuantity(value: string | undefined) {
  if (!value) {
    return 1;
  }

  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

function formatQuantity(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

function formatSgd(value: number) {
  return `S$${value.toFixed(2)}`;
}
