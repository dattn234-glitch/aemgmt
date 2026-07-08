type NamedCustomer = {
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
};

// Sign-up lets people type anything into the name fields — including their
// email address, twice. Dedupe identical halves and fall back to the email so
// the UI never renders "x@y.com x@y.com".
export function customerDisplayName(customer: NamedCustomer) {
  const first = (customer.firstName ?? "").trim();
  const last = (customer.lastName ?? "").trim();
  const parts = first.toLowerCase() === last.toLowerCase() ? [first] : [first, last];
  const name = parts.filter(Boolean).join(" ");

  return name || (customer.email ?? "").trim() || "Account";
}

// Short label for tight spots (navbar chip, greetings): first name, or the
// mailbox part when the "name" is actually an email ("dat@x.com" -> "dat").
export function customerShortName(customer: NamedCustomer) {
  const first = (customer.firstName ?? "").trim() || customerDisplayName(customer);

  return first.includes("@") ? first.split("@")[0] || first : first;
}
