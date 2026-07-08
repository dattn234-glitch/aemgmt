import { useState } from "react";
import { CalendarCheck } from "lucide-react";
import { company } from "../lib/company";
import { Icon3D } from "./Icon3D";
import { WhatsappLogo } from "./WhatsappLogo";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";

type BookingOptionDialogProps = {
  bookingHref?: string;
  className?: string;
  label?: string;
  mobile?: boolean;
};

export function BookingOptionDialog({
  bookingHref = "#booking",
  className,
  label = "Book now",
  mobile = false
}: BookingOptionDialogProps) {
  const [open, setOpen] = useState(false);

  function handleBookingClick() {
    setOpen(false);
    window.location.hash = bookingHref.startsWith("#") ? bookingHref.slice(1) : bookingHref;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className={className ?? (mobile ? "w-full" : "h-12 px-6 transition hover:-translate-y-0.5")} type="button">
          <CalendarCheck size={15} aria-hidden="true" />
          {label}
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[min(420px,calc(100%-32px))]">
        <DialogHeader className="justify-items-center text-center">
          <Icon3D name="chat" size={58} />
          <DialogTitle className="mt-2 text-center text-[30px]">Select booking option</DialogTitle>
          <DialogDescription className="text-center">
            Book online in minutes — AE confirms your slot — or chat with us on WhatsApp.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <Button className="w-full" type="button" onClick={handleBookingClick}>
            Book online in minutes
          </Button>
          <Button asChild className="w-full" variant="outline">
            <a href={company.whatsappHref} target="_blank" rel="noreferrer" onClick={() => setOpen(false)}>
              <WhatsappLogo className="size-5 text-[#25D366]" />
              Chat with AE
            </a>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
