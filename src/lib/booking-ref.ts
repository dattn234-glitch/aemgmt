// Turns the internal id "booking_20260708_e41ab6bc" into a short, friendly reference
// like "#E41AB6BC" for customer-facing displays (cards, timeline, invoice).
export function shortBookingRef(id: string | null | undefined): string {
  if (!id) {
    return "Pending";
  }

  // Only transform the internal "booking_..." ids; leave friendly values untouched.
  if (!id.startsWith("booking_")) {
    return id;
  }

  const segment = id.split("_").pop() ?? id;
  return `#${segment.toUpperCase()}`;
}
