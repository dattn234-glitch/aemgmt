import { company } from "../lib/company";
import { WhatsappLogo } from "./WhatsappLogo";

const hiddenRoutes = new Set(["#admin", "#booking", "#invoice", "#signin"]);

export function FloatingWhatsapp({ activeHref }: { activeHref: string }) {
  if (hiddenRoutes.has(activeHref)) {
    return null;
  }

  return (
    <a
      aria-label="Chat with AE Management Services on WhatsApp"
      className="fixed bottom-5 right-5 z-50 grid size-14 place-items-center rounded-full bg-[#25D366] text-white shadow-[0_8px_24px_rgb(22_25_26_/_0.22)] transition hover:scale-105 hover:bg-[#20BA5A] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#25D366]"
      href={company.whatsappHref}
      rel="noreferrer"
      target="_blank"
    >
      <WhatsappLogo className="size-7" />
    </a>
  );
}
