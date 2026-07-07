import { Leaf, ShieldCheck, Sparkles, Star, UserCheck } from "lucide-react";
import { CtaBand } from "../page/CtaBand";
import { PageHero } from "../page/PageHero";
import { Container } from "../ui";

const reviews = [
  ["The same-cleaner arrangement makes weekly upkeep much easier for our family.", "Mei L.", "Tampines"],
  ["Super easy to book, clear WhatsApp updates, and careful results every time.", "Daniel T.", "Queenstown"],
  ["The checklist and completion photos make the service feel accountable.", "Jessica N.", "Serangoon"],
  ["AE saved our weekends. The same cleaner comes every other week and the flat feels reset without us managing anything.", "Priya S.", "Bedok"],
  ["Our move-out clean was handled carefully. Cabinets, fridge, baseboards, all covered.", "Marcus T.", "Bukit Timah"],
  ["The booking was simple and the team was careful around our renovation dust. Huge relief.", "Nina K.", "Punggol"]
] as const;

const badges = [
  ["Bonded & insured", ShieldCheck],
  ["Background-checked", UserCheck],
  ["Eco-friendly", Leaf]
] as const;

export function ReviewsPage() {
  return (
    <>
      <PageHero
        eyebrow="REVIEWS"
        title={<>Loved by homes <span className="text-navy">across Singapore.</span></>}
        sub="Notes from recurring home cleaning, move-in/out resets, and post-renovation days around Singapore."
      />

      <section className="bg-paper py-20 lg:py-28">
        <Container className="grid gap-12">
          <div className="grid gap-8 lg:grid-cols-[360px_1fr] lg:items-center">
            <article className="rounded-[22px] border border-line bg-white p-8 text-center">
              <p className="m-0 font-display text-[64px] font-normal leading-none text-navy">4.9</p>
              <div className="mt-4 flex justify-center gap-1 text-gold" aria-label="Five star rating">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Star key={index} size={18} fill="currentColor" aria-hidden="true" />
                ))}
              </div>
              <p className="mb-0 mt-3 text-sm text-ink/55">residential service feedback</p>
              <span className="mt-6 inline-flex rounded-full bg-sky-100 px-4 py-2 text-sm font-medium text-navy">Digital checklist + photo report</span>
            </article>
            <div className="grid gap-4">
              <Sparkles className="text-navy" size={34} aria-hidden="true" />
              <h2 className="m-0 font-display text-h2 font-normal text-ink">
                Repeat clients are the measure{" "}
                <span className="text-navy">we care about.</span>
              </h2>
              <p className="m-0 max-w-2xl text-lg leading-8 text-ink/65">A polished clean is only part of the work. The better signal is when families trust the same team to return, learn the home, and keep the week moving.</p>
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            {reviews.map(([quote, name, city]) => (
              <article className="rounded-[20px] border border-line bg-white p-7" key={name}>
                <div className="flex gap-1 text-gold" aria-label="Five star rating">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star key={index} size={16} fill="currentColor" aria-hidden="true" />
                  ))}
                </div>
                <p className="mb-6 mt-5 text-[17px] leading-relaxed text-ink/80">"{quote}"</p>
                <p className="m-0 text-sm text-ink/55"><span className="font-semibold text-ink">- {name}</span>, {city}</p>
              </article>
            ))}
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            {badges.map(([label, Icon]) => (
              <div className="flex items-center gap-3 rounded-full bg-sky-100 px-5 py-4 text-ink/65" key={label}>
                <Icon className="text-navy" size={18} aria-hidden="true" />
                <span className="text-sm font-medium">{label}</span>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <CtaBand tone="paper" sub="Join Singapore households using AE for calmer weekly home resets." />
    </>
  );
}
