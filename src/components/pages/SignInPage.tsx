import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { useCustomerSession } from "../../hooks/useCustomerSession";
import { company } from "../../lib/company";
import { customerShortName } from "../../lib/customer-name";
import { CustomerAccountPanel } from "../CustomerAccountDialog";
import { Icon3D } from "../Icon3D";
import { WhatsappLogo } from "../WhatsappLogo";
import { Container } from "../ui";
import { Button } from "../ui/button";

export function SignInPage() {
  const session = useCustomerSession();
  const [qrCode, setQrCode] = useState("");

  useEffect(() => {
    let active = true;

    QRCode.toDataURL(company.whatsappHref, {
      color: {
        dark: "#16191A",
        light: "#EFF6FF"
      },
      errorCorrectionLevel: "M",
      margin: 1,
      width: 220
    }).then((value) => {
      if (active) {
        setQrCode(value);
      }
    }).catch(() => {
      if (active) {
        setQrCode("");
      }
    });

    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="bg-cream">
      <section className="pt-28 pb-16 lg:pt-32 lg:pb-22" id="signin" aria-labelledby="signin-title">
        <Container className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_390px] lg:items-start">
          <div className="rounded-[28px] border border-line bg-white p-5 sm:p-7">
            <p className="m-0 text-sm font-semibold tracking-[0.08em] text-primary-ink uppercase">
              {session.customer ? "Your account" : "Sign in"}
            </p>
            <h1 id="signin-title" className="mt-3 font-display text-[34px] font-medium leading-tight text-ink sm:text-[40px]">
              {session.customer ? `Welcome back, ${customerShortName(session.customer)}.` : "Manage your AE booking in one place."}
            </h1>
            <p className="m-0 mt-3 text-base leading-7 text-ink/60">
              {session.customer
                ? "Your requests, confirmed visits, and invoices stay linked to this account."
                : "Sign in or create an account — your visit, confirmation, and invoice stay linked to it."}
            </p>
            <div className="mt-6">
              <CustomerAccountPanel
                embedded
                hideHeader
                session={session}
                title="Sign in to your account."
              />
            </div>
          </div>

          <aside className="rounded-[28px] border border-primary/20 bg-primary-soft p-6">
            <Icon3D name="phone" size={58} />
            <h2 className="mt-5 font-display text-[32px] font-medium leading-tight text-ink">Get updates on WhatsApp</h2>
            <p className="mt-3 text-sm leading-6 text-ink/65">
              Scan to chat with AE about your booking, home access, or anything else.
            </p>
            <div className="mt-6 rounded-[24px] border border-line bg-white p-4">
              {qrCode ? (
                <img className="mx-auto size-[220px]" src={qrCode} alt="WhatsApp QR code for AE Management Services" />
              ) : (
                <div className="grid aspect-square place-items-center rounded-[18px] bg-paper text-sm text-ink/55">Loading QR</div>
              )}
            </div>
            <Button asChild className="mt-5 w-full" variant="outline">
              <a href={company.whatsappHref} target="_blank" rel="noreferrer">
                <WhatsappLogo className="size-5 text-[#25D366]" />
                Chat with AE
              </a>
            </Button>
          </aside>
        </Container>
      </section>
    </main>
  );
}
