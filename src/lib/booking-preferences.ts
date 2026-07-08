const preferredBookingServiceKey = "ae-preferred-booking-service";
const aePreselectKey = "aePreselect";

export type BookingPreselect = {
  frequency?: string;
  serviceId: string;
};

export function setPreferredBookingService(serviceId: string, frequency?: string) {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(preferredBookingServiceKey, serviceId);
  window.sessionStorage.setItem(aePreselectKey, JSON.stringify({ serviceId, frequency }));
}

export function takePreferredBookingService(validServiceIds: string[]): BookingPreselect | null {
  if (typeof window === "undefined") {
    return null;
  }

  const preselect = parsePreselect(window.sessionStorage.getItem(aePreselectKey));
  const serviceId = window.sessionStorage.getItem(preferredBookingServiceKey);
  window.sessionStorage.removeItem(aePreselectKey);
  window.sessionStorage.removeItem(preferredBookingServiceKey);

  const next = preselect ?? (serviceId ? { serviceId } : null);

  return next && validServiceIds.includes(next.serviceId) ? next : null;
}

function parsePreselect(value: string | null): BookingPreselect | null {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(value) as Partial<BookingPreselect>;

    return typeof parsed.serviceId === "string"
      ? { serviceId: parsed.serviceId, frequency: typeof parsed.frequency === "string" ? parsed.frequency : undefined }
      : null;
  } catch {
    return null;
  }
}
