import { useState, type FormEvent, type ReactNode } from "react";
import { Clock3, Mail, MapPin, MessageCircle, Phone, ShieldCheck, TimerReset } from "lucide-react";
import type { ContactContent } from "../../lib/site-content";
import { company } from "../../lib/company";
import { cn } from "../../lib/utils";
import { CtaBand } from "../page/CtaBand";
import { PageHero } from "../page/PageHero";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Textarea } from "../ui/textarea";
import { Container } from "../ui";

type ContactStatus = {
  state: "idle" | "submitting" | "success" | "error";
  message: string;
};

const services = ["Residential cleaning subscription", "Move-in / move-out cleaning", "Post-renovation cleaning"];
const serviceAreas = ["East", "West", "North", "Central", "CBD fringe"];

export function ContactPage({ contact }: { contact: ContactContent }) {
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
        body: JSON.stringify({ serviceType, name, email, phone, message })
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
    <>
      <PageHero
        eyebrow="CONTACT"
        title={<>We're here <span className="text-navy">to help.</span></>}
        sub="Ask about a service, update a booking, or tell us what your home needs next."
      />

      <section className="bg-paper py-20 lg:py-28">
        <Container className="grid gap-8">
          <div className="grid overflow-hidden rounded-[28px] border border-line lg:grid-cols-[5fr_7fr]">
            <div className="grid gap-8 bg-navy-900 p-8 text-white lg:p-10">
              <div>
                <p className="m-0 text-sm font-semibold uppercase tracking-[0.08em] text-sky-300">REACH US</p>
                <h2 className="mb-0 mt-3 font-display text-4xl font-normal">Tell us what needs attention.</h2>
              </div>
              <div className="grid gap-4 text-white/80">
                <ContactRow icon={<Phone size={18} />} text={contact.phone} />
                <ContactRow icon={<Mail size={18} />} text={company.email} />
                <ContactRow icon={<Clock3 size={18} />} text={company.serviceHours} />
                <ContactRow icon={<MapPin size={18} />} text="Singapore island-wide" />
              </div>
              <div className="flex flex-wrap content-start items-start gap-2">
                {serviceAreas.map((area) => (
                  <span className="rounded-full bg-white/10 px-3 py-2 text-sm text-white/85" key={area}>{area}</span>
                ))}
              </div>
            </div>

            <form className="grid gap-5 bg-white p-7 lg:p-10" aria-label="Contact form" onSubmit={handleContactSubmit}>
              <Field label="Service">
                <Select value={serviceType} onValueChange={setServiceType}>
                  <SelectTrigger className="h-11 w-full rounded-xl border-line bg-white text-ink">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map((service) => (
                      <SelectItem key={service} value={service}>{service}</SelectItem>
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
                <Textarea className="min-h-32 rounded-xl border-line bg-white" autoComplete="off" onChange={(event) => setMessage(event.target.value)} rows={4} value={message} />
              </Field>
              <p className={cn("m-0 rounded-2xl px-4 py-3 text-sm leading-6", status.state === "error" ? "bg-[#FFF3ED] text-[#8A321D]" : "bg-sky-100 text-navy")}>{status.message}</p>
              <Button className="w-fit" disabled={status.state === "submitting"} type="submit">
                {status.state === "submitting" ? "Sending..." : "Send request"}
              </Button>
            </form>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {[
              ["Response within 1 business day", MessageCircle],
              ["Mon-Sun 8-6", TimerReset],
              ["Bonded & insured", ShieldCheck]
            ].map(([label, Icon]) => (
              <div className="flex items-center gap-3 rounded-[20px] border border-line bg-white p-5 text-ink/70" key={label as string}>
                <Icon className="text-navy" size={20} aria-hidden="true" />
                <span className="text-sm font-medium">{label as string}</span>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <CtaBand
        tone="paper"
        title={<>Need a faster answer? <em className="italic text-sky-300">Call us.</em></>}
        sub="We can help pick the right residential service, estimate timing, or route an existing booking question."
        secondary={{ label: "WhatsApp us", href: company.whatsappHref }}
      />
    </>
  );
}

function ContactRow({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <p className="m-0 flex items-center gap-3">
      <span className="text-sky-300">{icon}</span>
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
