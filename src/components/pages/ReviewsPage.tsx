import { Leaf, ShieldCheck, Star, UserCheck } from "lucide-react";
import { Avatar } from "../Avatar";
import { reviewCards } from "../ReviewsSection";
import { Reveal } from "../Reveal";
import { CtaBand } from "../page/CtaBand";
import { Container } from "../ui";

const badges = [
  ["Bonded & insured", ShieldCheck],
  ["Background-checked", UserCheck],
  ["Eco-friendly options", Leaf]
] as const;

const navyCardIndexes = new Set([1, 4]);

export function ReviewsPage() {
  return (
    <>
      <section className="bg-paper pb-16 pt-32 lg:pb-20 lg:pt-40">
        <Container className="grid gap-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-end">
          <div className="grid gap-5">
            <p className="m-0 text-sm font-semibold uppercase tracking-[0.08em] text-primary-ink">REVIEWS</p>
            <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
              <p className="m-0 font-display text-[clamp(5rem,12vw,9rem)] font-semibold leading-[0.9] tracking-tight text-navy-900">
                4.9
              </p>
              <div className="pb-3">
                <div className="flex gap-1 text-gold" aria-label="Five star rating">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star key={index} size={22} fill="currentColor" aria-hidden="true" />
                  ))}
                </div>
                <p className="mb-0 mt-2 text-sm font-medium text-ink/55">residential service feedback</p>
              </div>
            </div>
            <h1 className="m-0 max-w-xl font-display text-h3 font-semibold leading-snug text-ink">
              Repeat clients are the measure <em className="italic text-primary-ink">we care about.</em>
            </h1>
          </div>
          <div className="grid gap-4 lg:pb-2">
            <p className="m-0 max-w-md text-lg leading-8 text-ink/65">
              A polished clean is only part of the work. The better signal is when families trust the same cleaner to
              return, learn the home, and keep the week moving.
            </p>
            <div className="flex flex-wrap gap-2">
              {badges.map(([label, Icon]) => (
                <span className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-4 py-2 text-sm font-medium text-ink/70" key={label}>
                  <Icon className="text-primary-ink" size={16} aria-hidden="true" />
                  {label}
                </span>
              ))}
            </div>
          </div>
        </Container>
      </section>

      <section className="bg-cream py-16 lg:py-24">
        <Container>
          <div className="columns-1 gap-5 sm:columns-2 lg:columns-3">
            {reviewCards.map((review, index) => {
              const navy = navyCardIndexes.has(index);

              return (
                <Reveal
                  className={`mb-5 break-inside-avoid rounded-[22px] p-7 ${
                    navy
                      ? "bg-navy-900 text-white"
                      : "border border-line bg-white text-ink shadow-[0_10px_24px_rgb(9_30_66_/_0.05)]"
                  }`}
                  delay={(index % 3) * 0.07}
                  key={review.name}
                >
                  <article>
                    <div className={`flex gap-1 ${navy ? "text-gold" : "text-gold"}`} aria-label="Five star rating">
                      {Array.from({ length: 5 }).map((_, starIndex) => (
                        <Star key={starIndex} size={15} fill="currentColor" aria-hidden="true" />
                      ))}
                    </div>
                    <p className={`mb-0 mt-4 font-display text-[19px] font-semibold leading-relaxed ${navy ? "text-white" : "text-ink/85"}`}>
                      "{review.quote}"
                    </p>
                    <div className="mt-6 flex items-center gap-3">
                      <Avatar name={review.name} className={navy ? "ring-2 ring-white/20" : "ring-2 ring-primary-soft"} />
                      <span className="min-w-0">
                        <strong className={`block text-sm font-semibold ${navy ? "text-white" : "text-ink"}`}>{review.name}</strong>
                        <span className={`block text-xs ${navy ? "text-white/60" : "text-ink/55"}`}>
                          {review.city} · {review.bookings}
                        </span>
                      </span>
                    </div>
                    <div className={`mt-4 flex flex-wrap gap-2 text-xs font-semibold ${navy ? "text-white/70" : "text-ink/60"}`}>
                      <span className={`rounded-full px-3 py-1 ${navy ? "bg-white/10 text-white" : "bg-primary-soft text-ink"}`}>
                        {review.service}
                      </span>
                      <span className={`rounded-full px-3 py-1 ${navy ? "border border-white/20" : "border border-line bg-white"}`}>
                        {review.date}
                      </span>
                    </div>
                  </article>
                </Reveal>
              );
            })}
          </div>
          <p className="mx-auto mb-0 mt-8 max-w-2xl text-center text-sm leading-6 text-ink/50">
            Feedback collected from AE customers after completed visits. Every clean follows a digital checklist, so
            the visit scope stays clear from booking to completion.
          </p>
        </Container>
      </section>

      <CtaBand
        variant="split"
        tone="paper"
        title={<>Start with one visit, stay for the <em className="italic text-navy-700">consistency.</em></>}
        sub="Book the first clean online, then decide whether AE should become part of your weekly or fortnightly home rhythm."
      />
    </>
  );
}
