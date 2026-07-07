import { Star } from "lucide-react";
import { useReveal } from "../hooks/useReveal";
import { Container } from "./ui";

const reviews = [
  ["The same-cleaner arrangement makes weekly upkeep much easier for our family.", "Mei L.", "Tampines"],
  ["Super easy to book, clear WhatsApp updates, and careful results every time.", "Daniel T.", "Queenstown"],
  ["The checklist and completion photos make the service feel accountable.", "Jessica N.", "Serangoon"]
] as const;

export const reviewCards = [
  ["AE saved our weekends. The same cleaner comes every other week and the flat feels reset without us managing anything.", "Priya S.", "Bedok"],
  ["Our move-out clean was handled carefully. Cabinets, fridge, baseboards, all covered.", "Marcus T.", "Bukit Timah"],
  ["The booking was simple and the team was careful around our renovation dust. Huge relief.", "Nina K.", "Punggol"]
] as const;

export function ReviewsSection() {
  const headerReveal = useReveal<HTMLDivElement>();
  const gridReveal = useReveal<HTMLDivElement>();

  return (
    <section className="scroll-mt-[88px] bg-paper py-20 lg:py-28" id="reviews" aria-labelledby="reviews-title">
      <Container className="grid gap-10">
        <div
          ref={headerReveal.ref}
          className={`mx-auto grid max-w-3xl justify-items-center gap-4 text-center transition duration-500 ${headerReveal.className}`}
        >
          <p className="m-0 text-sm font-semibold uppercase tracking-[0.08em] text-navy">REVIEWS</p>
          <h2 id="reviews-title" className="m-0 font-display text-h2 font-normal text-ink">
            Loved by homes{" "}
            <span className="text-navy">across Singapore.</span>
          </h2>
          <p className="m-0 text-lg leading-8 text-ink/65">Notes from recurring home cleaning, move-in/out resets, and post-renovation days around Singapore.</p>
        </div>
        <div ref={gridReveal.ref} className={`grid gap-5 transition duration-500 lg:grid-cols-3 ${gridReveal.className}`}>
          {reviews.map(([quote, name, city]) => (
            <article className="rounded-[20px] border border-line bg-white p-7" key={name}>
              <div className="flex gap-1 text-gold" aria-label="Five star rating">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Star key={index} size={16} fill="currentColor" aria-hidden="true" />
                ))}
              </div>
              <p className="mb-6 mt-5 text-[17px] leading-relaxed text-ink/80">"{quote}"</p>
              <p className="m-0 text-sm text-ink/65">
                <span className="font-semibold text-ink">- {name}</span>, {city}
              </p>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}
