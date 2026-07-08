import type { InvoiceSummary } from "../components/InvoiceView";
import { company, formatMoney } from "./company";
import { toWaMePhone } from "./phone";

export type InvoiceMessageBooking = {
  customer: {
    name: string;
    phone: string;
  };
};

export function buildInvoicePublicUrl(invoice: Pick<InvoiceSummary, "invoiceNo" | "publicToken">) {
  const origin = company.siteUrl || (typeof window !== "undefined" ? window.location.origin : "http://127.0.0.1:5173");
  const url = new URL(origin);

  url.searchParams.set("invoice", invoice.invoiceNo);
  url.searchParams.set("token", invoice.publicToken ?? "");
  url.hash = "invoice";

  return url.toString();
}

export function buildInvoiceMessage(booking: InvoiceMessageBooking, invoice: InvoiceSummary) {
  const customerFirstName = booking.customer.name.trim().split(/\s+/)[0] || "there";
  const publicInvoiceUrl = buildInvoicePublicUrl(invoice);

  return [
    "*Invoice for your most recent service*",
    "",
    `Hi ${customerFirstName}!`,
    "",
    "Thank you again for choosing AE Management Services. The invoice for your recent visit is now ready.",
    "",
    `Invoice Amount: ${formatMoney(invoice.amount)}`,
    "",
    `You may view your invoice by clicking this link: ${publicInvoiceUrl}. We accept payment by PayNow (preferred) or Bank Transfer.`,
    "",
    "*PayNow:*",
    `• *Account Name (${company.bankName})*: ${company.legalName}`,
    `• *PayNow UEN*: ${company.paynowUen || "[CLIENT TO CONFIRM]"}`,
    `• *Reference*: Please indicate *${invoice.invoiceNo}* as your reference number.`,
    "",
    "*Online Bank Transfer:*",
    `• *Account Name (${company.bankName})*: ${company.legalName}`,
    `• *Account Number*: ${company.bankAccount || "[CLIENT TO CONFIRM]"}`,
    `• *Reference*: Please indicate *${invoice.invoiceNo}* as your reference number.`,
    "",
    "*IMPT: Please include the reference number for PayNow or Bank payments, otherwise we may not be able to recognise your payment.*",
    "",
    `If you have any questions regarding your billing, please WhatsApp us at ${company.billingWhatsapp}.`,
    "",
    "Regards,",
    "AE Management Services"
  ].join("\n");
}

export function buildInvoiceWhatsappHref(booking: InvoiceMessageBooking, invoice: InvoiceSummary | null) {
  const phone = toWaMePhone(booking.customer.phone);

  if (!invoice || !phone) {
    return company.whatsappHref;
  }

  return `https://wa.me/${phone}?text=${encodeURIComponent(buildInvoiceMessage(booking, invoice))}`;
}
