import { Leaf, ShieldCheck, Sparkles, Users } from "lucide-react";
import kitchenImage from "../../assets/ae-cleaner-kitchen.png";
import livingRoomImage from "../../assets/ae-hero-living-room.png";
import { CtaBand } from "../page/CtaBand";
import { PageHero } from "../page/PageHero";
import { Container } from "../ui";

const values = [
  ["Trust & vetting", "Every cleaner is background-checked, trained, and covered before entering a home.", ShieldCheck],
  ["Consistent teams", "We keep your preferences attached to the team that knows your space.", Users],
  ["Eco products", "Plant-forward options are available for families, pets, and sensitive homes.", Leaf],
  ["Detail obsession", "Baseboards, handles, ledges, and reset details are part of how we work.", Sparkles]
] as const;

export function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="ABOUT US"
        title={<>A local team <span className="text-navy">that cares.</span></>}
        sub="AE Management Services supports Singapore homes with reliable residential cleaning and a WhatsApp-first booking flow."
      />

      <section className="bg-paper py-20 lg:py-28">
        <Container className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div className="relative min-h-[440px]">
            <img className="h-[390px] w-[78%] rounded-[20px] object-cover" src={kitchenImage} alt="Cleaner wiping a bright kitchen counter" />
            <img className="absolute bottom-0 right-0 h-[220px] w-[48%] rounded-[20px] border-8 border-paper object-cover" src={livingRoomImage} alt="Bright tidy living room" />
            <div className="absolute left-6 top-6 grid rounded-[20px] bg-sky-100 p-5 text-navy-700">
              <Leaf size={26} aria-hidden="true" />
              <p className="mb-0 mt-4 font-display text-2xl font-normal leading-tight">Clean home<br />Happy life</p>
            </div>
          </div>
          <div className="grid gap-5">
            <p className="m-0 text-sm font-semibold uppercase tracking-[0.08em] text-navy">OUR STORY</p>
            <h2 className="m-0 font-display text-h2 font-normal text-ink">
              Cleaning built around{" "}
              <span className="text-navy">real life.</span>
            </h2>
            <p className="m-0 text-lg leading-8 text-ink/65">AE is built around a simple residential promise: booking a dependable home cleaner should not feel like project management. The service is designed around clear scopes, confirmed visits, and WhatsApp support.</p>
            <p className="m-0 text-lg leading-8 text-ink/65">Today we help Singapore households stay ahead of weekly resets, move-day deadlines, and post-renovation dust with checklist-led home cleaning.</p>
            <div className="flex flex-wrap gap-2">
              {["Locally owned", "Insured", "Since 2021"].map((chip) => (
                <span className="rounded-full bg-sky-100 px-4 py-2 text-sm font-medium text-navy" key={chip}>{chip}</span>
              ))}
            </div>
          </div>
        </Container>
      </section>

      <section className="bg-cream py-10">
        <Container>
          <div className="grid gap-8 rounded-[28px] bg-navy-900 p-8 text-center text-white md:grid-cols-3 lg:p-10">
            {[
              ["Same cleaner", "where available every visit"],
              ["Replacement guarantee", "when an assigned cleaner is unavailable"],
              ["Digital checklist", "plus photo completion report"]
            ].map(([stat, label]) => (
              <div key={stat}>
                <p className="m-0 font-display text-4xl font-normal text-sky-300">{stat}</p>
                <p className="mb-0 mt-2 text-sm text-white/70">{label}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section className="bg-cream py-20 lg:py-28">
        <Container className="grid gap-8">
          <div className="grid gap-3">
            <p className="m-0 text-sm font-semibold uppercase tracking-[0.08em] text-navy">VALUES</p>
            <h2 className="m-0 font-display text-h2 font-normal text-ink">
              The details that make us{" "}
              <span className="text-navy">easy to trust.</span>
            </h2>
          </div>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {values.map(([title, copy, Icon]) => (
              <article className="rounded-[20px] border border-line bg-white p-6" key={title}>
                <span className="grid size-10 place-items-center rounded-xl bg-sky-100 text-navy"><Icon size={20} aria-hidden="true" /></span>
                <h3 className="mb-2 mt-5 font-display text-xl font-normal text-ink">{title}</h3>
                <p className="m-0 text-sm leading-6 text-ink/60">{copy}</p>
              </article>
            ))}
          </div>
          <div className="grid gap-5 rounded-[20px] bg-sky-100 p-7 md:grid-cols-[auto_1fr_auto] md:items-center">
            <span className="grid size-12 place-items-center rounded-xl bg-white text-navy"><Leaf size={24} aria-hidden="true" /></span>
            <div>
              <h3 className="m-0 font-display text-2xl font-normal text-navy-700">Eco-minded where it matters.</h3>
              <p className="mb-0 mt-2 text-ink/65">Choose plant-based products for regular resets and sensitive households without giving up a detailed clean.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {["Plant-based", "Kid & pet safe"].map((chip) => (
                <span className="rounded-full bg-white px-4 py-2 text-sm font-medium text-navy" key={chip}>{chip}</span>
              ))}
            </div>
          </div>
        </Container>
      </section>

      <CtaBand tone="cream" sub="Meet the Singapore residential cleaning team for recurring care and move-day resets." />
    </>
  );
}
