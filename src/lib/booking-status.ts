// Single source of truth for booking/invoice status colours, shared by the customer
// account cards and the admin dashboard so the same state always looks the same.
export type BookingStatusView = {
  label: string;
  // badge = pill classes (border + bg + text); accent = left-border colour class; dot = small dot bg.
  badge: string;
  accent: string;
  dot: string;
};

const INVOICE_READY = new Set(["invoice_unpaid", "qr_ready", "instructions_pending"]);

export function bookingStatusView(status: string, paymentStatus: string): BookingStatusView {
  if (paymentStatus === "paid") {
    return {
      label: "Paid",
      badge: "border-success/25 bg-success-soft text-success",
      accent: "border-l-success",
      dot: "bg-success"
    };
  }

  if (INVOICE_READY.has(paymentStatus)) {
    return {
      label: "Invoice unpaid",
      badge: "border-[#B45309]/30 bg-[#FEF3C7] text-[#B45309]",
      accent: "border-l-[#D97706]",
      dot: "bg-[#D97706]"
    };
  }

  if (status === "completed") {
    return {
      label: "Service completed",
      badge: "border-[#6D28D9]/25 bg-[#F3EEFF] text-[#6D28D9]",
      accent: "border-l-[#6D28D9]",
      dot: "bg-[#6D28D9]"
    };
  }

  if (status === "confirmed") {
    return {
      label: "Confirmed",
      badge: "border-primary-ink/25 bg-primary-soft text-primary-ink",
      accent: "border-l-primary-ink",
      dot: "bg-primary-ink"
    };
  }

  if (status === "cancelled") {
    return {
      label: "Cancelled",
      badge: "border-destructive/30 bg-destructive-soft text-destructive",
      accent: "border-l-destructive",
      dot: "bg-destructive"
    };
  }

  return {
    label: "Pending admin",
    badge: "border-line bg-paper text-ink/60",
    accent: "border-l-ink/25",
    dot: "bg-ink/40"
  };
}
