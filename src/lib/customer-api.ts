import type { BookingStatusResponse } from "../components/BookingStatusTimeline";

export type CustomerUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  name: string;
};

export type CustomerBooking = BookingStatusResponse & {
  serviceId: string;
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
  notes: string;
  createdAt: string;
};

export type CustomerBookingsResponse = {
  bookings: CustomerBooking[];
};

export type CustomerSignupPayload = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
};

export type CustomerLoginPayload = {
  email: string;
  password: string;
};

export type UnifiedAuthResponse = {
  role: "admin" | "customer";
  name: string;
  customer?: CustomerUser;
};

const customerSessionStorageKey = "ae_customer_session_hint";
export const adminSessionStorageKey = "ae_admin_session_hint";

export function hasCustomerSessionHint() {
  return typeof window !== "undefined" && window.localStorage.getItem(customerSessionStorageKey) === "1";
}

export function rememberCustomerSession() {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(customerSessionStorageKey, "1");
  }
}

export function rememberAdminSession() {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(adminSessionStorageKey, "1");
  }
}

export function forgetAdminSession() {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(adminSessionStorageKey);
  }
}

export function forgetCustomerSession() {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(customerSessionStorageKey);
  }
}

export async function getCurrentCustomer() {
  const response = await fetch("/api/customer/me", { credentials: "include" });

  if (response.status === 401) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`Customer session request failed: ${response.status}`);
  }

  return response.json() as Promise<CustomerUser>;
}

export async function getCustomerBookings() {
  const response = await fetch("/api/customer/bookings", { credentials: "include" });

  if (response.status === 401) {
    return [];
  }

  if (!response.ok) {
    throw new Error(`Customer bookings request failed: ${response.status}`);
  }

  const payload = (await response.json()) as CustomerBookingsResponse;

  return payload.bookings;
}

export async function loginCustomer(payload: CustomerLoginPayload) {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(await readApiMessage(response, "Invalid email or password."));
  }

  const result = (await response.json()) as UnifiedAuthResponse;

  if (result.role === "admin") {
    rememberAdminSession();
    forgetCustomerSession();
    return result;
  }

  if (!result.customer) {
    throw new Error("Cannot sign in right now.");
  }

  rememberCustomerSession();
  forgetAdminSession();

  return result;
}

export async function signupCustomer(payload: CustomerSignupPayload) {
  const response = await fetch("/api/customer/signup", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(await readApiMessage(response, "Cannot create this account yet."));
  }

  rememberCustomerSession();
  forgetAdminSession();

  return response.json() as Promise<CustomerUser>;
}

export async function logoutCustomer() {
  await fetch("/api/customer/logout", {
    method: "POST",
    credentials: "include"
  });
  forgetCustomerSession();
}

export async function getCurrentAuth() {
  const response = await fetch("/api/auth/me", { credentials: "include" });

  if (!response.ok) {
    throw new Error(`Auth session request failed: ${response.status}`);
  }

  return response.json() as Promise<{ role: "admin" | "customer" | null; name: string | null }>;
}

export async function logoutAdmin() {
  await fetch("/api/admin/logout", {
    method: "POST",
    credentials: "include"
  });
  forgetAdminSession();
}

async function readApiMessage(response: Response, fallback: string) {
  try {
    const payload = (await response.json()) as { message?: string };

    return payload.message ?? fallback;
  } catch {
    return fallback;
  }
}
