export type AvailabilitySearchPayload = {
  postalCode: string;
  address: string;
  serviceId: string;
  frequency: string;
  duration?: string;
  sizeTier?: string;
};

export type AvailabilitySlot = {
  time: string;
  rate: number;
  total: number | null;
  available: boolean;
};

export type AvailabilityDate = {
  date: string;
  label: string;
  surcharge: number;
  available: boolean;
  blocked?: boolean;
  slots: AvailabilitySlot[];
};

export type AvailabilitySearchResponse = {
  serviceable: boolean;
  bookingsOpen?: boolean;
  message: string;
  searchId: string;
  weekStart: string;
  dates: AvailabilityDate[];
};

export type AvailabilityErrorResponse = {
  message?: string;
  errors?: Record<string, string>;
};

export async function searchAvailability(payload: AvailabilitySearchPayload) {
  const startedAt = performance.now();
  const response = await fetch("/api/availability/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const elapsed = performance.now() - startedAt;
  const waitForSkeleton = Math.max(0, 650 - elapsed);

  if (waitForSkeleton > 0) {
    await new Promise((resolve) => window.setTimeout(resolve, waitForSkeleton));
  }

  if (!response.ok) {
    const error = (await safeJson(response)) as AvailabilityErrorResponse | null;
    const nextError = new Error(error?.message ?? `Availability search failed: ${response.status}`);
    (nextError as Error & { details?: AvailabilityErrorResponse }).details = error ?? undefined;

    throw nextError;
  }

  return response.json() as Promise<AvailabilitySearchResponse>;
}

async function safeJson(response: Response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}
