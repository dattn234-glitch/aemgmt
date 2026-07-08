import { useState, type FormEvent, type ReactNode } from "react";
import { Clock3, Mail, MapPin, Phone, ShieldCheck } from "lucide-react";
import type { ContactContent } from "../../lib/site-content";
import { company } from "../../lib/company";
import { cn } from "../../lib/utils";
import { WhatsappLogo } from "../WhatsappLogo";
import { CtaBand } from "../page/CtaBand";
import { Button } from "../ui/button";
import { Form } from "../ui/form";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Textarea } from "../ui/textarea";

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
      <section className="bg-navy-900 pt-[72px]">
        <div className="grid lg:min-h-[calc(100svh-72px)] lg:grid-cols-2">
          <div className="flex flex-col justify-between gap-10 px-6 py-14 text-white sm:px-10 lg:px-14 lg:py-16 xl:pl-[max(3.5rem,calc((100vw-1440px)/2+20px))]">
            <div className="grid content-start gap-8">
              <div>
                <p className="m-0 text-sm font-semibold uppercase tracking-[0.08em] text-sky-200">CONTACT</p>
                <h1 className="mb-0 mt-4 max-w-md font-display text-[clamp(2.25rem,4.5vw,3.75rem)] font-medium leading-[1.06]">
                  Tell us what needs <em className="italic text-sky-200">attention.</em>
                </h1>
                <p className="mb-0 mt-5 max-w-md text-lg leading-8 text-white/70">
                  Ask about a service, update a booking, or describe what your home needs next. We reply within one
                  business day — usually much faster on WhatsApp.
                </p>
              </div>

              <div className="grid gap-4 text-white/80">
                <ContactRow icon={<Phone size={18} />} text={contact.phone} href={`tel:${contact.phone.replace(/\s/g, "")}`} />
                <ContactRow icon={<Mail size={18} />} text={company.email} href={`mailto:${company.email}`} />
                <ContactRow icon={<Clock3 size={18} />} text={company.serviceHours} />
                <ContactRow icon={<MapPin size={18} />} text="Singapore island-wide" />
              </div>

              <a
                className="group grid w-fit grid-cols-[auto_1fr] items-center gap-4 rounded-[20px] border border-white/15 bg-white/5 px-5 py-4 transition hover:border-white/30 hover:bg-white/10"
                href={company.whatsappHref}
                rel="noreferrer"
                target="_blank"
              >
                <WhatsappLogo className="size-9 text-[#25D366]" />
                <span>
                  <span className="block text-sm font-semibold text-white">WhatsApp is fastest</span>
                  <span className="mt-0.5 block text-sm text-white/60">Message us and we'll sort it out live.</span>
                </span>
              </a>
            </div>

            <div className="grid gap-4">
              <div className="flex flex-wrap gap-2">
                {serviceAreas.map((area) => (
                  <span className="rounded-full bg-white/10 px-3 py-2 text-sm text-white/85" key={area}>{area}</span>
                ))}
              </div>
              <p className="m-0 inline-flex items-center gap-2 text-sm text-white/55">
                <ShieldCheck size={16} aria-hidden="true" />
                Bonded & insured · Response within 1 business day
              </p>
            </div>
          </div>

          <div className="bg-paper px-6 py-14 sm:px-10 lg:flex lg:items-center lg:px-14 lg:py-16 xl:pr-[max(3.5rem,calc((100vw-1440px)/2+20px))]">
            <Form className="grid w-full max-w-xl gap-5" aria-label="Contact form" onSubmit={handleContactSubmit}>
              <h2 className="m-0 font-display text-h3 font-medium text-ink">Send us the details</h2>
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
              <p className={cn("m-0 rounded-2xl px-4 py-3 text-sm leading-6", status.state === "error" ? "bg-destructive-soft text-destructive" : "bg-primary-soft text-ink")}>{status.message}</p>
              <Button className="w-fit" disabled={status.state === "submitting"} type="submit">
                {status.state === "submitting" ? "Sending..." : "Send request"}
              </Button>
            </Form>
          </div>
        </div>
      </section>

      <CtaBand
        variant="inline"
        tone="paper"
        title={<>Rather just book <em className="italic text-primary-ink">the clean?</em></>}
        sub="Skip the back-and-forth — pick a service and time online, and AE confirms your slot."
        secondary={{ label: "WhatsApp us", href: company.whatsappHref }}
      />
    </>
  );
}

function ContactRow({ icon, text, href }: { icon: ReactNode; text: string; href?: string }) {
  const content = (
    <>
      <span className="shrink-0 text-sky-200">{icon}</span>
      <span className="min-w-0 break-words">{text}</span>
    </>
  );

  if (href) {
    return (
      <a className="flex min-w-0 items-center gap-3 transition-colors hover:text-white" href={href}>
        {content}
      </a>
    );
  }

  return <p className="m-0 flex min-w-0 items-center gap-3">{content}</p>;
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-2">
      <Label className="text-sm font-medium text-ink">{label}</Label>
      {children}
    </div>
  );
}
