import { MessageCircle } from "lucide-react";
import { company } from "../lib/company";

export function FloatingWhatsapp({ activeHref }: { activeHref: string }) {
  if (activeHref === "#admin") {
    return null;
  }

  return (
    <a
      aria-label="Chat with AE Management Services on WhatsApp"
      className="fixed bottom-5 right-5 z-50 grid size-14 place-items-center rounded-full bg-[#25D366] text-white shadow-[0_8px_24px_rgb(22_25_26_/_0.18)] transition hover:scale-105 focus-visible:outline-sky"
      href={company.whatsappHref}
      rel="noreferrer"
      target="_blank"
    >
      <MessageCircle className="size-7" aria-hidden="true" />
    </a>
  );
}
