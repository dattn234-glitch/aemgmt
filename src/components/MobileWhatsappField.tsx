import { useState } from "react";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { ALLOWED_PHONE_REGIONS, isValidSgMobile, phoneRegion, toLocalDigits } from "../lib/phone";
import { cn } from "../lib/utils";

// +84 is temporarily allowed for testing (client based in VN) — see ALLOWED_PHONE_REGIONS.
// The visible input owns its digits locally: deriving the display from the normalized
// "+65…"/"+84…" prop on every keystroke is what kept resurrecting the region code
// inside the field (type → store "+84…" → re-render → "84" reappears in the box).
export function MobileWhatsappField({
  error,
  id,
  onChange,
  value
}: {
  error?: string;
  id: string;
  onChange: (value: string) => void;
  value: string;
}) {
  const [region, setRegion] = useState<(typeof ALLOWED_PHONE_REGIONS)[number]>(() => phoneRegion(value));
  const [local, setLocal] = useState(() => toLocalDigits(value, phoneRegion(value)));
  const maxLen = region === "84" ? 9 : 8;
  const liveError = local.length === maxLen && !isValidSgMobile(`+${region}${local}`)
    ? region === "84"
      ? "Enter a valid Vietnam WhatsApp mobile."
      : "Enter an 8-digit Singapore WhatsApp mobile starting with 8 or 9."
    : "";
  const visibleError = error ?? liveError;

  return (
    <div>
      <Label className="text-sm font-semibold text-ink/70" htmlFor={id}>Mobile (WhatsApp)</Label>
      <div className={cn("mt-2 flex h-12 overflow-hidden rounded-full border bg-white", visibleError ? "border-destructive-border bg-destructive-soft" : "border-input")}>
        <Select
          onValueChange={(next) => {
            const regionCode = next as (typeof ALLOWED_PHONE_REGIONS)[number];
            const kept = local.slice(0, regionCode === "84" ? 9 : 8);
            setRegion(regionCode);
            setLocal(kept);
            onChange(kept ? `+${regionCode}${kept}` : "");
          }}
          value={region}
        >
          <SelectTrigger
            aria-label="Country code"
            className="w-[74px] justify-center gap-1 self-stretch rounded-none border-0 border-r border-line bg-paper px-3 text-sm font-semibold text-ink shadow-none focus-visible:ring-0 data-[size=default]:h-full data-[size=sm]:h-full"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="start" className="rounded-[18px] border-line">
            {ALLOWED_PHONE_REGIONS.map((code) => (
              <SelectItem className="rounded-[12px]" key={code} value={code}>+{code}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          aria-describedby={visibleError ? `${id}-error` : undefined}
          aria-invalid={Boolean(visibleError)}
          autoComplete="tel-national"
          className="h-full min-w-0 flex-1 rounded-none border-0 bg-transparent px-4 text-ink shadow-none focus-visible:ring-0"
          id={id}
          inputMode="numeric"
          maxLength={maxLen + 4}
          onChange={(event) => {
            // Pasted values may carry +65/+84/0 prefixes — toLocalDigits strips them once.
            const digits = toLocalDigits(event.target.value, region);
            setLocal(digits);
            onChange(digits ? `+${region}${digits}` : "");
          }}
          placeholder={region === "84" ? "912 345 678" : "8123 4567"}
          required
          type="tel"
          value={local}
        />
      </div>
      {visibleError ? <p className="m-0 mt-2 text-xs font-semibold text-destructive" id={`${id}-error`}>{visibleError}</p> : null}
    </div>
  );
}
