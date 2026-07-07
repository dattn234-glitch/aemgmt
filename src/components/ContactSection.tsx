import { useState, type FormEvent, type ReactNode } from "react";
import { Clock3, Mail, MapPin, Phone } from "lucide-react";
import { useReveal } from "../hooks/useReveal";
import { company } from "../lib/company";
import type { ContactContent } from "../lib/site-content";
import { cn } from "../lib/utils";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Textarea } from "./ui/textarea";
import { Container } from "./ui";

type ContactStatus = {
  state: "idle" | "submitting" | "success" | "error";
  message: string;
};

const services = ["Residential cleaning subscription", "Move-in / move-out cleaning", "Post-renovation cleaning"];

export function ContactSection({ contact }: { contact: ContactContent }) {
  const headerReveal = useReveal<HTMLDivElement>();
  const formReveal = useReveal<HTMLFormElement>();
  const [serviceType, setServiceType] = useState("Residential cleaning subscription");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<ContactStatus>({
    state: "idle",
    message: "Tell us what you need and we will get back with timing, scope, and next steps."
  });

  async function handleContactSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus({ state: "submitting", message: "Sending your request..." });

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceType,
          name,
          email,
          phone,
          message
        })
      });

      if (!response.ok) {
        throw new Error(`Contact request failed: ${response.status}`);
      }

      const result = (await response.json()) as { id?: string };
      setStatus({
        state: "success",
        message: `${result.id ?? "Request"} received. We will reply to ${email || phone} shortly.`
      });
    } catch {
      setStatus({
        state: "error",
        message: "The contact request could not be sent right now. Your message is still here."
      });
    }
  }

  return (
    <section className="scroll-mt-[88px] bg-cream py-20 lg:py-28" id="contact" aria-labelledby="contact-title">
      <Container className="grid gap-10 lg:grid-cols-2 lg:items-start">
        <div ref={headerReveal.ref} className={`grid gap-6 transition duration-500 ${headerReveal.className}`}>
          <div className="grid gap-3">
            <p className="m-0 text-sm font-semibold uppercase tracking-[0.08em] text-navy">CONTACT</p>
            <h2 id="contact-title" className="m-0 font-display text-h2 font-normal text-ink">
              We're here{" "}
              <span className="text-navy">to help.</span>
            </h2>
          </div>
          <div className="grid gap-4 text-ink/80">
            <ContactRow icon={<Phone size={18} aria-hidden="true" />} text={contact.phone} />
            <ContactRow icon={<Mail size={18} aria-hidden="true" />} text={company.email} />
            <ContactRow icon={<Clock3 size={18} aria-hidden="true" />} text={company.serviceHours} />
            <ContactRow icon={<MapPin size={18} aria-hidden="true" />} text="Singapore island-wide" />
          </div>
        </div>

        <form
          ref={formReveal.ref}
          className={`grid gap-5 rounded-[22px] border border-line bg-white p-7 transition duration-500 ${formReveal.className}`}
          aria-label="Contact form"
          onSubmit={handleContactSubmit}
        >
          <Field label="Service">
            <Select value={serviceType} onValueChange={setServiceType}>
              <SelectTrigger className="h-11 w-full rounded-xl border-line bg-white text-ink">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {services.map((service) => (
                  <SelectItem key={service} value={service}>
                    {service}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Name">
              <Input className="h-11 rounded-xl border-line bg-white" autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} required />
            </Field>
            <Field label="Phone">
              <Input className="h-11 rounded-xl border-line bg-white" autoComplete="tel" type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} required />
            </Field>
          </div>

          <Field label="Email">
            <Input className="h-11 rounded-xl border-line bg-white" autoComplete="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </Field>

          <Field label="Message">
            <Textarea
              className="min-h-32 rounded-xl border-line bg-white"
              autoComplete="off"
              onChange={(event) => setMessage(event.target.value)}
              rows={4}
              value={message}
            />
          </Field>

          <p
            className={cn(
              "m-0 rounded-2xl px-4 py-3 text-sm leading-6",
              status.state === "error" ? "bg-[#FFF3ED] text-[#8A321D]" : "bg-sky-100 text-navy"
            )}
          >
            {status.message}
          </p>

          <Button className="w-fit" disabled={status.state === "submitting"} type="submit">
            {status.state === "submitting" ? "Sending..." : "Send request"}
          </Button>
        </form>
      </Container>
    </section>
  );
}

function ContactRow({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <p className="m-0 flex items-center gap-3">
      <span className="text-navy">{icon}</span>
      <span>{text}</span>
    </p>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-2">
      <Label className="text-sm font-medium text-ink">{label}</Label>
      {children}
    </div>
  );
}
