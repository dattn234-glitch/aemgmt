import { cn } from "../lib/utils";

/**
 * Crisp vector version of the AE monogram + sparkle for small chrome (header/footer).
 * The full bitmap lockup (with the legal name) stays in use on formal surfaces like invoices.
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <span aria-hidden="true" className={cn("grid shrink-0 place-items-center overflow-hidden rounded-xl bg-white", className)}>
      <svg className="size-[72%]" viewBox="0 0 64 64" fill="none" role="img">
        <text
          x="29"
          y="46"
          fill="var(--color-navy)"
          fontFamily="'Figtree Variable', Figtree, 'Segoe UI', sans-serif"
          fontSize="34"
          fontWeight="800"
          letterSpacing="-1.5"
          textAnchor="middle"
        >
          AE
        </text>
        <path
          d="M51 8c.9 5.2 3 7.4 8.2 8.3-5.2.9-7.3 3-8.2 8.3-.9-5.3-3-7.4-8.2-8.3 5.2-.9 7.3-3.1 8.2-8.3Z"
          fill="var(--color-primary)"
        />
      </svg>
    </span>
  );
}
