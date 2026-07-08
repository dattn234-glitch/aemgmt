// Allowed WhatsApp phone regions. "84" (Vietnam) is enabled temporarily for testing
// while the client is based in VN — remove it from this list for production.
export const ALLOWED_PHONE_REGIONS = ["65", "84"] as const;

type Region = (typeof ALLOWED_PHONE_REGIONS)[number];

const allow = (region: Region) => (ALLOWED_PHONE_REGIONS as readonly string[]).includes(region);

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

  // VN local format: 0 + 9 digits (e.g. 0912 345 678)
  if (allow("84") && /^0[35789]\d{8}$/.test(digits)) {
    return `+84${digits.slice(1)}`;
  }

  // Bare SG mobile: exactly 8 digits starting 8/9
  if (allow("65") && /^[89]\d{7}$/.test(digits)) {
    return `+65${digits}`;
  }

  // Bare VN mobile without leading 0: 9 digits
  if (allow("84") && /^[35789]\d{8}$/.test(digits)) {
    return `+84${digits}`;
  }

  return "";
}

export function isValidSgMobile(value: string) {
  return normalizeSgPhone(value) !== "";
}

export function phoneRegion(value: string): Region {
  const normalized = normalizeSgPhone(value);
  if (normalized.startsWith("+84")) return "84";
  return "65";
}

// Local part (without region code) for display inside the input field.
export function toSgMobileLocal(value: string, region?: Region) {
  const normalized = normalizeSgPhone(value);
  if (normalized) {
    return toLocalDigits(normalized, normalized.startsWith("+84") ? "84" : "65");
  }
  const digits = value.replace(/\D/g, "");
  const r = region ?? (digits.startsWith("84") || digits.startsWith("0") ? "84" : "65");
  return toLocalDigits(value, r);
}

export function toLocalDigits(raw: string, region: Region): string {
  // A stored normalized value ("+65…", "+84…") must never leak its region code into the
  // local-digits display — "+65" with no local part renders as an empty field, not "65".
  const withoutPrefix = raw.replace(/^\s*\+(65|84)/, "");
  let digits = withoutPrefix.replace(/\D/g, "");
  const maxLen = region === "84" ? 9 : 8;

  if (digits.startsWith(region) && digits.length > maxLen) {
    digits = digits.slice(region.length);
  }

  if (region === "84" && digits.startsWith("0") && digits.length === 10) {
    digits = digits.slice(1);
  }

  return digits.slice(0, maxLen);
}

export function formatPhoneDisplay(value: string) {
  const normalized = normalizeSgPhone(value) || value;
  const digits = normalized.replace(/\D/g, "");

  if (digits.startsWith("84")) {
    const local = toLocalDigits(digits, "84");
    return local.length === 9
      ? `+84 ${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6)}`
      : normalized;
  }

  if (digits.startsWith("65")) {
    const local = toLocalDigits(digits, "65");
    return local.length === 8 ? `+65 ${local.slice(0, 4)} ${local.slice(4)}` : normalized;
  }

  return value;
}

export function toWaMePhone(value: string) {
  return normalizeSgPhone(value).replace(/\D/g, "");
}
