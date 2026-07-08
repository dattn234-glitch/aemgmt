// Allowed WhatsApp phone regions. "84" (Vietnam) is enabled temporarily for testing
// while the client is based in VN — remove it from this list for production.
const ALLOWED_PHONE_REGIONS = ["65", "84"] as const;

const allow = (region: (typeof ALLOWED_PHONE_REGIONS)[number]) =>
  (ALLOWED_PHONE_REGIONS as readonly string[]).includes(region);

// Returns "+65XXXXXXXX" (SG mobile) or "+84XXXXXXXXX" (VN mobile) or "" when invalid.
export function normalizeSgPhone(value: string) {
  const digits = value.replace(/\D/g, "");

  if (allow("65") && digits.startsWith("65") && /^[89]\d{7}$/.test(digits.slice(2))) {
    return `+65${digits.slice(2)}`;
  }

  if (allow("84") && digits.startsWith("84")) {
    const local = digits.slice(2).replace(/^0/, "");
    if (/^[35789]\d{8}$/.test(local)) {
      return `+84${local}`;
    }
  }

  if (allow("84") && /^0[35789]\d{8}$/.test(digits)) {
    return `+84${digits.slice(1)}`;
  }

  if (allow("65") && /^[89]\d{7}$/.test(digits)) {
    return `+65${digits}`;
  }

  if (allow("84") && /^[35789]\d{8}$/.test(digits)) {
    return `+84${digits}`;
  }

  return "";
}

export function isValidSgMobile(value: string) {
  return normalizeSgPhone(value) !== "";
}
