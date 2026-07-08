import { useEffect, useState } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import { InvoiceView, type InvoiceSummary } from "../InvoiceView";

type PublicInvoiceResponse = {
  bookingRef: string;
  serviceName: string;
  invoice: InvoiceSummary;
};

export function PublicInvoicePage() {
  const [payload, setPayload] = useState<PublicInvoiceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    let active = true;
    const params = new URLSearchParams(window.location.search);
    const invoiceNo = params.get("invoice");
    const token = params.get("token");

    async function loadInvoice() {
      if (!invoiceNo || !token) {
        setExpired(true);
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/invoices/${encodeURIComponent(invoiceNo)}?token=${encodeURIComponent(token)}`);

        if (!response.ok) {
          throw new Error("Invoice link invalid.");
        }

        const result = (await response.json()) as PublicInvoiceResponse;

        if (active) {
          setPayload(result);
        }
      } catch {
        if (active) {
          setExpired(true);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadInvoice();

    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="bg-paper pt-28 pb-16 lg:pt-32 lg:pb-24">
      <div className="mx-auto w-[min(920px,calc(100%-48px))]">
        {loading ? (
          <div className="grid min-h-[280px] place-items-center rounded-[22px] border border-line bg-white text-ink/60">
            <span className="inline-flex items-center gap-2">
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              Loading invoice...
            </span>
          </div>
        ) : expired || !payload ? (
          <div className="mx-auto grid max-w-[560px] justify-items-center rounded-[22px] border border-line bg-white p-8 text-center">
            <span className="grid size-12 place-items-center rounded-full bg-primary-soft text-ink">
              <AlertCircle className="size-6" aria-hidden="true" />
            </span>
            <h1 className="mt-4 font-display text-3xl font-semibold leading-tight text-ink">Invoice link expired or invalid</h1>
            <p className="mt-3 max-w-md text-sm leading-6 text-ink/60">
              Please contact AE Management Services and we will resend the invoice link for your booking.
            </p>
          </div>
        ) : (
          <InvoiceView bookingRef={payload.bookingRef} invoice={payload.invoice} serviceName={payload.serviceName} />
        )}
      </div>
    </section>
  );
}
