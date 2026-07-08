import { Check, Leaf } from "lucide-react";
import kitchenImage from "../../assets/ae-cleaner-kitchen.webp";
import livingRoomImage from "../../assets/ae-hero-living-room.webp";
import { Reveal } from "../Reveal";
import { CtaBand } from "../page/CtaBand";
import { Container } from "../ui";

const principles = [
  [
    "Trust before entry",
    "Every cleaner is background-checked, trained, and insured before they step into a home. You always know who is coming and when."
  ],
  [
    "The same face at the door",
    "You get the same cleaner each visit where available — someone who already knows your home, your routines, and how you like things done."
  ],
  [
    "Proof, not promises",
    "Every visit follows a digital checklist and ends with completion photos, so you can see the work even when you're not home."
  ],
  [
    "Pay when it's done",
    "No deposits, no prepayment. You settle by PayNow only after the clean is finished — that keeps the pressure on us, not you."
  ]
] as const;

export function AboutPage() {
  return (
    <>
      <section className="bg-paper pb-16 pt-32 lg:pb-24 lg:pt-40">
        <Container size="wide">
          <p className="m-0 text-sm font-semibold uppercase tracking-[0.08em] text-primary-ink">ABOUT US</p>
          <h1 className="mb-0 mt-5 max-w-4xl font-display text-[clamp(2.5rem,6.5vw,5.25rem)] font-medium leading-[1.05] tracking-[-0.015em] text-ink">
            A local team that treats your home <em className="italic text-primary-ink">like their own.</em>
          </h1>
          <div className="mt-8 h-px w-24 bg-gold" aria-hidden="true" />
          <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
            <p className="m-0 max-w-2xl text-xl leading-9 text-ink/75">
              AE Management Services keeps Singapore homes clean with vetted local cleaners and a booking flow that
              takes two minutes. Weekly upkeep, move-day handovers, post-renovation dust — one team, one checklist,
              one person to message.
            </p>
            <div className="flex flex-wrap content-start gap-2 lg:justify-end">
              {["Locally owned", "Bonded & insured", "Since 2021", "Island-wide"].map((chip) => (
                <span className="h-fit rounded-full border border-line bg-white px-4 py-2 text-sm font-medium text-ink/70" key={chip}>
                  {chip}
                </span>
              ))}
            </div>
          </div>
        </Container>
      </section>

      <section className="bg-cream py-20 lg:py-28">
        <Container className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <Reveal className="relative min-h-[440px]">
            <img className="h-[390px] w-[78%] rounded-[20px] object-cover" src={kitchenImage} alt="Cleaner wiping a bright kitchen counter" loading="lazy" />
            <img className="absolute bottom-0 right-0 h-[220px] w-[48%] rounded-[20px] border-8 border-cream object-cover" src={livingRoomImage} alt="Bright tidy living room" loading="lazy" />
            <span className="absolute bottom-6 left-5 inline-flex items-center gap-2.5 rounded-full border border-white/70 bg-white/90 px-4 py-2.5 text-sm font-semibold text-ink shadow-[0_10px_26px_rgb(9_30_66_/_0.12)] backdrop-blur-sm">
              <Leaf className="text-primary-ink" size={16} strokeWidth={2} aria-hidden="true" />
              Clean home, happy life
            </span>
          </Reveal>
          <Reveal className="grid gap-5" delay={0.1}>
            <p className="m-0 text-sm font-semibold uppercase tracking-[0.08em] text-primary-ink">OUR STORY</p>
            <h2 className="m-0 font-display text-h2 font-medium text-ink">
              Cleaning built around real life.
            </h2>
            <p className="m-0 text-lg leading-8 text-ink/65">
              AE started with a simple idea: booking a dependable home cleaner should be easy. Every visit comes with a
              clear cleaning checklist, a confirmed time, and someone you can message directly if anything comes up.
            </p>
            <blockquote className="relative m-0 border-l-2 border-gold py-1 pl-6">
              <span className="absolute -left-1 -top-4 font-display text-6xl italic text-gold/60 select-none" aria-hidden="true">"</span>
              <p className="m-0 font-display text-2xl font-medium italic leading-snug text-navy-900">
                Booking a dependable home cleaner should feel as easy as ordering dinner.
              </p>
            </blockquote>
            <p className="m-0 text-lg leading-8 text-ink/65">
              Today we help Singapore households with weekly upkeep, move-day deadlines, and post-renovation dust — all
              handled by the same dependable team.
            </p>
          </Reveal>
        </Container>
      </section>

      <section className="bg-paper py-20 lg:py-28">
        <Container size="narrow" className="grid gap-3">
          <p className="m-0 text-sm font-semibold uppercase tracking-[0.08em] text-primary-ink">HOW WE WORK</p>
          <h2 className="m-0 font-display text-h2 font-medium text-ink">Four principles, kept on every visit.</h2>
          <div className="mt-8">
            {principles.map(([title, copy], index) => (
              <Reveal
                className="grid gap-5 border-t border-line py-8 last:border-b sm:grid-cols-[110px_minmax(0,1fr)] lg:py-10"
                delay={index * 0.06}
                key={title}
              >
                <p className="m-0 font-display text-[clamp(2.5rem,4vw,3.5rem)] font-semibold leading-none tracking-tight text-gold">
                  {String(index + 1).padStart(2, "0")}
                </p>
                <div>
                  <h3 className="m-0 font-display text-h3 font-medium text-ink">{title}</h3>
                  <p className="mb-0 mt-3 max-w-xl text-lg leading-8 text-ink/65">{copy}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      <section className="bg-paper pb-20 lg:pb-24">
        <Container>
          <div className="grid gap-5 rounded-[20px] border border-line bg-white p-7 md:grid-cols-[auto_1fr_minmax(220px,320px)] md:items-center">
            <span className="grid size-12 place-items-center rounded-xl bg-primary-soft text-ink"><Leaf size={24} aria-hidden="true" /></span>
            <div>
              <h3 className="m-0 font-display text-2xl font-medium text-ink">Eco-minded where it matters.</h3>
              <p className="mb-0 mt-2 text-ink/65">Choose plant-based products for your regular cleans and sensitive households — without giving up a detailed clean.</p>
            </div>
            <ul className="m-0 grid list-none gap-3 p-0">
              {["Plant-based products", "Kid & pet safe"].map((chip) => (
                <li className="grid grid-cols-[18px_1fr] items-center gap-3 text-sm font-medium text-ink/70" key={chip}>
                  <span className="grid size-[18px] place-items-center rounded-full bg-primary-soft text-primary-ink">
                    <Check size={12} strokeWidth={2.4} aria-hidden="true" />
                  </span>
                  <span>{chip}</span>
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </section>

      <CtaBand
        variant="split"
        tone="paper"
        title={<>Ready to hand over <em className="italic text-navy-700">the cleaning?</em></>}
        sub="Weekly cleans, move-in/out handovers, or post-renovation cleans — AE confirms every booking and you pay only after service."
      />
    </>
  );
}
