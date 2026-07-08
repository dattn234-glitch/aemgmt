import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getCurrentCustomer,
  getCustomerBookings,
  forgetCustomerSession,
  hasCustomerSessionHint,
  loginCustomer,
  logoutCustomer,
  signupCustomer,
  type CustomerBooking,
  type CustomerLoginPayload,
  type CustomerSignupPayload,
  type CustomerUser
} from "../lib/customer-api";

export const customerSessionChangedEvent = "ae-customer-session-changed";

export function useCustomerSession() {
  const [customer, setCustomer] = useState<CustomerUser | null>(null);
  const [bookings, setBookings] = useState<CustomerBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingsLoading, setBookingsLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!hasCustomerSessionHint()) {
      setCustomer(null);
      setBookings([]);
      setLoading(false);
      setBookingsLoading(false);
      return;
    }

    setLoading(true);

    try {
      const nextCustomer = await getCurrentCustomer();
      setCustomer(nextCustomer);

      if (nextCustomer) {
        setBookingsLoading(true);
        setBookings(await getCustomerBookings());
      } else {
        forgetCustomerSession();
        setBookings([]);
      }
    } finally {
      setBookingsLoading(false);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();

    const onSessionChanged = () => void refresh();

    window.addEventListener(customerSessionChangedEvent, onSessionChanged);

    return () => window.removeEventListener(customerSessionChangedEvent, onSessionChanged);
  }, [refresh]);

  const pendingCount = useMemo(
    () => bookings.filter((booking) => booking.paymentStatus !== "paid").length,
    [bookings]
  );

  async function login(payload: CustomerLoginPayload) {
    const result = await loginCustomer(payload);

    if (result.role === "admin") {
      setCustomer(null);
      setBookings([]);
      window.dispatchEvent(new Event(customerSessionChangedEvent));
      window.location.hash = "#admin";

      return null;
    }

    const nextCustomer = result.customer;

    if (!nextCustomer) {
      throw new Error("Cannot sign in right now.");
    }

    setCustomer(nextCustomer);
    setBookings(await getCustomerBookings());
    window.dispatchEvent(new Event(customerSessionChangedEvent));

    return nextCustomer;
  }

  async function signup(payload: CustomerSignupPayload) {
    const nextCustomer = await signupCustomer(payload);
    setCustomer(nextCustomer);
    setBookings(await getCustomerBookings());
    window.dispatchEvent(new Event(customerSessionChangedEvent));

    return nextCustomer;
  }

  async function logout() {
    await logoutCustomer();
    setCustomer(null);
    setBookings([]);
    window.dispatchEvent(new Event(customerSessionChangedEvent));
    if (typeof window !== "undefined") {
      window.location.hash = "#home";
    }
  }

  return {
    bookings,
    bookingsLoading,
    customer,
    loading,
    login,
    logout,
    pendingCount,
    refresh,
    signup
  };
}
